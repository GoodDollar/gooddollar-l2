import express from 'express';
import {
  createServer,
  ASCII_TICKER_RAW_SOURCE,
  ASCII_TICKER_FULL_SOURCE,
  normalizeSymbol,
} from '../server';
import { QuoteCache } from '../quote-cache';

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
 * Drift guard for task 0047: the wire `expected.pattern` field must be a
 * single regex that reproduces `normalizeSymbol`'s gate bit-for-bit.
 * Task 0045 shipped only the SHAPE gate, so a frontend feeding the
 * pattern through `new RegExp(...)` accepted strings the server then
 * rejected on the alnum branch (`...`, `----------------`, `_._._.`).
 *
 * The fix encodes the alnum requirement inline as a positive lookahead
 * so a single regex test reproduces both gates. The legacy shape-only
 * pattern stays reachable as `expected.patternShape` for one release.
 */
describe('expected.pattern reproduces normalizeSymbol bit-for-bit (task 0047)', () => {
  const ACCEPT = ['AAPL', 'aapl', 'BRK.B', 'BTC-USD', 'A', '0', '1234'];
  const REJECT = [
    '...',
    '----------------',
    '_._._.',
    '..--__',
    '',
    'AAAAAAAAAAAAAAAAA',
    'A B',
    'AA%PL',
    'AA/PL',
    'ß',
  ];

  test.each(ACCEPT)('combined regex accepts %j (server accepts)', (s) => {
    expect(new RegExp(ASCII_TICKER_FULL_SOURCE).test(s)).toBe(true);
    expect(normalizeSymbol(s).ok).toBe(true);
  });

  test.each(REJECT)('combined regex rejects %j (server rejects)', (s) => {
    expect(new RegExp(ASCII_TICKER_FULL_SOURCE).test(s)).toBe(false);
    expect(normalizeSymbol(s).ok).toBe(false);
  });

  test('combined source is built from the shape source plus an alnum lookahead', () => {
    expect(ASCII_TICKER_FULL_SOURCE).toBe(
      `^(?=.*[A-Za-z0-9])${ASCII_TICKER_RAW_SOURCE}$`,
    );
  });
});

describe('400 invalid-symbol envelope wires the combined pattern (task 0047)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('shape branch: expected.pattern is the combined regex; patternShape is the legacy shape-only source', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { expected: Record<string, unknown> };
    expect(body.expected.pattern).toBe(ASCII_TICKER_FULL_SOURCE);
    expect(body.expected.patternShape).toBe(`^${ASCII_TICKER_RAW_SOURCE}$`);
  });

  it('no-alnum branch: same expected block (single source of truth)', async () => {
    const res = await fetch(`${baseUrl}/quotes/...`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { expected: Record<string, unknown> };
    expect(body.expected.pattern).toBe(ASCII_TICKER_FULL_SOURCE);
    expect(body.expected.patternShape).toBe(`^${ASCII_TICKER_RAW_SOURCE}$`);
  });

  it('expected.pattern fed through new RegExp rejects punctuation-only inputs', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as { expected: { pattern: string } };
    const pattern = new RegExp(body.expected.pattern);
    expect(pattern.test('...')).toBe(false);
    expect(pattern.test('----------------')).toBe(false);
    expect(pattern.test('_._._.')).toBe(false);
    expect(pattern.test('..--__')).toBe(false);
  });

  it('expected.pattern fed through new RegExp still accepts real tickers', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as { expected: { pattern: string } };
    const pattern = new RegExp(body.expected.pattern);
    expect(pattern.test('aapl')).toBe(true);
    expect(pattern.test('AAPL')).toBe(true);
    expect(pattern.test('BRK.B')).toBe(true);
    expect(pattern.test('BTC-USD')).toBe(true);
  });

  it('deprecations entry names patternShape with rename + next-release language', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as {
      deprecations?: Record<string, string>;
    };
    expect(body.deprecations).toBeDefined();
    const note = body.deprecations?.['expected.patternShape'];
    expect(typeof note).toBe('string');
    expect(note).toMatch(/expected\.pattern/);
    expect(note?.toLowerCase()).toContain('next release');
  });

  it('flag fields unchanged from task 0045 contract', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as {
      expected: { mustContainAlnum: unknown; canonicalisation: unknown };
    };
    expect(body.expected.mustContainAlnum).toBe(true);
    expect(body.expected.canonicalisation).toBe('uppercase');
  });

  it('envelope-order invariant preserved: ends with timestamp, timestampIso (task 0041)', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('regression: lowercase /quotes/aapl still canonicalises to AAPL', async () => {
    const res = await fetch(`${baseUrl}/quotes/aapl`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
  });
});
