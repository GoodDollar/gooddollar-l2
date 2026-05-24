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

const CONCRETE_PATHS: readonly string[] = ENDPOINT_CATALOG.map((e) =>
  e.path === '/quotes/:symbol' ? '/quotes/AAPL' : e.path,
);

/**
 * Task 0059: every OPTIONS response carries the RFC 7231 `Allow` header
 * so non-CORS clients (curl, Go net/http, Python requests, k6,
 * oracle-signer probes) can discover allowed methods on a path in a
 * single round-trip — without having to send a wrong verb to read the
 * 405 envelope.
 */
describe('OPTIONS responses emit RFC 7231 `Allow` header (task 0059)', () => {
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

  for (const path of CONCRETE_PATHS) {
    it(`OPTIONS ${path} → 204 with Allow: GET, OPTIONS`, async () => {
      const res = await fetch(`${baseUrl}${path}`, { method: 'OPTIONS' });
      expect(res.status).toBe(204);
      expect(res.headers.get('allow')).toBe('GET, OPTIONS');
    });

    it(`OPTIONS ${path}: Allow matches Access-Control-Allow-Methods byte-for-byte`, async () => {
      const res = await fetch(`${baseUrl}${path}`, { method: 'OPTIONS' });
      expect(res.headers.get('allow')).toBe(
        res.headers.get('access-control-allow-methods'),
      );
    });
  }

  it('OPTIONS on unregistered path falls through to catch-all 404 (task 0085)', async () => {
    // Previously the OPTIONS short-circuit emitted 204 + a default
    // `Allow: GET, OPTIONS` for any path, lying about a GET that
    // immediately 404s and poisoning the browser preflight cache for
    // Access-Control-Max-Age. RFC 9110 §9.3.7 scopes OPTIONS to the
    // target resource — no resource ⇒ no capabilities ⇒ 404.
    const res = await fetch(`${baseUrl}/nope`, { method: 'OPTIONS' });
    expect(res.status).toBe(404);
    expect(res.headers.get('allow')).toBeNull();
    expect(res.headers.get('access-control-allow-methods')).toBeNull();
  });

  it('drift-proof: OPTIONS /foo and POST /foo report the same Allow value', async () => {
    const opt = await fetch(`${baseUrl}/health`, { method: 'OPTIONS' });
    const post = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(opt.headers.get('allow')).toBe(post.headers.get('allow'));
  });

  it('drift-proof: OPTIONS on parametric route matches PUT 405 on same path', async () => {
    const opt = await fetch(`${baseUrl}/quotes/AAPL`, { method: 'OPTIONS' });
    const put = await fetch(`${baseUrl}/quotes/AAPL`, { method: 'PUT' });
    expect(opt.headers.get('allow')).toBe('GET, OPTIONS');
    expect(opt.headers.get('allow')).toBe(put.headers.get('allow'));
  });

  it('CORS preflight headers still ride along (browser preflight unaffected)', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    // task 0079: when the client omits Access-Control-Request-Headers,
    // the server falls back to the broad Polygon/Stripe-style default
    // list covering correlation, auth, cache override, content
    // negotiation.
    expect(res.headers.get('access-control-allow-headers')).toBe(
      'Content-Type, Authorization, X-Request-Id, Cache-Control, Accept, Prefer',
    );
    expect(res.headers.get('access-control-max-age')).toBe('600');
  });

  it('OPTIONS body is empty (204 No Content unchanged)', async () => {
    const res = await fetch(`${baseUrl}/`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    const text = await res.text();
    expect(text).toBe('');
  });

  it('non-OPTIONS responses do NOT carry the Allow header by default (only on 204 OPTIONS + 405)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    // 200 health responses don't need Allow — it's an OPTIONS/405-only
    // header per RFC 7231.
    expect(res.headers.get('allow')).toBeNull();
  });
});
