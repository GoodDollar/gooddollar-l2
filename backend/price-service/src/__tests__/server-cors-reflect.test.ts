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

describe('CORS preflight reflects Access-Control-Request-Headers (task 0079)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  async function preflight(
    path: string,
    requestHeaders?: string,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Origin: 'https://app.example',
      'Access-Control-Request-Method': 'GET',
    };
    if (requestHeaders !== undefined) {
      headers['Access-Control-Request-Headers'] = requestHeaders;
    }
    return fetch(`${baseUrl}${path}`, { method: 'OPTIONS', headers });
  }

  it('reflects a single client-requested header verbatim', async () => {
    const res = await preflight('/quotes/AAPL', 'X-Request-Id');
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-headers')).toBe('X-Request-Id');
  });

  it('reflects a comma-separated list preserving order', async () => {
    const res = await preflight('/quotes', 'X-Request-Id, Authorization, Prefer');
    expect(res.headers.get('access-control-allow-headers')).toBe(
      'X-Request-Id, Authorization, Prefer',
    );
  });

  it('drops unsafe tokens (colon, whitespace) and ships only the survivors', async () => {
    const res = await preflight('/health', 'X-Request-Id, X-Inject: foo, Authorization');
    expect(res.headers.get('access-control-allow-headers')).toBe(
      'X-Request-Id, Authorization',
    );
  });

  it('dedupes case-insensitive duplicates (first wins for casing)', async () => {
    const res = await preflight('/health', 'X-Request-Id, x-request-id');
    expect(res.headers.get('access-control-allow-headers')).toBe('X-Request-Id');
  });

  it('absent Access-Control-Request-Headers → ships the default broad list', async () => {
    const res = await preflight('/health');
    const got = res.headers.get('access-control-allow-headers');
    expect(got).toBe(
      'Content-Type, Authorization, X-Request-Id, Cache-Control, Accept, Prefer',
    );
  });

  it('all-unsafe header list → falls back to the default list', async () => {
    const res = await preflight('/health', 'x:y, a b c');
    expect(res.headers.get('access-control-allow-headers')).toBe(
      'Content-Type, Authorization, X-Request-Id, Cache-Control, Accept, Prefer',
    );
  });

  it('preflight to an unknown path returns 404 (task 0085: OPTIONS scoped to target resource)', async () => {
    // Task 0085 — OPTIONS on an unregistered path falls through to
    // the catch-all 404 instead of pretending the URL exists. The CORS
    // reflection contract therefore only applies to registered paths;
    // a 404 has no preflight semantics so it does not advertise
    // Access-Control-Allow-Headers.
    const res = await preflight('/no-such-path', 'X-Request-Id');
    expect(res.status).toBe(404);
    expect(res.headers.get('access-control-allow-headers')).toBeNull();
  });

  it('GET (non-OPTIONS) does NOT ship Access-Control-Allow-Headers', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('access-control-allow-headers')).toBeNull();
  });

  it('GET (non-OPTIONS) does still ship Access-Control-Allow-Origin and Expose-Headers', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-expose-headers')).toBe(
      'X-Request-Id, Retry-After',
    );
  });
});
