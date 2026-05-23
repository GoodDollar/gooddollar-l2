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

const HEALTH_ENDPOINTS: ReadonlyArray<string> = [
  '/health',
  '/quotes',
  '/quotes/fresh/all',
  '/status/quotes',
];

function makeApp(srcGetter: () => SourceStatus, withCache: boolean): express.Express {
  const cache = new QuoteCache({ cacheTtlMs: 30_000 });
  if (withCache) cache.update(makeQuote({ symbol: 'AAPL' }));
  return createServer(cache, { symbols: ['AAPL'] }, undefined, srcGetter);
}

/**
 * Task 0064: four sibling health-class endpoints all answer the same
 * upstream "is this service degraded?" question. Prior to this task,
 * `/health` shipped only `status:'degraded'`; `/status/quotes` shipped
 * `healthy: !degraded` (inverse polarity); the two `/quotes*` siblings
 * already shipped `degraded:boolean` + `message`. This drift-gate suite
 * asserts every endpoint now ships the same `degraded:boolean` field,
 * with the same polarity (`true == bad`), plus a `message` when
 * degraded.
 */
describe('degraded field unification across health endpoints (task 0064)', () => {
  describe('degraded source (503 path)', () => {
    const deadSource = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });

    it.each(HEALTH_ENDPOINTS)('%s ships degraded:true with non-empty message', async (path) => {
      const app = makeApp(deadSource, false);
      const { server, baseUrl } = await listen(app);
      try {
        const res = await fetch(`${baseUrl}${path}`);
        const body = (await res.json()) as Record<string, unknown>;
        expect(res.status).toBe(503);
        expect(body.degraded).toBe(true);
        expect(typeof body.message).toBe('string');
        expect((body.message as string).length).toBeGreaterThan(0);
      } finally {
        await close(server);
      }
    });
  });

  describe('healthy source (200 path)', () => {
    const liveSource = (): SourceStatus => ({
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: Date.now(),
    });

    it.each(HEALTH_ENDPOINTS)('%s ships degraded:false with no message', async (path) => {
      const app = makeApp(liveSource, true);
      const { server, baseUrl } = await listen(app);
      try {
        const res = await fetch(`${baseUrl}${path}`);
        const body = (await res.json()) as Record<string, unknown>;
        expect(res.status).toBe(200);
        expect(body.degraded).toBe(false);
        expect('message' in body).toBe(false);
      } finally {
        await close(server);
      }
    });
  });

  describe('polarity drift gate', () => {
    it.each([
      ['dead', (): SourceStatus => ({ connected: false, reason: 'not-attached', lastAttachAt: null })],
      ['live', (): SourceStatus => ({ connected: true, symbols: ['AAPL'], lastAttachAt: Date.now() })],
    ])('every health endpoint agrees: degraded === !healthy (where present) under %s source', async (_label, getter) => {
      const app = makeApp(getter, true);
      const { server, baseUrl } = await listen(app);
      try {
        for (const path of HEALTH_ENDPOINTS) {
          const body = (await (await fetch(`${baseUrl}${path}`)).json()) as Record<string, unknown>;
          if ('healthy' in body && 'degraded' in body) {
            expect(body.degraded).toBe(!body.healthy);
          }
        }
      } finally {
        await close(server);
      }
    });

    it.each([
      ['dead', (): SourceStatus => ({ connected: false, reason: 'not-attached', lastAttachAt: null })],
      ['live', (): SourceStatus => ({ connected: true, symbols: ['AAPL'], lastAttachAt: Date.now() })],
    ])('every health endpoint agrees: degraded === (status === "degraded") under %s source', async (_label, getter) => {
      const app = makeApp(getter, true);
      const { server, baseUrl } = await listen(app);
      try {
        for (const path of HEALTH_ENDPOINTS) {
          const body = (await (await fetch(`${baseUrl}${path}`)).json()) as Record<string, unknown>;
          if ('status' in body && 'degraded' in body) {
            expect(body.degraded).toBe(body.status === 'degraded');
          }
        }
      } finally {
        await close(server);
      }
    });
  });

  describe('/status/quotes deprecates healthy in favour of degraded', () => {
    it('legacy healthy field still rides under dead source', async () => {
      const app = makeApp(
        () => ({ connected: false, reason: 'not-attached', lastAttachAt: null }),
        false,
      );
      const { server, baseUrl } = await listen(app);
      try {
        const body = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as Record<string, unknown>;
        expect(body.degraded).toBe(true);
        expect(body.healthy).toBe(false);
        const deprecations = body.deprecations as Record<string, string>;
        expect(typeof deprecations.healthy).toBe('string');
        expect(deprecations.healthy).toMatch(/degraded/);
      } finally {
        await close(server);
      }
    });

    it('legacy healthy field still rides under live source', async () => {
      const app = makeApp(
        () => ({ connected: true, symbols: ['AAPL'], lastAttachAt: Date.now() }),
        true,
      );
      const { server, baseUrl } = await listen(app);
      try {
        const body = (await (await fetch(`${baseUrl}/status/quotes`)).json()) as Record<string, unknown>;
        expect(body.degraded).toBe(false);
        expect(body.healthy).toBe(true);
        const deprecations = body.deprecations as Record<string, string>;
        expect(typeof deprecations.healthy).toBe('string');
      } finally {
        await close(server);
      }
    });
  });

  describe('/health gains the canonical degraded field', () => {
    it('503 body now carries degraded:true alongside the existing status:degraded', async () => {
      const app = makeApp(
        () => ({ connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null }),
        false,
      );
      const { server, baseUrl } = await listen(app);
      try {
        const body = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
        expect(body.degraded).toBe(true);
        expect(body.status).toBe('degraded');
        expect(typeof body.message).toBe('string');
      } finally {
        await close(server);
      }
    });

    it('200 body carries degraded:false, status:ok, no message', async () => {
      const app = makeApp(
        () => ({ connected: true, symbols: ['AAPL'], lastAttachAt: Date.now() }),
        true,
      );
      const { server, baseUrl } = await listen(app);
      try {
        const body = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
        expect(body.degraded).toBe(false);
        expect(body.status).toBe('ok');
        expect('message' in body).toBe(false);
      } finally {
        await close(server);
      }
    });
  });
});
