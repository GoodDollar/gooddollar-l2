import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return computeSpread({
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
  });
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

interface BulkBody {
  status: number;
  body: Record<string, unknown>;
}

async function bulk(baseUrl: string): Promise<BulkBody> {
  const res = await fetch(`${baseUrl}/quotes`);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

/**
 * Task 0060: `/quotes` previously returned 200 for every state — even
 * `source.connected:false` AND empty cache — while sibling
 * `/quotes/fresh/all` returned 503 for the same condition. This forced
 * every integrator to write two error paths: `resp.ok` for one endpoint,
 * `body.degraded` for the other. After this task a single `resp.ok`
 * check classifies every degraded state across both bulk endpoints.
 */
describe('GET /quotes — degraded-state HTTP status matrix (task 0060)', () => {
  it('source connected + cache empty → 200, degraded:false, no stale', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: Date.now(),
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const { status, body } = await bulk(baseUrl);
      expect(status).toBe(200);
      expect(body.degraded).toBe(false);
      expect('stale' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('source connected + cache non-empty → 200, degraded:false, no stale', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const srcGetter = (): SourceStatus => ({
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: Date.now(),
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const { status, body } = await bulk(baseUrl);
      expect(status).toBe(200);
      expect(body.degraded).toBe(false);
      expect('stale' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('source dead + cache empty → 503, degraded:true, quotes:{}', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const { status, body } = await bulk(baseUrl);
      expect(status).toBe(503);
      expect(body.degraded).toBe(true);
      expect(body.quotes).toEqual({});
      expect(typeof body.message).toBe('string');
      expect(body.message as string).toMatch(/degraded|source/i);
    } finally {
      await close(server);
    }
  });

  it('source dead + cache non-empty → 200, degraded:true, stale:true, message', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const { status, body } = await bulk(baseUrl);
      expect(status).toBe(200);
      expect(body.degraded).toBe(true);
      expect(body.stale).toBe(true);
      expect(typeof body.message).toBe('string');
      expect(body.message as string).toMatch(/stale/i);
    } finally {
      await close(server);
    }
  });

  it('paired regression: /quotes 503 matches /quotes/fresh/all 503 under dead-source-empty-cache', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const a = await fetch(`${baseUrl}/quotes`);
      const b = await fetch(`${baseUrl}/quotes/fresh/all`);
      expect(a.status).toBe(503);
      expect(b.status).toBe(503);
      const aBody = (await a.json()) as Record<string, unknown>;
      const bBody = (await b.json()) as Record<string, unknown>;
      expect(aBody.degraded).toBe(true);
      expect(bBody.degraded).toBe(true);
    } finally {
      await close(server);
    }
  });

  it('back-compat: no sourceStatusGetter wired → 200 with no degraded/stale fields', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const { status, body } = await bulk(baseUrl);
      expect(status).toBe(200);
      expect('degraded' in body).toBe(false);
      expect('stale' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('catalog responseShape advertises stale? AND 503 marker; summary mentions 503', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const root = (await (await fetch(`${baseUrl}/`)).json()) as {
        endpoints: Array<{ path: string; summary: string; responseShape: string }>;
      };
      const e = root.endpoints.find((x) => x.path === '/quotes');
      expect(e).toBeDefined();
      expect(e!.responseShape).toMatch(/stale\?/);
      expect(e!.responseShape).toMatch(/503/);
      expect(e!.responseShape.length).toBeLessThanOrEqual(240);
      expect(e!.summary).toMatch(/503/);
    } finally {
      await close(server);
    }
  });
});
