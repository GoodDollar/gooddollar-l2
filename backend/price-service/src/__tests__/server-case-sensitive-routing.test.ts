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
 * Alternating-case mangler used by the case-sensitive routing tests. Flips
 * each letter independently so the result is neither all-upper nor
 * all-lower — proves we're not just toggling a single global case.
 */
function mixedCase(s: string): string {
  let out = '';
  let flip = false;
  for (const c of s) {
    if (/[a-z]/i.test(c)) {
      out += flip ? c.toUpperCase() : c.toLowerCase();
      flip = !flip;
    } else {
      out += c;
    }
  }
  return out;
}

const FLAT_CATALOG_PATHS = ENDPOINT_CATALOG
  .filter((e) => !e.parametric && e.path !== '/')
  .map((e) => e.path);

describe('case-sensitive routing — uppercase/mixed-case paths fall through to 404 with didYouMean', () => {
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
    it(`UPPERCASE ${path} → 404 with didYouMean = ${path}`, async () => {
      const upper = path.toUpperCase();
      const res = await fetch(`${baseUrl}${upper}`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('not-found');
      expect(body.path).toBe(upper);
      expect(body.didYouMean).toBe(path);
    });

    it(`mixedCase ${path} → 404 with didYouMean = ${path}`, async () => {
      const mixed = mixedCase(path);
      // Skip cases where mixed-casing happens to equal the canonical form
      // (paths whose alpha chars are all already-lowercase singletons).
      if (mixed === path) return;
      const res = await fetch(`${baseUrl}${mixed}`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('not-found');
      expect(body.path).toBe(mixed);
      expect(body.didYouMean).toBe(path);
    });
  }

  it('GET /QUOTES/AAPL (parametric, prefix-only case mismatch) → 404 didYouMean /quotes/AAPL (preserves symbol case)', async () => {
    const res = await fetch(`${baseUrl}/QUOTES/AAPL`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.didYouMean).toBe('/quotes/AAPL');
  });

  it('GET /Quotes/aapl (parametric, prefix-only case mismatch, lower symbol) → 404 didYouMean /quotes/aapl', async () => {
    const res = await fetch(`${baseUrl}/Quotes/aapl`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.didYouMean).toBe('/quotes/aapl');
  });

  it('canonical /quotes/AAPL still resolves to /quotes/:symbol handler (unchanged regression)', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
  });

  it('canonical lowercase /quotes still returns 200 with bulk body (unchanged regression)', async () => {
    const res = await fetch(`${baseUrl}/quotes`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.quotes).toBeDefined();
  });

  it('bare root / still returns 200 with discovery payload', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.service).toBe('price-service');
  });

  it('truly-unknown path /totally-unknown → 404 WITHOUT didYouMean', async () => {
    const res = await fetch(`${baseUrl}/totally-unknown`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(body.didYouMean).toBeUndefined();
  });

  it('OPTIONS /HEALTH preflight still returns 204 (CORS intercepts before route dispatch)', async () => {
    const res = await fetch(`${baseUrl}/HEALTH`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });

  it('404 envelope echoes raw request path, not the lowercase normalised form', async () => {
    const res = await fetch(`${baseUrl}/HeAlTh`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.path).toBe('/HeAlTh');
    expect(body.didYouMean).toBe('/health');
  });

  it('404 envelope still carries the compact endpoints[] hint list with canonical lowercase paths', async () => {
    const res = await fetch(`${baseUrl}/HEALTH`);
    const body = (await res.json()) as { endpoints: Array<{ path: string }> };
    const paths = body.endpoints.map((e) => e.path);
    expect(paths).toContain('/health');
    expect(paths).toContain('/quotes');
    // No duplicate uppercase forms.
    expect(paths.filter((p) => p === '/HEALTH')).toHaveLength(0);
  });
});
