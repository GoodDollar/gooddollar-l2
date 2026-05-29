export type VenueType = 'spot' | 'perp' | 'prediction';
export type Side = 'buy' | 'sell';

export interface Asset {
  symbol: string;
  address?: string;
  decimals?: number;
}

export interface MarketQuote {
  venueId: string;
  venueType: VenueType;
  marketId: string;
  base: string;
  quote: string;
  side: Side;
  price: number;
  size: number;
  feeBps?: number;
  timestamp: number;
  raw?: unknown;
}

export interface ExecutionLeg {
  venueId: string;
  venueType: VenueType;
  marketId: string;
  side: Side;
  base: string;
  quote: string;
  size: number;
  expectedPrice: number;
  maxSlippageBps: number;
  calldata?: string;
  to?: string;
  valueWei?: string;
  raw?: unknown;
}

export interface Opportunity {
  id: string;
  kind: 'spot-spot' | 'spot-perp-basis' | 'prediction-basket' | 'cross-venue';
  description: string;
  legs: ExecutionLeg[];
  notionalUsd: number;
  expectedProfitUsd: number;
  expectedProfitBps: number;
  risks: string[];
  createdAt: number;
}

export interface ExecutionResult {
  opportunityId: string;
  dryRun: boolean;
  ok: boolean;
  txHashes: string[];
  error?: string;
}
