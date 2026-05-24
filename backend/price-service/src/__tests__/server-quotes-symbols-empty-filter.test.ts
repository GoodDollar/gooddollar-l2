import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';

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
 * Task 0088: `?symbols=`, `?symbols=   `, and `?symbols=,,,` no longer
 * silently fall through to the unfiltered cache dump — they now ship
 * `filterDiscarded: 'symbols-query-empty'` plus requestedCount/
 * matchedCount/quotes-empty signals so a client that built
 * `?symbols=${arr.join(',')}` from an empty array can detect the
 * no-op. The truly-absent case (`/quotes` with no query) stays
 * byte-identical.
 */
describe('/quotes?symbols= empty-filter sentinel (task 0088)', () => {
  let cache: QuoteCache;
  let server: import('http').Server;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  beforeEach(() => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'MSFT' }));
  });

  it('GET /quotes (no query) is byte-identical to today — no filter fields', async () => {
    const body = (await (await fetch(`${baseUrl}/quotes`)).json()) as Record<
      string,
      unknown
    >;
    expect('requestedCount' in body).toBe(false);
    expect('matchedCount' in body).toBe(false);
    expect('filterDiscarded' in body).toBe(false);
    expect(body.totalCached).toBe(2);
    expect(body.count).toBe(2);
    const quotes = body.quotes as Record<string, unknown>;
    expect(Object.keys(quotes).sort()).toEqual(['AAPL', 'MSFT']);
  });

  it('GET /quotes?symbols= ships filterDiscarded sentinel + zero counts + empty quotes', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.filterDiscarded).toBe('symbols-query-empty');
    expect(body.requestedCount).toBe(0);
    expect(body.matchedCount).toBe(0);
    expect(body.quotes).toEqual({});
    // unmatched / invalidRequested are absent on the empty-filter
    // branch — nothing to surface.
    expect('unmatched' in body).toBe(false);
    expect('invalidRequested' in body).toBe(false);
  });

  it('GET /quotes?symbols=   (whitespace) behaves identically to ?symbols=', async () => {
    const a = (await (await fetch(`${baseUrl}/quotes?symbols=`)).json()) as Record<string, unknown>;
    const b = (await (
      await fetch(`${baseUrl}/quotes?symbols=%20%20%20`)
    ).json()) as Record<string, unknown>;
    expect(b.filterDiscarded).toBe(a.filterDiscarded);
    expect(b.requestedCount).toBe(a.requestedCount);
    expect(b.matchedCount).toBe(a.matchedCount);
    expect(b.quotes).toEqual(a.quotes);
  });

  it('GET /quotes?symbols=,,, behaves identically to ?symbols=', async () => {
    const a = (await (await fetch(`${baseUrl}/quotes?symbols=`)).json()) as Record<string, unknown>;
    const b = (await (
      await fetch(`${baseUrl}/quotes?symbols=,,,`)
    ).json()) as Record<string, unknown>;
    expect(b.filterDiscarded).toBe(a.filterDiscarded);
    expect(b.requestedCount).toBe(a.requestedCount);
    expect(b.matchedCount).toBe(a.matchedCount);
    expect(b.quotes).toEqual(a.quotes);
  });

  it('GET /quotes?symbols=AAPL keeps the existing filtered-path body, no filterDiscarded', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(1);
    expect(body.matchedCount).toBe(1);
    expect('filterDiscarded' in body).toBe(false);
    const quotes = body.quotes as Record<string, unknown>;
    expect(Object.keys(quotes)).toEqual(['AAPL']);
  });

  it('GET /quotes?symbols=@@@ keeps the existing invalid-only body, no filterDiscarded', async () => {
    // Invalid tokens are a DIFFERENT verdict than empty — the filter
    // was syntactically present and parsed; tokens just failed the
    // normalize gate.
    const res = await fetch(`${baseUrl}/quotes?symbols=@@@`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(0);
    expect(body.matchedCount).toBe(0);
    expect(body.invalidRequested).toEqual(['@@@']);
    expect('filterDiscarded' in body).toBe(false);
  });

  it('deprecation pointer flips back to totalCached for the empty-filter case', async () => {
    const body = (await (
      await fetch(`${baseUrl}/quotes?symbols=`)
    ).json()) as Record<string, unknown>;
    const dep = body.deprecations as Record<string, string>;
    // Present-but-empty is NOT a real filter, so the deprecation
    // pointer rides the unfiltered-path text (`totalCached`), NOT
    // the filtered-path text (`matchedCount`).
    expect(dep.count).toMatch(/totalCached/);
    expect(dep.count).not.toMatch(/matchedCount/);
  });

  it('catalog responseShape advertises filterDiscarded?', () => {
    const e = ENDPOINT_CATALOG.find((x) => x.path === '/quotes');
    expect(e).toBeDefined();
    expect(e!.responseShape).toMatch(/filterDiscarded\?/);
    expect(e!.responseShape.length).toBeLessThanOrEqual(240);
  });

  it('four-state drift gate: absent / empty / valid / invalid produce four distinguishable shapes', async () => {
    const absent = (await (await fetch(`${baseUrl}/quotes`)).json()) as Record<string, unknown>;
    const empty = (await (await fetch(`${baseUrl}/quotes?symbols=`)).json()) as Record<string, unknown>;
    const valid = (await (
      await fetch(`${baseUrl}/quotes?symbols=AAPL`)
    ).json()) as Record<string, unknown>;
    const invalid = (await (
      await fetch(`${baseUrl}/quotes?symbols=@@@`)
    ).json()) as Record<string, unknown>;

    const shape = (b: Record<string, unknown>) => ({
      requestedCount: 'requestedCount' in b,
      filterDiscarded: 'filterDiscarded' in b,
      invalidRequested: 'invalidRequested' in b,
    });
    expect(shape(absent)).toEqual({
      requestedCount: false,
      filterDiscarded: false,
      invalidRequested: false,
    });
    expect(shape(empty)).toEqual({
      requestedCount: true,
      filterDiscarded: true,
      invalidRequested: false,
    });
    expect(shape(valid)).toEqual({
      requestedCount: true,
      filterDiscarded: false,
      invalidRequested: false,
    });
    expect(shape(invalid)).toEqual({
      requestedCount: true,
      filterDiscarded: false,
      invalidRequested: true,
    });
  });
});
