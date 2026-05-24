/**
 * Append-only JSONL audit log for oracle-signer events.
 *
 * One file per day under `dir` named `YYYY-MM-DD.jsonl`. Each line is a
 * compact JSON object capturing a single event (submit_ok, submit_fail,
 * refused, startup, shutdown). The dir is `mkdir -p`d on first write.
 *
 * Safety:
 *   - The writer strips known-secret keys (`signerKey`, `rpcUrl`) before
 *     serialising. We never trust the caller to remember.
 *   - Write failures are logged once and swallowed — the submission loop
 *     keeps running even when the disk is full.
 *   - Writes are serialised via a Promise chain so concurrent callers
 *     produce a clean, line-oriented file.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export type AuditEvent =
  | 'submit_ok'
  | 'submit_fail'
  | 'refused'
  | 'startup'
  | 'shutdown';

export interface AuditEntry {
  rail: 'stocks' | 'crypto';
  event: AuditEvent;
  txHash?: string;
  error?: string;
  symbols?: string[];
  blockNumber?: number;
  chainId?: number;
  gasUsed?: string;
  roundTripMs?: number;
}

interface SerialisedEntry extends AuditEntry { ts: number }

export interface AuditLogOptions {
  dir: string;
  /** Inject a clock for deterministic tests. */
  now?: () => Date;
}

const SECRET_KEYS = new Set(['signerKey', 'rpcUrl', 'privateKey', 'secret']);

function redact(entry: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entry)) {
    if (SECRET_KEYS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

export class AuditLog {
  private readonly dir: string;
  private readonly clock: () => Date;
  private dirEnsured = false;
  private writeChain: Promise<void> = Promise.resolve();
  private warnedOnError = false;

  constructor(opts: AuditLogOptions) {
    this.dir = opts.dir;
    this.clock = opts.now ?? (() => new Date());
  }

  currentFileName(): string {
    const d = this.clock();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}.jsonl`;
  }

  async append(entry: AuditEntry): Promise<void> {
    const ts = this.clock().getTime();
    const cleaned = redact(entry as unknown as Record<string, unknown>) as unknown as AuditEntry;
    const sanitised: SerialisedEntry = { ts, ...cleaned };
    const line = JSON.stringify(sanitised) + '\n';
    const file = path.join(this.dir, this.currentFileName());

    // Serialise writes so concurrent callers never interleave half-lines.
    this.writeChain = this.writeChain.then(async () => {
      try {
        if (!this.dirEnsured) {
          await fs.mkdir(this.dir, { recursive: true });
          this.dirEnsured = true;
        }
        await fs.appendFile(file, line, { flag: 'a' });
      } catch (err) {
        if (!this.warnedOnError) {
          this.warnedOnError = true;
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[oracle-signer:audit] write failed (will silently retry on next event): ${msg}`);
        }
      }
    });

    return this.writeChain;
  }
}
