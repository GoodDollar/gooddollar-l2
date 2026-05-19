export type EtoroMode = 'sandbox' | 'real';

export type EtoroAssetClass =
  | 'equity'
  | 'etf'
  | 'crypto'
  | 'forex'
  | 'index'
  | 'commodity'
  | 'unknown';

export type SessionState =
  | 'pre-market'
  | 'open'
  | 'after-hours'
  | 'closed'
  | 'halted'
  | 'unknown';

export interface EtoroCredentials {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  mode: EtoroMode;
}

export interface EtoroClientConfig {
  credentials: EtoroCredentials;
  timeoutMs?: number;
  userAgent?: string;
}

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
  assetClass: EtoroAssetClass;
  currency: string;
  stale: boolean;
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
  amount: number;
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
  totalBalance: number;
  availableBalance: number;
  totalMargin: number;
  unrealizedPnl: number;
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
}
