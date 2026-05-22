import type { MarketQuote, VenueType } from '../core/types.js';
import type { VenueAdapter, VenueDefinition } from './venue.js';

/**
 * Generic REST adapter for venues that expose quote/orderbook JSON.
 * Configure `rest.quotesUrl` and optionally `rest.healthUrl` in markets.json.
 * Map/normalize the response in `normalizeQuotes` once the API shape is known.
 */
export class GenericRestVenue implements VenueAdapter {
  id: string;
  type: VenueType;
  private def: VenueDefinition;

  constructor(def: VenueDefinition) {
    this.id = def.id;
    this.type = def.type;
    this.def = def;
  }

  async healthy(): Promise<boolean> {
    const url = this.def.rest?.healthUrl ?? this.def.rest?.quotesUrl;
    if (!url) return false;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    return res.ok;
  }

  async quotes(): Promise<MarketQuote[]> {
    const url = this.def.rest?.quotesUrl;
    if (!url) return [];
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`${this.id} quotes HTTP ${res.status}`);
    const json = await res.json();
    return this.normalizeQuotes(json);
  }

  private normalizeQuotes(json: unknown): MarketQuote[] {
    // Intentionally conservative: no guessed API shape. Extend this per venue.
    if (!Array.isArray(json)) return [];
    const now = Date.now();
    return json.flatMap((item: any) => {
      if (!item.marketId || !item.base || !item.quote || !item.bid || !item.ask) return [];
      return [
        { venueId: this.id, venueType: this.type, marketId: String(item.marketId), base: String(item.base), quote: String(item.quote), side: 'buy' as const, price: Number(item.ask), size: Number(item.askSize ?? 0), feeBps: Number(item.feeBps ?? 0), timestamp: now, raw: item },
        { venueId: this.id, venueType: this.type, marketId: String(item.marketId), base: String(item.base), quote: String(item.quote), side: 'sell' as const, price: Number(item.bid), size: Number(item.bidSize ?? 0), feeBps: Number(item.feeBps ?? 0), timestamp: now, raw: item },
      ];
    }).filter(q => Number.isFinite(q.price) && q.price > 0 && Number.isFinite(q.size) && q.size > 0);
  }
}
