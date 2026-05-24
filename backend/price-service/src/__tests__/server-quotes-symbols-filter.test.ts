import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';
import { MAX_REQUESTED_SYMBOLS } from '../symbols-query';

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

describe('GET /quotes?symbols= filter (task 0077)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT', 'NVDA'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'MSFT' }));
    cache.update(makeQuote({ symbol: 'NVDA' }));
  });

  it('?symbols=AAPL,MSFT returns only the requested subset', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,MSFT`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body.quotes as Record<string, unknown>);
    expect(keys.sort()).toEqual(['AAPL', 'MSFT']);
    expect(body.requestedCount).toBe(2);
    expect(body.matchedCount).toBe(2);
    expect(body.totalCached).toBe(3);
    expect(body.count).toBe(2); // count aliases matchedCount under filter
    expect('unmatched' in body).toBe(false);
    expect('invalidRequested' in body).toBe(false);
  });

  it('no query returns the full cache, byte-identical to today (no new optional fields)', async () => {
    const res = await fetch(`${baseUrl}/quotes`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body.quotes as Record<string, unknown>);
    expect(keys.sort()).toEqual(['AAPL', 'MSFT', 'NVDA']);
    expect(body.totalCached).toBe(3);
    expect(body.count).toBe(3);
    expect('requestedCount' in body).toBe(false);
    expect('matchedCount' in body).toBe(false);
    expect('unmatched' in body).toBe(false);
    expect('invalidRequested' in body).toBe(false);
    expect('cappedAt' in body).toBe(false);
  });

  it('case-insensitive: ?symbols=aapl,MSFT equals ?symbols=AAPL,MSFT', async () => {
    const a = await (await fetch(`${baseUrl}/quotes?symbols=aapl,MSFT`)).json() as Record<string, unknown>;
    const b = await (await fetch(`${baseUrl}/quotes?symbols=AAPL,MSFT`)).json() as Record<string, unknown>;
    expect(Object.keys(a.quotes as Record<string, unknown>).sort()).toEqual(
      Object.keys(b.quotes as Record<string, unknown>).sort(),
    );
    expect(a.requestedCount).toBe(b.requestedCount);
  });

  it('?symbols=AAPL,,MSFT collapses the empty token', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,,MSFT`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(2);
    expect(Object.keys(body.quotes as Record<string, unknown>).sort()).toEqual(['AAPL', 'MSFT']);
  });

  it('?symbols=AAPL,AAPL,MSFT dedupes: requestedCount === 2', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,AAPL,MSFT`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(2);
  });

  it('?symbols=AAPL,@@@,MSFT: invalid token surfaces in body.invalidRequested', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,@@@,MSFT`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(2);
    expect(body.invalidRequested).toEqual(['@@@']);
    expect(Object.keys(body.quotes as Record<string, unknown>).sort()).toEqual(['AAPL', 'MSFT']);
  });

  it('?symbols=AAPL,NVDA when only AAPL cached lists NVDA in body.unmatched', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,NVDA`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.matchedCount).toBe(1);
    expect(body.unmatched).toEqual(['NVDA']);
    expect(Object.keys(body.quotes as Record<string, unknown>)).toEqual(['AAPL']);
  });

  it('requestedCount and matchedCount are absent on the unfiltered path', async () => {
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect('requestedCount' in body).toBe(false);
    expect('matchedCount' in body).toBe(false);
  });

  it('hostile overflow input is capped and reported via cappedAt', async () => {
    const many = Array.from({ length: MAX_REQUESTED_SYMBOLS + 10 }, (_, i) => `SYM${i}`);
    const res = await fetch(`${baseUrl}/quotes?symbols=${many.join(',')}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestCap).toBe(MAX_REQUESTED_SYMBOLS);
  });

  it('responseShape at GET / mentions the new optional fields', async () => {
    const root = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const eps = root.endpoints as Array<Record<string, unknown>>;
    const quotes = eps.find((e) => e.path === '/quotes')!;
    expect(quotes.responseShape as string).toMatch(/requestedCount\?/);
    expect(quotes.responseShape as string).toMatch(/matchedCount\?/);
    // task 0091 compacted `unmatched?` + the two new partitions into
    // brace-expansion shorthand `unmatched{,Cold,Unconfigured}?`; the
    // word-boundary regex matches either the legacy `unmatched?` form
    // or the compact `unmatched{...}?` form so this assertion outlives
    // the catalog-string evolution.
    expect(quotes.responseShape as string).toMatch(/unmatched\b/);
    expect(quotes.responseShape as string).toMatch(/invalidRequested\b/);
  });

  it('quickstart includes a step demonstrating ?symbols=', async () => {
    const root = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = root.quickstart as Array<Record<string, unknown>>;
    const step = qs.find((s) => (s.request as string).includes('?symbols='));
    expect(step).toBeDefined();
    expect(step!.request as string).toMatch(/GET \/quotes\?symbols=/);
  });
});

describe('GET /quotes?symbols= filter — degraded source interplay (task 0077)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const app = createServer(
      cache,
      { symbols: ['AAPL', 'NVDA'] },
      undefined,
      () => srcState,
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('degraded + filtered request for uncached subset returns 503 with Retry-After', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes?symbols=NVDA`);
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBeTruthy();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.degraded).toBe(true);
    expect(typeof body.message).toBe('string');
    expect(body.matchedCount).toBe(0);
    expect(body.unmatched).toEqual(['NVDA']);
  });

  it('degraded + filtered request matching at least one cached entry returns 200', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,NVDA`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.matchedCount).toBe(1);
    expect(body.unmatched).toEqual(['NVDA']);
    expect(body.degraded).toBe(true);
    expect(body.stale).toBe(true);
  });
});
