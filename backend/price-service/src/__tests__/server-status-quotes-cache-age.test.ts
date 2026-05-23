import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';

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

async function listen(app: express.Express): Promise<{
  server: import('http').Server;
  baseUrl: string;
}> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(server: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

describe('/status/quotes — cacheAge field rename (task 0033)', () => {
  let app: express.Express;
  let cache: QuoteCache;
  let server: import('http').Server;
  let baseUrl: string;

  beforeEach(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'TSLA', last: 250 }));
    app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterEach(async () => {
    await close(server);
  });

  it('per-quote entries include a numeric cacheAge >= 0', async () => {
    const body = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as {
      quotes: Array<{ cacheAge: number }>;
    };
    expect(body.quotes.length).toBeGreaterThan(0);
    for (const q of body.quotes) {
      expect(typeof q.cacheAge).toBe('number');
      expect(q.cacheAge).toBeGreaterThanOrEqual(0);
    }
  });

  it('cacheAge === lastUpdateMs during the deprecation window (drift gate)', async () => {
    const body = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as {
      quotes: Array<{ cacheAge: number; lastUpdateMs: number }>;
    };
    for (const q of body.quotes) {
      expect(q.cacheAge).toBe(q.lastUpdateMs);
    }
  });

  it('body.deprecations.lastUpdateMs is a non-empty string mentioning cacheAge', async () => {
    const body = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as {
      deprecations: Record<string, string>;
    };
    expect(typeof body.deprecations).toBe('object');
    expect(typeof body.deprecations.lastUpdateMs).toBe('string');
    expect(body.deprecations.lastUpdateMs.length).toBeGreaterThan(0);
    expect(body.deprecations.lastUpdateMs).toMatch(/cacheAge/);
  });

  it('legacy lastUpdateMs still present (back-compat during window)', async () => {
    const body = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as {
      quotes: Array<{ lastUpdateMs: number }>;
    };
    for (const q of body.quotes) {
      expect(typeof q.lastUpdateMs).toBe('number');
    }
  });

  it('catalog summary mentions "cache age" (matching the field)', async () => {
    const root = (await (await fetch(`${baseUrl}/`)).json()) as {
      endpoints: Array<{ path: string; summary: string }>;
    };
    const entry = root.endpoints.find((e) => e.path === '/status/quotes');
    expect(entry).toBeDefined();
    expect(entry!.summary.toLowerCase()).toMatch(/cache age/);
  });

  it('responseShape mentions cacheAge and lastUpdateMs and stays ≤ 240 chars', async () => {
    const root = (await (await fetch(`${baseUrl}/`)).json()) as {
      endpoints: Array<{ path: string; responseShape: string }>;
    };
    const entry = root.endpoints.find((e) => e.path === '/status/quotes');
    expect(entry).toBeDefined();
    expect(entry!.responseShape).toMatch(/cacheAge/);
    expect(entry!.responseShape).toMatch(/lastUpdateMs/);
    expect(entry!.responseShape.length).toBeLessThanOrEqual(240);
  });
});

describe('cross-endpoint duration field naming (task 0033)', () => {
  it('cacheAge is canonical across /quotes, /quotes/:symbol, /status/quotes', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const quotes = (await (await fetch(`${baseUrl}/quotes`)).json()) as {
        quotes: Record<string, { cacheAge: number }>;
      };
      const single = (await (await fetch(`${baseUrl}/quotes/AAPL`)).json()) as {
        cacheAge: number;
      };
      const status = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as {
        quotes: Array<{ cacheAge: number }>;
      };
      expect(typeof quotes.quotes.AAPL.cacheAge).toBe('number');
      expect(typeof single.cacheAge).toBe('number');
      for (const q of status.quotes) {
        expect(typeof q.cacheAge).toBe('number');
      }
    } finally {
      await close(server);
    }
  });
});
