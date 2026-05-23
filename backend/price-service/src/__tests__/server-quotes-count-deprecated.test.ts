import express from 'express';
import { createServer, STATIC_QUICKSTART } from '../server';
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

async function close(s: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => s.close(() => resolve()));
}

describe('/quotes count vs totalCached drift gate (task 0035)', () => {
  it('body.count === body.totalCached on empty cache', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes`)).json()) as {
        count: number;
        totalCached: number;
      };
      expect(body.count).toBe(body.totalCached);
      expect(body.count).toBe(0);
    } finally {
      await close(server);
    }
  });

  it('body.count === body.totalCached with one cached quote', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes`)).json()) as {
        count: number;
        totalCached: number;
      };
      expect(body.count).toBe(body.totalCached);
      expect(body.count).toBe(1);
    } finally {
      await close(server);
    }
  });

  it('body.count === body.totalCached with multiple cached quotes', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'TSLA', last: 250 }));
    cache.update(makeQuote({ symbol: 'NVDA', last: 800 }));
    const app = createServer(cache, { symbols: ['AAPL', 'TSLA', 'NVDA'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes`)).json()) as {
        count: number;
        totalCached: number;
      };
      expect(body.count).toBe(body.totalCached);
      expect(body.count).toBe(3);
    } finally {
      await close(server);
    }
  });

  it('body.deprecations.count is a non-empty string mentioning totalCached', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes`)).json()) as {
        deprecations: Record<string, string>;
      };
      expect(typeof body.deprecations).toBe('object');
      expect(typeof body.deprecations.count).toBe('string');
      expect(body.deprecations.count.length).toBeGreaterThan(0);
      expect(body.deprecations.count).toMatch(/totalCached/);
    } finally {
      await close(server);
    }
  });
});

describe('STATIC_QUICKSTART step 2 advertises totalCached not count (task 0035)', () => {
  it('step 2 expect string mentions totalCached and not "count"', () => {
    const step2 = STATIC_QUICKSTART.find((s) => s.step === 2);
    expect(step2).toBeDefined();
    expect(step2!.expect).toMatch(/totalCached/);
    expect(step2!.expect).not.toMatch(/\bcount\b/);
  });
});

describe('catalog: /quotes responseShape marks count deprecated (task 0035)', () => {
  it('responseShape mentions deprecations and totalCached and stays ≤ 240 chars', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const root = (await (await fetch(`${baseUrl}/`)).json()) as {
        endpoints: Array<{ path: string; responseShape: string }>;
      };
      const e = root.endpoints.find((x) => x.path === '/quotes');
      expect(e).toBeDefined();
      expect(e!.responseShape).toMatch(/deprecations/);
      expect(e!.responseShape).toMatch(/totalCached/);
      expect(e!.responseShape.length).toBeLessThanOrEqual(240);
    } finally {
      await close(server);
    }
  });
});

describe('cross-endpoint count/totalCached scope (task 0035 regression gate)', () => {
  it('/health.totalCached unchanged', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/health`)).json()) as {
        totalCached: number;
      };
      expect(typeof body.totalCached).toBe('number');
    } finally {
      await close(server);
    }
  });

  it('/quotes/fresh/all.count unchanged — different semantic; no deprecations block', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.count).toBe(1);
      expect(body.deprecations).toBeUndefined();
    } finally {
      await close(server);
    }
  });
});
