import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { ENDPOINT_CATALOG } from '../server';
import { NormalizedQuote, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return computeSpread({
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.5,
    ask: 189.6,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 1,
    stale: false,
    ...overrides,
  });
}

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

// Endpoints whose JSON success body now ships body.requestId at the
// top of the body literal (matching /health's task 0078 precedent).
const SUCCESS_ENDPOINTS: ReadonlyArray<string> = [
  '/',
  '/quotes',
  '/quotes/fresh/all',
  '/audit/stats',
  '/status/quotes',
  '/docs/source-reasons',
];

describe('body.requestId rides on every JSON success envelope (task 0084)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it.each(SUCCESS_ENDPOINTS)(
    '%s ships body.requestId === X-Request-Id header (server-generated)',
    async (path) => {
      const res = await fetch(`${baseUrl}${path}`);
      const header = res.headers.get('x-request-id');
      const body = (await res.json()) as Record<string, unknown>;
      expect(typeof body.requestId).toBe('string');
      expect((body.requestId as string).length).toBeGreaterThan(0);
      expect(body.requestId).toBe(header);
    },
  );

  it.each(SUCCESS_ENDPOINTS)(
    '%s echoes a client-supplied X-Request-Id in BOTH the header AND body.requestId',
    async (path) => {
      const trace = `trace-${path.replace(/\W/g, '') || 'root'}`;
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'X-Request-Id': trace },
      });
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.headers.get('x-request-id')).toBe(trace);
      expect(body.requestId).toBe(trace);
    },
  );

  it('/health body.requestId placement is unchanged (regression)', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'trace-health-regression' },
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe('trace-health-regression');
    expect(Object.keys(body)[0]).toBe('requestId');
  });

  it('/metrics text/plain ships X-Request-Id header but no body.requestId token', async () => {
    const res = await fetch(`${baseUrl}/metrics`, {
      headers: { 'X-Request-Id': 'trace-metrics' },
    });
    expect(res.headers.get('x-request-id')).toBe('trace-metrics');
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).not.toMatch(/^requestId/m);
  });

  it('responseShape advertised at GET / mentions requestId for each updated endpoint', () => {
    for (const path of SUCCESS_ENDPOINTS) {
      const entry = ENDPOINT_CATALOG.find((e) => e.path === path);
      expect(entry).toBeDefined();
      expect(entry!.responseShape).toContain('requestId');
    }
  });

  it('/metrics responseShape is unchanged (text/plain — header-only correlation)', () => {
    const entry = ENDPOINT_CATALOG.find((e) => e.path === '/metrics');
    expect(entry).toBeDefined();
    expect(entry!.responseShape).not.toContain('requestId');
  });

  it('/ field order: service first, requestId second (matching task 0084 plan)', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys[0]).toBe('service');
    expect(keys[1]).toBe('requestId');
  });

  it('/docs/source-reasons field order: requestId is the first body field', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<
      string,
      unknown
    >;
    expect(Object.keys(body)[0]).toBe('requestId');
  });
});
