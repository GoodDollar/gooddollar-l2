import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';
import { MAX_MAX_AGE_MS } from '../max-age-query';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
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
  };
  return computeSpread(base);
}

async function listen(app: express.Express): Promise<{
  server: import('http').Server;
  baseUrl: string;
}> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(s: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => s.close(() => resolve()));
}

/**
 * Task 0087: /quotes/fresh/all now honours the same ?symbols= and
 * ?maxAgeMs= query knobs the sibling /quotes and /quotes/:symbol
 * endpoints already accept. Without a query, the body shape stays
 * byte-identical to the pre-change response (back-compat gate
 * covered by server-quotes-fresh-degraded + server-quotes-fresh-
 * count-deprecated). With a query, the same envelope overlays
 * (requestedCount, matchedCount, unmatched, invalidRequested,
 * requestCap, maxAgeMs) ride on the body — no new ad-hoc parser.
 */
describe('/quotes/fresh/all ?symbols= filter (task 0087)', () => {
  let cache: QuoteCache;
  let server: import('http').Server;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT', 'NVDA'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  beforeEach(() => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'MSFT' }));
    cache.update(makeQuote({ symbol: 'NVDA' }));
  });

  it('?symbols=AAPL,MSFT returns only the requested subset', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh/all?symbols=AAPL,MSFT`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const quotes = body.quotes as Array<{ symbol: string }>;
    expect(quotes.map((q) => q.symbol).sort()).toEqual(['AAPL', 'MSFT']);
    expect(body.requestedCount).toBe(2);
    expect(body.matchedCount).toBe(2);
    expect(body.freshCount).toBe(2);
    expect(body.count).toBe(2);
    expect('unmatched' in body).toBe(false);
    expect('invalidRequested' in body).toBe(false);
  });

  it('?symbols=AAPL,FAKE lists FAKE in unmatched', async () => {
    // FAKE is rejected by parseSymbolsQuery only if it fails the
    // alnum/shape gate; FAKE is a valid alnum string so it goes
    // into `requested` and then misses cache → unmatched.
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes/fresh/all?symbols=AAPL,FAKE`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.matchedCount).toBe(1);
    expect(body.unmatched).toEqual(['FAKE']);
    const quotes = body.quotes as Array<{ symbol: string }>;
    expect(quotes.map((q) => q.symbol)).toEqual(['AAPL']);
  });

  it('?symbols=AAPL,@@@ surfaces @@@ in invalidRequested and AAPL in quotes', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh/all?symbols=AAPL,@@@`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(1);
    expect(body.invalidRequested).toEqual(['@@@']);
    const quotes = body.quotes as Array<{ symbol: string }>;
    expect(quotes.map((q) => q.symbol)).toEqual(['AAPL']);
  });

  it('no query returns the full fresh array, byte-identical body shape', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh/all`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const quotes = body.quotes as Array<{ symbol: string }>;
    expect(quotes.map((q) => q.symbol).sort()).toEqual(['AAPL', 'MSFT', 'NVDA']);
    expect(body.freshCount).toBe(3);
    expect(body.count).toBe(3);
    // None of the filter-specific keys appear on the unfiltered path.
    expect('requestedCount' in body).toBe(false);
    expect('matchedCount' in body).toBe(false);
    expect('unmatched' in body).toBe(false);
    expect('invalidRequested' in body).toBe(false);
    expect('requestCap' in body).toBe(false);
    expect('maxAgeMs' in body).toBe(false);
  });

  it('deprecation pointer flips to matchedCount-rename when filter applied', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh/all?symbols=AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    const dep = body.deprecations as Record<string, string>;
    expect(dep.count).toMatch(/matchedCount/);
  });

  it('unfiltered path keeps freshCount-rename deprecation pointer', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh/all`);
    const body = (await res.json()) as Record<string, unknown>;
    const dep = body.deprecations as Record<string, string>;
    expect(dep.count).toMatch(/freshCount/);
  });
});

describe('/quotes/fresh/all ?maxAgeMs= gate (task 0087)', () => {
  it('?maxAgeMs=ABC returns 400 invalid-max-age-ms with full triplet', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const res = await fetch(`${baseUrl}/quotes/fresh/all?maxAgeMs=ABC`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe('invalid-max-age-ms');
      expect(typeof body.message).toBe('string');
      expect(typeof body.humanReason).toBe('string');
      expect(typeof body.severity).toBe('string');
      expect(typeof body.nextStep).toBe('string');
      const expected = body.expected as Record<string, unknown>;
      expect(expected.parameter).toBe('maxAgeMs');
      expect(expected.pattern).toBe('^[1-9][0-9]{0,10}$');
      expect(expected.example).toBe('30000');
      // No symbol field on the bulk variant (no single symbol in scope).
      expect('symbol' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('?maxAgeMs=10 drops entries older than 10ms and echoes body.maxAgeMs', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const res = await fetch(`${baseUrl}/quotes/fresh/all?maxAgeMs=10`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.maxAgeMs).toBe(10);
      const quotes = body.quotes as unknown[];
      expect(quotes).toHaveLength(0);
      expect(body.matchedCount).toBeUndefined();
    } finally {
      await close(server);
    }
  });

  it('?maxAgeMs=86400000 (1 day) keeps fresh entries; body.maxAgeMs echoed', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const res = await fetch(`${baseUrl}/quotes/fresh/all?maxAgeMs=86400000`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.maxAgeMs).toBe(86_400_000);
      const quotes = body.quotes as Array<{ symbol: string }>;
      expect(quotes.map((q) => q.symbol)).toEqual(['AAPL']);
    } finally {
      await close(server);
    }
  });

  it('?maxAgeMs=999999999999999 over-cap clamps to MAX_MAX_AGE_MS', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      // 15+ digits hits the regex cap (max 11 digits) → 400.
      const tooMany = await fetch(
        `${baseUrl}/quotes/fresh/all?maxAgeMs=999999999999999`,
      );
      expect(tooMany.status).toBe(400);
      // 11-digit overflow value clamps to MAX_MAX_AGE_MS.
      const res = await fetch(
        `${baseUrl}/quotes/fresh/all?maxAgeMs=99999999999`,
      );
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.maxAgeMs).toBe(MAX_MAX_AGE_MS);
    } finally {
      await close(server);
    }
  });

  it('?symbols=AAPL&maxAgeMs=30000 — both gates apply; both new fields ride', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'MSFT' }));
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT'] });
    const { server, baseUrl } = await listen(app);
    try {
      const res = await fetch(
        `${baseUrl}/quotes/fresh/all?symbols=AAPL&maxAgeMs=30000`,
      );
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.requestedCount).toBe(1);
      expect(body.matchedCount).toBe(1);
      expect(body.maxAgeMs).toBe(30000);
      const quotes = body.quotes as Array<{ symbol: string }>;
      expect(quotes.map((q) => q.symbol)).toEqual(['AAPL']);
    } finally {
      await close(server);
    }
  });
});

describe('/quotes/fresh/all invalid-max-age-ms drift gate (task 0087)', () => {
  it('the 400 envelope mirrors /quotes/:symbol minus the symbol field', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const a = await (
        await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=ABC`)
      ).json() as Record<string, unknown>;
      const b = await (
        await fetch(`${baseUrl}/quotes/fresh/all?maxAgeMs=ABC`)
      ).json() as Record<string, unknown>;
      // Drift gate: identical keyset modulo the documented difference
      // (per-symbol carries `symbol`; bulk drops it) and the per-request
      // bookkeeping fields (`requestId`, `timestamp*`, `path`).
      const dropPerRequest = (k: string) =>
        k !== 'requestId' && k !== 'timestamp' && k !== 'timestampIso' && k !== 'path';
      const keysA = Object.keys(a).filter(dropPerRequest).filter((k) => k !== 'symbol').sort();
      const keysB = Object.keys(b).filter(dropPerRequest).sort();
      expect(keysA).toEqual(keysB);
      expect(a.error).toBe(b.error);
      expect(a.message).toBe(b.message);
      expect(a.humanReason).toBe(b.humanReason);
      expect(a.severity).toBe(b.severity);
      expect(a.nextStep).toBe(b.nextStep);
      expect(a.expected).toEqual(b.expected);
    } finally {
      await close(server);
    }
  });
});

describe('/quotes/fresh/all degraded interplay with filter (task 0087)', () => {
  it('degraded + ?symbols=NVDA where NVDA absent from cache returns 503 with unmatched', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const srcGetter = (): SourceStatus => ({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const app = createServer(
      cache,
      { symbols: ['AAPL', 'NVDA'] },
      undefined,
      srcGetter,
    );
    const { server, baseUrl } = await listen(app);
    try {
      const res = await fetch(`${baseUrl}/quotes/fresh/all?symbols=NVDA`);
      expect(res.status).toBe(503);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.degraded).toBe(true);
      expect(body.matchedCount).toBe(0);
      expect(body.unmatched).toEqual(['NVDA']);
    } finally {
      await close(server);
    }
  });
});

describe('/quotes/fresh/all catalog row (task 0087)', () => {
  it('ENDPOINT_CATALOG advertises the new optional query/response fields', () => {
    const e = ENDPOINT_CATALOG.find((x) => x.path === '/quotes/fresh/all');
    expect(e).toBeDefined();
    expect(e!.responseShape).toMatch(/matchedCount\?/);
    expect(e!.responseShape).toMatch(/unmatched\?/);
    expect(e!.responseShape).toMatch(/invalidRequested\?/);
    expect(e!.responseShape).toMatch(/maxAgeMs\?/);
    expect(e!.responseShape).toMatch(/freshCount/);
    // task 0090 compresses `count(deprecated→freshCount)` to
    // `count(dep)` so the new `invalidRequestedTotal?` / `invalidCap?`
    // fields fit under the 240-char wire cap; accept either form here
    // (the runtime rename pointer lives on `body.deprecations.count`).
    expect(e!.responseShape).toMatch(/\(dep(?:recated)?/);
    expect(e!.responseShape.length).toBeLessThanOrEqual(240);
    expect(e!.summary).toMatch(/\?symbols=/);
    expect(e!.summary).toMatch(/\?maxAgeMs=/);
    expect(e!.summary.length).toBeLessThanOrEqual(140);
  });
});

describe('/quotes/fresh/all quickstart step (task 0087)', () => {
  it('discovery quickstart includes a paste-runnable fresh/all step with both query params', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const root = (await (await fetch(`${baseUrl}/`)).json()) as Record<
        string,
        unknown
      >;
      const qs = root.quickstart as Array<Record<string, unknown>>;
      const step = qs.find((s) =>
        (s.request as string).includes('/quotes/fresh/all?symbols='),
      );
      expect(step).toBeDefined();
      expect(step!.request as string).toMatch(
        /^GET \/quotes\/fresh\/all\?symbols=.*maxAgeMs=/,
      );
    } finally {
      await close(server);
    }
  });
});
