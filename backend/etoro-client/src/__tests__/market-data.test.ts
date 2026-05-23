import axios, { AxiosInstance } from 'axios';
import { MarketDataModule, MarketDataDeps, detectUSMarketSession } from '../market-data';
import { AuditLogger, AUDIT_CONSOLE_THROTTLE_MS } from '../audit-logger';
import { RateLimiter } from '../rate-limiter';
import { AuditLogEntry, EtoroMode, NormalizedQuote, InstrumentMetadata, SessionState } from '../types';
import { stubResolver, toRateRecord } from './test-helpers';

const INSTRUMENT_IDS: Record<string, string> = {
  AAPL: 'INST_1001',
  TSLA: 'INST_1002',
  NVDA: 'INST_1003',
  SPY: 'INST_1004',
  BTC: 'INST_2001',
  ETH: 'INST_2002',
  OLD: 'INST_9001',
  WIDE: 'INST_9002',
  UNKNOWN: 'INST_9003',
  NONEXIST: 'INST_9004',
};

function defaultResolver() {
  return stubResolver(INSTRUMENT_IDS);
}

function ratesEnvelope(records: unknown[]) {
  return { rates: records };
}

/**
 * Lightweight axios stub that maps the SDK's two endpoint families
 * (`/market-data/instruments/rates`, `/market-data/candles`) to the
 * provided payloads. Tests that need search-endpoint behaviour stub
 * the resolver directly via `deps.resolver`.
 */
function createMockAxios(responses: {
  rates?: unknown[];
  candles?: unknown[];
  rawByPath?: Record<string, unknown>;
} = {}): AxiosInstance {
  const get = jest.fn(async (url: string) => {
    if (responses.rawByPath && url in responses.rawByPath) {
      return { data: responses.rawByPath[url], status: 200 };
    }
    if (url.includes('/market-data/instruments/rates')) {
      return { data: ratesEnvelope(responses.rates ?? []), status: 200 };
    }
    if (url.includes('/market-data/candles')) {
      return { data: { candles: responses.candles ?? [] }, status: 200 };
    }
    return { data: [], status: 200 };
  });
  return { get } as unknown as AxiosInstance;
}

const MOCK_RATES = [
  toRateRecord({ symbol: 'AAPL', instrumentID: 'INST_1001', bid: 189.50, ask: 189.60, lastExecution: 189.55, date: Date.now() }),
  toRateRecord({ symbol: 'TSLA', instrumentID: 'INST_1002', bid: 250.10, ask: 250.30, lastExecution: 250.20, date: Date.now() }),
];

const MOCK_CANDLES = [
  { open: 188, high: 190, low: 187, close: 189, volume: 50000, timestamp: Date.now() - 3600_000 },
  { open: 189, high: 191, low: 188, close: 190, volume: 60000, timestamp: Date.now() },
];

function makeMod(http: AxiosInstance, config?: ConstructorParameters<typeof MarketDataModule>[1], deps?: MarketDataDeps) {
  return new MarketDataModule(http, config, { resolver: defaultResolver(), ...deps });
}

describe('MarketDataModule', () => {
  describe('getInstruments', () => {
    it('fetches and normalizes instruments via resolver', async () => {
      const http = createMockAxios({});
      const mod = makeMod(http);
      const result = await mod.getInstruments(['AAPL', 'TSLA']);

      expect(result).toHaveLength(2);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].instrumentId).toBe('INST_1001');
      expect(result[1].symbol).toBe('TSLA');
    });

    it('caches instruments on subsequent calls', async () => {
      const http = createMockAxios({});
      const mod = makeMod(http);

      await mod.getInstruments(['AAPL', 'TSLA']);
      const initialResolverCalls = (mod as unknown as { resolver: { resolve: jest.Mock } })
        .resolver.resolve.mock.calls.length;
      await mod.getInstruments(['AAPL', 'TSLA']);
      const finalResolverCalls = (mod as unknown as { resolver: { resolve: jest.Mock } })
        .resolver.resolve.mock.calls.length;

      expect(finalResolverCalls).toBe(initialResolverCalls);
    });

    it('returns filtered instruments from cache', async () => {
      const http = createMockAxios({});
      const mod = makeMod(http);

      await mod.getInstruments(['AAPL', 'TSLA']);
      const filtered = await mod.getInstruments(['AAPL']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].symbol).toBe('AAPL');
    });
  });

  describe('getQuotes', () => {
    it('fetches and normalizes quotes from the rates envelope', async () => {
      const http = createMockAxios({ rates: MOCK_RATES });
      const mod = makeMod(http);
      const result = await mod.getQuotes(['AAPL', 'TSLA']);

      expect(result).toHaveLength(2);
      const aapl = result.find((q) => q.symbol === 'AAPL')!;
      expect(aapl.bid).toBe(189.50);
      expect(aapl.ask).toBe(189.60);
      expect(aapl.mid).toBeCloseTo(189.55, 2);
      expect(aapl.source).toBe('etoro');
      expect(aapl.confidence).toBeGreaterThanOrEqual(80);
      expect(aapl.confidence).toBeLessThanOrEqual(100);
      expect(aapl.stale).toBe(false);
    });

    it('caches quotes for getCachedQuote', async () => {
      const http = createMockAxios({ rates: [MOCK_RATES[0]] });
      const mod = makeMod(http);
      await mod.getQuotes(['AAPL']);

      const cached = mod.getCachedQuote('AAPL');
      expect(cached).toBeDefined();
      expect(cached!.symbol).toBe('AAPL');
    });
  });

  describe('getQuote', () => {
    it('returns single quote or null', async () => {
      const http = createMockAxios({ rates: [MOCK_RATES[0]] });
      const mod = makeMod(http);

      const result = await mod.getQuote('AAPL');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('AAPL');
    });

    it('returns null when no quotes returned', async () => {
      const http = createMockAxios({ rates: [] });
      const mod = makeMod(http);

      const result = await mod.getQuote('NONEXIST');
      expect(result).toBeNull();
    });
  });

  describe('getCandles', () => {
    it('fetches and normalizes candle data', async () => {
      const http = createMockAxios({ candles: MOCK_CANDLES });
      const mod = makeMod(http);
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
        rates: [toRateRecord({ instrumentID: 'INST_1001', bid: 189.50, ask: 189.60, lastExecution: 189.55, date: Date.now() })],
      });
      const mod = makeMod(http);
      const [q] = await mod.getQuotes(['AAPL']);
      expect(q.confidence).toBeGreaterThanOrEqual(90);
      expect(q.confidence).toBeLessThanOrEqual(100);
    });

    it('scores lower confidence when only lastExecution available (no bid/ask)', async () => {
      const http = createMockAxios({
        rates: [toRateRecord({ instrumentID: 'INST_1004', lastExecution: 500.00, date: Date.now() })],
      });
      const mod = makeMod(http);
      const [q] = await mod.getQuotes(['SPY']);
      expect(q.confidence).toBeGreaterThanOrEqual(40);
      expect(q.confidence).toBeLessThan(80);
    });

    it('scores zero confidence for stale quotes', async () => {
      const staleTs = Date.now() - 10 * 60_000;
      const http = createMockAxios({
        rates: [toRateRecord({ instrumentID: 'INST_9001', bid: 100, ask: 101, date: staleTs })],
      });
      const mod = makeMod(http, { maxQuoteAgeMs: 5 * 60_000 });
      const [q] = await mod.getQuotes(['OLD']);
      expect(q.confidence).toBe(0);
      expect(q.stale).toBe(true);
    });

    it('degrades confidence for wider spreads', async () => {
      const http = createMockAxios({
        rates: [toRateRecord({ instrumentID: 'INST_9002', bid: 100, ask: 103, lastExecution: 101.5, date: Date.now() })],
      });
      const mod = makeMod(http);
      const [q] = await mod.getQuotes(['WIDE']);
      expect(q.confidence).toBeGreaterThanOrEqual(50);
      expect(q.confidence).toBeLessThan(90);
    });

    it('returns integer confidence values', async () => {
      const http = createMockAxios({ rates: MOCK_RATES });
      const mod = makeMod(http);
      const results = await mod.getQuotes(['AAPL', 'TSLA']);
      for (const q of results) {
        expect(Number.isInteger(q.confidence)).toBe(true);
      }
    });
  });

  describe('quote normalization edge cases', () => {
    it('handles missing bid/ask gracefully', async () => {
      const http = createMockAxios({
        rates: [toRateRecord({ instrumentID: 'INST_1004', lastExecution: 500.00, date: Date.now() })],
      });
      const mod = makeMod(http);
      const result = await mod.getQuotes(['SPY']);

      expect(result[0].bid).toBe(0);
      expect(result[0].ask).toBe(0);
      expect(result[0].last).toBe(500.00);
      expect(result[0].mid).toBe(500.00);
    });

    it('marks stale quotes with maxQuoteAgeMs', async () => {
      const staleTs = Date.now() - 10 * 60_000;
      const http = createMockAxios({
        rates: [toRateRecord({ instrumentID: 'INST_9001', bid: 100, ask: 101, date: staleTs })],
      });
      const mod = makeMod(http, { maxQuoteAgeMs: 5 * 60_000 });
      const result = await mod.getQuotes(['OLD']);

      expect(result[0].stale).toBe(true);
      expect(result[0].confidence).toBe(0);
    });

    it('handles case-insensitive instrumentID (instrumentID and instrumentId both accepted)', async () => {
      const http = createMockAxios({
        rates: [{
          instrumentId: 'INST_1003',
          bid: 130.5,
          ask: 131.0,
          lastExecution: 130.75,
          date: Date.now(),
        }],
      });
      const mod = makeMod(http);
      const result = await mod.getQuotes(['NVDA']);

      expect(result[0].symbol).toBe('NVDA');
      expect(result[0].instrumentId).toBe('INST_1003');
      expect(result[0].bid).toBe(130.5);
      expect(result[0].ask).toBe(131.0);
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
      const http = createMockAxios({ rates: MOCK_RATES });
      const mod = makeMod(http, { restFallbackIntervalMs: 100_000 });

      mod.subscribe(['AAPL']);
      mod.startStreaming();

      expect(mod.isStreaming()).toBe(true);
      mod.stopStreaming();
      expect(mod.isStreaming()).toBe(false);
    });

    it('registers and unregisters quote listeners', () => {
      const http = createMockAxios({});
      const mod = makeMod(http);
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
      return toRateRecord({
        instrumentID: INSTRUMENT_IDS[symbol] ?? `INST_${symbol}`,
        bid: overrides.bid ?? 100,
        ask: overrides.ask ?? 101,
        lastExecution: 100.5,
        date: overrides.timestamp ?? Date.now(),
      });
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
        data: { rates: [freshQuote('BTC'), freshQuote('ETH')] },
      }));
      const mod = makeMod(makeStubHttp(get), { restFallbackIntervalMs: 1_000 });
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
          return { data: { rates: [freshQuote('AAPL'), freshQuote('TSLA'), freshQuote('NVDA')] } };
        }
        return { data: { rates: [freshQuote('BTC'), freshQuote('ETH')] } };
      });
      const mod = makeMod(makeStubHttp(get), { restFallbackIntervalMs: 1_000 });
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
          rates: [
            freshQuote('BTC'),
            freshQuote('ETH', { timestamp: Date.now() - 30 * 60_000 }),
          ],
        },
      }));
      const mod = makeMod(makeStubHttp(get), {
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
        if (callCount === 1) return { data: { rates: [freshQuote('BTC')] } };
        throw new Error('HTTP 500');
      });
      const mod = makeMod(makeStubHttp(get), { restFallbackIntervalMs: 1_000 }, {
        consoleErrorImpl: () => undefined,
      });

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

    it('records rest-fallback failure when getQuotes rejects on a tick', async () => {
      const get = jest.fn(async () => { throw new Error('HTTP 500'); });
      const mod = makeMod(makeStubHttp(get), { restFallbackIntervalMs: 1_000 }, {
        consoleErrorImpl: () => undefined,
      });
      mod.subscribe(['BTC']);
      mod.startStreaming();
      await tickFallback(1_000);
      expect(mod.getStreamFailureCount('rest-fallback')).toBeGreaterThanOrEqual(1);
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

    const silentDeps: MarketDataDeps = { consoleErrorImpl: () => undefined, resolver: defaultResolver() };

    it('returns null for getQuote when rate record omits every instrument-id field', async () => {
      const http = makeStubHttp({ rates: [{ bid: 100, ask: 101 }] });
      const mod = new MarketDataModule(http, undefined, silentDeps);
      const result = await mod.getQuote('BTC');
      expect(result).toBeNull();
      expect(mod.getCachedQuote('UNKNOWN')).toBeUndefined();
      expect(mod.getMalformedQuoteCount()).toBe(1);
    });

    it('returns [] from getQuotes when every rate record is malformed and audits each drop', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({ rates: [{ bid: 100, ask: 101 }, { foo: 'bar' }] });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined, resolver: defaultResolver() });
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
        rates: [
          toRateRecord({ instrumentID: 'INST_2001', bid: 100, ask: 101, date: Date.now() }),
          { bid: 200, ask: 201 },
        ],
      });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined, resolver: defaultResolver() });
      const result = await mod.getQuotes(['BTC', 'ETH']);
      expect(result.map((q) => q.symbol)).toEqual(['BTC']);
      expect(mod.getMalformedQuoteCount()).toBe(1);
      expect(mod.getCachedQuote('BTC')).toBeDefined();
      expect(mod.getCachedQuote('UNKNOWN')).toBeUndefined();
      const drops = entries.filter((e) => e.action === 'normalizeQuote-malformed');
      expect(drops).toHaveLength(1);
    });

    it('exposes sorted keys of the most recently dropped rate record', async () => {
      const http = makeStubHttp({ rates: [{ bid: 100, ask: 101, foo: true }] });
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
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined });

      mod.handleWsMessage('not-json');

      const parseErrors = entries.filter((e) => e.action === 'ws-parse-failed');
      expect(parseErrors).toHaveLength(1);
      expect(parseErrors[0].method).toBe('PRE-CHECK');
      expect(mod.getStreamFailureCount('ws-parse')).toBe(1);
    });

    it('getQuotes absorbs a 429 via the injected dispatcher and resolves', async () => {
      let n = 0;
      const get = jest.fn(async () => {
        n++;
        if (n === 1) {
          const err = new Error('429') as Error & { response: { status: number } };
          err.response = { status: 429 };
          throw err;
        }
        return { data: { rates: [toRateRecord({ instrumentID: 'INST_2001', bid: 100, ask: 101, date: Date.now() })] } };
      });
      const limiter = new RateLimiter({
        minBackoffMs: 1, maxBackoffMs: 5, multiplier: 2, maxRetries: 3,
        sleepImpl: async () => undefined,
      });
      const http = { get } as unknown as AxiosInstance;
      const mod = new MarketDataModule(http, undefined, {
        dispatch: (fn) => limiter.executeWithTelemetry(fn),
        resolver: defaultResolver(),
      });

      const quotes = await mod.getQuotes(['BTC']);
      expect(quotes).toHaveLength(1);
      expect(quotes[0].symbol).toBe('BTC');
      expect(n).toBe(2);
    });

    it('audits + counts when getQuotes receives a 200 with an unrecognized envelope', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({ weirdField: 'x' });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined, resolver: defaultResolver() });

      const result = await mod.getQuotes(['BTC']);
      expect(result).toEqual([]);
      expect(mod.getMalformedListResponseCount('getQuotes')).toBe(1);

      const lines = entries.filter((e) => e.action === 'getQuotes-malformed');
      expect(lines).toHaveLength(1);
      expect(lines[0].method).toBe('PARSE');
      expect(lines[0].path).toBe('/market-data/instruments/rates');
      expect(lines[0].error).toBe(
        'MalformedListResponse: object-no-match keys=[weirdField]',
      );
    });

    it('does NOT audit when getQuotes returns a legitimately empty list', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({ rates: [] });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined, resolver: defaultResolver() });

      const result = await mod.getQuotes(['BTC']);
      expect(result).toEqual([]);
      expect(mod.getMalformedListResponseCount('getQuotes')).toBe(0);
      expect(entries.filter((e) => e.action === 'getQuotes-malformed')).toHaveLength(0);
    });

    it('does NOT audit when getQuotes returns a well-formed rates envelope with one rate', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({
        rates: [toRateRecord({ instrumentID: 'INST_2001', bid: 100, ask: 101, date: Date.now() })],
      });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined, resolver: defaultResolver() });

      const result = await mod.getQuotes(['BTC']);
      expect(result).toHaveLength(1);
      expect(mod.getMalformedListResponseCount('getQuotes')).toBe(0);
      expect(entries.filter((e) => e.action === 'getQuotes-malformed')).toHaveLength(0);
    });

    it('audits + counts when getCandles receives a malformed envelope', async () => {
      const { audit, entries } = recordingAudit();
      const http = makeStubHttp({ random: 1 });
      const mod = new MarketDataModule(http, undefined, { audit, consoleErrorImpl: () => undefined, resolver: defaultResolver() });

      const result = await mod.getCandles('BTC', '1m', 0, 1);
      expect(result).toEqual([]);
      expect(mod.getMalformedListResponseCount('getCandles')).toBe(1);
      expect(entries.filter((e) => e.action === 'getCandles-malformed')).toHaveLength(1);
    });

    it('throws MalformedListResponseError when throwOnMalformedListResponse=true', async () => {
      const { audit } = recordingAudit();
      const http = makeStubHttp({ weird: 'x' });
      const mod = new MarketDataModule(http, undefined, {
        audit,
        consoleErrorImpl: () => undefined,
        throwOnMalformedListResponse: true,
        resolver: defaultResolver(),
      });

      await expect(mod.getQuotes(['BTC'])).rejects.toMatchObject({
        name: 'MalformedListResponseError',
        action: 'getQuotes',
        observedShape: 'object-no-match',
      });
    });

    it('getMalformedListResponseCounts returns an empty snapshot on a fresh module', () => {
      const http = { get: jest.fn() } as unknown as AxiosInstance;
      const mod = new MarketDataModule(http, undefined, silentDeps);
      expect(mod.getMalformedListResponseCounts()).toEqual({});
    });

    it('throttles console.error to one per AUDIT_CONSOLE_THROTTLE_MS window across many drops (malformed quote)', () => {
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

describe('MarketDataModule — stream-failure visibility', () => {
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

  function makeModule(deps: Partial<MarketDataDeps> = {}): {
    mod: MarketDataModule;
    audit: AuditLogger;
    entries: AuditLogEntry[];
    consoleErrorImpl: jest.Mock;
  } {
    const { audit, entries } = recordingAudit();
    const consoleErrorImpl = jest.fn();
    const http = { get: jest.fn() } as unknown as AxiosInstance;
    const mod = new MarketDataModule(http, undefined, {
      audit,
      consoleErrorImpl,
      ...deps,
    });
    return { mod, audit, entries, consoleErrorImpl };
  }

  it('starts with all four counters at zero and no lastStreamError', () => {
    const { mod } = makeModule();
    expect(mod.getStreamFailureCounts()).toEqual({
      'ws-construct': 0,
      'ws-parse': 0,
      'ws-error-event': 0,
      'rest-fallback': 0,
    });
    expect(mod.getLastStreamError()).toBeUndefined();
  });

  it('ws-parse: a non-JSON frame increments ws-parse and audits one PRE-CHECK line', () => {
    const { mod, entries } = makeModule();
    mod.handleWsMessage('not-json');
    expect(mod.getStreamFailureCount('ws-parse')).toBe(1);
    const snap = mod.getLastStreamError();
    expect(snap?.kind).toBe('ws-parse');
    const lines = entries.filter((e) => e.action === 'ws-parse-failed');
    expect(lines).toHaveLength(1);
    expect(lines[0].method).toBe('PRE-CHECK');
    expect(lines[0].path).toBe('/market-data/stream');
  });

  it('per-kind throttle: 10 ws-parse failures in 60s emit 1 console.error; an unrelated kind emits its own', () => {
    let now = 1_700_000_000_000;
    const { mod, consoleErrorImpl } = makeModule({ clock: () => now });

    for (let i = 0; i < 10; i++) {
      now += 1_000;
      mod.handleWsMessage('not-json');
    }
    expect(mod.getStreamFailureCount('ws-parse')).toBe(10);
    expect(consoleErrorImpl).toHaveBeenCalledTimes(1);

    // A different kind in the same window still fires its own heartbeat.
    now += 1_000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod as unknown as { recordStreamFailure: (k: string, e: Error) => void })
      .recordStreamFailure('ws-error-event', new Error('socket reset'));
    expect(consoleErrorImpl).toHaveBeenCalledTimes(2);

    // After the throttle window elapses, ws-parse fires again.
    now += AUDIT_CONSOLE_THROTTLE_MS + 1;
    mod.handleWsMessage('still-not-json');
    expect(consoleErrorImpl).toHaveBeenCalledTimes(3);
  });

  it('masks long token-shaped substrings in the recorded error string', () => {
    const { mod, entries } = makeModule();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod as unknown as { recordStreamFailure: (k: string, e: Error) => void })
      .recordStreamFailure('rest-fallback', new Error('boom AKIA_thisisalongsecret123 boom'));
    const lines = entries.filter((e) => e.action === 'rest-fallback-failed');
    expect(lines).toHaveLength(1);
    expect(lines[0].error).toContain('[REDACTED]');
    expect(lines[0].error).not.toContain('AKIA_thisisalongsecret123');
  });

  it('ws-construct: a WebSocket constructor that throws synchronously increments the counter and audits one PRE-CHECK line', () => {
    jest.isolateModules(() => {
      jest.doMock('ws', () => {
        return {
          __esModule: true,
          default: jest.fn(() => { throw new Error('boom'); }),
          OPEN: 1,
        };
      });

      const { MarketDataModule: MD } = require('../market-data') as typeof import('../market-data');
      const { AuditLogger: AL } = require('../audit-logger') as typeof import('../audit-logger');

      const entries: AuditLogEntry[] = [];
      const audit = new AL('demo-readonly', {
        logPath: '/dev/null',
        appendImpl: (_p: string, line: string) => { entries.push(JSON.parse(line) as AuditLogEntry); },
        mkdirImpl: () => undefined,
        consoleErrorImpl: () => undefined,
      });
      const http = { get: jest.fn() } as unknown as AxiosInstance;
      const mod = new MD(http, { wsUrl: 'ws://x' }, { audit, consoleErrorImpl: () => undefined });

      mod.startStreaming();
      try {
        expect(mod.getStreamFailureCount('ws-construct')).toBe(1);
        const lines = entries.filter((e) => e.action === 'ws-construct-failed');
        expect(lines).toHaveLength(1);
        expect(lines[0].method).toBe('PRE-CHECK');
        expect(lines[0].path).toBe('/market-data/stream');
      } finally {
        mod.stopStreaming();
      }
    });
  });
});
