import { PriceService, QuoteCache, RiskFilter, WsBroadcaster, createServer } from '../index';
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
    confidence: 1,
    stale: false,
    ...overrides,
  };
}

describe('PriceService', () => {
  it('exports all public modules', () => {
    expect(QuoteCache).toBeDefined();
    expect(RiskFilter).toBeDefined();
    expect(WsBroadcaster).toBeDefined();
    expect(createServer).toBeDefined();
    expect(PriceService).toBeDefined();
  });

  it('ingests quotes into cache', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    service.ingestQuote(makeQuote({ symbol: 'AAPL' }));
    expect(service.cache.size).toBe(1);
    expect(service.cache.get('AAPL')?.quote.symbol).toBe('AAPL');
  });

  it('ingests multiple symbols', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    service.ingestQuote(makeQuote({ symbol: 'AAPL' }));
    service.ingestQuote(makeQuote({ symbol: 'TSLA' }));
    service.ingestQuote(makeQuote({ symbol: 'NVDA' }));
    expect(service.cache.size).toBe(3);
    expect(service.cache.getFresh().length).toBe(3);
  });

  it('filters rejected quotes', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    service.ingestQuote(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));
    expect(service.cache.size).toBe(0);
    expect(service.cache.getFresh().length).toBe(0);
  });
});
