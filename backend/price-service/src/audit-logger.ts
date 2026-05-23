import fs from 'fs';
import path from 'path';
import { IngestStats, NormalizedQuote } from './types';

const DEFAULT_LOG_PATH = path.resolve(__dirname, '..', 'audit.log');

export interface AuditLoggerOptions {
  /**
   * Filesystem path the audit logger appends JSONL records to. Defaults
   * to `PRICE_AUDIT_LOG_PATH` env var or `<pkg>/audit.log`.
   */
  logPath?: string;
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
 * Best-effort JSON-lines audit logger for quote ingestion. Mirrors the
 * etoro-client AuditLogger: appendFileSync, swallow write errors. Also
 * maintains in-memory `IngestStats` so the HTTP surface can expose
 * acceptance ratios and per-reason buckets without re-reading the file.
 */
export class AuditLogger {
  private readonly logPath: string;
  private readonly statsState: IngestStats = {
    ingested: 0,
    rejected: 0,
    byReason: {},
    firstAt: null,
    lastAt: null,
    writeErrors: 0,
  };

  constructor(options?: AuditLoggerOptions) {
    this.logPath = options?.logPath
      ?? process.env.PRICE_AUDIT_LOG_PATH
      ?? DEFAULT_LOG_PATH;
  }

  /**
   * Append an audit record. The quote payload is written verbatim — quotes
   * already carry no secrets, but callers must not pass anything sensitive
   * via `reason` either.
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
    if (this.statsState.firstAt === null) this.statsState.firstAt = now;
    this.statsState.lastAt = now;

    try {
      fs.appendFileSync(this.logPath, JSON.stringify(line) + '\n', 'utf8');
    } catch {
      this.statsState.writeErrors += 1;
    }
  }

  stats(): IngestStats {
    return {
      ingested: this.statsState.ingested,
      rejected: this.statsState.rejected,
      byReason: { ...this.statsState.byReason },
      firstAt: this.statsState.firstAt,
      lastAt: this.statsState.lastAt,
      writeErrors: this.statsState.writeErrors,
    };
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
}
