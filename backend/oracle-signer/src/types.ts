export type {
  NormalizedQuote,
  SessionState as SessionStateString,
} from '../../shared/quote-types';

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
