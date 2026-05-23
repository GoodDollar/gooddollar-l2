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

describe('REST Server — ENDPOINT_CATALOG drives /, 404, and 405', () => {
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

  it('GET / endpoints entries each carry a non-empty summary <= 140 chars', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as {
      endpoints: Array<{ path: string; methods: string[]; summary: string }>;
    };
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(body.endpoints.length).toBeGreaterThan(0);
    for (const ep of body.endpoints) {
      expect(typeof ep.path).toBe('string');
      expect(Array.isArray(ep.methods)).toBe(true);
      expect(typeof ep.summary).toBe('string');
      expect(ep.summary.length).toBeGreaterThan(0);
      expect(ep.summary.length).toBeLessThanOrEqual(140);
    }
  });

  it('GET /no-such-path 404 endpoints array uses compact {path, methods} shape', async () => {
    const res = await fetch(`${baseUrl}/no-such-path`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as {
      endpoints: Array<Record<string, unknown>>;
    };
    expect(Array.isArray(body.endpoints)).toBe(true);
    const first = body.endpoints[0];
    expect(typeof first.path).toBe('string');
    expect(Array.isArray(first.methods)).toBe(true);
    // Compact projection (task 0027): full discovery (summary +
    // responseShape) lives on GET /, not on every wrong-URL response.
    expect('summary' in first).toBe(false);
    expect('responseShape' in first).toBe(false);
  });

  it('every endpoint in GET / also appears in the 404 list (no drift between callers)', async () => {
    const root = (await (await fetch(`${baseUrl}/`)).json()) as {
      endpoints: Array<{ path: string }>;
    };
    const nf = (await (await fetch(`${baseUrl}/nope`)).json()) as {
      endpoints: Array<{ path: string }>;
    };
    const rootPaths = root.endpoints.map((e) => e.path).sort();
    const nfPaths = nf.endpoints.map((e) => e.path).sort();
    expect(rootPaths).toEqual(nfPaths);
  });

  it('catalog covers every endpoint exposed by the server', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as { endpoints: Array<{ path: string }> };
    const paths = body.endpoints.map((e) => e.path).sort();
    expect(paths).toEqual(
      [
        '/',
        '/audit/stats',
        '/docs/source-reasons',
        '/health',
        '/quotes',
        '/quotes/:symbol',
        '/quotes/fresh/all',
        '/status/quotes',
      ].sort(),
    );
  });

  it('405 lookup still works for known parametric paths after catalog refactor', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`, { method: 'PUT' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
  });

  it('405 lookup still works for exact-match paths after catalog refactor', async () => {
    const res = await fetch(`${baseUrl}/audit/stats`, { method: 'DELETE' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
  });
});
