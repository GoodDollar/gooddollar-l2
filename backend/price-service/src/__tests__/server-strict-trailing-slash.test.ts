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

const FLAT_CATALOG_PATHS = ENDPOINT_CATALOG
  .filter((e) => !e.parametric && e.path !== '/')
  .map((e) => e.path);

/**
 * Express's default `strict routing: false` folds /quotes/ onto /quotes,
 * so a developer typing /quotes/ (forgotten symbol on the parametric
 * /quotes/:symbol route, or shell auto-completion appending a stray
 * slash) gets the bulk dump back instead of a 400 / 404 that steers
 * them to the right URL. See task 0046.
 */
describe('strict trailing-slash routing (task 0046)', () => {
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

  for (const path of FLAT_CATALOG_PATHS) {
    it(`GET ${path}/ → 404 with didYouMean = ${path}`, async () => {
      const res = await fetch(`${baseUrl}${path}/`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('not-found');
      expect(body.didYouMean).toBe(path);
      expect(body.path).toBe(`${path}/`);
    });
  }

  it('GET /quotes/AAPL/ (parametric child + slash) → 404 didYouMean /quotes/AAPL', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL/`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(body.didYouMean).toBe('/quotes/AAPL');
  });

  it('GET /quotes/ (parametric parent — special operator message) → 404 with disambiguating message', async () => {
    const res = await fetch(`${baseUrl}/quotes/`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.didYouMean).toBe('/quotes');
    expect(body.message).toBeDefined();
    expect(body.message).toMatch(/\/quotes\/:symbol/);
    expect(body.message).toMatch(/bulk|\/quotes/i);
  });

  it('GET / (bare root) still returns 200 with discovery payload', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.service).toBe('price-service');
  });

  it('GET /quotes (canonical no-slash) still returns 200 with bulk body', async () => {
    const res = await fetch(`${baseUrl}/quotes`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.quotes).toBeDefined();
  });

  it('GET /quotes/AAPL (canonical parametric no-slash) still 404 no-quote — unchanged', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
  });

  it('GET /totally-unknown/ → 404 WITHOUT didYouMean (no catalog match either way)', async () => {
    const res = await fetch(`${baseUrl}/totally-unknown/`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(body.didYouMean).toBeUndefined();
  });

  it('composes with case-mismatch + trailing slash: GET /HEALTH/ → 404 didYouMean /health', async () => {
    const res = await fetch(`${baseUrl}/HEALTH/`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.didYouMean).toBe('/health');
  });

  it('composes with case-mismatch + trailing slash on parametric: GET /QUOTES/AAPL/ → 404 didYouMean /quotes/AAPL', async () => {
    const res = await fetch(`${baseUrl}/QUOTES/AAPL/`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.didYouMean).toBe('/quotes/AAPL');
  });

  it('404 envelope still ends with timestamp, timestampIso (envelope-order invariant)', async () => {
    const res = await fetch(`${baseUrl}/quotes/`);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });
});
