import { CachedQuote, NormalizedQuote, PriceServiceConfig, DEFAULT_CONFIG, RiskFilterResult } from './types';
import { RiskFilter } from './risk-filter';

export class QuoteCache {
  private readonly cache = new Map<string, CachedQuote>();
  private readonly filter: RiskFilter;
  private readonly config: PriceServiceConfig;
  private readonly listeners: Array<(symbol: string, result: RiskFilterResult) => void> = [];
  // Monotonic counter of ingest attempts (accepted or rejected). Used by the
  // health endpoints to distinguish "boot has not yet received any quote"
  // (`starting`) from "cache emptied or all quotes stale" (`degraded`).
  private cumulativeUpdatesCount = 0;

  constructor(config?: Partial<PriceServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.filter = new RiskFilter(config);
  }

  update(quote: NormalizedQuote): RiskFilterResult {
    this.cumulativeUpdatesCount++;
    const result = this.filter.apply(quote);
    const now = Date.now();

    if (result.accepted) {
      this.cache.set(quote.symbol, {
        quote: result.quote,
        cachedAt: now,
        filterResult: result,
      });
    }

    for (const listener of this.listeners) {
      listener(quote.symbol, result);
    }

    return result;
  }

  get(symbol: string): CachedQuote | undefined {
    const entry = this.cache.get(symbol);
    if (!entry) return undefined;

    const age = Date.now() - entry.cachedAt;
    if (age > this.config.cacheTtlMs) {
      return {
        ...entry,
        quote: { ...entry.quote, stale: true, confidence: 0 },
        filterResult: {
          accepted: false,
          reason: `cache-expired: age ${age}ms exceeds TTL ${this.config.cacheTtlMs}ms`,
          quote: { ...entry.quote, stale: true, confidence: 0 },
        },
      };
    }

    return entry;
  }

  getAll(): Map<string, CachedQuote> {
    const result = new Map<string, CachedQuote>();
    for (const [symbol] of this.cache) {
      const entry = this.get(symbol);
      if (entry) result.set(symbol, entry);
    }
    return result;
  }

  getFresh(): NormalizedQuote[] {
    const quotes: NormalizedQuote[] = [];
    for (const [symbol] of this.cache) {
      const entry = this.get(symbol);
      if (entry && !entry.quote.stale && entry.filterResult.accepted) {
        quotes.push(entry.quote);
      }
    }
    return quotes;
  }

  onUpdate(listener: (symbol: string, result: RiskFilterResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  clear(symbol?: string): void {
    if (symbol) {
      this.cache.delete(symbol);
    } else {
      this.cache.clear();
    }
    this.filter.clearTwap(symbol);
  }

  get size(): number {
    return this.cache.size;
  }

  get cumulativeUpdates(): number {
    return this.cumulativeUpdatesCount;
  }
}
