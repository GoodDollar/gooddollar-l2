import fs from 'fs';
import path from 'path';
import { IngestStats, NormalizedQuote } from './types';

const DEFAULT_LOG_PATH = path.resolve(__dirname, '..', 'audit.log');
const DEFAULT_MAX_BUFFERED_LINES = 10_000;
const DEFAULT_FLUSH_TIMEOUT_MS = 1_000;

export interface AuditLoggerOptions {
  /**
   * Filesystem path the audit logger appends JSONL records to. Defaults
   * to `PRICE_AUDIT_LOG_PATH` env var or `<pkg>/audit.log`.
   */
  logPath?: string;
  /**
   * Hard cap on lines held in memory while the WriteStream is
   * backpressured. When exceeded, oldest lines are dropped and
   * `bufferedDrops` increments. Default 10 000.
   */
  maxBufferedLines?: number;
  /**
   * Default deadline (in ms) for `flush()` to wait on the stream
   * before resolving. Default 1 000.
   */
  flushTimeoutMs?: number;
  /**
   * Test seam: inject a custom Writable. When provided, the logger
   * writes to this stream instead of opening one against `logPath`.
   * The injected stream is responsible for emitting `'drain'` after
   * a write returns false — see the stalled-disk tests.
   */
  stream?: WritableLike;
}

export interface AuditRecordInput {
  accepted: boolean;
  reason?: string;
  quote: NormalizedQuote;
}

interface AuditLogLine {
  timestamp: string;
  accepted: boolean;
  reason?: string;
  quote: NormalizedQuote;
}

/**
 * Minimal subset of `stream.Writable` the logger relies on. Lets tests
 * inject a stalled-disk mock without pulling in `stream.Writable`'s
 * full surface area. The optional `cb` on `write()` fires once libuv
 * has handed the bytes to the kernel; `flush()` waits for it before
 * resolving so callers get a real "data is on disk" signal.
 */
export interface WritableLike {
  write(chunk: string, cb?: (err?: Error | null) => void): boolean;
  once(event: 'drain' | 'error' | 'close', listener: (...args: unknown[]) => void): void;
  on(event: 'error', listener: (err: Error) => void): void;
  end?(cb?: () => void): void;
}

/**
 * Non-blocking JSON-lines audit logger for quote ingestion. Writes via
 * an append-mode `fs.createWriteStream` opened lazily on first record,
 * so the per-tick hot path never enters a sync `write(2)` syscall.
 *
 * Semantics:
 * - `record()` is non-blocking. It updates `IngestStats` synchronously,
 *   enqueues the serialized line, and pumps the stream — no awaits.
 * - The in-memory queue is capped at `maxBufferedLines` (default
 *   10 000). When the writer is backpressured AND the cap is reached,
 *   OLDEST lines are dropped and `bufferedDrops` increments. New ticks
 *   are more forensically valuable than ten-minute-old ones.
 * - `writeErrors` counts stream `'error'` emissions (kernel-rejected
 *   writes); `bufferedDrops` counts producer-side shedding. Two
 *   distinct failure modes deserve two distinct counters on
 *   `/audit/stats`.
 * - On-disk JSONL format is unchanged: each line is exactly
 *   `JSON.stringify({timestamp, accepted, reason?, quote}) + '\n'`,
 *   so replay tooling stays compatible.
 */
export class AuditLogger {
  private readonly logPath: string;
  private readonly maxBufferedLines: number;
  private readonly flushTimeoutMs: number;
  private readonly statsState: IngestStats = {
    ingested: 0,
    rejected: 0,
    byReason: {},
    firstAtMs: null,
    lastAtMs: null,
    writeErrors: 0,
    bufferedDrops: 0,
  };
  private readonly pending: string[] = [];
  private stream: WritableLike | null = null;
  private streamFailed = false;
  private draining = false;
  /** Lines handed to the stream but whose write-callback hasn't fired. */
  private inflight = 0;

  constructor(options?: AuditLoggerOptions) {
    this.logPath = options?.logPath
      ?? process.env.PRICE_AUDIT_LOG_PATH
      ?? DEFAULT_LOG_PATH;
    this.maxBufferedLines = options?.maxBufferedLines ?? DEFAULT_MAX_BUFFERED_LINES;
    this.flushTimeoutMs = options?.flushTimeoutMs ?? DEFAULT_FLUSH_TIMEOUT_MS;
    if (options?.stream) {
      this.stream = options.stream;
      this.attachStreamHandlers(this.stream);
    }
  }

  /**
   * Append an audit record. Non-blocking: stats update synchronously,
   * the line is enqueued and pumped without awaiting any I/O.
   */
  record(input: AuditRecordInput): void {
    const now = Date.now();
    const line: AuditLogLine = {
      timestamp: new Date(now).toISOString(),
      accepted: input.accepted,
      quote: input.quote,
    };
    if (input.reason !== undefined) line.reason = input.reason;

    if (input.accepted) {
      this.statsState.ingested += 1;
    } else {
      this.statsState.rejected += 1;
      const bucket = AuditLogger.reasonBucket(input.reason);
      this.statsState.byReason[bucket] = (this.statsState.byReason[bucket] ?? 0) + 1;
    }
    if (this.statsState.firstAtMs === null) this.statsState.firstAtMs = now;
    this.statsState.lastAtMs = now;

    this.enqueue(JSON.stringify(line) + '\n');
    this.pump();
  }

  stats(): IngestStats {
    return {
      ingested: this.statsState.ingested,
      rejected: this.statsState.rejected,
      byReason: { ...this.statsState.byReason },
      firstAtMs: this.statsState.firstAtMs,
      lastAtMs: this.statsState.lastAtMs,
      writeErrors: this.statsState.writeErrors,
      bufferedDrops: this.statsState.bufferedDrops,
    };
  }

  /**
   * Drain the pending queue into the stream and wait for libuv to
   * acknowledge each handed-off line. Resolves when the queue is
   * empty AND every dispatched write has fired its callback, OR
   * when `timeoutMs` elapses, whichever comes first. Does not close
   * the stream — long-running services keep it open.
   */
  flush(timeoutMs: number = this.flushTimeoutMs): Promise<void> {
    return new Promise((resolve) => {
      const deadline = Date.now() + Math.max(0, timeoutMs);
      const tick = (): void => {
        this.pump();
        if (this.pending.length === 0 && this.inflight === 0) {
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          resolve();
          return;
        }
        setImmediate(tick);
      };
      tick();
    });
  }

  /**
   * Bucket a free-form filter reason ("stale: quote age 12000ms...") by
   * its leading token before the first colon. Keeps cardinality bounded
   * so `/audit/stats` is a small, predictable object.
   */
  private static reasonBucket(reason?: string): string {
    if (!reason) return 'unknown';
    const colonIdx = reason.indexOf(':');
    if (colonIdx < 0) return reason.trim() || 'unknown';
    const head = reason.slice(0, colonIdx).trim();
    return head || 'unknown';
  }

  /** Push a serialized line; shed oldest if over the buffer cap. */
  private enqueue(line: string): void {
    this.pending.push(line);
    while (this.pending.length > this.maxBufferedLines) {
      this.pending.shift();
      this.statsState.bufferedDrops += 1;
    }
  }

  /**
   * Push pending lines into the stream until empty or the stream
   * signals backpressure. Re-enters via `'drain'`. Lazily opens the
   * stream on first call. Once the stream has emitted `'error'` we
   * stop attempting writes and tally further pending lines as
   * `writeErrors` — operators see a monotonically rising counter
   * even on a permanently failed log target.
   */
  private pump(): void {
    if (this.draining) return;
    if (this.streamFailed) {
      this.discardPendingAsErrors();
      return;
    }
    const stream = this.openStream();
    if (!stream) {
      this.discardPendingAsErrors();
      return;
    }

    while (this.pending.length > 0) {
      const next = this.pending[0];
      let ok = false;
      this.inflight += 1;
      try {
        ok = stream.write(next, () => {
          this.inflight -= 1;
        });
      } catch {
        this.inflight -= 1;
        this.markFailed();
        return;
      }
      this.pending.shift();
      if (!ok) {
        this.draining = true;
        stream.once('drain', () => {
          this.draining = false;
          this.pump();
        });
        return;
      }
    }
  }

  /** Lazy open: skipped in test setups that never call `record()`. */
  private openStream(): WritableLike | null {
    if (this.stream) return this.stream;
    try {
      const real = fs.createWriteStream(this.logPath, { flags: 'a' });
      this.attachStreamHandlers(real);
      this.stream = real;
      return real;
    } catch {
      this.markFailed();
      return null;
    }
  }

  private attachStreamHandlers(stream: WritableLike): void {
    stream.on('error', () => {
      this.markFailed();
    });
  }

  private markFailed(): void {
    if (!this.streamFailed) this.statsState.writeErrors += 1;
    this.streamFailed = true;
    this.draining = false;
    this.discardPendingAsErrors();
  }

  private discardPendingAsErrors(): void {
    if (this.pending.length === 0) return;
    this.statsState.writeErrors += this.pending.length;
    this.pending.length = 0;
  }
}
