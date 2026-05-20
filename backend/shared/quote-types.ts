/**
 * Canonical quote types shared across the eToro price oracle pipeline.
 *
 * Used by: etoro-client, price-service, oracle-signer
 * Must stay in sync with StockOracleV2.sol SessionState enum.
 */

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

/**
 * A normalized price quote flowing through the pipeline:
 * EtoroClient → PriceService → OracleSigner → StockOracleV2
 */
export interface NormalizedQuote {
  source: 'etoro';
  symbol: string;
  /** eToro instrument identifier (string, matching eToro API format) */
  instrumentId: string;
  bid: number;
  ask: number;
  mid: number;
  last: number;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  sessionState: SessionState;
  /** Quote quality score 0-100 (matching StockOracleV2 uint8 confidence) */
  confidence: number;
  assetClass?: EtoroAssetClass;
  currency?: string;
  stale: boolean;
}
