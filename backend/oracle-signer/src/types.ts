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
