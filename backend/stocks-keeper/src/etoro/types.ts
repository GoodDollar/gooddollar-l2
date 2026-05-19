export type EtoroAssetClass =
  | 'equity'
  | 'etf'
  | 'crypto'
  | 'forex'
  | 'index'
  | 'commodity'
  | 'unknown';

export interface EtoroCredentialRecord {
  profile: string;
  username?: string;
  password?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  token?: string;
  accountId?: string;
  baseUrl?: string;
  environment?: string;
  raw: Record<string, string>;
}

export interface EtoroClientConfig {
  baseUrl: string;
  credentials?: EtoroCredentialRecord;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  userAgent?: string;
  authPath?: string;
  instrumentsPath?: string;
  quotesPath?: string;
}

export interface EtoroInstrument {
  instrumentId: string;
  symbol: string;
  ticker: string;
  displayName?: string;
  exchange?: string;
  currency: string;
  assetClass: EtoroAssetClass;
  source: 'etoro';
  raw: unknown;
}

export interface GoodChainMarketQuote {
  source: 'etoro';
  instrumentId: string;
  symbol: string;
  ticker: string;
  goodChainKey: string;
  assetClass: EtoroAssetClass;
  exchange?: string;
  currency: string;
  bid?: number;
  ask?: number;
  last?: number;
  price: number;
  priceE8: bigint;
  timestamp: number;
  stale: boolean;
  raw: unknown;
}

export interface OraclePriceUpdate {
  ticker: string;
  price: number;
  priceChainlink: bigint;
  timestamp: number;
  source: 'etoro';
  instrumentId: string;
}
