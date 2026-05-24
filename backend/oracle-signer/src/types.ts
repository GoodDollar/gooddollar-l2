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
  /** StockOracleV2 address. Empty string disables the stocks rail. */
  oracleAddress: string;
  signerKey: string;
  updateIntervalMs: number;
  minDeviationBps: number;
  symbols: string[];
  txTimeoutMs: number;
  /**
   * Devnet chain-id allowlist. The service refuses to start the submission
   * loop when `provider.getNetwork().chainId` is not in this list — a
   * defence-in-depth guard against accidentally publishing keeper-signed
   * batches to mainnet. Defaults to [31337, 1337].
   */
  allowedChainIds: number[];

  // ---- Crypto rail (optional) ----
  /** SwapPriceOracle address. Empty string disables the crypto rail. */
  swapPriceOracleAddress?: string;
  /** Raw `CRYPTO_SYMBOL_MAP` env value — parsed by the service. */
  cryptoSymbolMap?: string;
  /** Crypto-rail submission interval; defaults to `updateIntervalMs` when undefined. */
  cryptoUpdateIntervalMs?: number;
  /** Crypto-rail deviation threshold (bps); defaults to `minDeviationBps`. */
  cryptoMinDeviationBps?: number;
  /** Crypto-rail symbol allowlist; defaults to the keys of `cryptoSymbolMap`. */
  cryptoSymbols?: string[];
}

export interface PendingUpdate {
  symbol: string;
  price8: bigint;
  timestamp: number;
  session: SessionState;
  confidence: number;
}

/** Like `PendingUpdate` but for the SwapPriceOracle rail (token address keyed, no timestamp/session/confidence). */
export interface PendingCryptoUpdate {
  symbol: string;
  address: string;
  price8: bigint;
  /** Off-chain quote timestamp (seconds). The contract uses `block.timestamp`; this is only kept for audit logging. */
  timestamp: number;
}

export interface UpdateResult {
  txHash: string;
  gasUsed: bigint;
  symbolCount: number;
  roundTripMs: number;
  /** Optional block number when known (added in 0004's proof-store path). */
  blockNumber?: number;
}
