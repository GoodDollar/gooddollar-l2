export type SessionState =
  | 'pre-market'
  | 'open'
  | 'after-hours'
  | 'closed'
  | 'halted'
  | 'unknown';

export interface NormalizedQuote {
  source: 'etoro';
  symbol: string;
  instrumentId: string;
  bid: number;
  ask: number;
  mid: number;
  last: number;
  timestamp: number;
  sessionState: SessionState;
  confidence: number;
  stale: boolean;
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
