import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';
import { ERROR_REASONS_PUBLIC } from '../source-status';
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

describe('GET /quotes/:symbol?maxAgeMs= — freshness gate (task 0081)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    // 10-minute TTL keeps `cache.get` from synthesising a `stale:true`
    // wrapper around our back-dated entries — we drive the cacheAge
    // axis directly via `seedAged`'s internal mutation. The freshness
    // gate under test is decoupled from the cache-TTL gate.
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
    // Update with a FRESH-timestamp quote so the risk filter accepts
    // it and stores the entry; then reach into the internal map and
    // back-date `cachedAt` to simulate the requested age. Bypasses
    // the staleness filter so we can drive the `cacheAge` axis the
    // freshness gate consumes in isolation.
    const quote = makeQuote({ symbol, timestamp: Date.now() });
    cache.update(quote);
    const internal = (cache as unknown as { cache: Map<string, { cachedAt: number }> }).cache;
    const entry = internal.get(symbol);
    if (entry) entry.cachedAt = Date.now() - ageMs;
  }

  it('absent query → 200 (backwards-compatible, even for very old entries)', async () => {
    seedAged('AAPL', 90_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(200);
  });

  it('fresh entry within budget → 200 body identical to no-query path', async () => {
    seedAged('AAPL', 1_000);
    const a = await (await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=30000`)).json() as Record<string, unknown>;
    const b = await (await fetch(`${baseUrl}/quotes/AAPL`)).json() as Record<string, unknown>;
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
    expect(a.symbol).toBe(b.symbol);
    expect(a.bid).toBe(b.bid);
    expect(a.ask).toBe(b.ask);
  });

  it('stale entry → 503 stale-cache with full triplet + cacheAge + maxAgeMs', async () => {
    seedAged('AAPL', 90_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=30000`);
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('stale-cache');
    expect(body.symbol).toBe('AAPL');
    expect(body.configured).toBe(true);
    expect(typeof body.cacheAge).toBe('number');
    expect((body.cacheAge as number) >= 90_000).toBe(true);
    expect(body.maxAgeMs).toBe(30_000);
    expect(body.humanReason).toBe(
      ERROR_REASONS_PUBLIC['stale-cache']!.humanReason,
    );
    expect(body.severity).toBe('degraded');
    expect(body.nextStep).toBe(
      ERROR_REASONS_PUBLIC['stale-cache']!.nextStep,
    );
  });

  it('stale entry → Retry-After defaults to 15 when source is healthy', async () => {
    seedAged('AAPL', 90_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=30000`);
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('15');
  });

  it('invalid maxAgeMs (abc) → 400 invalid-max-age-ms with triplet + expected.pattern', async () => {
    // Gate runs strictly AFTER the entry-exists check (see §10 of
    // the acceptance criteria) — cache must hold an entry first.
    seedAged('AAPL', 1_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=abc`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
    expect(body.severity).toBe('info');
    const expected = body.expected as Record<string, unknown>;
    expect(expected.parameter).toBe('maxAgeMs');
    expect(expected.pattern).toBe(MAX_AGE_MS_REGEX.source);
  });

  it.each([['0'], ['-1'], ['1.5'], ['1e6'], ['030000'], [' 30000']])(
    'invalid maxAgeMs (%s) → 400',
    async (val) => {
      // Gate runs strictly AFTER the entry-exists check, so the
      // cache must hold an AAPL entry for the 400 branch to fire
      // (otherwise the 404 no-quote shadow wins). This is the
      // documented contract — see Acceptance criteria §10.
      seedAged('AAPL', 1_000);
      const res = await fetch(
        `${baseUrl}/quotes/AAPL?maxAgeMs=${encodeURIComponent(val)}`,
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('invalid-max-age-ms');
    },
  );

  it('huge maxAgeMs (99999999999, 11d) → clamps to 24h, returns 200 for fresh entry', async () => {
    // The regex caps the LEXICAL width at 11 digits; anything wider
    // is rejected as a 400 (separately tested). Within the lexical
    // bound, the parser silently clamps to MAX_MAX_AGE_MS so a
    // `?maxAgeMs=99999999999` effectively means "no gate" for any
    // entry under 24h old.
    seedAged('AAPL', 1_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=99999999999`);
    expect(res.status).toBe(200);
  });

  it('overflow beyond the regex (12+ digits) → 400 (lexical cap fires first)', async () => {
    seedAged('AAPL', 1_000);
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=999999999999`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-max-age-ms');
  });

  it('unconfigured symbol + maxAgeMs → existing 404 symbol-not-configured (gate skipped)', async () => {
    const res = await fetch(`${baseUrl}/quotes/NVDA?maxAgeMs=30000`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('symbol-not-configured');
  });

  it('configured-but-empty cache + maxAgeMs → existing 404 no-quote (gate skipped)', async () => {
    const res = await fetch(`${baseUrl}/quotes/MSFT?maxAgeMs=30000`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
  });

  it('invalid-symbol path still 400 (gate downstream of input validation)', async () => {
    seedAged('AAPL', 1_000);
    const res = await fetch(`${baseUrl}/quotes/!?maxAgeMs=30000`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
  });
});

describe('GET /quotes/:symbol?maxAgeMs= — dead-source Retry-After (task 0081)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 600_000 });
    // Seed with a fresh-timestamp quote so the risk filter accepts
    // it, then back-date `cachedAt` so `cacheAge` reads 90s without
    // the staleness gate firing on the quote payload itself.
    cache.update(makeQuote({ symbol: 'AAPL', timestamp: Date.now() }));
    const internal = (cache as unknown as {
      cache: Map<string, { cachedAt: number }>;
    }).cache;
    const entry = internal.get('AAPL');
    if (entry) entry.cachedAt = Date.now() - 90_000;
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => ({
        connected: false,
        reason: 'source-unavailable',
        detail: 'down',
        lastAttachAt: null,
      }),
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('dead source + stale cache → Retry-After mirrors src.retryAfterSeconds', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=30000`);
    expect(res.status).toBe(503);
    const retry = res.headers.get('retry-after');
    expect(retry).not.toBeNull();
    expect(Number(retry)).toBeGreaterThan(0);
  });
});

describe('/docs/source-reasons advertises the new error codes (task 0081)', () => {
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

  it('errorReasons catalog includes stale-cache and invalid-max-age-ms', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as {
      errorReasons: Record<string, unknown>;
    };
    expect(body.errorReasons['stale-cache']).toBeDefined();
    expect(body.errorReasons['invalid-max-age-ms']).toBeDefined();
  });
});
