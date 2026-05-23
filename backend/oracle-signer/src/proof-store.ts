/**
 * In-memory proof store. Keeps the last N successful submissions per rail
 * AND the last N failures per rail, plus cumulative `{ ok, failed }` counts
 * since process start, so the `/proof` HTTP endpoint and the frontend status
 * API can render "most recent on-chain proof per rail" *and* "what's been
 * breaking" without reading the chain or grepping the audit log.
 *
 * Pure / synchronous / no I/O — testable in isolation.
 */

import type { IngestStats } from './price-ws-client';

export type RailName = 'stocks' | 'crypto';

export interface ProofEntryInput {
  txHash: string;
  blockNumber: number;
  /** gasUsed serialised as a decimal string so JSON consumers don't have to deal with BigInt. */
  gasUsed: string;
  symbols: string[];
  roundTripMs: number;
  submittedAtMs: number;
  /** Off-chain mid prices used to build the batch, keyed by symbol. */
  mids: Record<string, number>;
}

export interface ProofEntry extends ProofEntryInput {
  rail: RailName;
}

export interface ProofFailureInput {
  /** Short, redacted error text (≤200 chars, no newlines, no signer-key hex). */
  reason: string;
  /** Structured ethers/RPC error code when available, e.g. CALL_EXCEPTION. */
  errorClass?: string;
  symbols: string[];
  attemptedAtMs: number;
}

export interface ProofFailure extends ProofFailureInput {
  rail: RailName;
}

export interface RailCounts {
  ok: number;
  failed: number;
}

export interface ProofSnapshot {
  generatedAt: number;
  stocks: ProofEntry[];
  crypto: ProofEntry[];
  failures: { stocks: ProofFailure[]; crypto: ProofFailure[] };
  counts: { stocks: RailCounts; crypto: RailCounts };
  /** Optional ingest counters, merged in by `OracleSignerService.getProofSnapshot()`.
   *  Older signer builds may omit this; consumers must default to zero counters. */
  ingest?: IngestStats;
}

export const DEFAULT_PROOF_CAPACITY = 50;

const REASON_MAX_LEN = 200;

/**
 * Reduce a thrown value to a redacted, ≤200-char single-line string suitable
 * for inclusion in a public HTTP body. Strips long hex sequences (signer
 * keys, addresses), collapses CR/LF, and clamps length so a stack trace or
 * accidentally-leaked credential never escapes.
 */
export function redactProofReason(err: unknown): string {
  let raw: string;
  if (err instanceof Error) {
    raw = err.message;
  } else if (err === undefined || err === null) {
    raw = String(err);
  } else {
    raw = String(err);
  }
  const oneLine = raw.replace(/\r?\n/g, ' ');
  const redactedHex = oneLine.replace(/0x[0-9a-fA-F]{40,}/g, '<redacted-hex>');
  return redactedHex.length > REASON_MAX_LEN ? redactedHex.slice(0, REASON_MAX_LEN) : redactedHex;
}

export class ProofStore {
  private readonly capacity: number;
  private readonly rails: Record<RailName, ProofEntry[]> = { stocks: [], crypto: [] };
  private readonly failures: Record<RailName, ProofFailure[]> = { stocks: [], crypto: [] };
  private readonly counts: Record<RailName, RailCounts> = {
    stocks: { ok: 0, failed: 0 },
    crypto: { ok: 0, failed: 0 },
  };

  constructor(capacity: number = DEFAULT_PROOF_CAPACITY) {
    this.capacity = Math.max(1, Math.floor(capacity));
  }

  record(rail: RailName, entry: ProofEntryInput): void {
    const arr = this.rails[rail];
    arr.push({ ...entry, rail });
    while (arr.length > this.capacity) arr.shift();
    this.counts[rail].ok += 1;
  }

  recordFailure(rail: RailName, fail: ProofFailureInput): void {
    const arr = this.failures[rail];
    arr.push({ ...fail, rail });
    while (arr.length > this.capacity) arr.shift();
    this.counts[rail].failed += 1;
  }

  snapshot(): ProofSnapshot {
    return {
      generatedAt: Date.now(),
      stocks: this.rails.stocks.slice().reverse(),
      crypto: this.rails.crypto.slice().reverse(),
      failures: {
        stocks: this.failures.stocks.slice().reverse(),
        crypto: this.failures.crypto.slice().reverse(),
      },
      counts: {
        stocks: { ...this.counts.stocks },
        crypto: { ...this.counts.crypto },
      },
    };
  }
}
