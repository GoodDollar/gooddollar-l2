import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
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

function seedAged(cache: QuoteCache, symbol: string, ageMs: number): void {
  const quote = makeQuote({ symbol, timestamp: Date.now() });
  cache.update(quote);
  const internal = (cache as unknown as { cache: Map<string, { cachedAt: number }> }).cache;
  const entry = internal.get(symbol);
  if (entry) entry.cachedAt = Date.now() - ageMs;
}

describe('GET /quotes/:symbol — body.requestId on every error envelope (task 0083)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 600_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    cache.clear();
  });

  async function fetchWithTrace(
    path: string,
    trace: string,
  ): Promise<{ status: number; header: string | null; body: Record<string, unknown> }> {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'X-Request-Id': trace },
    });
    return {
      status: res.status,
      header: res.headers.get('x-request-id'),
      body: (await res.json()) as Record<string, unknown>,
    };
  }

  it('invalid-symbol (no-alnum) → body.requestId === X-Request-Id header', async () => {
    const { status, header, body } = await fetchWithTrace('/quotes/...', 'trace-inv-1');
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    expect(body.requestId).toBe('trace-inv-1');
    expect(header).toBe('trace-inv-1');
  });

  it('invalid-symbol (shape) → body.requestId echoed', async () => {
    const { status, body } = await fetchWithTrace('/quotes/!', 'trace-inv-2');
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    expect(body.requestId).toBe('trace-inv-2');
  });

  it('invalid-symbol-or-path (sibling-route hint) → body.requestId echoed', async () => {
    const { status, body } = await fetchWithTrace('/quotes/fresh', 'trace-hint-1');
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-symbol-or-path');
    expect(body.requestId).toBe('trace-hint-1');
  });

  it('symbol-not-configured → body.requestId echoed', async () => {
    const { status, body } = await fetchWithTrace('/quotes/UNKNOWN', 'trace-snc-1');
    expect(status).toBe(404);
    expect(body.error).toBe('symbol-not-configured');
    expect(body.requestId).toBe('trace-snc-1');
  });

  it('no-quote (cold cache) → body.requestId echoed', async () => {
    const { status, body } = await fetchWithTrace('/quotes/AAPL', 'trace-nq-1');
    expect(status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.requestId).toBe('trace-nq-1');
  });

  it('invalid-max-age-ms (cold cache, post-0082) → body.requestId echoed', async () => {
    const { status, body } = await fetchWithTrace(
      '/quotes/AAPL?maxAgeMs=abc',
      'trace-maxage-1',
    );
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-max-age-ms');
    expect(body.requestId).toBe('trace-maxage-1');
  });

  it('stale-cache (503) → body.requestId echoed', async () => {
    seedAged(cache, 'AAPL', 10_000);
    const { status, body } = await fetchWithTrace(
      '/quotes/AAPL?maxAgeMs=5',
      'trace-stale-1',
    );
    expect(status).toBe(503);
    expect(body.error).toBe('stale-cache');
    expect(body.requestId).toBe('trace-stale-1');
  });

  it('body.requestId is set even without a client header (server-generated)', async () => {
    const res = await fetch(`${baseUrl}/quotes/UNKNOWN`);
    expect(res.status).toBe(404);
    const header = res.headers.get('x-request-id');
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe(header);
    expect(typeof body.requestId).toBe('string');
    expect((body.requestId as string).length).toBeGreaterThan(0);
  });

  it('field order: requestId immediately follows nextStep on every envelope', async () => {
    const paths: Array<[string, string]> = [
      ['/quotes/...', 'invalid-symbol'],
      ['/quotes/fresh', 'invalid-symbol-or-path'],
      ['/quotes/UNKNOWN', 'symbol-not-configured'],
      ['/quotes/AAPL', 'no-quote'],
      ['/quotes/AAPL?maxAgeMs=abc', 'invalid-max-age-ms'],
    ];
    for (const [path, expectedError] of paths) {
      const res = await fetch(`${baseUrl}${path}`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe(expectedError);
      const keys = Object.keys(body);
      const nextStepIdx = keys.indexOf('nextStep');
      const requestIdIdx = keys.indexOf('requestId');
      expect(nextStepIdx).toBeGreaterThanOrEqual(0);
      expect(requestIdIdx).toBe(nextStepIdx + 1);
    }
  });

  it('field order: requestId immediately follows nextStep on stale-cache', async () => {
    seedAged(cache, 'AAPL', 10_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=5`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('stale-cache');
    const keys = Object.keys(body);
    expect(keys.indexOf('requestId')).toBe(keys.indexOf('nextStep') + 1);
  });

  it('regression — catch-all 404 still ships body.requestId', async () => {
    const { status, body } = await fetchWithTrace('/no-such-path', 'trace-catchall');
    expect(status).toBe(404);
    expect(body.error).toBe('not-found');
    expect(body.requestId).toBe('trace-catchall');
  });

  it('regression — 405 still ships body.requestId', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'PUT',
      headers: { 'X-Request-Id': 'trace-405' },
    });
    expect(res.status).toBe(405);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestId).toBe('trace-405');
  });
});
