import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';
import { MAX_INVALID_REPORTED } from '../symbols-query';

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

/**
 * task 0090 — `body.invalidRequested[]` MUST dedupe (verbatim-token
 * key, case-preserved) and clip at `MAX_INVALID_REPORTED=50` so a
 * hostile `?symbols=@@@1,...,@@@200` cannot inflate the response body
 * with 200 echoed tokens (~2.5 KB amplification). Pre-cap counter
 * `invalidRequestedTotal` and breach flag `invalidCap` ride alongside
 * so an operator polling for malformed-watchlist floods sees the
 * volume without paying the wire cost.
 *
 * The asymmetric dedupe key (verbatim-token, NOT canonical) is
 * deliberate: invalid tokens have no canonical form, and a
 * case-sensitive watchlist UI surfaces `Bad#` and `bad#` as two
 * distinct typos.
 */
describe('GET /quotes?symbols= invalid dedupe + cap (task 0090)', () => {
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

  it('?symbols=@@@,@@@,@@@ → invalidRequested deduped to one entry + total=1', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=@@@,@@@,@@@`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.invalidRequested).toEqual(['@@@']);
    expect(body.invalidRequestedTotal).toBe(1);
    expect('invalidCap' in body).toBe(false);
  });

  it('?symbols=Bad#,bad#,BAD# → invalidRequested keeps all three (case-preserved dedupe)', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=Bad%23,bad%23,BAD%23`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.invalidRequested).toEqual(['Bad#', 'bad#', 'BAD#']);
    expect(body.invalidRequestedTotal).toBe(3);
    expect('invalidCap' in body).toBe(false);
  });

  it('mass-invalid flood: 60 distinct invalids → echo clipped to 50, total=60, invalidCap=50', async () => {
    const tokens = Array.from({ length: 60 }, (_, i) => `bad%23${i}`).join(',');
    const res = await fetch(`${baseUrl}/quotes?symbols=${tokens}`);
    const body = (await res.json()) as Record<string, unknown>;
    const echoed = body.invalidRequested as string[];
    expect(echoed).toHaveLength(MAX_INVALID_REPORTED);
    expect(body.invalidRequestedTotal).toBe(60);
    expect(body.invalidCap).toBe(MAX_INVALID_REPORTED);
    expect(echoed[0]).toBe('bad#0');
    expect(echoed[MAX_INVALID_REPORTED - 1]).toBe(`bad#${MAX_INVALID_REPORTED - 1}`);
  });

  it('exactly-at-cap boundary: 50 distinct invalids → invalidCap field ABSENT', async () => {
    const tokens = Array.from(
      { length: MAX_INVALID_REPORTED },
      (_, i) => `bad%23${i}`,
    ).join(',');
    const res = await fetch(`${baseUrl}/quotes?symbols=${tokens}`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.invalidRequested).toHaveLength(MAX_INVALID_REPORTED);
    expect(body.invalidRequestedTotal).toBe(MAX_INVALID_REPORTED);
    expect('invalidCap' in body).toBe(false);
  });

  it('?symbols=AAPL (no invalids) → no invalidRequestedTotal, no invalidCap (back-compat)', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect('invalidRequested' in body).toBe(false);
    expect('invalidRequestedTotal' in body).toBe(false);
    expect('invalidCap' in body).toBe(false);
  });

  it('?symbols=AAPL,AAPL (dup valid only) → byte-identical to pre-0090 (no invalid fields)', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.requestedCount).toBe(1);
    expect('invalidRequested' in body).toBe(false);
    expect('invalidRequestedTotal' in body).toBe(false);
  });

  it('wire-cost guard: hostile 200-invalid flood serialises to <600 bytes for the invalidRequested slice', async () => {
    const tokens = Array.from({ length: 200 }, (_, i) => `bad%23${i}`).join(',');
    const res = await fetch(`${baseUrl}/quotes?symbols=${tokens}`);
    const body = (await res.json()) as Record<string, unknown>;
    const wireBytes = JSON.stringify(body.invalidRequested).length;
    expect(wireBytes).toBeLessThan(600);
    expect(body.invalidRequestedTotal).toBe(200);
    expect(body.invalidCap).toBe(MAX_INVALID_REPORTED);
  });

  it('invalidRequestedTotal + invalidCap drift gate: fresh-all mirrors the /quotes envelope', async () => {
    const tokens = Array.from({ length: 60 }, (_, i) => `bad%23${i}`).join(',');
    const a = (await (await fetch(`${baseUrl}/quotes?symbols=${tokens}`)).json()) as Record<
      string,
      unknown
    >;
    const b = (await (
      await fetch(`${baseUrl}/quotes/fresh/all?symbols=${tokens}`)
    ).json()) as Record<string, unknown>;
    expect(b.invalidRequested).toEqual(a.invalidRequested);
    expect(b.invalidRequestedTotal).toBe(a.invalidRequestedTotal);
    expect(b.invalidCap).toBe(a.invalidCap);
  });
});
