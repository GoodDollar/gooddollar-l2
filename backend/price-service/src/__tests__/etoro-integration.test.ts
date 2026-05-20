import { PriceService } from '../index';
import { connectEtoroSource, EtoroSourceConfig } from '../etoro-source';
import { NormalizedQuote } from '../types';

function makeQuote(symbol: string, mid: number): NormalizedQuote {
  return {
    source: 'etoro',
    symbol,
    instrumentId: `${symbol}-1`,
    bid: mid - 0.05,
    ask: mid + 0.05,
    mid,
    last: mid,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 95,
    stale: false,
  };
}

describe('connectEtoroSource', () => {
  it('feeds EtoroClient quotes into PriceService cache', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    const quotes: NormalizedQuote[] = [
      makeQuote('AAPL', 191.50),
      makeQuote('TSLA', 178.30),
    ];

    let capturedCallback: ((q: NormalizedQuote) => void) | null = null;

    const mockMarketData = {
      onQuote: jest.fn((cb: (q: NormalizedQuote) => void) => {
        capturedCallback = cb;
        return () => {};
      }),
      subscribe: jest.fn(),
      startStreaming: jest.fn(),
      stopStreaming: jest.fn(),
    };

    const config: EtoroSourceConfig = {
      symbols: ['AAPL', 'TSLA'],
      marketData: mockMarketData as any,
    };

    const handle = connectEtoroSource(service, config);

    expect(mockMarketData.subscribe).toHaveBeenCalledWith(['AAPL', 'TSLA']);
    expect(mockMarketData.startStreaming).toHaveBeenCalled();
    expect(mockMarketData.onQuote).toHaveBeenCalled();
    expect(capturedCallback).not.toBeNull();

    for (const q of quotes) {
      capturedCallback!(q);
    }

    expect(service.cache.size).toBe(2);
    expect(service.cache.get('AAPL')?.quote.mid).toBe(191.50);
    expect(service.cache.get('TSLA')?.quote.mid).toBe(178.30);

    handle.stop();
    expect(mockMarketData.stopStreaming).toHaveBeenCalled();
  });

  it('returns a handle with stop and stats', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });

    const mockMarketData = {
      onQuote: jest.fn(() => () => {}),
      subscribe: jest.fn(),
      startStreaming: jest.fn(),
      stopStreaming: jest.fn(),
    };

    const handle = connectEtoroSource(service, {
      symbols: ['AAPL'],
      marketData: mockMarketData as any,
    });

    expect(typeof handle.stop).toBe('function');
    expect(typeof handle.stats).toBe('function');
    const stats = handle.stats();
    expect(stats.ingestedCount).toBe(0);
    expect(stats.rejectedCount).toBe(0);
    expect(stats.symbols).toEqual(['AAPL']);

    handle.stop();
  });

  it('increments ingested count on accepted quotes', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    let cb: ((q: NormalizedQuote) => void) | null = null;

    const mockMarketData = {
      onQuote: jest.fn((fn: (q: NormalizedQuote) => void) => { cb = fn; return () => {}; }),
      subscribe: jest.fn(),
      startStreaming: jest.fn(),
      stopStreaming: jest.fn(),
    };

    const handle = connectEtoroSource(service, {
      symbols: ['AAPL'],
      marketData: mockMarketData as any,
    });

    cb!(makeQuote('AAPL', 191.50));
    cb!(makeQuote('AAPL', 191.60));

    const stats = handle.stats();
    expect(stats.ingestedCount).toBe(2);
    handle.stop();
  });
});
