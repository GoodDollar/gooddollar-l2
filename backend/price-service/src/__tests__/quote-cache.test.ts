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

    it('does not store a crossed quote (bid > ask)', () => {
      const result = cache.update(makeQuote({ bid: 101, ask: 100, mid: 100.5 }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toMatch(/^crossed:/);
      expect(cache.size).toBe(0);
      expect(cache.get('AAPL')).toBeUndefined();
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

    // Regression: a single throwing listener used to propagate up out
    // of `update`, breaking the upstream ingest path (etoro-source →
    // PriceService.ingestQuote) and silencing every later listener
    // for the same tick. Mirrors the defensive pattern in
    // etoro-client/src/market-data.ts.
    it('isolates a throwing listener so update returns and later listeners still fire', () => {
      const received: string[] = [];
      cache.onUpdate(() => { throw new Error('downstream blew up'); });
      cache.onUpdate((symbol) => received.push(symbol));

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => cache.update(makeQuote({ symbol: 'AAPL' }))).not.toThrow();
      expect(received).toEqual(['AAPL']);
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/cache listener threw/));
      warn.mockRestore();
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

  describe('cumulativeUpdates', () => {
    it('starts at 0 on a fresh cache', () => {
      expect(cache.cumulativeUpdates).toBe(0);
    });

    it('increments on accepted quote', () => {
      cache.update(makeQuote());
      expect(cache.cumulativeUpdates).toBe(1);
    });

    it('increments on rejected quote (e.g. halted session)', () => {
      cache.update(makeQuote({ sessionState: 'halted' }));
      expect(cache.cumulativeUpdates).toBe(1);
      expect(cache.size).toBe(0);
    });

    it('increments on rejected (stale) quote', () => {
      cache.update(makeQuote({ timestamp: Date.now() - 60_000 }));
      expect(cache.cumulativeUpdates).toBe(1);
      expect(cache.size).toBe(0);
    });

    it('accumulates across many updates regardless of acceptance', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA', sessionState: 'halted' }));
      cache.update(makeQuote({ symbol: 'MSFT' }));
      expect(cache.cumulativeUpdates).toBe(3);
    });

    it('is not reset by clear()', () => {
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA' }));
      cache.clear();
      expect(cache.cumulativeUpdates).toBe(2);
    });
  });
});
