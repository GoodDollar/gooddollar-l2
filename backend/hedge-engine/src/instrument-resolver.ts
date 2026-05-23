import { StockSymbol } from './types';

/**
 * Minimal slice of EtoroClient.marketData — we only need instrument lookup.
 * Kept structurally typed so the resolver can be tested with a plain mock.
 */
export interface MarketDataLike {
  getInstrument(symbol: string): Promise<{ instrumentId: string; symbol: string } | null>;
}

/**
 * Resolves on-chain symbols (e.g. `AAPL`) to eToro instrument IDs.
 *
 * Layering:
 *  1. `envMap` (HEDGE_INSTRUMENT_MAP=AAPL:1001,TSLA:1002) — operator override,
 *     always wins so we can patch around a stale eToro catalog.
 *  2. `marketData.getInstrument(symbol)` — lazy live lookup.
 *  3. `null` — caller (`HedgeExecutor`) already turns `null` into
 *     `error: "No instrument ID mapped"`.
 *
 * Each symbol's resolution is cached after the first successful lookup so
 * a 50-tick steady state hits marketData at most once per symbol.
 */
export class InstrumentResolver {
  private readonly envMap: Map<StockSymbol, string>;
  private readonly marketData: MarketDataLike | null;
  private readonly cache = new Map<StockSymbol, string | null>();

  constructor(envMap: Map<StockSymbol, string>, marketData: MarketDataLike | null) {
    this.envMap = envMap;
    this.marketData = marketData;
  }

  async resolve(symbol: StockSymbol): Promise<string | null> {
    const cached = this.cache.get(symbol);
    if (cached !== undefined) return cached;

    const envHit = this.envMap.get(symbol);
    if (envHit) {
      this.cache.set(symbol, envHit);
      return envHit;
    }

    if (!this.marketData) {
      // Do NOT cache misses — operator may patch env mid-process via restart.
      return null;
    }

    try {
      const meta = await this.marketData.getInstrument(symbol);
      const id = meta?.instrumentId ?? null;
      if (id) this.cache.set(symbol, id);
      return id;
    } catch {
      return null;
    }
  }
}
