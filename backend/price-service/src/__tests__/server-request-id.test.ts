import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { GENERATED_REQUEST_ID_REGEX } from '../request-id';
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

describe('X-Request-Id correlation header (task 0078)', () => {
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

  const ENDPOINTS: ReadonlyArray<[string, string, number[]]> = [
    ['GET', '/', [200]],
    ['GET', '/health', [200, 503]],
    ['GET', '/quotes', [200, 503]],
    ['GET', '/quotes/AAPL', [200, 404]],
    ['GET', '/quotes/@@@', [400]],
    ['GET', '/quotes/NVDA', [404]],
    ['GET', '/audit/stats', [200]],
    ['GET', '/docs/source-reasons', [200]],
    ['GET', '/quotes/fresh/all', [200, 503]],
    ['GET', '/status/quotes', [200, 503]],
    ['GET', '/nope', [404]],
    ['PUT', '/health', [405]],
    ['OPTIONS', '/quotes/AAPL', [204]],
  ];

  it.each(ENDPOINTS)(
    '%s %s ships X-Request-Id on every response',
    async (method, path, _statuses) => {
      const res = await fetch(`${baseUrl}${path}`, { method });
      const header = res.headers.get('x-request-id');
      expect(header).toBeTruthy();
      expect((header as string).length).toBeGreaterThan(0);
    },
  );

  it('client-supplied safe X-Request-Id is echoed verbatim', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'trace-abc-123' },
    });
    expect(res.headers.get('x-request-id')).toBe('trace-abc-123');
  });

  it('client-supplied unsafe X-Request-Id (whitespace) is replaced with a generated ID', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'foo bar' },
    });
    const echoed = res.headers.get('x-request-id');
    expect(echoed).not.toBe('foo bar');
    expect(echoed).toMatch(GENERATED_REQUEST_ID_REGEX);
  });

  it('absent client header → server generates a canonical-shape ID', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('x-request-id')).toMatch(GENERATED_REQUEST_ID_REGEX);
  });

  it('Access-Control-Expose-Headers ships X-Request-Id + Retry-After on every response', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('access-control-expose-headers')).toBe(
      'X-Request-Id, Retry-After',
    );
  });

  it('Access-Control-Allow-Headers (preflight) includes X-Request-Id', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.headers.get('access-control-allow-headers')).toContain('X-Request-Id');
  });

  it('body.requestId rides on /health envelope', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'trace-health-1' },
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe('trace-health-1');
  });

  it('body.requestId rides on catch-all 404 envelope', async () => {
    const res = await fetch(`${baseUrl}/no-such-path`, {
      headers: { 'X-Request-Id': 'trace-404-1' },
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe('trace-404-1');
  });

  it('body.requestId rides on 405 envelope', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'PUT',
      headers: { 'X-Request-Id': 'trace-405-1' },
    });
    expect(res.status).toBe(405);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe('trace-405-1');
  });

  it('body.requestId rides on /quotes success envelope (task 0084)', async () => {
    const res = await fetch(`${baseUrl}/quotes`, {
      headers: { 'X-Request-Id': 'trace-quotes' },
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe('trace-quotes');
    expect(res.headers.get('x-request-id')).toBe('trace-quotes');
  });

  it('GET / discovery body advertises the correlation header under body.support', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    const support = body.support as Record<string, unknown>;
    expect(support).toBeDefined();
    const correlation = support.correlation as Record<string, unknown>;
    expect(correlation.header).toBe('X-Request-Id');
    expect(typeof correlation.describe).toBe('string');
    expect(typeof correlation.pattern).toBe('string');
  });
});
