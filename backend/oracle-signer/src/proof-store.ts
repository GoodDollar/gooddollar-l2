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

/**
 * Per-rail operational status as seen at snapshot time. Surfaces the three
 * questions an operator asks first: "is this rail configured?", "when did it
 * last publish successfully?", and "when did it last fail?".
 *
 * `lastSuccessAtMs` / `lastFailureAtMs` are tracked as independent state on
 * `ProofStore` — they survive ring rollover so an operator still has a
 * timestamp to point at even when every entry in the bounded ring is a failure
 * that pushed all successes off.
 *
 * `lastSuccessAgeMs` / `lastFailureAgeMs` are derived at snapshot time as
 * `generatedAt - lastXxxAtMs`. They can be negative in pathological clock-skew
 * cases; consumers should treat negative values as "clock skew" and not as
 * "future timestamp".
 */
export interface RailStatus {
  enabled: boolean;
  lastSuccessAtMs: number | null;
  lastSuccessAgeMs: number | null;
  lastFailureAtMs: number | null;
  lastFailureAgeMs: number | null;
}

export interface ProofSnapshot {
  generatedAt: number;
  /** Per-rail status block — added by task 0009 so operators can answer
   *  "is the oracle publishing? how fresh?" without subtracting timestamps. */
  rails: { stocks: RailStatus; crypto: RailStatus };
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

interface RailStatusState {
  enabled: boolean;
  lastSuccessAtMs: number | null;
  lastFailureAtMs: number | null;
}

function defaultRailStatusState(): RailStatusState {
  return { enabled: false, lastSuccessAtMs: null, lastFailureAtMs: null };
}

function defaultRailStatus(): RailStatus {
  return {
    enabled: false,
    lastSuccessAtMs: null,
    lastSuccessAgeMs: null,
    lastFailureAtMs: null,
    lastFailureAgeMs: null,
  };
}

/**
 * Canonical empty `/proof` body. Used by `oracle-signer` before its service is
 * constructed (e.g. while `loadConfig()` is failing) so that consumers always
 * see the SAME superset shape — never an "alternate degraded schema" that
 * drifts as the snapshot grows.
 */
export function canonicalEmptyProofSnapshot(): ProofSnapshot {
  return {
    generatedAt: Date.now(),
    rails: { stocks: defaultRailStatus(), crypto: defaultRailStatus() },
    stocks: [],
    crypto: [],
    failures: { stocks: [], crypto: [] },
    counts: { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } },
  };
}

export class ProofStore {
  private readonly capacity: number;
  private readonly rails: Record<RailName, ProofEntry[]> = { stocks: [], crypto: [] };
  private readonly failures: Record<RailName, ProofFailure[]> = { stocks: [], crypto: [] };
  private readonly counts: Record<RailName, RailCounts> = {
    stocks: { ok: 0, failed: 0 },
    crypto: { ok: 0, failed: 0 },
  };
  private readonly railStatus: Record<RailName, RailStatusState> = {
    stocks: defaultRailStatusState(),
    crypto: defaultRailStatusState(),
  };

  constructor(capacity: number = DEFAULT_PROOF_CAPACITY) {
    this.capacity = Math.max(1, Math.floor(capacity));
  }

  /**
   * Mark whether a rail is wired (has an oracle address + necessary config).
   * Operators reading `/proof` use this to disambiguate "rail just hasn't
   * published yet" from "rail isn't configured at all".
   */
  setRailEnabled(rail: RailName, enabled: boolean): void {
    this.railStatus[rail].enabled = enabled;
  }

  record(rail: RailName, entry: ProofEntryInput): void {
    const arr = this.rails[rail];
    arr.push({ ...entry, rail });
    while (arr.length > this.capacity) arr.shift();
    this.counts[rail].ok += 1;
    this.railStatus[rail].lastSuccessAtMs = entry.submittedAtMs;
  }

  recordFailure(rail: RailName, fail: ProofFailureInput): void {
    const arr = this.failures[rail];
    arr.push({ ...fail, rail });
    while (arr.length > this.capacity) arr.shift();
    this.counts[rail].failed += 1;
    this.railStatus[rail].lastFailureAtMs = fail.attemptedAtMs;
  }

  snapshot(): ProofSnapshot {
    const generatedAt = Date.now();
    const buildRail = (rail: RailName): RailStatus => {
      const s = this.railStatus[rail];
      return {
        enabled: s.enabled,
        lastSuccessAtMs: s.lastSuccessAtMs,
        lastSuccessAgeMs: s.lastSuccessAtMs === null ? null : generatedAt - s.lastSuccessAtMs,
        lastFailureAtMs: s.lastFailureAtMs,
        lastFailureAgeMs: s.lastFailureAtMs === null ? null : generatedAt - s.lastFailureAtMs,
      };
    };
    return {
      generatedAt,
      rails: { stocks: buildRail('stocks'), crypto: buildRail('crypto') },
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
