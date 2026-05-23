import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { SOURCE_REASONS_PUBLIC } from '../source-status';

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

describe('REST Server — GET / sourceReasonCatalog pointer (replaces inline sourceReasons)', () => {
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

  it('GET / no longer exposes a top-level sourceReasons field', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    expect('sourceReasons' in body).toBe(false);
  });

  it('GET / exposes a sourceReasonCatalog pointer to /docs/source-reasons', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const ptr = body.sourceReasonCatalog as Record<string, unknown>;
    expect(typeof ptr).toBe('object');
    expect(ptr.url).toBe('/docs/source-reasons');
    expect(ptr.count).toBe(Object.keys(SOURCE_REASONS_PUBLIC).length);
    expect(typeof ptr.description).toBe('string');
    expect((ptr.description as string).length).toBeGreaterThanOrEqual(40);
    expect(ptr.description).toMatch(/reference|not.*live|NOT a live/i);
  });
});

describe('REST Server — GET /docs/source-reasons', () => {
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

  it('returns the full reason catalog as JSON', async () => {
    const res = await fetch(`${baseUrl}/docs/source-reasons`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.reasons).toBeDefined();
    expect(typeof body.count).toBe('number');
    expect(typeof body.timestamp).toBe('number');
    expect(typeof body.timestampIso).toBe('string');
    expect(Object.keys(body.reasons as Record<string, unknown>).length).toBe(body.count);
    for (const [code, doc] of Object.entries(body.reasons as Record<string, unknown>)) {
      expect(typeof code).toBe('string');
      const d = doc as Record<string, unknown>;
      expect(typeof d.humanReason).toBe('string');
      expect(typeof d.nextStep).toBe('string');
      expect(d.severity).toMatch(/^(info|degraded|critical)$/);
    }
  });

  it('every existing reason code in SOURCE_REASONS_PUBLIC is present', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<string, unknown>;
    const reasons = body.reasons as Record<string, unknown>;
    for (const code of Object.keys(SOURCE_REASONS_PUBLIC)) {
      expect(reasons[code]).toBeDefined();
    }
  });

  it('is registered in the / endpoint catalog', async () => {
    const root = (await (await fetch(`${baseUrl}/`)).json()) as {
      endpoints: Array<{ path: string }>;
    };
    expect(root.endpoints.map((e) => e.path)).toContain('/docs/source-reasons');
  });

  it('is registered in the 404 hint list', async () => {
    const notFound = (await (await fetch(`${baseUrl}/no-such-path`)).json()) as {
      endpoints: Array<{ path: string }>;
    };
    expect(notFound.endpoints.map((e) => e.path)).toContain('/docs/source-reasons');
  });

  it('non-GET methods return 405', async () => {
    const res = await fetch(`${baseUrl}/docs/source-reasons`, { method: 'POST' });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });
});
