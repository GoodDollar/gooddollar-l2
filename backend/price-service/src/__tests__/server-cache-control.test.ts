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
 * Live-tick price data is by definition non-cacheable at the HTTP
 * transport layer. A CDN, reverse proxy, or browser BFCache silently
 * pinning `/quotes/AAPL` for minutes makes the service a stale-price
 * source for every downstream consumer (oracle-signer, frontend). The
 * upstream-side `risk-filter` cannot detect that the TRANSPORT is the
 * stale layer; only `Cache-Control: no-store` on every response can.
 * See task 0043.
 */
describe('Cache-Control: no-store on every response (task 0043)', () => {
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

  // For the parametric route, substitute a real symbol the deploy
  // accepts; the header policy is identical regardless of body content.
  const SAMPLE_PATHS = ENDPOINT_CATALOG.map((e) =>
    e.path === '/quotes/:symbol' ? '/quotes/AAPL' : e.path,
  );

  for (const path of SAMPLE_PATHS) {
    it(`GET ${path} → Cache-Control: no-store + Pragma: no-cache`, async () => {
      const res = await fetch(`${baseUrl}${path}`);
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(res.headers.get('pragma')).toBe('no-cache');
    });
  }

  it('404 not-found also carries Cache-Control: no-store', async () => {
    const res = await fetch(`${baseUrl}/totally-unknown`);
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('pragma')).toBe('no-cache');
  });

  it('400 invalid-symbol also carries Cache-Control: no-store', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('400 invalid-symbol-or-path also carries Cache-Control: no-store', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh`);
    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('404 no-quote also carries Cache-Control: no-store', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('405 method-not-allowed also carries Cache-Control: no-store', async () => {
    const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(res.status).toBe(405);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('204 OPTIONS preflight also carries Cache-Control: no-store (belt-and-braces; preflight cache uses Access-Control-Max-Age)', async () => {
    const res = await fetch(`${baseUrl}/health`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('access-control-max-age')).toBe('600');
  });
});
