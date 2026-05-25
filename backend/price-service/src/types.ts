export type SessionState =
  | 'pre-market'
  | 'open'
  | 'after-hours'
  | 'closed'
  | 'halted'
  | 'unknown';

export type EtoroAssetClass =
  | 'equity'
  | 'etf'
  | 'crypto'
  | 'forex'
  | 'index'
  | 'commodity'
  | 'unknown';

export interface NormalizedQuote {
  source: 'etoro';
  symbol: string;
  instrumentId: string;
  bid: number;
  ask: number;
  mid: number;
  last: number;
  spread: number;
  spreadPct: number;
  timestamp: number;
  sessionState: SessionState;
  confidence: number;
  assetClass?: EtoroAssetClass;
  currency?: string;
  stale: boolean;
}

/**
 * Derive absolute and percentage spread from a quote's bid/ask/mid.
 * `spread` is `ask - bid` (clamped to >= 0). `spreadPct` is
 * `((ask - bid) / mid) * 100`, clamped to >= 0 when mid > 0, else 0.
 * Returns a new quote with the derived fields filled in so callers can
 * pass through partially-constructed fixtures without recomputing.
 */
export function computeSpread<T extends Pick<NormalizedQuote, 'bid' | 'ask' | 'mid'>>(
  quote: T,
): T & { spread: number; spreadPct: number } {
  const rawSpread = quote.ask - quote.bid;
  const spread = rawSpread > 0 ? rawSpread : 0;
  const spreadPct = quote.mid > 0 ? Math.max(0, (rawSpread / quote.mid) * 100) : 0;
  return { ...quote, spread, spreadPct };
}

export interface RiskFilterResult {
  accepted: boolean;
  reason?: string;
  quote: NormalizedQuote;
}

export interface CachedQuote {
  quote: NormalizedQuote;
  cachedAt: number;
  filterResult: RiskFilterResult;
}

import { DEFAULT_LANE_SYMBOLS } from '@goodchain/etoro-client';

export interface PriceServiceConfig {
  symbols: string[];
  stalenessThresholdMs: number;
  maxDeviationPct: number;
  maxSpreadPct: number;
  /**
   * Accept official eToro last-close quotes for equity-like assets while the
   * exchange session is closed. Default stays false so the generic price
   * service remains conservative; the live eToro testnet producer enables this
   * explicitly so weekend/overnight recovery still has real eToro prices
   * flowing through the oracle instead of silently falling back to fixtures.
   */
  acceptClosedMarketQuotes: boolean;
  cacheTtlMs: number;
  restFallbackIntervalMs: number;
  port: number;
  wsPort: number;
}

/**
 * Connection state of the upstream market-data source (eToro).
 * Surfaced on `/health` and `/status/quotes` so a downstream consumer
 * (lane-3 oracle-signer) can distinguish "warmup, no ticks yet" from
 * "source dead at boot, will never tick".
 *
 * `reason` is contractually a stable catalog slug (one of
 * `REASON_CATALOG`'s keys) — producers run their thrown errors
 * through `classifySourceError` (see `source-status.ts`) which maps
 * every input to a slug. The optional `detail` carries the redacted
 * raw machine-error first line for debuggability when classification
 * fell to `source-unavailable`; null/undefined for clean catalog
 * slugs (e.g. `etoro-client-not-installed`, `not-attached`).
 */
export type SourceStatus =
  | {
      connected: false;
      reason: string;
      detail?: string | null;
      lastAttachAt: number | null;
    }
  | { connected: true; symbols: string[]; lastAttachAt: number };

/**
 * Rolling in-memory counters for quote ingestion, surfaced via the
 * audit logger and exposed by the `/health` and `/audit/stats` endpoints.
 *
 * `firstAtMs` / `lastAtMs` are unix-millisecond timestamps. The `Ms`
 * suffix marks unix-ms timestamps service-wide (see the policy block
 * near the `/status/quotes` handler in `server.ts`); plain `firstAt` /
 * `lastAt` rode for historical reasons until task 0053. The wire
 * legacy aliases live behind a deprecation note in the `/audit/stats`
 * handler — the in-memory contract uses the canonical names only.
 */
export interface IngestStats {
  ingested: number;
  rejected: number;
  byReason: Record<string, number>;
  firstAtMs: number | null;
  lastAtMs: number | null;
  writeErrors: number;
  /**
   * Lines shed by the audit logger because the in-memory buffer was
   * over its cap while the WriteStream was backpressured (task 0067).
   * Distinct from `writeErrors`: that counts kernel-rejected writes
   * (full disk, bad path); this counts producer-side shedding under
   * "kernel can't keep up" pressure. Drop-oldest policy — recent
   * forensic detail wins over ancient ticks.
   */
  bufferedDrops: number;
}

export const DEFAULT_CONFIG: PriceServiceConfig = {
  symbols: [...DEFAULT_LANE_SYMBOLS],
  stalenessThresholdMs: 10_000,
  maxDeviationPct: 5,
  maxSpreadPct: 2,
  acceptClosedMarketQuotes: false,
  cacheTtlMs: 30_000,
  restFallbackIntervalMs: 5_000,
  port: 9300,
  wsPort: 9301,
};
