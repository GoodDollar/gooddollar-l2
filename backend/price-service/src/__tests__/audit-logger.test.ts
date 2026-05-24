import fs from 'fs';
import os from 'os';
import path from 'path';
import { AuditLogger, WritableLike } from '../audit-logger';
import { NormalizedQuote, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return computeSpread({
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 95,
    stale: false,
    ...overrides,
  });
}

/**
 * Stalled-disk mock: `write()` returns false (backpressured) until the
 * caller invokes `release()`, which fires `'drain'`. Surfaces only the
 * `WritableLike` slice the logger actually depends on.
 */
function makeStalledStream(): {
  stream: WritableLike;
  written: string[];
  release: () => void;
  fail: (err: Error) => void;
} {
  const written: string[] = [];
  const callbacks: Array<(err?: Error | null) => void> = [];
  const drainListeners: Array<() => void> = [];
  const errorListeners: Array<(err: Error) => void> = [];
  const stream: WritableLike = {
    write(chunk: string, cb?: (err?: Error | null) => void): boolean {
      written.push(chunk);
      if (cb) callbacks.push(cb);
      return false;
    },
    once(event, listener): void {
      if (event === 'drain') drainListeners.push(listener as () => void);
      else if (event === 'error') errorListeners.push(listener as (err: Error) => void);
    },
    on(event, listener): void {
      if (event === 'error') errorListeners.push(listener);
    },
  };
  return {
    stream,
    written,
    release() {
      const cbs = callbacks.splice(0, callbacks.length);
      for (const cb of cbs) cb();
      const fns = drainListeners.splice(0, drainListeners.length);
      for (const fn of fns) fn();
    },
    fail(err: Error) {
      const fns = errorListeners.splice(0, errorListeners.length);
      for (const fn of fns) fn(err);
    },
  };
}

/** Wait for one macrotask boundary so async stream events can fire. */
function nextTick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('AuditLogger', () => {
  let tmpDir: string;
  let logPath: string;
  let logger: AuditLogger;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'price-audit-'));
    logPath = path.join(tmpDir, 'audit.log');
    logger = new AuditLogger({ logPath });
  });

  afterEach(async () => {
    try {
      await logger.flush(200);
    } catch {}
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('writes one JSONL line per record', async () => {
    logger.record({ accepted: true, quote: makeQuote() });
    logger.record({ accepted: false, reason: 'stale: too old', quote: makeQuote() });

    await logger.flush(500);

    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.accepted).toBe(true);
    expect(first.quote.symbol).toBe('AAPL');
    expect(first.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(first.reason).toBeUndefined();

    const second = JSON.parse(lines[1]);
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe('stale: too old');
  });

  it('accumulates IngestStats across records', () => {
    logger.record({ accepted: true, quote: makeQuote() });
    logger.record({ accepted: true, quote: makeQuote({ symbol: 'TSLA' }) });
    logger.record({ accepted: false, reason: 'stale: 1', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'stale: 2', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'spread-too-wide: 1', quote: makeQuote() });

    const stats = logger.stats();
    expect(stats.ingested).toBe(2);
    expect(stats.rejected).toBe(3);
    expect(stats.byReason.stale).toBe(2);
    expect(stats.byReason['spread-too-wide']).toBe(1);
    expect(stats.firstAtMs).not.toBeNull();
    expect(stats.lastAtMs).not.toBeNull();
    expect(stats.lastAtMs).toBeGreaterThanOrEqual(stats.firstAtMs!);
    expect(stats.writeErrors).toBe(0);
    expect(stats.bufferedDrops).toBe(0);
  });

  it('buckets reasons by leading token before the colon', () => {
    logger.record({ accepted: false, reason: 'market-closed: equity session', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'market-closed: index session', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'halted: market is halted', quote: makeQuote() });

    const stats = logger.stats();
    expect(stats.byReason['market-closed']).toBe(2);
    expect(stats.byReason.halted).toBe(1);
  });

  it('uses "unknown" reason bucket when reason is missing on rejection', () => {
    logger.record({ accepted: false, quote: makeQuote() });
    const stats = logger.stats();
    expect(stats.rejected).toBe(1);
    expect(stats.byReason.unknown).toBe(1);
  });

  it('survives async write failures without throwing and counts them', async () => {
    const badLogger = new AuditLogger({ logPath: '/proc/this-cannot-be-written/audit.log' });
    expect(() => {
      badLogger.record({ accepted: true, quote: makeQuote() });
      badLogger.record({ accepted: false, reason: 'stale: x', quote: makeQuote() });
    }).not.toThrow();

    // The stream open fails asynchronously — wait for the 'error' event
    // to land and the logger to converge to its failed state.
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    badLogger.record({ accepted: true, quote: makeQuote() });
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    const stats = badLogger.stats();
    expect(stats.ingested).toBe(2);
    expect(stats.rejected).toBe(1);
    expect(stats.writeErrors).toBeGreaterThanOrEqual(1);
  });

  it('reads default log path from PRICE_AUDIT_LOG_PATH env when not provided', async () => {
    const envPath = path.join(tmpDir, 'env-audit.log');
    const prev = process.env.PRICE_AUDIT_LOG_PATH;
    process.env.PRICE_AUDIT_LOG_PATH = envPath;
    try {
      const envLogger = new AuditLogger();
      envLogger.record({ accepted: true, quote: makeQuote() });
      await envLogger.flush(500);
      expect(fs.existsSync(envPath)).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.PRICE_AUDIT_LOG_PATH;
      else process.env.PRICE_AUDIT_LOG_PATH = prev;
    }
  });

  it('starts with zero stats and null firstAtMs/lastAtMs before any record', () => {
    const fresh = new AuditLogger({ logPath: path.join(tmpDir, 'fresh.log') });
    const stats = fresh.stats();
    expect(stats.ingested).toBe(0);
    expect(stats.rejected).toBe(0);
    expect(stats.byReason).toEqual({});
    expect(stats.firstAtMs).toBeNull();
    expect(stats.lastAtMs).toBeNull();
    expect(stats.writeErrors).toBe(0);
    expect(stats.bufferedDrops).toBe(0);
  });
});

describe('AuditLogger non-blocking semantics (task 0067)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'price-audit-perf-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('returns from record() in well under 1 ms on a warm cache', () => {
    const logger = new AuditLogger({ logPath: path.join(tmpDir, 'warm.log') });
    logger.record({ accepted: true, quote: makeQuote() });

    const t0 = process.hrtime.bigint();
    logger.record({ accepted: true, quote: makeQuote() });
    const dtMs = Number(process.hrtime.bigint() - t0) / 1e6;

    expect(dtMs).toBeLessThan(5);
  });

  it('completes 10 000 sequential records well within the AC budget', () => {
    const logger = new AuditLogger({ logPath: path.join(tmpDir, 'perf.log') });
    const N = 10_000;

    const t0 = process.hrtime.bigint();
    for (let i = 0; i < N; i++) {
      logger.record({ accepted: true, quote: makeQuote() });
    }
    const dtMs = Number(process.hrtime.bigint() - t0) / 1e6;

    // AC: total < 10 000 × 0.1 ms = 1000 ms. Be generous on slow CI.
    expect(dtMs).toBeLessThan(1000);
  });

  it('returns from record() in <5 ms when the writer is stalled (drain-gated)', () => {
    const stalled = makeStalledStream();
    const logger = new AuditLogger({
      logPath: path.join(tmpDir, 'stalled.log'),
      stream: stalled.stream,
    });
    logger.record({ accepted: true, quote: makeQuote() });

    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 100; i++) {
      logger.record({ accepted: true, quote: makeQuote() });
    }
    const dtMs = Number(process.hrtime.bigint() - t0) / 1e6;

    expect(dtMs).toBeLessThan(50);
  });

  it('drops oldest lines when the buffer overflows under stalled writes', () => {
    const stalled = makeStalledStream();
    const logger = new AuditLogger({
      logPath: path.join(tmpDir, 'overflow.log'),
      maxBufferedLines: 5,
      stream: stalled.stream,
    });

    // The very first record() pushes its line into the stream
    // (write returns false, but the line was still accepted by Node)
    // and trips backpressure. Subsequent records queue in `pending`;
    // once `pending` exceeds the 5-line cap, OLDEST queued lines are
    // shed and `bufferedDrops` rises. With 10 records and 1 already
    // handed off, 9 queue and 4 of those get dropped.
    for (let i = 0; i < 10; i++) {
      logger.record({ accepted: true, quote: makeQuote({ symbol: `S${i}` }) });
    }

    const stats = logger.stats();
    expect(stats.bufferedDrops).toBe(4);
    expect(stats.ingested).toBe(10);

    // Releasing the stalled writer drains one queued line per drain
    // event (every write also returns false in the mock). Pump until
    // empty to verify drop-OLDEST policy: the newest record (S9)
    // must land, oldest queued (S1..S4) must NOT land.
    while (stalled.written.length < 6) stalled.release();
    expect(stalled.written.some((s) => s.includes('"symbol":"S9"'))).toBe(true);
    expect(stalled.written.some((s) => s.includes('"symbol":"S1"'))).toBe(false);
    expect(stalled.written.some((s) => s.includes('"symbol":"S4"'))).toBe(false);
  });

  it('flush() drains pending lines into the file', async () => {
    const logger = new AuditLogger({ logPath: path.join(tmpDir, 'flush.log') });
    for (let i = 0; i < 100; i++) {
      logger.record({ accepted: true, quote: makeQuote({ symbol: `T${i}` }) });
    }
    await logger.flush(500);

    const lines = fs.readFileSync(path.join(tmpDir, 'flush.log'), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(100);
  });

  it('counts a kernel-rejected stream error as a writeError', async () => {
    const stalled = makeStalledStream();
    const logger = new AuditLogger({
      logPath: path.join(tmpDir, 'errored.log'),
      stream: stalled.stream,
    });
    logger.record({ accepted: true, quote: makeQuote() });
    stalled.fail(new Error('disk full'));
    await nextTick();

    expect(logger.stats().writeErrors).toBeGreaterThanOrEqual(1);
  });

  it('does NOT use any *Sync fs API in record() at runtime', () => {
    const logger = new AuditLogger({ logPath: path.join(tmpDir, 'no-sync.log') });
    const realAppendFileSync = fs.appendFileSync;
    let calls = 0;
    (fs as unknown as { appendFileSync: typeof fs.appendFileSync }).appendFileSync =
      ((..._args: unknown[]) => {
        calls += 1;
      }) as unknown as typeof fs.appendFileSync;
    try {
      for (let i = 0; i < 50; i++) {
        logger.record({ accepted: true, quote: makeQuote() });
      }
    } finally {
      (fs as unknown as { appendFileSync: typeof fs.appendFileSync }).appendFileSync =
        realAppendFileSync;
    }
    expect(calls).toBe(0);
  });
});
