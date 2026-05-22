import type { ExecutionLeg, MarketQuote, VenueType } from '../core/types.js';

export interface VenueAdapter {
  id: string;
  type: VenueType;
  healthy(): Promise<boolean>;
  quotes(): Promise<MarketQuote[]>;
  buildExecution?(leg: ExecutionLeg): Promise<ExecutionLeg>;
}

export interface VenueDefinition {
  id: string;
  type: VenueType;
  enabled: boolean;
  description?: string;
  contracts?: Record<string, string>;
  rest?: Record<string, string>;
  [key: string]: unknown;
}
