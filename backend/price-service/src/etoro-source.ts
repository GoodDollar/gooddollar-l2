import { PriceService } from './index';
import type { NormalizedQuote } from './types';

/**
 * Minimal interface for the MarketDataModule's streaming API.
 * Decoupled from the full EtoroClient to enable testing with mocks.
 */
export interface MarketDataSource {
  onQuote(callback: (quote: NormalizedQuote) => void): () => void;
  subscribe(symbols: string[]): void;
  startStreaming(): void;
  stopStreaming(): void;
}

export interface EtoroSourceConfig {
  symbols: string[];
  marketData: MarketDataSource;
}

export interface EtoroSourceHandle {
  stop(): void;
  stats(): EtoroSourceStats;
}

export interface EtoroSourceStats {
  ingestedCount: number;
  rejectedCount: number;
  symbols: string[];
}

/**
 * Connects an eToro MarketDataSource to a PriceService instance.
 * Quotes from the source flow through the PriceService's risk filter
 * and into its cache + WS broadcaster.
 */
export function connectEtoroSource(
  service: PriceService,
  config: EtoroSourceConfig,
): EtoroSourceHandle {
  let ingestedCount = 0;
  let rejectedCount = 0;

  const unsubQuote = config.marketData.onQuote((quote: NormalizedQuote) => {
    const result = service.ingestQuote(quote);
    if (result.accepted) {
      ingestedCount++;
    } else {
      rejectedCount++;
    }
  });

  config.marketData.subscribe(config.symbols);
  config.marketData.startStreaming();

  return {
    stop() {
      unsubQuote();
      config.marketData.stopStreaming();
    },
    stats() {
      return {
        ingestedCount,
        rejectedCount,
        symbols: [...config.symbols],
      };
    },
  };
}
