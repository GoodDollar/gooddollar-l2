import express from 'express';
import { createServer } from '../server';
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

describe('OPTIONS on unregistered path → catch-all 404 (task 0085)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('OPTIONS /no-such-thing → 404 not-found JSON envelope (no Allow header)', async () => {
    const res = await fetch(`${baseUrl}/no-such-thing`, { method: 'OPTIONS' });
    expect(res.status).toBe(404);
    expect(res.headers.get('allow')).toBeNull();
    expect(res.headers.get('access-control-allow-methods')).toBeNull();
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(typeof body.humanReason).toBe('string');
    expect(typeof body.nextStep).toBe('string');
    expect(typeof body.requestId).toBe('string');
  });

  it('OPTIONS /favicon.ico → 404 (browser auto-fetch case)', async () => {
    const res = await fetch(`${baseUrl}/favicon.ico`, { method: 'OPTIONS' });
    expect(res.status).toBe(404);
    expect(res.headers.get('allow')).toBeNull();
  });

  it('OPTIONS /HEALTH (case mismatch) → 404 with didYouMean: /health', async () => {
    const res = await fetch(`${baseUrl}/HEALTH`, { method: 'OPTIONS' });
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(body.didYouMean).toBe('/health');
  });

  it('OPTIONS //quotes//AAPL// (multi-slash) → 404 with canonicalSuggestion', async () => {
    const res = await fetch(`${baseUrl}//quotes//AAPL//`, { method: 'OPTIONS' });
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(body.didYouMean).toBe('/quotes/AAPL');
  });

  it('regression — OPTIONS / → 204 with Allow header (registered path)', async () => {
    const res = await fetch(`${baseUrl}/`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });

  it.each([
    ['/health'],
    ['/quotes'],
    ['/audit/stats'],
    ['/metrics'],
    ['/docs/source-reasons'],
    ['/status/quotes'],
    ['/quotes/fresh/all'],
  ])('regression — OPTIONS %s → 204 with Allow header', async (path) => {
    const res = await fetch(`${baseUrl}${path}`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });

  it('regression — OPTIONS /quotes/AAPL → 204 (parametric route registered)', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });

  it('preflight reflection on registered paths still works', async () => {
    const res = await fetch(`${baseUrl}/quotes`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Request-Id, Authorization',
      },
    });
    expect(res.status).toBe(204);
    const allowHeaders = res.headers.get('access-control-allow-headers') ?? '';
    expect(allowHeaders).toContain('X-Request-Id');
    expect(allowHeaders).toContain('Authorization');
  });

  it('preflight reflection is NOT emitted on unregistered-path 404', async () => {
    const res = await fetch(`${baseUrl}/no-such-thing`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Request-Id',
      },
    });
    expect(res.status).toBe(404);
    expect(res.headers.get('access-control-allow-headers')).toBeNull();
  });

  it('OPTIONS /no-such-thing matches GET /no-such-thing 404 envelope shape', async () => {
    const opt = await fetch(`${baseUrl}/no-such-thing`, { method: 'OPTIONS' });
    const get = await fetch(`${baseUrl}/no-such-thing`);
    expect(opt.status).toBe(get.status);
    const optBody = (await opt.json()) as Record<string, unknown>;
    const getBody = (await get.json()) as Record<string, unknown>;
    expect(optBody.error).toBe(getBody.error);
    expect(optBody.humanReason).toBe(getBody.humanReason);
    expect(optBody.severity).toBe(getBody.severity);
    expect(optBody.nextStep).toBe(getBody.nextStep);
  });
});
