import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.5,
    ask: 189.6,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 1,
    stale: false,
    ...overrides,
  };
  return computeSpread(base);
}

function listen(app: express.Express): Promise<{
  server: ReturnType<express.Express['listen']>;
  baseUrl: string;
}> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as import('net').AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

describe('GET /quotes — count + totalCached always present', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('includes count matching Object.keys(quotes).length', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'TSLA' }));
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.count).toBe(2);
    expect(body.totalCached).toBe(2);
    expect(Object.keys(body.quotes as Record<string, unknown>)).toEqual(
      expect.arrayContaining(['AAPL', 'TSLA']),
    );
  });

  it('count and totalCached are 0 on empty cache', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.count).toBe(0);
    expect(body.totalCached).toBe(0);
  });

  it('without sourceStatusGetter, degraded and message are omitted cleanly', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(body, 'degraded')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'message')).toBe(false);
  });
});

describe('GET /quotes — degraded + message when source disconnected', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => srcState,
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('empty + degraded includes message referencing source.reason', async () => {
    cache.clear();
    srcState = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const res = await fetch(`${baseUrl}/quotes`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.count).toBe(0);
    expect(body.degraded).toBe(true);
    expect(typeof body.message).toBe('string');
    expect(body.message).toMatch(/degraded|source\.reason/i);
  });

  it('non-empty omits message even when degraded', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.count).toBe(1);
    expect(body.degraded).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(body, 'message')).toBe(false);
  });
});

describe('GET /quotes — empty + healthy (warmup) message', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => srcState,
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('empty + healthy includes "awaiting first tick" message', async () => {
    cache.clear();
    srcState = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    const res = await fetch(`${baseUrl}/quotes`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.degraded).toBe(false);
    expect(typeof body.message).toBe('string');
    expect(body.message).toMatch(/awaiting first tick/i);
  });

  it('non-empty + healthy omits message', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.degraded).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'message')).toBe(false);
  });

  it('HTTP status stays 200 on every combination', async () => {
    cache.clear();
    const r1 = await fetch(`${baseUrl}/quotes`);
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const r2 = await fetch(`${baseUrl}/quotes`);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });
});
