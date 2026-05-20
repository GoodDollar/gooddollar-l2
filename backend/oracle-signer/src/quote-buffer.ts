import { NormalizedQuote, PendingUpdate, SessionState } from './types';

/**
 * Buffers the latest quote per symbol and determines which symbols have
 * deviated enough from the last submitted price to warrant an on-chain update.
 */
export class QuoteBuffer {
  private latestQuotes = new Map<string, NormalizedQuote>();
  private lastSubmittedPrices = new Map<string, number>();
  private readonly minDeviationBps: number;

  constructor(minDeviationBps: number) {
    this.minDeviationBps = minDeviationBps;
  }

  update(quote: NormalizedQuote): void {
    if (!Number.isFinite(quote.mid) || quote.mid <= 0) return;
    this.latestQuotes.set(quote.symbol, quote);
  }

  /**
   * Returns symbols whose current mid price has deviated from the last
   * submitted price by more than minDeviationBps basis points.
   * Symbols without a prior submission are always included.
   */
  getPendingUpdates(): PendingUpdate[] {
    const updates: PendingUpdate[] = [];

    for (const [symbol, quote] of this.latestQuotes) {
      const lastPrice = this.lastSubmittedPrices.get(symbol);

      if (lastPrice !== undefined) {
        const deviation = Math.abs(quote.mid - lastPrice) / lastPrice * 10000;
        if (deviation < this.minDeviationBps) continue;
      }

      updates.push({
        symbol,
        price8: this.toPrice8(quote.mid),
        timestamp: Math.floor(quote.timestamp / 1000),
        session: this.mapSession(quote.sessionState),
        confidence: Math.min(Math.max(Math.round(quote.confidence), 0), 100),
      });
    }

    return updates;
  }

  markSubmitted(symbols: string[]): void {
    for (const symbol of symbols) {
      const quote = this.latestQuotes.get(symbol);
      if (quote) {
        this.lastSubmittedPrices.set(symbol, quote.mid);
      }
    }
  }

  getLatestQuote(symbol: string): NormalizedQuote | undefined {
    return this.latestQuotes.get(symbol);
  }

  get symbolCount(): number {
    return this.latestQuotes.size;
  }

  /** Converts a USD price to 8-decimal fixed point (e.g., $191.50 → 19_150_000_000) */
  private toPrice8(price: number): bigint {
    return BigInt(Math.round(price * 1e8));
  }

  private mapSession(state: string): SessionState {
    switch (state) {
      case 'open': return SessionState.Open;
      case 'pre-market': return SessionState.PreMarket;
      case 'after-hours': return SessionState.AfterHours;
      case 'closed': return SessionState.Closed;
      case 'halted': return SessionState.Halted;
      default: return SessionState.Closed;
    }
  }
}
