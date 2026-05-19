import { RiskFilter } from '../risk-filter';
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

describe('RiskFilter', () => {
  let filter: RiskFilter;

  beforeEach(() => {
    filter = new RiskFilter({
      stalenessThresholdMs: 10_000,
      maxSpreadPct: 2,
      maxDeviationPct: 5,
    });
  });

  describe('staleness check', () => {
    it('accepts fresh quotes', () => {
      const result = filter.apply(makeQuote());
      expect(result.accepted).toBe(true);
    });

    it('rejects stale quotes', () => {
      const result = filter.apply(makeQuote({ timestamp: Date.now() - 15_000 }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('stale');
      expect(result.quote.stale).toBe(true);
      expect(result.quote.confidence).toBe(0);
    });
  });

  describe('spread check', () => {
    it('accepts normal spreads', () => {
      const result = filter.apply(makeQuote({ bid: 100, ask: 100.5, mid: 100.25 }));
      expect(result.accepted).toBe(true);
    });

    it('rejects wide spreads', () => {
      const result = filter.apply(makeQuote({ bid: 100, ask: 105, mid: 102.5 }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('spread-too-wide');
    });

    it('rejects zero mid price', () => {
      const result = filter.apply(makeQuote({ mid: 0, bid: 0, ask: 0 }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('invalid');
    });

    it('rejects negative mid price', () => {
      const result = filter.apply(makeQuote({ mid: -1 }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('invalid');
    });
  });

  describe('session check', () => {
    it('accepts open market', () => {
      const result = filter.apply(makeQuote({ sessionState: 'open' }));
      expect(result.accepted).toBe(true);
    });

    it('accepts pre-market quotes', () => {
      const result = filter.apply(makeQuote({ sessionState: 'pre-market' }));
      expect(result.accepted).toBe(true);
    });

    it('accepts after-hours quotes', () => {
      const result = filter.apply(makeQuote({ sessionState: 'after-hours' }));
      expect(result.accepted).toBe(true);
    });

    it('rejects halted market', () => {
      const result = filter.apply(makeQuote({ sessionState: 'halted' }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('halted');
    });
  });

  describe('TWAP deviation check', () => {
    it('skips deviation check with fewer than 5 samples', () => {
      for (let i = 0; i < 4; i++) {
        filter.apply(makeQuote({ mid: 100 }));
      }
      const result = filter.apply(makeQuote({ mid: 200 }));
      expect(result.accepted).toBe(true);
    });

    it('rejects large deviation after enough samples', () => {
      for (let i = 0; i < 10; i++) {
        filter.apply(makeQuote({ mid: 100 }));
      }
      const result = filter.apply(makeQuote({ mid: 120 }));
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('deviation');
    });

    it('accepts small deviation', () => {
      for (let i = 0; i < 10; i++) {
        filter.apply(makeQuote({ mid: 100 }));
      }
      const result = filter.apply(makeQuote({ mid: 101 }));
      expect(result.accepted).toBe(true);
    });
  });

  describe('confidence output (0-100 scale)', () => {
    it('preserves input confidence for accepted quotes', () => {
      const result = filter.apply(makeQuote({ confidence: 95 }));
      expect(result.accepted).toBe(true);
      expect(result.quote.confidence).toBe(95);
    });

    it('outputs 0-100 integer confidence for stale rejection', () => {
      const result = filter.apply(makeQuote({ timestamp: Date.now() - 15_000 }));
      expect(result.accepted).toBe(false);
      expect(result.quote.confidence).toBe(0);
      expect(Number.isInteger(result.quote.confidence)).toBe(true);
    });

    it('outputs 0-100 integer confidence for spread rejection', () => {
      const result = filter.apply(makeQuote({ bid: 100, ask: 105, mid: 102.5 }));
      expect(result.accepted).toBe(false);
      expect(result.quote.confidence).toBeGreaterThanOrEqual(0);
      expect(result.quote.confidence).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.quote.confidence)).toBe(true);
    });

    it('outputs 0-100 integer confidence for deviation rejection', () => {
      for (let i = 0; i < 10; i++) {
        filter.apply(makeQuote({ mid: 100 }));
      }
      const result = filter.apply(makeQuote({ mid: 120 }));
      expect(result.accepted).toBe(false);
      expect(result.quote.confidence).toBeGreaterThanOrEqual(0);
      expect(result.quote.confidence).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.quote.confidence)).toBe(true);
    });

    it('outputs 0 confidence for halted rejection', () => {
      const result = filter.apply(makeQuote({ sessionState: 'halted' }));
      expect(result.accepted).toBe(false);
      expect(result.quote.confidence).toBe(0);
    });
  });

  describe('clearTwap', () => {
    it('clears specific symbol TWAP', () => {
      for (let i = 0; i < 10; i++) {
        filter.apply(makeQuote({ mid: 100 }));
      }
      filter.clearTwap('AAPL');
      const result = filter.apply(makeQuote({ mid: 200 }));
      expect(result.accepted).toBe(true);
    });

    it('clears all TWAP data', () => {
      for (let i = 0; i < 10; i++) {
        filter.apply(makeQuote({ symbol: 'AAPL', mid: 100 }));
        filter.apply(makeQuote({ symbol: 'TSLA', mid: 200 }));
      }
      filter.clearTwap();
      expect(filter.apply(makeQuote({ symbol: 'AAPL', mid: 200 })).accepted).toBe(true);
      expect(filter.apply(makeQuote({ symbol: 'TSLA', mid: 400 })).accepted).toBe(true);
    });
  });
});
