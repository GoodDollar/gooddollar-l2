import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { SourceStatus } from '../types';

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
 * Task 0074 — `/quotes/:symbol` 404 `no-quote` (configured symbol,
 * cold cache, dead source) emits the same `Retry-After` HTTP header
 * the bulk `/quotes` 503 already emits for the same upstream state.
 * Gated on `src && !src.connected && retryAfterSeconds > 0` so the
 * header rides only when the source is dead — never on the warmup
 * branch (healthy source, cold cache, non-deterministic first-tick).
 * `symbol-not-configured` (permanent state) stays bare per RFC
 * 9110 §10.2.3 semantics.
 */
describe('/quotes/:symbol 404 Retry-After header (task 0074)', () => {
  describe('source dead (critical), configured symbol, cold cache', () => {
    let server: import('http').Server;
    let baseUrl: string;

    const status: SourceStatus = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => status);
      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await close(server);
    });

    it('no-quote 404 ships Retry-After: 60', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('no-quote');
      expect(res.headers.get('retry-after')).toBe('60');
    });

    it('no-quote 404 Retry-After matches body source.retryAfterSeconds', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      const headerValue = res.headers.get('retry-after');
      const body = (await res.json()) as Record<string, unknown>;
      const src = body.source as Record<string, unknown>;
      expect(src.retryAfterSeconds).toBe(Number(headerValue));
    });

    it('symbol-not-configured 404 does NOT ship Retry-After (permanent state)', async () => {
      const res = await fetch(`${baseUrl}/quotes/UNKNOWNSYM`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('symbol-not-configured');
      expect(res.headers.get('retry-after')).toBeNull();
    });
  });

  describe('source dead (degraded), configured symbol, cold cache', () => {
    let server: import('http').Server;
    let baseUrl: string;

    const status: SourceStatus = {
      connected: false,
      reason: 'source-unavailable',
      lastAttachAt: null,
    };

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => status);
      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await close(server);
    });

    it('no-quote 404 ships Retry-After: 15 for degraded severity', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      expect(res.status).toBe(404);
      expect(res.headers.get('retry-after')).toBe('15');
    });
  });

  describe('source healthy, configured symbol, cold cache (warmup)', () => {
    let server: import('http').Server;
    let baseUrl: string;

    const status: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: Date.now(),
    };

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => status);
      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await close(server);
    });

    it('no-quote 404 does NOT ship Retry-After (no useful hint during warmup)', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('no-quote');
      expect(res.headers.get('retry-after')).toBeNull();
    });
  });

  describe('no source-status getter (legacy boot)', () => {
    let server: import('http').Server;
    let baseUrl: string;

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const app = createServer(cache, { symbols: ['AAPL'] });
      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await close(server);
    });

    it('no-quote 404 does NOT ship Retry-After when source state unknown', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      expect(res.status).toBe(404);
      expect(res.headers.get('retry-after')).toBeNull();
    });
  });
});
