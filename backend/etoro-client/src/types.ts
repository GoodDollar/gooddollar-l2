export type {
  NormalizedQuote,
  SessionState,
  EtoroAssetClass,
} from '../../shared/quote-types';
import type { NormalizedQuote } from '../../shared/quote-types';

export type EtoroMode = 'sandbox' | 'real';

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

export interface InstrumentMetadata {
  instrumentId: string;
  symbol: string;
  displayName: string;
  exchange: string;
  currency: string;
  assetClass: import('../../shared/quote-types').EtoroAssetClass;
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
}
