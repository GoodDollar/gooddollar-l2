import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';
import { MAX_AGE_MS_REGEX } from '../max-age-query';

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

describe('GET /quotes/:symbol — ?maxAgeMs validation runs before resource-state gates (task 0082)', () => {
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

  function seedAged(symbol: string, ageMs: number): void {
    const quote = makeQuote({ symbol, timestamp: Date.now() });
    cache.update(quote);
    const internal = (cache as unknown as { cache: Map<string, { cachedAt: number }> }).cache;
    const entry = internal.get(symbol);
    if (entry) entry.cachedAt = Date.now() - ageMs;
  }

  it('unconfigured symbol + maxAgeMs=abc → 400 invalid-max-age-ms (NOT 404 symbol-not-configured)', async () => {
    const res = await fetch(`${baseUrl}/quotes/UNKNOWN?maxAgeMs=abc`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
    const expected = body.expected as Record<string, unknown>;
    expect(expected.parameter).toBe('maxAgeMs');
    expect(expected.pattern).toBe(MAX_AGE_MS_REGEX.source);
  });

  it('configured symbol + cold cache + maxAgeMs=abc → 400 invalid-max-age-ms (NOT 404 no-quote)', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=abc`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
  });

  it('unconfigured symbol + maxAgeMs=-1 → 400 invalid-max-age-ms (NOT 404 symbol-not-configured)', async () => {
    const res = await fetch(`${baseUrl}/quotes/UNKNOWN?maxAgeMs=-1`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
  });

  it('configured symbol + cold cache + maxAgeMs=0 → 400 invalid-max-age-ms', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=0`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
  });

  it('configured symbol + fresh cache + maxAgeMs=0 → 400 invalid-max-age-ms (cache state irrelevant)', async () => {
    seedAged('AAPL', 1_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=0`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
  });

  it('regression — /quotes/AAPL (no query, cold cache) still returns 404 no-quote', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
  });

  it('regression — /quotes/UNKNOWN (no query) still returns 404 symbol-not-configured', async () => {
    const res = await fetch(`${baseUrl}/quotes/UNKNOWN`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('symbol-not-configured');
  });

  it('invalid-symbol shape + maxAgeMs=abc → 400 invalid-symbol (shape gate stays first)', async () => {
    const res = await fetch(`${baseUrl}/quotes/!?maxAgeMs=abc`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
  });

  it('sibling-route hint + maxAgeMs=abc → 400 invalid-symbol-or-path (hint gate stays second)', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh?maxAgeMs=abc`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol-or-path');
  });

  it('regression — fresh cache + valid maxAgeMs=30000 → 200', async () => {
    seedAged('AAPL', 1_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=30000`);
    expect(res.status).toBe(200);
  });

  it('regression — stale cache + valid maxAgeMs=5 → 503 stale-cache (gate still fires post-cache-hit)', async () => {
    seedAged('AAPL', 10_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=5`);
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('stale-cache');
    expect(body.maxAgeMs).toBe(5);
  });

  it('invalid-max-age-ms body shape is byte-identical regardless of cache state', async () => {
    // Cold cache, configured symbol.
    const cold = (await (
      await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=abc`)
    ).json()) as Record<string, unknown>;
    // Fresh cache, same symbol.
    seedAged('AAPL', 1_000);
    const fresh = (await (
      await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=abc`)
    ).json()) as Record<string, unknown>;
    expect(cold.error).toBe('invalid-max-age-ms');
    expect(fresh.error).toBe('invalid-max-age-ms');
    expect(cold.symbol).toBe(fresh.symbol);
    expect(cold.humanReason).toBe(fresh.humanReason);
    expect(cold.severity).toBe(fresh.severity);
    expect(cold.nextStep).toBe(fresh.nextStep);
    expect(cold.expected).toEqual(fresh.expected);
  });
});
