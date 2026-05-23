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

export interface PriceServiceConfig {
  symbols: string[];
  stalenessThresholdMs: number;
  maxDeviationPct: number;
  maxSpreadPct: number;
  cacheTtlMs: number;
  restFallbackIntervalMs: number;
  port: number;
  wsPort: number;
}

export const DEFAULT_CONFIG: PriceServiceConfig = {
  symbols: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META', 'AMZN', 'GOOGL', 'SPY', 'QQQ', 'AMD'],
  stalenessThresholdMs: 10_000,
  maxDeviationPct: 5,
  maxSpreadPct: 2,
  cacheTtlMs: 30_000,
  restFallbackIntervalMs: 5_000,
  port: 9300,
  wsPort: 9301,
};
