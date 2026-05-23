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

describe('/quotes/fresh/all degraded contract (task 0034)', () => {
  it('source dead + empty cache → 503 with degraded:true and no quotes', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/quotes/fresh/all`);
      expect(r.status).toBe(503);
      const body = (await r.json()) as Record<string, unknown>;
      expect(body.degraded).toBe(true);
      expect(body.count).toBe(0);
      expect(body.quotes).toEqual([]);
      const src = body.source as Record<string, unknown>;
      expect(src.connected).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('source healthy + empty cache → 200 with message; degraded false-or-absent', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: Date.now(),
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/quotes/fresh/all`);
      expect(r.status).toBe(200);
      const body = (await r.json()) as Record<string, unknown>;
      expect(body.count).toBe(0);
      expect(typeof body.message).toBe('string');
      expect((body.message as string).length).toBeGreaterThan(0);
      expect(body.message).toMatch(/source is healthy/);
      expect((body.degraded as boolean | undefined) ?? false).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('source healthy + cache has fresh quote → 200, no message', async () => {
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
      const r = await fetch(`${baseUrl}/quotes/fresh/all`);
      expect(r.status).toBe(200);
      const body = (await r.json()) as {
        count: number;
        quotes: unknown[];
        message?: string;
      };
      expect(body.count).toBe(1);
      expect(body.quotes).toHaveLength(1);
      expect(body.message).toBeUndefined();
    } finally {
      await close(server);
    }
  });

  it('no sourceStatusGetter (legacy fixture) → 200 unchanged, no degraded/source/message', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/quotes/fresh/all`);
      expect(r.status).toBe(200);
      const body = (await r.json()) as Record<string, unknown>;
      expect(body.source).toBeUndefined();
      expect(body.degraded).toBeUndefined();
      expect(body.message).toBeUndefined();
    } finally {
      await close(server);
    }
  });

  it('parity: /quotes/fresh/all 503 ⇔ /health 503 ⇔ /status/quotes 503', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const a = await fetch(`${baseUrl}/quotes/fresh/all`);
      const b = await fetch(`${baseUrl}/health`);
      const c = await fetch(`${baseUrl}/status/quotes`);
      expect(a.status).toBe(503);
      expect(b.status).toBe(503);
      expect(c.status).toBe(503);
    } finally {
      await close(server);
    }
  });

  it('responseShape mentions degraded? + message? and stays ≤ 240 chars', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const root = (await (await fetch(`${baseUrl}/`)).json()) as {
        endpoints: Array<{ path: string; summary: string; responseShape: string }>;
      };
      const e = root.endpoints.find((x) => x.path === '/quotes/fresh/all');
      expect(e).toBeDefined();
      expect(e!.responseShape).toMatch(/degraded\?/);
      expect(e!.responseShape).toMatch(/message\?/);
      expect(e!.responseShape.length).toBeLessThanOrEqual(240);
      expect(e!.summary).toMatch(/503/);
    } finally {
      await close(server);
    }
  });

  it('source block is sanitised (single-line reason, no stack/path)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason:
        "Cannot find module '/home/x/y'\nRequire stack:\n- /home/x/z",
      lastAttachAt: null,
    });
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/quotes/fresh/all`)).json()) as {
        source: { reason: string };
      };
      const reason = body.source.reason;
      expect(reason).not.toContain('\n');
      expect(reason).not.toMatch(/\/home\//);
      expect(reason).not.toContain('Require stack');
    } finally {
      await close(server);
    }
  });
});
