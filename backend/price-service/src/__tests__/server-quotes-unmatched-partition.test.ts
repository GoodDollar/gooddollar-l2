import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';
import { ERROR_REASONS_PUBLIC } from '../source-status';
import { NormalizedQuote, computeSpread } from '../types';

/**
 * Task 0091 — `GET /quotes?symbols=` partitions `body.unmatched` into
 * `unmatchedCold` (configured but cache cold — retryable) and
 * `unmatchedUnconfigured` (not in `ORACLE_SYMBOLS` — terminal) so a
 * caller can pick a different retry strategy per bucket without
 * making N round trips to `/quotes/:symbol`.
 *
 * `unmatched` stays for one deprecation window as the union, with a
 * `body.deprecations.unmatched` rename pointer. The drift-gate test
 * pins SET equality between the union and the concatenation of the
 * partitions so a future refactor cannot quietly diverge them.
 */

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

describe('GET /quotes?symbols= partitions unmatched (task 0091)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'MSFT'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    cache.clear();
  });

  it('mixed: cold (configured) + unconfigured → both partitions populated', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,FAKETICKER,MSFT`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.matchedCount).toBe(0);
    expect(body.unmatched).toEqual(['AAPL', 'MSFT', 'FAKETICKER']);
    expect(body.unmatchedCold).toEqual(['AAPL', 'MSFT']);
    expect(body.unmatchedUnconfigured).toEqual(['FAKETICKER']);
    expect(body.unmatchedUnconfiguredSeverity).toBe('critical');
    const deprecations = body.deprecations as Record<string, string>;
    expect(deprecations.unmatched).toMatch(/unmatchedCold/);
    expect(deprecations.unmatched).toMatch(/unmatchedUnconfigured/);
  });

  it('cold-only: configured but cache empty → unmatchedCold populated, unmatchedUnconfigured ABSENT', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,MSFT`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.unmatched).toEqual(['AAPL', 'MSFT']);
    expect(body.unmatchedCold).toEqual(['AAPL', 'MSFT']);
    expect('unmatchedUnconfigured' in body).toBe(false);
    expect('unmatchedUnconfiguredSeverity' in body).toBe(false);
  });

  it('unconfigured-only: not in ORACLE_SYMBOLS → unmatchedUnconfigured + critical severity, unmatchedCold ABSENT', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=FAKETICKER,BADTICKER`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.unmatched).toEqual(['FAKETICKER', 'BADTICKER']);
    expect('unmatchedCold' in body).toBe(false);
    expect(body.unmatchedUnconfigured).toEqual(['FAKETICKER', 'BADTICKER']);
    expect(body.unmatchedUnconfiguredSeverity).toBe('critical');
  });

  it('all-matched: configured + cached → no unmatched* fields appear at all', async () => {
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.matchedCount).toBe(1);
    expect('unmatched' in body).toBe(false);
    expect('unmatchedCold' in body).toBe(false);
    expect('unmatchedUnconfigured' in body).toBe(false);
    expect('unmatchedUnconfiguredSeverity' in body).toBe(false);
    const deprecations = body.deprecations as Record<string, string>;
    expect('unmatched' in deprecations).toBe(false);
  });

  it('unfiltered: GET /quotes (no ?symbols=) → no unmatched* fields and no unmatched deprecation pointer', async () => {
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect('unmatched' in body).toBe(false);
    expect('unmatchedCold' in body).toBe(false);
    expect('unmatchedUnconfigured' in body).toBe(false);
    expect('unmatchedUnconfiguredSeverity' in body).toBe(false);
    const deprecations = body.deprecations as Record<string, string>;
    expect('unmatched' in deprecations).toBe(false);
  });

  it('drift gate: SET(unmatched) === SET(unmatchedCold ∪ unmatchedUnconfigured)', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=AAPL,FAKETICKER,MSFT,BADTICKER`);
    const body = (await res.json()) as Record<string, unknown>;
    const union = new Set(body.unmatched as string[]);
    const partitionUnion = new Set([
      ...(body.unmatchedCold as string[]),
      ...(body.unmatchedUnconfigured as string[]),
    ]);
    expect(union.size).toBe(partitionUnion.size);
    for (const symbol of union) {
      expect(partitionUnion.has(symbol)).toBe(true);
    }
  });

  it('severity-source drift gate: emitted severity matches ERROR_REASONS_PUBLIC[symbol-not-configured].severity', async () => {
    const res = await fetch(`${baseUrl}/quotes?symbols=FAKETICKER`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.unmatchedUnconfiguredSeverity).toBe(
      ERROR_REASONS_PUBLIC['symbol-not-configured']!.severity,
    );
  });

  it('catalog responseShape advertises the new partition fields', () => {
    const entry = ENDPOINT_CATALOG.find((e) => e.path === '/quotes');
    expect(entry).toBeDefined();
    expect(entry!.responseShape).toMatch(/Cold/);
    expect(entry!.responseShape).toMatch(/Unconfigured/);
    expect(entry!.responseShape.length).toBeLessThanOrEqual(240);
  });
});
