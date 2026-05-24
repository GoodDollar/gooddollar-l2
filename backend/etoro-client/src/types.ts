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
 * Lane-1 mode contract.
 *
 * - `mock`: zero-network deterministic fake. No credentials required.
 *   Trading is hard-disabled — every order method throws
 *   `RealTradingDisabledError`. Used by tests and downstream services
 *   when demo credentials are absent.
 * - `demo-readonly`: real eToro demo base URLs. Market data is live
 *   against the demo endpoint, trading methods throw
 *   `RealTradingDisabledError`.
 * - `demo-trading`: real eToro demo base URLs. Market data and trading
 *   are both live against the demo account. Demo caps
 *   (`MAX_DEMO_ORDER_NOTIONAL_USD`, `MAX_DAILY_DEMO_NOTIONAL_USD`) are
 *   enforced before any order leaves the SDK.
 * - `real-disabled`: market data only against demo URLs. Trading is
 *   hard-disabled by `REAL_TRADING_ENABLED=false` in source. Provided
 *   so a future lane can flip the source-level fence without re-doing
 *   credential plumbing.
 */
export type EtoroMode =
  | 'mock'
  | 'demo-readonly'
  | 'demo-trading'
  | 'real-disabled';

export interface EtoroCredentials {
  apiKey: string;
  apiSecret: string;
  /**
   * The per-environment user/account key required by the official eToro
   * public API on every request as the `x-user-key` header. For mock
   * mode this is the deterministic literal `'mock-user-key'`; for
   * `demo-*` modes it is loaded from `ETORO_DEMO_USER_KEY`; for
   * `real-disabled` from `ETORO_USER_KEY`.
   */
  userKey: string;
  baseUrl: string;
  wsUrl: string;
  mode: EtoroMode;
}

export interface DemoCapConfig {
  maxOrderNotionalUsd: number;
  maxDailyNotionalUsd: number;
}

export interface EtoroClientConfig {
  credentials: EtoroCredentials;
  timeoutMs?: number;
  userAgent?: string;
}

export interface InstrumentMetadata {
  instrumentId: string;
  symbol: string;
  displayName: string;
  exchange: string;
  currency: string;
  assetClass: EtoroAssetClass;
  minTradeSize: number;
  maxLeverage: number;
}

export interface CandleData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface OrderRequest {
  symbol: string;
  instrumentId: string;
  side: 'buy' | 'sell';
  /**
   * USD notional. When set, the SDK routes to
   * `/trading/execution/demo/market-open-orders/by-amount`. Mutually
   * exclusive with `units`.
   */
  amount: number;
  /**
   * Unit count (shares / coins). When set, the SDK routes to
   * `/trading/execution/demo/market-open-orders/by-units`. Mutually
   * exclusive with `amount`.
   */
  units?: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface OrderResult {
  orderId: string;
  positionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  executionPrice: number;
  timestamp: number;
  status: 'filled' | 'pending' | 'rejected';
}

export interface Position {
  positionId: string;
  instrumentId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  leverage: number;
  openTimestamp: number;
}

export interface AccountBalance {
  totalEquity: number;
  availableCash: number;
  usedMargin: number;
  freeMargin: number;
  currency: string;
}

export type QuoteCallback = (quote: NormalizedQuote) => void;

export interface MarketDataConfig {
  /** WebSocket URL for streaming quotes */
  wsUrl?: string;
  /** How often to poll REST when WS is down (ms) */
  restFallbackIntervalMs?: number;
  /** Max quote age before marking stale (ms) */
  maxQuoteAgeMs?: number;
  /** WS reconnect delay (ms) */
  wsReconnectDelayMs?: number;
  /** WS reconnect max delay (ms) */
  wsReconnectMaxDelayMs?: number;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  method: string;
  path: string;
  mode: EtoroMode;
  statusCode?: number;
  durationMs?: number;
  error?: string;
  /** Resolved USD notional captured at cap-check time (trading actions only). */
  resolvedNotionalUsd?: number;
  /** Where the resolved notional came from. */
  notionalSource?: 'sizer' | 'limit-price' | 'live-quote' | 'reference-fallback';
  /** Age in ms of the live quote used for sizing (live-quote source only). */
  quoteAgeMs?: number;
  /** Resolved mode label emitted once at EtoroClient construction. */
  resolvedMode?: EtoroMode;
  /** Whether the mode was resolved from env or set explicitly. */
  modeSource?: 'env' | 'explicit';
  /** Resolved per-order cap (USD) recorded at construction. */
  capOrderUsd?: number;
  /** Resolved daily cap (USD) recorded at construction. */
  capDailyUsd?: number;
  /** Symbols whose instrument overrides were applied at construction. */
  instrumentOverridesApplied?: string[];
  /** Resolved audit-log file path captured on the mode-resolved entry. */
  resolvedAuditLogPath?: string;
  /**
   * Number of attempts the rate-limited dispatcher made for this HTTP
   * call. `1` means "no retry"; `N` means "N-1 backoffs absorbed".
   */
  attempts?: number;
  /**
   * Sum (ms) of all backoffs slept-for across the call's retries. `0`
   * on a no-throttle happy path.
   */
  totalBackoffMs?: number;
}
