import { QuoteCache } from '../quote-cache';
import { NormalizedQuote } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return {
    source: 'etoro',
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 95,
    stale: false,
    ...overrides,
  };
}

describe('QuoteCache', () => {
  let cache: QuoteCache;

  beforeEach(() => {
    cache = new QuoteCache({
      stalenessThresholdMs: 10_000,
      maxSpreadPct: 2,
      maxDeviationPct: 5,
      cacheTtlMs: 30_000,
    });
  });

  describe('update', () => {
    it('stores accepted quotes', () => {
      const result = cache.update(makeQuote());
      expect(result.accepted).toBe(true);
      expect(cache.size).toBe(1);
    });

    it('does not store rejected quotes', () => {
      cache.update(makeQuote({ sessionState: 'halted' }));
      expect(cache.size).toBe(0);
    });

    it('updates existing quote', () => {
      cache.update(makeQuote({ last: 100 }));
      cache.update(makeQuote({ last: 105 }));
      expect(cache.size).toBe(1);
      const entry = cache.get('AAPL');
      expect(entry?.quote.last).toBe(105);
    });
  });

  describe('get', () => {
    it('returns undefined for unknown symbol', () => {
      expect(cache.get('UNKNOWN')).toBeUndefined();
    });

    it('returns cached quote', () => {
      cache.update(makeQuote());
      const entry = cache.get('AAPL');
      expect(entry).toBeDefined();
      expect(entry?.quote.symbol).toBe('AAPL');
    });

    it('marks expired entries as stale', () => {
      const shortCache = new QuoteCache({ cacheTtlMs: 1 });
      shortCache.update(makeQuote());

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const entry = shortCache.get('AAPL');
          expect(entry?.quote.stale).toBe(true);
          expect(entry?.filterResult.accepted).toBe(false);
          expect(entry?.filterResult.reason).toContain('cache-expired');
          resolve();
        }, 10);
      });
    });
  });

  describe('getAll', () => {
    it('returns all cached quotes', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA' }));
      const all = cache.getAll();
      expect(all.size).toBe(2);
    });
  });

  describe('getFresh', () => {
    it('returns only non-stale accepted quotes', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA' }));
      const fresh = cache.getFresh();
      expect(fresh.length).toBe(2);
    });

    it('excludes halted quotes', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA', sessionState: 'halted' }));
      const fresh = cache.getFresh();
      expect(fresh.length).toBe(1);
      expect(fresh[0].symbol).toBe('AAPL');
    });
  });

  describe('onUpdate', () => {
    it('notifies listeners on accepted update', () => {
      const received: string[] = [];
      cache.onUpdate((symbol) => received.push(symbol));
      cache.update(makeQuote({ symbol: 'AAPL' }));
      expect(received).toEqual(['AAPL']);
    });

    it('notifies listeners on rejected update too', () => {
      const received: string[] = [];
      cache.onUpdate((symbol) => received.push(symbol));
      cache.update(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));
      expect(received).toEqual(['AAPL']);
    });

    it('unsubscribe stops notifications', () => {
      const received: string[] = [];
      const unsub = cache.onUpdate((symbol) => received.push(symbol));
      cache.update(makeQuote({ symbol: 'AAPL' }));
      unsub();
      cache.update(makeQuote({ symbol: 'TSLA' }));
      expect(received).toEqual(['AAPL']);
    });
  });

  describe('clear', () => {
    it('clears specific symbol', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA' }));
      cache.clear('AAPL');
      expect(cache.size).toBe(1);
      expect(cache.get('AAPL')).toBeUndefined();
    });

    it('clears all entries', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA' }));
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });
});
