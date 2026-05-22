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
  blockNumber: number | null;
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

/**
 * Static deployment context for the proof endpoint — answers "which chain?",
 * "which oracle contracts?", and "which keeper address?" so dashboards can
 * render explorer links and operators can verify the right oracle is being
 * written to.
 *
 * `chainId` is populated after `assertDevnetChain` runs successfully; it
 * stays null on a refused signer or before the first guard probe.
 * `signerAddress` is the wallet's PUBLIC address derived from the signer key
 * — the private key is never serialised anywhere in this snapshot.
 * `rpcEndpoint` is the RPC URL passed through `redactRpcEndpoint` (strips
 * URL credentials/query/hash and obvious token path segments).
 * `oracleAddresses.<rail>` is null when that rail's address isn't configured.
 *
 * Casing for addresses follows ethers v6's checksum casing — callers that
 * need lowercased addresses should normalise downstream.
 */
export interface ChainInfo {
  chainId: number | null;
  rpcEndpoint?: string;
  signerAddress: string | null;
  oracleAddresses: { stocks: string | null; crypto: string | null };
}

export interface ProofSnapshot {
  generatedAt: number;
  /** Static deployment context — chainId, addresses. Added by task 0011. */
  chain: ChainInfo;
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
export const MAX_PROOF_CAPACITY = 500;

const REASON_MAX_LEN = 200;

/**
 * Reduce a thrown value to a redacted, ≤200-char single-line string suitable
 * for inclusion in a public HTTP body. Strips long hex sequences (signer
 * keys, addresses), collapses CR/LF, and clamps length so a stack trace or
 * accidentally-leaked credential never escapes.
 */
const RPC_ENDPOINT_MAX_LEN = 200;

export function normalizeProofCapacity(raw: number | string | undefined | null): number {
  const parsed = typeof raw === 'number'
    ? raw
    : typeof raw === 'string' && raw.trim().length > 0
      ? Number(raw)
      : DEFAULT_PROOF_CAPACITY;
  if (!Number.isFinite(parsed)) return DEFAULT_PROOF_CAPACITY;

  const capacity = Math.floor(parsed);
  if (capacity <= 0) return DEFAULT_PROOF_CAPACITY;
  return Math.min(capacity, MAX_PROOF_CAPACITY);
}

function shouldRedactPathSegment(segment: string): boolean {
  const decoded = decodeURIComponent(segment);
  if (/api[-_]?key|access[-_]?token|secret|password|credential/i.test(decoded)) return true;
  return decoded.length >= 20 && /^[A-Za-z0-9._~-]+$/.test(decoded);
}

/**
 * Sanitise an RPC URL for inclusion in the public `/proof` response.
 *
 * - Strips `userinfo`, query strings, hashes, and obvious token path segments.
 * - Returns `undefined` for non-URL inputs (IPC paths, empty strings,
 *   malformed values, anything that the WHATWG URL parser rejects). The
 *   public proof body would rather omit the field than expose a partially-
 *   sanitised value that may still carry credentials.
 * - Clamps the result to ≤200 chars.
 *
 * Operators using IPC paths or other non-URL transports can read the env
 * var directly on the signer host; this helper deliberately drops them.
 */
export function redactRpcEndpoint(raw: string | undefined | null): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return undefined;
  }
  const pathSegments = u.pathname.split('/').filter(Boolean);
  const safePath = pathSegments.length === 0
    ? ''
    : pathSegments.some(shouldRedactPathSegment)
      ? '/<redacted>'
      : u.pathname;
  const out = `${u.protocol}//${u.host}${safePath}`;
  return out.length > RPC_ENDPOINT_MAX_LEN ? out.slice(0, RPC_ENDPOINT_MAX_LEN) : out;
}

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

function defaultChainInfo(): ChainInfo {
  return {
    chainId: null,
    signerAddress: null,
    oracleAddresses: { stocks: null, crypto: null },
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
    chain: defaultChainInfo(),
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
  private chainInfoState: ChainInfo = defaultChainInfo();

  constructor(capacity: number = DEFAULT_PROOF_CAPACITY) {
    this.capacity = normalizeProofCapacity(capacity);
  }

  /**
   * Mark whether a rail is wired (has an oracle address + necessary config).
   * Operators reading `/proof` use this to disambiguate "rail just hasn't
   * published yet" from "rail isn't configured at all".
   */
  setRailEnabled(rail: RailName, enabled: boolean): void {
    this.railStatus[rail].enabled = enabled;
  }

  /**
   * Merge static deployment context (chain id, addresses, RPC endpoint) into
   * the snapshot. Shallowly merges top-level fields; `oracleAddresses` merges
   * one rail at a time so callers can set just `stocks` or just `crypto`
   * without clobbering the other. `rpcEndpoint: undefined` removes the
   * existing value (use for resetting); pass a string to overwrite.
   */
  setChainInfo(partial: Partial<ChainInfo>): void {
    const merged: ChainInfo = {
      chainId: partial.chainId !== undefined ? partial.chainId : this.chainInfoState.chainId,
      signerAddress: partial.signerAddress !== undefined ? partial.signerAddress : this.chainInfoState.signerAddress,
      oracleAddresses: {
        stocks: partial.oracleAddresses?.stocks !== undefined
          ? partial.oracleAddresses.stocks
          : this.chainInfoState.oracleAddresses.stocks,
        crypto: partial.oracleAddresses?.crypto !== undefined
          ? partial.oracleAddresses.crypto
          : this.chainInfoState.oracleAddresses.crypto,
      },
    };
    if ('rpcEndpoint' in partial) {
      if (partial.rpcEndpoint !== undefined) merged.rpcEndpoint = partial.rpcEndpoint;
    } else if (this.chainInfoState.rpcEndpoint !== undefined) {
      merged.rpcEndpoint = this.chainInfoState.rpcEndpoint;
    }
    this.chainInfoState = merged;
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
    const chain: ChainInfo = {
      chainId: this.chainInfoState.chainId,
      signerAddress: this.chainInfoState.signerAddress,
      oracleAddresses: { ...this.chainInfoState.oracleAddresses },
    };
    if (this.chainInfoState.rpcEndpoint !== undefined) {
      chain.rpcEndpoint = this.chainInfoState.rpcEndpoint;
    }
    return {
      generatedAt,
      chain,
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
