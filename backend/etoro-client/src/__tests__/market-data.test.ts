import axios, { AxiosInstance } from 'axios';
import { MarketDataModule, detectUSMarketSession } from '../market-data';
import { NormalizedQuote, InstrumentMetadata, SessionState } from '../types';

function createMockAxios(responses: Record<string, unknown> = {}): AxiosInstance {
  const instance = {
    get: jest.fn(async (url: string) => {
      const key = Object.keys(responses).find((k) => url.includes(k));
      return { data: key ? responses[key] : [] };
    }),
  } as unknown as AxiosInstance;
  return instance;
}

const MOCK_INSTRUMENTS = [
  {
    instrumentId: 'INST_1001',
    symbol: 'AAPL',
    displayName: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    assetClass: 'equity',
    minTradeSize: 0.01,
    maxLeverage: 5,
  },
  {
    instrumentId: 'INST_1002',
    symbol: 'TSLA',
    displayName: 'Tesla Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    assetClass: 'equity',
    minTradeSize: 0.01,
    maxLeverage: 5,
  },
];

const MOCK_QUOTES = [
  {
    symbol: 'AAPL',
    instrumentId: 'INST_1001',
    bid: 189.50,
    ask: 189.60,
    last: 189.55,
    timestamp: Date.now(),
    assetClass: 'equity',
    currency: 'USD',
  },
  {
    symbol: 'TSLA',
    instrumentId: 'INST_1002',
    bid: 250.10,
    ask: 250.30,
    last: 250.20,
    timestamp: Date.now(),
    assetClass: 'equity',
    currency: 'USD',
  },
];

const MOCK_CANDLES = [
  { open: 188, high: 190, low: 187, close: 189, volume: 50000, timestamp: Date.now() - 3600_000 },
  { open: 189, high: 191, low: 188, close: 190, volume: 60000, timestamp: Date.now() },
];

describe('MarketDataModule', () => {
  describe('getInstruments', () => {
    it('fetches and normalizes instruments', async () => {
      const http = createMockAxios({ instruments: { instruments: MOCK_INSTRUMENTS } });
      const mod = new MarketDataModule(http);
      const result = await mod.getInstruments(['AAPL', 'TSLA']);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].instrumentId).toBe('INST_1001');
      expect(result[0].exchange).toBe('NASDAQ');
      expect(result[0].assetClass).toBe('equity');
      expect(result[1].symbol).toBe('TSLA');
    });

    it('caches instruments on subsequent calls', async () => {
      const http = createMockAxios({ instruments: { instruments: MOCK_INSTRUMENTS } });
      const mod = new MarketDataModule(http);

      await mod.getInstruments();
      await mod.getInstruments();

      expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('returns filtered instruments from cache', async () => {
      const http = createMockAxios({ instruments: { instruments: MOCK_INSTRUMENTS } });
      const mod = new MarketDataModule(http);

      await mod.getInstruments();
      const filtered = await mod.getInstruments(['AAPL']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].symbol).toBe('AAPL');
    });
  });

  describe('getQuotes', () => {
    it('fetches and normalizes quotes', async () => {
      const http = createMockAxios({ quotes: { quotes: MOCK_QUOTES } });
      const mod = new MarketDataModule(http);
      const result = await mod.getQuotes(['AAPL', 'TSLA']);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].bid).toBe(189.50);
      expect(result[0].ask).toBe(189.60);
      expect(result[0].mid).toBeCloseTo(189.55, 2);
      expect(result[0].source).toBe('etoro');
      expect(result[0].confidence).toBe(1);
      expect(result[0].stale).toBe(false);
    });

    it('caches quotes for getCachedQuote', async () => {
      const http = createMockAxios({ quotes: { quotes: MOCK_QUOTES } });
      const mod = new MarketDataModule(http);
      await mod.getQuotes(['AAPL']);

      const cached = mod.getCachedQuote('AAPL');
      expect(cached).toBeDefined();
      expect(cached!.symbol).toBe('AAPL');
    });
  });

  describe('getQuote', () => {
    it('returns single quote or null', async () => {
      const http = createMockAxios({ quotes: { quotes: [MOCK_QUOTES[0]] } });
      const mod = new MarketDataModule(http);

      const result = await mod.getQuote('AAPL');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('AAPL');
    });

    it('returns null when no quotes returned', async () => {
      const http = createMockAxios({ quotes: { quotes: [] } });
      const mod = new MarketDataModule(http);

      const result = await mod.getQuote('NONEXIST');
      expect(result).toBeNull();
    });
  });

  describe('getCandles', () => {
    it('fetches and normalizes candle data', async () => {
      const http = createMockAxios({ candles: { candles: MOCK_CANDLES } });
      const mod = new MarketDataModule(http);
      const now = Date.now();
      const result = await mod.getCandles('AAPL', '1h', now - 7 * 86400_000, now);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].open).toBe(188);
      expect(result[0].high).toBe(190);
      expect(result[0].close).toBe(189);
      expect(result[0].volume).toBe(50000);
    });
  });

  describe('quote normalization edge cases', () => {
    it('handles missing bid/ask gracefully', async () => {
      const http = createMockAxios({
        quotes: { quotes: [{ symbol: 'SPY', last: 500.00, timestamp: Date.now() }] },
      });
      const mod = new MarketDataModule(http);
      const result = await mod.getQuotes(['SPY']);

      expect(result[0].bid).toBe(0);
      expect(result[0].ask).toBe(0);
      expect(result[0].last).toBe(500.00);
      expect(result[0].mid).toBe(500.00);
    });

    it('marks stale quotes with maxQuoteAgeMs', async () => {
      const staleTs = Date.now() - 10 * 60_000;
      const http = createMockAxios({
        quotes: { quotes: [{ symbol: 'OLD', bid: 100, ask: 101, timestamp: staleTs }] },
      });
      const mod = new MarketDataModule(http, { maxQuoteAgeMs: 5 * 60_000 });
      const result = await mod.getQuotes(['OLD']);

      expect(result[0].stale).toBe(true);
      expect(result[0].confidence).toBe(0);
    });

    it('handles alternative field names', async () => {
      const http = createMockAxios({
        quotes: {
          quotes: [{
            ticker: 'nvda',
            instrumentID: 'I_NVDA',
            bidPrice: 130.5,
            askPrice: 131.0,
            currentRate: 130.75,
            updatedAt: Date.now(),
            instrumentType: 'stock',
          }],
        },
      });
      const mod = new MarketDataModule(http);
      const result = await mod.getQuotes(['NVDA']);

      expect(result[0].symbol).toBe('NVDA');
      expect(result[0].instrumentId).toBe('I_NVDA');
      expect(result[0].bid).toBe(130.5);
      expect(result[0].ask).toBe(131.0);
      expect(result[0].assetClass).toBe('equity');
    });
  });

  describe('getSessionState', () => {
    it('returns a valid session state', async () => {
      const http = createMockAxios({});
      const mod = new MarketDataModule(http);
      const state = await mod.getSessionState('AAPL');
      expect(['pre-market', 'open', 'after-hours', 'closed', 'halted', 'unknown']).toContain(state);
    });
  });

  describe('streaming lifecycle', () => {
    it('starts REST fallback when no wsUrl', () => {
      const http = createMockAxios({ quotes: { quotes: MOCK_QUOTES } });
      const mod = new MarketDataModule(http, { restFallbackIntervalMs: 100_000 });

      mod.subscribe(['AAPL']);
      mod.startStreaming();

      expect(mod.isStreaming()).toBe(true);
      mod.stopStreaming();
      expect(mod.isStreaming()).toBe(false);
    });

    it('registers and unregisters quote listeners', () => {
      const http = createMockAxios({});
      const mod = new MarketDataModule(http);
      const cb = jest.fn();

      const unsub = mod.onQuote(cb);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});

describe('detectUSMarketSession', () => {
  function etDate(hour: number, minute: number, weekday: number): Date {
    const base = new Date();
    const dayDiff = ((weekday - base.getDay()) + 7) % 7 || (weekday === base.getDay() ? 0 : 7);
    base.setDate(base.getDate() + dayDiff);

    const dateStr = base.toISOString().slice(0, 10);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    const etFull = `${dateStr}T${timeStr}`;

    const etUtcMs = new Date(
      new Date(etFull).toLocaleString('en-US', { timeZone: 'America/New_York' })
    ).getTime();
    const localMs = new Date(etFull).getTime();
    const offsetMs = localMs - etUtcMs;
    return new Date(localMs + offsetMs);
  }

  it('returns closed on Saturday', () => {
    expect(detectUSMarketSession(etDate(12, 0, 6))).toBe('closed');
  });

  it('returns closed on Sunday', () => {
    expect(detectUSMarketSession(etDate(12, 0, 0))).toBe('closed');
  });

  it('returns pre-market at 7:00 ET on a weekday', () => {
    expect(detectUSMarketSession(etDate(7, 0, 1))).toBe('pre-market');
  });

  it('returns open at 10:00 ET on a weekday', () => {
    expect(detectUSMarketSession(etDate(10, 0, 2))).toBe('open');
  });

  it('returns open at 9:30 ET on a weekday', () => {
    expect(detectUSMarketSession(etDate(9, 30, 3))).toBe('open');
  });

  it('returns after-hours at 17:00 ET on a weekday', () => {
    expect(detectUSMarketSession(etDate(17, 0, 4))).toBe('after-hours');
  });

  it('returns closed at 21:00 ET on a weekday', () => {
    expect(detectUSMarketSession(etDate(21, 0, 1))).toBe('closed');
  });

  it('returns closed at 3:00 ET on a weekday (before pre-market)', () => {
    expect(detectUSMarketSession(etDate(3, 0, 2))).toBe('closed');
  });
});
