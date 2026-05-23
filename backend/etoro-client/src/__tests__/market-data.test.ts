import axios, { AxiosInstance } from 'axios';
import { MarketDataModule, MarketDataDeps, detectUSMarketSession } from '../market-data';
import { AuditLogger, AUDIT_CONSOLE_THROTTLE_MS } from '../audit-logger';
import { AuditLogEntry, EtoroMode, NormalizedQuote, InstrumentMetadata, SessionState } from '../types';

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
      expect(result[0].confidence).toBeGreaterThanOrEqual(80);
      expect(result[0].confidence).toBeLessThanOrEqual(100);
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

  describe('confidence scoring (0-100 scale)', () => {
    it('scores high confidence for tight bid/ask spread', async () => {
      const http = createMockAxios({
        quotes: { quotes: [{ symbol: 'AAPL', bid: 189.50, ask: 189.60, last: 189.55, timestamp: Date.now() }] },
      });
      const mod = new MarketDataModule(http);
      const [q] = await mod.getQuotes(['AAPL']);
      expect(q.confidence).toBeGreaterThanOrEqual(90);
      expect(q.confidence).toBeLessThanOrEqual(100);
    });

    it('scores lower confidence when only last price available (no bid/ask)', async () => {
      const http = createMockAxios({
        quotes: { quotes: [{ symbol: 'SPY', last: 500.00, timestamp: Date.now() }] },
      });
      const mod = new MarketDataModule(http);
      const [q] = await mod.getQuotes(['SPY']);
      expect(q.confidence).toBeGreaterThanOrEqual(40);
      expect(q.confidence).toBeLessThan(80);
    });

    it('scores zero confidence for stale quotes', async () => {
      const staleTs = Date.now() - 10 * 60_000;
      const http = createMockAxios({
        quotes: { quotes: [{ symbol: 'OLD', bid: 100, ask: 101, timestamp: staleTs }] },
      });
      const mod = new MarketDataModule(http, { maxQuoteAgeMs: 5 * 60_000 });
      const [q] = await mod.getQuotes(['OLD']);
      expect(q.confidence).toBe(0);
      expect(q.stale).toBe(true);
    });

    it('degrades confidence for wider spreads', async () => {
      const http = createMockAxios({
        quotes: { quotes: [{ symbol: 'WIDE', bid: 100, ask: 103, last: 101.5, timestamp: Date.now() }] },
      });
      const mod = new MarketDataModule(http);
      const [q] = await mod.getQuotes(['WIDE']);
      expect(q.confidence).toBeGreaterThanOrEqual(50);
      expect(q.confidence).toBeLessThan(90);
    });

    it('returns integer confidence values', async () => {
      const http = createMockAxios({ quotes: { quotes: MOCK_QUOTES } });
      const mod = new MarketDataModule(http);
      const results = await mod.getQuotes(['AAPL', 'TSLA']);
      for (const q of results) {
        expect(Number.isInteger(q.confidence)).toBe(true);
      }
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

  describe('REST fallback fanout', () => {
    function makeStubHttp(getImpl: jest.Mock) {
      return { get: getImpl } as unknown as AxiosInstance;
    }

    function freshQuote(symbol: string, overrides: Partial<{ bid: number; ask: number; timestamp: number }> = {}) {
      return {
        symbol,
        instrumentId: `INST_${symbol}`,
        bid: 100,
        ask: 101,
        last: 100.5,
        timestamp: overrides.timestamp ?? Date.now(),
        assetClass: 'equity',
        currency: 'USD',
        ...overrides,
      };
    }

    async function tickFallback(intervalMs: number): Promise<void> {
      jest.advanceTimersByTime(intervalMs);
      // Drain microtasks for the async timer callback.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('emits exactly one listener call per fresh subscribed quote per tick', async () => {
      const get = jest.fn(async () => ({
        data: { quotes: [freshQuote('BTC'), freshQuote('ETH')] },
      }));
      const mod = new MarketDataModule(makeStubHttp(get), { restFallbackIntervalMs: 1_000 });
      const cb = jest.fn();
      mod.onQuote(cb);
      mod.subscribe(['BTC', 'ETH']);
      mod.startStreaming();

      await tickFallback(1_000);

      expect(cb).toHaveBeenCalledTimes(2);
      const emitted = cb.mock.calls.map((c) => (c[0] as NormalizedQuote).symbol).sort();
      expect(emitted).toEqual(['BTC', 'ETH']);
      mod.stopStreaming();
    });

    it('does not replay cached quotes for symbols the consumer has unsubscribed from', async () => {
      // First call returns three symbols; we keep them in the cache.
      // After the first call we change the subscription to two symbols.
      const calls: string[][] = [];
      const get = jest.fn(async () => {
        const tick = calls.length;
        calls.push([]);
        if (tick === 0) {
          return { data: { quotes: [freshQuote('AAPL'), freshQuote('TSLA'), freshQuote('NVDA')] } };
        }
        return { data: { quotes: [freshQuote('BTC'), freshQuote('ETH')] } };
      });
      const mod = new MarketDataModule(makeStubHttp(get), { restFallbackIntervalMs: 1_000 });
      const cb = jest.fn();
      mod.onQuote(cb);

      // Seed the cache via a direct getQuotes (does not invoke listeners).
      await mod.getQuotes(['AAPL', 'TSLA', 'NVDA']);
      expect(cb).toHaveBeenCalledTimes(0);

      mod.subscribe(['BTC', 'ETH']);
      mod.startStreaming();
      await tickFallback(1_000);

      expect(cb).toHaveBeenCalledTimes(2);
      const emitted = cb.mock.calls.map((c) => (c[0] as NormalizedQuote).symbol).sort();
      expect(emitted).toEqual(['BTC', 'ETH']);
      mod.stopStreaming();
    });

    it('drops stale quotes from listener fanout', async () => {
      const get = jest.fn(async () => ({
        data: {
          quotes: [
            freshQuote('BTC'),
            freshQuote('ETH', { timestamp: Date.now() - 30 * 60_000 }),
          ],
        },
      }));
      const mod = new MarketDataModule(makeStubHttp(get), {
        restFallbackIntervalMs: 1_000,
        maxQuoteAgeMs: 5 * 60_000,
      });
      const cb = jest.fn();
      mod.onQuote(cb);
      mod.subscribe(['BTC', 'ETH']);
      mod.startStreaming();

      await tickFallback(1_000);

      expect(cb).toHaveBeenCalledTimes(1);
      expect((cb.mock.calls[0][0] as NormalizedQuote).symbol).toBe('BTC');
      mod.stopStreaming();
    });

    it('fires no listeners and keeps cache unchanged when getQuotes rejects', async () => {
      let callCount = 0;
      const get = jest.fn(async () => {
        callCount += 1;
        if (callCount === 1) return { data: { quotes: [freshQuote('BTC')] } };
        throw new Error('HTTP 500');
      });
      const mod = new MarketDataModule(makeStubHttp(get), { restFallbackIntervalMs: 1_000 });

      await mod.getQuotes(['BTC']);
      const before = mod.getCachedQuote('BTC');

      const cb = jest.fn();
      mod.onQuote(cb);
      mod.subscribe(['BTC']);
      mod.startStreaming();
      await tickFallback(1_000);

      expect(cb).toHaveBeenCalledTimes(0);
      expect(mod.getCachedQuote('BTC')).toEqual(before);
      mod.stopStreaming();
    });
  });

  describe('normalizeQuote malformed payloads', () => {
    function recordingAudit(): { audit: AuditLogger; entries: AuditLogEntry[] } {
      const entries: AuditLogEntry[] = [];
      const mode: EtoroMode = 'demo-readonly';
      const audit = new AuditLogger(mode, {
        logPath: '/dev/null',
        appendImpl: (_p, line) => { entries.push(JSON.parse(line) as AuditLogEntry); },
        mkdirImpl: () => undefined,
        consoleErrorImpl: () => undefined,
      });
      return { audit, entries };
    }

    function makeStubHttp(payload: unknown): AxiosInstance {
      return { get: jest.fn(async () => ({ data: payload })) } as unknown as AxiosInstance;
    }

    const silentDeps: MarketDataDeps = { consoleErrorImpl: () => undefined };

    it('returns null for getQuote when payload omits every symbol field', async () => {
      const http = makeStubHttp({ quotes: [{ bid: 100, ask: 101 }] });
      const mod = new MarketDataModule(http, undefined, silentDeps);
      const result = await mod.getQuote('BTC');
      expect(result).toBeNull();
      expect(mod.getCachedQuote('UNKNOWN')).toBeUndefined();
      expect(mod.getMalformedQuoteCount()).toBe(1);
    });

    it('returns [] from getQuotes when every record is malformed and audits each drop', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({ quotes: [{ bid: 100, ask: 101 }, { foo: 'bar' }] });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined });
      const result = await mod.getQuotes(['BTC', 'ETH']);
      expect(result).toEqual([]);
      expect(mod.getMalformedQuoteCount()).toBe(2);
      expect(mod.getCachedQuote('UNKNOWN')).toBeUndefined();
      const drops = entries.filter((e) => e.action === 'normalizeQuote-malformed');
      expect(drops).toHaveLength(2);
      expect(drops[0].method).toBe('PARSE');
      expect(drops[0].path).toBe('/market-data/normalize');
      expect(drops[0].error).toMatch(/malformed-quote keys=\[/);
    });

    it('returns only identifiable records when mixed good + malformed', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({
        quotes: [
          { symbol: 'BTC', bid: 100, ask: 101, timestamp: Date.now() },
          { bid: 200, ask: 201 },
        ],
      });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined });
      const result = await mod.getQuotes(['BTC', 'ETH']);
      expect(result.map((q) => q.symbol)).toEqual(['BTC']);
      expect(mod.getMalformedQuoteCount()).toBe(1);
      expect(mod.getCachedQuote('BTC')).toBeDefined();
      expect(mod.getCachedQuote('UNKNOWN')).toBeUndefined();
      const drops = entries.filter((e) => e.action === 'normalizeQuote-malformed');
      expect(drops).toHaveLength(1);
    });

    it('exposes sorted keys of the most recently dropped record', async () => {
      const http = makeStubHttp({ quotes: [{ bid: 100, ask: 101, foo: true }] });
      const mod = new MarketDataModule(http, undefined, silentDeps);
      await mod.getQuotes(['BTC']);
      expect(mod.getLastMalformedKeys()).toEqual(['ask', 'bid', 'foo']);
    });

    it('WS message handler drops malformed records — no listener call, no cache write', () => {
      const { audit, entries } = recordingAudit();
      const http = { get: jest.fn() } as unknown as AxiosInstance;
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined });
      const cb = jest.fn();
      mod.onQuote(cb);

      mod.handleWsMessage(JSON.stringify({ bid: 100, ask: 101 }));

      expect(cb).not.toHaveBeenCalled();
      expect(mod.getCachedQuote('UNKNOWN')).toBeUndefined();
      expect(mod.getMalformedQuoteCount()).toBe(1);
      const drops = entries.filter((e) => e.action === 'normalizeQuote-malformed');
      expect(drops).toHaveLength(1);
    });

    it('WS message handler still emits identifiable records when the same frame mixes good + bad', () => {
      const http = { get: jest.fn() } as unknown as AxiosInstance;
      const mod = new MarketDataModule(http, undefined, silentDeps);
      const cb = jest.fn();
      mod.onQuote(cb);

      mod.handleWsMessage(JSON.stringify([
        { symbol: 'BTC', bid: 100, ask: 101, timestamp: Date.now() },
        { bid: 200, ask: 201 },
      ]));

      expect(cb).toHaveBeenCalledTimes(1);
      expect((cb.mock.calls[0][0] as NormalizedQuote).symbol).toBe('BTC');
      expect(mod.getCachedQuote('BTC')).toBeDefined();
      expect(mod.getMalformedQuoteCount()).toBe(1);
    });

    it('audits unparseable WS frames instead of silently swallowing them', () => {
      const { audit, entries } = recordingAudit();
      const http = { get: jest.fn() } as unknown as AxiosInstance;
      const mod = new MarketDataModule(http, undefined, { audit });

      mod.handleWsMessage('not-json');

      const parseErrors = entries.filter((e) => e.action === 'ws-message-parse-failed');
      expect(parseErrors).toHaveLength(1);
      expect(parseErrors[0].method).toBe('PARSE');
    });

    it('throttles console.error to one per AUDIT_CONSOLE_THROTTLE_MS window across many drops', () => {
      let now = 1_700_000_000_000;
      const consoleErrorImpl = jest.fn();
      const http = { get: jest.fn() } as unknown as AxiosInstance;
      const mod = new MarketDataModule(http, undefined, {
        clock: () => now,
        consoleErrorImpl,
      });

      for (let i = 0; i < 10; i++) {
        now += 1_000;
        mod.handleWsMessage(JSON.stringify({ bid: 100, ask: 101 }));
      }
      expect(mod.getMalformedQuoteCount()).toBe(10);
      expect(consoleErrorImpl).toHaveBeenCalledTimes(1);

      now += AUDIT_CONSOLE_THROTTLE_MS + 1;
      mod.handleWsMessage(JSON.stringify({ bid: 100, ask: 101 }));
      expect(consoleErrorImpl).toHaveBeenCalledTimes(2);
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
