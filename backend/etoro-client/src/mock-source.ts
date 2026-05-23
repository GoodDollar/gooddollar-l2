import {
  applyInstrumentOverrides,
  INSTRUMENT_MAP,
  INSTRUMENT_SYMBOLS,
  LaneInstrument,
  LaneSymbol,
  loadInstrumentOverrides,
} from './instruments';
import { computeConfidence } from './market-data';
import { NormalizedQuote, QuoteCallback } from './types';

export interface MockSourceConfig {
  /** Tick interval in ms (default 1000). */
  intervalMs?: number;
  /** Deterministic seed (default 1). */
  seed?: number;
  /** Override the instrument table; defaults to `INSTRUMENT_MAP` merged with env overrides. */
  instruments?: Record<LaneSymbol, LaneInstrument>;
  /** Inject a clock for tests (defaults to `Date.now`). */
  clock?: () => number;
  /** Inject a setInterval-like timer for tests. Must support `unref()` shape minimally. */
  setIntervalImpl?: (cb: () => void, ms: number) => unknown;
  /** Inject a clearInterval-like clearer matching `setIntervalImpl`'s return. */
  clearIntervalImpl?: (handle: unknown) => void;
}

/**
 * Deterministic, network-free fake of `MarketDataSource`. Used when
 * `ETORO_MODE=mock` so that downstream services (price-service, hedge-engine
 * smoke tests) can run without demo credentials.
 *
 * Implements `onQuote / subscribe / startStreaming / stopStreaming` to match
 * `price-service`'s `MarketDataSource` interface exactly. Every tick, it
 * emits one `NormalizedQuote` per subscribed symbol with a small, seeded
 * walk around `referencePriceUsd`. Same seed → same sequence.
 */
export class MockEtoroSource {
  private readonly intervalMs: number;
  private readonly instruments: Record<LaneSymbol, LaneInstrument>;
  private readonly clock: () => number;
  private readonly setIntervalImpl: (cb: () => void, ms: number) => unknown;
  private readonly clearIntervalImpl: (handle: unknown) => void;
  private readonly listeners: QuoteCallback[] = [];
  private readonly subscribed = new Set<LaneSymbol>();
  private readonly latest = new Map<LaneSymbol, NormalizedQuote>();
  private rngState: number;
  private intervalHandle: unknown = null;
  private tickCount = 0;

  constructor(config: MockSourceConfig = {}) {
    this.intervalMs = config.intervalMs ?? 1_000;
    this.instruments = config.instruments ?? applyInstrumentOverrides(
      INSTRUMENT_MAP,
      loadInstrumentOverrides(),
    );
    this.clock = config.clock ?? (() => Date.now());
    this.setIntervalImpl = config.setIntervalImpl ?? ((cb, ms) => setInterval(cb, ms));
    this.clearIntervalImpl = config.clearIntervalImpl ?? ((h) => clearInterval(h as ReturnType<typeof setInterval>));
    this.rngState = normalizeSeed(config.seed ?? 1);
  }

  onQuote(callback: QuoteCallback): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  subscribe(symbols: string[]): void {
    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (isLaneSymbol(upper)) this.subscribed.add(upper);
    }
  }

  unsubscribe(symbols: string[]): void {
    for (const s of symbols) {
      const upper = s.toUpperCase();
      if (isLaneSymbol(upper)) this.subscribed.delete(upper);
    }
  }

  startStreaming(): void {
    if (this.intervalHandle !== null) return;
    this.intervalHandle = this.setIntervalImpl(() => this.tick(), this.intervalMs);
  }

  stopStreaming(): void {
    if (this.intervalHandle !== null) {
      this.clearIntervalImpl(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  isStreaming(): boolean {
    return this.intervalHandle !== null;
  }

  /**
   * Emits one synchronous tick — used by tests that prefer to drive ticks
   * deterministically without timers. Also called internally by the
   * interval callback.
   */
  tick(): NormalizedQuote[] {
    this.tickCount++;
    const targets = this.subscribed.size > 0
      ? [...this.subscribed]
      : (INSTRUMENT_SYMBOLS as readonly LaneSymbol[]);
    const quotes: NormalizedQuote[] = [];
    for (const symbol of targets) {
      const inst = this.instruments[symbol];
      if (!inst) continue;
      const quote = this.buildQuote(inst);
      this.latest.set(symbol, quote);
      quotes.push(quote);
      for (const listener of this.listeners) {
        try { listener(quote); } catch { /* listener errors do not crash stream */ }
      }
    }
    return quotes;
  }

  getLatest(symbol: string): NormalizedQuote | undefined {
    const upper = symbol.toUpperCase();
    if (!isLaneSymbol(upper)) return undefined;
    return this.latest.get(upper);
  }

  /**
   * Mirrors `MarketDataModule.getCachedQuote` so the SDK's
   * `EtoroMarketDataSource.getCachedQuote?` interface is satisfied in
   * mock mode. `TradingModule.computeNotional` consults this to size
   * market orders against the most recent emitted tick instead of the
   * frozen `referencePriceUsd` constants.
   */
  getCachedQuote(symbol: string): NormalizedQuote | undefined {
    return this.getLatest(symbol);
  }

  private buildQuote(inst: LaneInstrument): NormalizedQuote {
    const drift = (this.nextRandom() - 0.5) * 0.01; // ±0.5% walk
    const mid = inst.referencePriceUsd * (1 + drift);
    const halfSpread = inst.referencePriceUsd * 0.0005; // 5 bps
    const bid = mid - halfSpread;
    const ask = mid + halfSpread;
    const last = mid;
    const timestamp = this.clock();

    return {
      source: 'etoro',
      symbol: inst.symbol,
      instrumentId: inst.etoroInstrumentId,
      bid,
      ask,
      mid,
      last,
      timestamp,
      sessionState: inst.assetClass === 'crypto' ? 'open' : 'unknown',
      confidence: computeConfidence({ bid, ask, mid, price: mid, stale: false }),
      assetClass: inst.assetClass,
      currency: 'USD',
      stale: false,
    };
  }

  /**
   * Mulberry32 PRNG — small, fast, deterministic, sufficient for emitting
   * a stable quote walk. Returns a float in [0, 1).
   */
  private nextRandom(): number {
    this.rngState = (this.rngState + 0x6D2B79F5) >>> 0;
    let t = this.rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1;
  const truncated = Math.floor(Math.abs(seed));
  return (truncated % 0xFFFFFFFF) || 1;
}

function isLaneSymbol(value: string): value is LaneSymbol {
  return (INSTRUMENT_SYMBOLS as readonly string[]).includes(value);
}
