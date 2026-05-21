import { NormalizedQuote, RiskFilterResult, PriceServiceConfig, DEFAULT_CONFIG } from './types';

export class RiskFilter {
  private readonly config: PriceServiceConfig;
  private readonly twapWindow: Map<string, number[]> = new Map();
  private static readonly TWAP_MAX_SAMPLES = 60;

  constructor(config?: Partial<PriceServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  apply(quote: NormalizedQuote): RiskFilterResult {
    const staleness = this.checkStaleness(quote);
    if (!staleness.accepted) return staleness;

    const spread = this.checkSpread(quote);
    if (!spread.accepted) return spread;

    const session = this.checkSession(quote);
    if (!session.accepted) return session;

    const deviation = this.checkTwapDeviation(quote);
    if (!deviation.accepted) return deviation;

    this.updateTwap(quote);

    return { accepted: true, quote };
  }

  private checkStaleness(quote: NormalizedQuote): RiskFilterResult {
    const age = Date.now() - quote.timestamp;
    if (age > this.config.stalenessThresholdMs) {
      return {
        accepted: false,
        reason: `stale: quote age ${age}ms exceeds threshold ${this.config.stalenessThresholdMs}ms`,
        quote: { ...quote, stale: true, confidence: 0 },
      };
    }
    return { accepted: true, quote };
  }

  private checkSpread(quote: NormalizedQuote): RiskFilterResult {
    if (quote.mid <= 0) {
      return {
        accepted: false,
        reason: 'invalid: mid price is zero or negative',
        quote: { ...quote, confidence: 0 },
      };
    }
    const spreadPct = ((quote.ask - quote.bid) / quote.mid) * 100;
    if (spreadPct > this.config.maxSpreadPct) {
      return {
        accepted: false,
        reason: `spread-too-wide: ${spreadPct.toFixed(2)}% exceeds max ${this.config.maxSpreadPct}%`,
        quote: { ...quote, confidence: Math.max(0, 1 - spreadPct / 10) },
      };
    }
    return { accepted: true, quote };
  }

  private checkSession(quote: NormalizedQuote): RiskFilterResult {
    if (quote.sessionState === 'halted') {
      return {
        accepted: false,
        reason: 'halted: market is halted',
        quote: { ...quote, confidence: 0 },
      };
    }
    return { accepted: true, quote };
  }

  private checkTwapDeviation(quote: NormalizedQuote): RiskFilterResult {
    const samples = this.twapWindow.get(quote.symbol);
    if (!samples || samples.length < 5) {
      return { accepted: true, quote };
    }

    const twap = samples.reduce((a, b) => a + b, 0) / samples.length;
    if (twap <= 0) return { accepted: true, quote };

    const deviationPct = Math.abs((quote.mid - twap) / twap) * 100;
    if (deviationPct > this.config.maxDeviationPct) {
      return {
        accepted: false,
        reason: `deviation: ${deviationPct.toFixed(2)}% from TWAP exceeds max ${this.config.maxDeviationPct}%`,
        quote: { ...quote, confidence: Math.max(0, 1 - deviationPct / 20) },
      };
    }
    return { accepted: true, quote };
  }

  private updateTwap(quote: NormalizedQuote): void {
    if (!this.twapWindow.has(quote.symbol)) {
      this.twapWindow.set(quote.symbol, []);
    }
    const samples = this.twapWindow.get(quote.symbol)!;
    samples.push(quote.mid);
    if (samples.length > RiskFilter.TWAP_MAX_SAMPLES) {
      samples.shift();
    }
  }

  clearTwap(symbol?: string): void {
    if (symbol) {
      this.twapWindow.delete(symbol);
    } else {
      this.twapWindow.clear();
    }
  }
}
