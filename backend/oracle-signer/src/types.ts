export type SessionStateString =
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
  sessionState: SessionStateString;
  confidence: number;
  assetClass?: string;
  currency?: string;
  stale: boolean;
}

/** On-chain session state enum (matches StockOracleV2.SessionState) */
export enum SessionState {
  Open = 0,
  PreMarket = 1,
  AfterHours = 2,
  Closed = 3,
  Halted = 4,
}

export interface OracleSignerConfig {
  priceServiceUrl: string;
  rpcUrl: string;
  oracleAddress: string;
  signerKey: string;
  updateIntervalMs: number;
  minDeviationBps: number;
  symbols: string[];
  txTimeoutMs: number;
  /**
   * Cumulative malformed/parse-fail/socket-error frame count beyond
   * which the watchdog flips `SERVICE_HEALTH_STATUS=degraded` with
   * the `WS_STREAM_REASON_PREFIX` reason. Surfaces silent
   * price-service ↔ signer schema drift on `/health`.
   */
  wsFailureDegradeAt: number;
}

export interface PendingUpdate {
  symbol: string;
  price8: bigint;
  timestamp: number;
  session: SessionState;
  confidence: number;
}

export interface UpdateResult {
  txHash: string;
  gasUsed: bigint;
  symbolCount: number;
  roundTripMs: number;
}
