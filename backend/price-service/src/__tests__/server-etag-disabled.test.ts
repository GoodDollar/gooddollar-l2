import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';

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

/**
 * Every response body carries a per-millisecond `timestamp` field via
 * `finalizeTimestamps`, so Express's weak-ETag (SHA-1 over the body)
 * NEVER matches a follow-up `If-None-Match`. Emitting a validator the
 * service structurally cannot honour is a false caching contract that
 * wastes bandwidth, CPU, and integrator time. See task 0044.
 */
describe('ETag disabled — no validator emitted on any response (task 0044)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  const SAMPLE_PATHS = ENDPOINT_CATALOG.map((e) =>
    e.path === '/quotes/:symbol' ? '/quotes/AAPL' : e.path,
  );

  for (const path of SAMPLE_PATHS) {
    it(`GET ${path} → no ETag header`, async () => {
      const res = await fetch(`${baseUrl}${path}`);
      expect(res.headers.get('etag')).toBeNull();
    });
  }

  it('404 not-found has no ETag', async () => {
    const res = await fetch(`${baseUrl}/totally-unknown`);
    expect(res.status).toBe(404);
    expect(res.headers.get('etag')).toBeNull();
  });

  it('400 invalid-symbol has no ETag', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    expect(res.status).toBe(400);
    expect(res.headers.get('etag')).toBeNull();
  });

  it('405 method-not-allowed has no ETag', async () => {
    const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(res.status).toBe(405);
    expect(res.headers.get('etag')).toBeNull();
  });

  it('If-None-Match: * on /quotes/AAPL still returns full body (404 no-quote), not 304', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`, {
      headers: { 'If-None-Match': '*' },
    });
    expect(res.status).toBe(404);
    expect(res.headers.get('etag')).toBeNull();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
  });

  it('If-None-Match with a fake weak ETag on /health still returns full body', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'If-None-Match': 'W/"anything"' },
    });
    expect(res.status).not.toBe(304);
    expect(res.headers.get('etag')).toBeNull();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.freshQuotes).toBeDefined();
  });
});
