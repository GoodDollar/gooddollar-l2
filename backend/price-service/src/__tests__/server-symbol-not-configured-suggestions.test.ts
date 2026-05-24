import express from 'express';
import {
  createServer,
  ENDPOINT_CATALOG,
  nearestSymbol,
} from '../server';
import { QuoteCache } from '../quote-cache';

const ORACLE_SYMBOLS = [
  'AAPL',
  'TSLA',
  'NVDA',
  'MSFT',
  'META',
  'AMZN',
  'GOOGL',
  'SPY',
  'QQQ',
  'AMD',
] as const;

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

describe('nearestSymbol — Levenshtein near-miss helper', () => {
  it('single-char insertion typo (APPL → AAPL)', () => {
    expect(nearestSymbol('APPL', ORACLE_SYMBOLS)).toBe('AAPL');
  });

  it('single-char deletion typo (APL → AAPL)', () => {
    expect(nearestSymbol('APL', ORACLE_SYMBOLS)).toBe('AAPL');
  });

  it('single-char substitution typo (MSFR → MSFT)', () => {
    expect(nearestSymbol('MSFR', ORACLE_SYMBOLS)).toBe('MSFT');
  });

  it('insertion typo (TSLLA → TSLA)', () => {
    expect(nearestSymbol('TSLLA', ORACLE_SYMBOLS)).toBe('TSLA');
  });

  it('substitution + insertion at the end (NVDIA → NVDA)', () => {
    expect(nearestSymbol('NVDIA', ORACLE_SYMBOLS)).toBe('NVDA');
  });

  it('cousin ticker (GOOG → GOOGL) at distance 1', () => {
    expect(nearestSymbol('GOOG', ORACLE_SYMBOLS)).toBe('GOOGL');
  });

  it('no suggestion for far-from-anything input (XYZZY)', () => {
    expect(nearestSymbol('XYZZY', ORACLE_SYMBOLS)).toBeUndefined();
  });

  it('no suggestion for repeated-char garbage (AAAAAA)', () => {
    expect(nearestSymbol('AAAAAA', ORACLE_SYMBOLS)).toBeUndefined();
  });

  it('exact match returns the input (distance 0)', () => {
    expect(nearestSymbol('AAPL', ORACLE_SYMBOLS)).toBe('AAPL');
  });

  it('returns undefined (not null, not "") on no match', () => {
    const result = nearestSymbol('ZZZZZ', ORACLE_SYMBOLS);
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty symbols list', () => {
    expect(nearestSymbol('AAPL', [])).toBeUndefined();
  });
});

describe('REST Server — /quotes/:symbol 404 symbol-not-configured suggestions', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: [...ORACLE_SYMBOLS] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  async function get404Body(symbol: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${baseUrl}/quotes/${symbol}`);
    expect(res.status).toBe(404);
    return (await res.json()) as Record<string, unknown>;
  }

  it('APPL → didYouMean: AAPL (single-char insertion)', async () => {
    const body = await get404Body('APPL');
    expect(body.error).toBe('symbol-not-configured');
    expect(body.didYouMean).toBe('AAPL');
  });

  it('APLE → didYouMean: AAPL (substitution + insertion)', async () => {
    const body = await get404Body('APLE');
    expect(body.error).toBe('symbol-not-configured');
    expect(body.didYouMean).toBe('AAPL');
  });

  it('TSLLA → didYouMean: TSLA', async () => {
    const body = await get404Body('TSLLA');
    expect(body.didYouMean).toBe('TSLA');
  });

  it('NVDIA → didYouMean: NVDA', async () => {
    const body = await get404Body('NVDIA');
    expect(body.didYouMean).toBe('NVDA');
  });

  it('GOOG → didYouMean: GOOGL (cousin ticker)', async () => {
    const body = await get404Body('GOOG');
    expect(body.didYouMean).toBe('GOOGL');
  });

  it('XYZZY → didYouMean field omitted (no near match)', async () => {
    const body = await get404Body('XYZZY');
    expect(body.error).toBe('symbol-not-configured');
    expect('didYouMean' in body).toBe(false);
  });

  it('AAAAAA → didYouMean field omitted', async () => {
    const body = await get404Body('AAAAAA');
    expect(body.error).toBe('symbol-not-configured');
    expect('didYouMean' in body).toBe(false);
  });

  it('symbol-not-configured 404 carries configuredSymbols array', async () => {
    const body = await get404Body('APPL');
    expect(body.configuredSymbols).toEqual([...ORACLE_SYMBOLS]);
  });

  it('symbol-not-configured 404 carries configuredSymbolCount number', async () => {
    const body = await get404Body('APPL');
    expect(body.configuredSymbolCount).toBe(ORACLE_SYMBOLS.length);
  });

  it('legacy configured:false bool still emitted for back-compat', async () => {
    const body = await get404Body('APPL');
    expect(body.configured).toBe(false);
  });

  it('still ships timestamp + timestampIso last on this branch', async () => {
    const body = await get404Body('APPL');
    expect(typeof body.timestamp).toBe('number');
    expect(typeof body.timestampIso).toBe('string');
  });

  it('no-quote 404 (configured but uncached) does NOT carry didYouMean', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
    expect('didYouMean' in body).toBe(false);
    expect('configuredSymbols' in body).toBe(false);
    expect('configuredSymbolCount' in body).toBe(false);
  });

  it('responseShape for /quotes/:symbol documents the new fields', () => {
    const entry = ENDPOINT_CATALOG.find((e) => e.path === '/quotes/:symbol');
    expect(entry).toBeDefined();
    expect(entry!.responseShape).toMatch(/configuredSymbols/);
    expect(entry!.responseShape).toMatch(/configuredSymbolCount|\(\+Count\)/);
    expect(entry!.responseShape.length).toBeLessThanOrEqual(240);
  });
});
