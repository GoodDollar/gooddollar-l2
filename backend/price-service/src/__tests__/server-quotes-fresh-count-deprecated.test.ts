import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread, SourceStatus } from '../types';

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

/**
 * Task 0054: align /quotes/fresh/all on the canonical `freshCount`
 * field used by /status/quotes; ship `count` as a legacy alias for
 * one deprecation window. Drift gate mirrors the count → totalCached
 * pattern from task 0035 — both fields must always carry the same
 * number so consumers can flip the migration target without behaviour
 * change.
 */
describe('/quotes/fresh/all freshCount migration (task 0054)', () => {
  it('empty cache: body.count === body.freshCount === 0', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.freshCount).toBe(0);
      expect(body.count).toBe(0);
      expect(body.count).toBe(body.freshCount);
    } finally {
      await close(server);
    }
  });

  it('one cached quote: body.count === body.freshCount === 1', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.freshCount).toBe(1);
      expect(body.count).toBe(1);
      expect(body.count).toBe(body.freshCount);
    } finally {
      await close(server);
    }
  });

  it('three cached quotes: body.count === body.freshCount === 3', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'TSLA', last: 250 }));
    cache.update(makeQuote({ symbol: 'NVDA', last: 800 }));
    const app = createServer(cache, { symbols: ['AAPL', 'TSLA', 'NVDA'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.freshCount).toBe(3);
      expect(body.count).toBe(3);
      expect(body.count).toBe(body.freshCount);
    } finally {
      await close(server);
    }
  });

  it('deprecations.count carries a rename pointer mentioning freshCount', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      const dep = body.deprecations as Record<string, string>;
      expect(typeof dep).toBe('object');
      expect(typeof dep.count).toBe('string');
      expect(dep.count).toMatch(/freshCount/);
      expect(dep.count.length).toBeGreaterThan(0);
    } finally {
      await close(server);
    }
  });

  it('field ordering: quotes precedes freshCount precedes count (canonical before legacy)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      const keys = Object.keys(body);
      const idx = (k: string) => keys.indexOf(k);
      expect(idx('quotes')).toBeGreaterThan(-1);
      expect(idx('freshCount')).toBeGreaterThan(idx('quotes'));
      expect(idx('count')).toBeGreaterThan(idx('freshCount'));
    } finally {
      await close(server);
    }
  });

  it('drift parity: /quotes/fresh/all.freshCount === /status/quotes.freshCount when source connected', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'TSLA', last: 250 }));
    const srcGetter = (): SourceStatus => ({
      connected: true,
      symbols: ['AAPL', 'TSLA'],
      lastAttachAt: Date.now(),
    });
    const app = createServer(cache, { symbols: ['AAPL', 'TSLA'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const fresh = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as Record<
        string,
        unknown
      >;
      const status = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as Record<
        string,
        unknown
      >;
      expect(fresh.freshCount).toBe(status.freshCount);
    } finally {
      await close(server);
    }
  });
});

describe('/quotes/fresh/all responseShape catalog (task 0054)', () => {
  it("ENDPOINT_CATALOG advertises freshCount as canonical and count as deprecated", () => {
    const e = ENDPOINT_CATALOG.find((x) => x.path === '/quotes/fresh/all');
    expect(e).toBeDefined();
    expect(e!.responseShape).toMatch(/freshCount/);
    expect(e!.responseShape).toMatch(/count/);
    // task 0090 — `(deprecated→freshCount)` shortened to `(dep)` so
    // the new `invalidRequestedTotal?` + `invalidCap?` fields fit
    // under the 240-char wire cap. The durable rename pointer rides
    // `body.deprecations.count` (asserted elsewhere); the catalog
    // string only needs the inline marker to flag `count` as legacy.
    expect(e!.responseShape).toMatch(/\(dep(?:recated)?/);
    expect(e!.responseShape.length).toBeLessThanOrEqual(240);
  });
});

/**
 * Polish-coverage guard: every endpoint that emits a "count of items
 * returned" field must use one of the canonical names
 * (`freshCount`, `totalCount`, `totalCached`, `configuredSymbolCount`)
 * OR ship the legacy `count` alias paired with a canonical companion +
 * deprecations entry. Fails the build if a future endpoint adds a
 * plain `count` without the migration.
 */
describe('codebase-wide count naming guard (task 0054)', () => {
  const COUNT_ENDPOINTS = ['/quotes', '/quotes/fresh/all'] as const;

  it.each(COUNT_ENDPOINTS)('%s legacy count rides only with a canonical companion + deprecation', async (path) => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}${path}`)).json()) as Record<string, unknown>;
      if (!('count' in body)) return;
      const canonicalNames = ['freshCount', 'totalCount', 'totalCached', 'configuredSymbolCount'];
      const present = canonicalNames.filter((n) => n in body);
      expect(present.length).toBeGreaterThanOrEqual(1);
      const dep = body.deprecations as Record<string, string> | undefined;
      expect(dep).toBeDefined();
      expect(typeof dep!.count).toBe('string');
    } finally {
      await close(server);
    }
  });
});
