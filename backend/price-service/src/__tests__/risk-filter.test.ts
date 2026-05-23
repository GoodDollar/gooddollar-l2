import { RiskFilter } from '../risk-filter';
import { NormalizedQuote, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 95,
    stale: false,
    ...overrides,
  };
  return computeSpread(base);
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

  describe('asset-class-aware session check', () => {
    it('equity closed session is rejected', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'equity', sessionState: 'closed' }),
      );
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('market-closed');
    });

    it('etf closed session is rejected', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'etf', sessionState: 'closed' }),
      );
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('market-closed');
    });

    it('index closed session is rejected', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'index', sessionState: 'closed' }),
      );
      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('market-closed');
    });

    it('equity open session is accepted', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'equity', sessionState: 'open' }),
      );
      expect(result.accepted).toBe(true);
    });

    it('crypto closed session is accepted with confidence downgrade of 25', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'crypto', sessionState: 'closed', confidence: 90 }),
      );
      expect(result.accepted).toBe(true);
      expect(result.quote.confidence).toBe(65);
    });

    it('crypto open session keeps confidence', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'crypto', sessionState: 'open', confidence: 90 }),
      );
      expect(result.accepted).toBe(true);
      expect(result.quote.confidence).toBe(90);
    });

    it('crypto confidence downgrade clamps to 0', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'crypto', sessionState: 'closed', confidence: 10 }),
      );
      expect(result.accepted).toBe(true);
      expect(result.quote.confidence).toBe(0);
    });

    it('forex closed session is accepted with confidence downgrade of 15', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'forex', sessionState: 'closed', confidence: 80 }),
      );
      expect(result.accepted).toBe(true);
      expect(result.quote.confidence).toBe(65);
    });

    it('commodity closed session is accepted with confidence downgrade of 15', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'commodity', sessionState: 'closed', confidence: 80 }),
      );
      expect(result.accepted).toBe(true);
      expect(result.quote.confidence).toBe(65);
    });

    it('unknown asset class still accepts closed (backwards-compat)', () => {
      const result = filter.apply(
        makeQuote({ assetClass: 'unknown', sessionState: 'closed' }),
      );
      expect(result.accepted).toBe(true);
    });

    it('no assetClass still accepts closed (backwards-compat)', () => {
      const result = filter.apply(
        makeQuote({ assetClass: undefined, sessionState: 'closed' }),
      );
      expect(result.accepted).toBe(true);
    });

    it('halted is rejected across every asset class', () => {
      for (const assetClass of ['equity', 'etf', 'crypto', 'forex', 'index', 'commodity', 'unknown'] as const) {
        const result = filter.apply(makeQuote({ assetClass, sessionState: 'halted' }));
        expect(result.accepted).toBe(false);
        expect(result.reason).toContain('halted');
      }
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

  describe('spread fields on result quote', () => {
    it('populates spread and spreadPct on accepted quotes', () => {
      const result = filter.apply(makeQuote({ bid: 100, ask: 100.5, mid: 100.25 }));
      expect(result.accepted).toBe(true);
      expect(result.quote.spread).toBeCloseTo(0.5, 6);
      expect(result.quote.spreadPct).toBeCloseTo((0.5 / 100.25) * 100, 6);
    });

    it('populates spread and spreadPct on stale rejection', () => {
      const result = filter.apply(makeQuote({ bid: 100, ask: 100.5, mid: 100.25, timestamp: Date.now() - 30_000 }));
      expect(result.accepted).toBe(false);
      expect(result.quote.spread).toBeCloseTo(0.5, 6);
      expect(result.quote.spreadPct).toBeCloseTo((0.5 / 100.25) * 100, 6);
    });

    it('populates spread on spread-too-wide rejection', () => {
      const result = filter.apply(makeQuote({ bid: 100, ask: 105, mid: 102.5 }));
      expect(result.accepted).toBe(false);
      expect(result.quote.spread).toBeCloseTo(5, 6);
      expect(result.quote.spreadPct).toBeCloseTo((5 / 102.5) * 100, 6);
    });

    it('clamps spreadPct to 0 when mid is not positive', () => {
      const result = filter.apply(makeQuote({ mid: 0, bid: 0, ask: 0 }));
      expect(result.accepted).toBe(false);
      expect(result.quote.spread).toBe(0);
      expect(result.quote.spreadPct).toBe(0);
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
