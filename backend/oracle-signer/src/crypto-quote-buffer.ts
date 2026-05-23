import { NormalizedQuote, PendingCryptoUpdate } from './types';
import { CryptoSymbolMap } from './crypto-symbol-map';

/**
 * Crypto-rail counterpart to {@link QuoteBuffer}. Same deviation-filter
 * semantics, but emits `PendingCryptoUpdate` (token-address keyed, no
 * timestamp/session/confidence — those are not part of
 * `SwapPriceOracle.batchUpdatePrices`).
 */
export class CryptoQuoteBuffer {
  private latestQuotes = new Map<string, NormalizedQuote>();
  private lastSubmittedPrices = new Map<string, number>();
  private readonly minDeviationBps: number;
  private readonly symbolMap: CryptoSymbolMap;

  constructor(minDeviationBps: number, symbolMap: CryptoSymbolMap) {
    this.minDeviationBps = minDeviationBps;
    this.symbolMap = symbolMap;
  }

  update(quote: NormalizedQuote): void {
    if (!Number.isFinite(quote.mid) || quote.mid <= 0) return;
    if (!this.symbolMap.has(quote.symbol)) return;
    this.latestQuotes.set(quote.symbol.toUpperCase(), quote);
  }

  getPendingUpdates(): PendingCryptoUpdate[] {
    const updates: PendingCryptoUpdate[] = [];

    for (const [keyUpper, quote] of this.latestQuotes) {
      const last = this.lastSubmittedPrices.get(keyUpper);
      if (last !== undefined) {
        const deviation = Math.abs(quote.mid - last) / last * 10000;
        if (deviation < this.minDeviationBps) continue;
      }
      const address = this.symbolMap.resolve(quote.symbol);
      if (!address) continue;

      updates.push({
        symbol: keyUpper,
        address,
        price8: BigInt(Math.round(quote.mid * 1e8)),
        timestamp: Math.floor(quote.timestamp / 1000),
      });
    }
    return updates;
  }

  markSubmitted(symbols: string[]): void {
    for (const sym of symbols) {
      const keyUpper = sym.toUpperCase();
      const quote = this.latestQuotes.get(keyUpper);
      if (quote) this.lastSubmittedPrices.set(keyUpper, quote.mid);
    }
  }

  getLatestQuote(symbol: string): NormalizedQuote | undefined {
    return this.latestQuotes.get(symbol.toUpperCase());
  }

  get symbolCount(): number {
    return this.latestQuotes.size;
  }
}
