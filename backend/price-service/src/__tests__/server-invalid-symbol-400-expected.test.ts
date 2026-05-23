import express from 'express';
import { createServer, ASCII_TICKER_RAW_SOURCE } from '../server';
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
 * The 400 invalid-symbol message used to advertise `/^[A-Z0-9._-]{1,16}$/`
 * — the POST-fold check that's actually unreachable from the public
 * surface. The real raw-input gate is `/^[A-Za-z0-9._-]{1,16}$/` (with
 * lowercase), and lowercase symbols are silently canonicalised via
 * `.toUpperCase()`. A consumer copy-pasting the displayed regex into
 * client-side validation would be STRICTER than the server. See task 0045.
 */
describe('/quotes/:symbol 400 invalid-symbol expected block (task 0045)', () => {
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

  const CANONICAL_PATTERN = '^[A-Za-z0-9._-]{1,16}$';

  it('shape branch (GET /quotes/!) → 400 with expected block whose pattern accepts lowercase', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
    expect(body.expected).toEqual({
      pattern: CANONICAL_PATTERN,
      minLength: 1,
      maxLength: 16,
      mustContainAlnum: true,
      canonicalisation: 'uppercase',
    });
  });

  it('shape branch message references the raw-input grammar with lowercase letters', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as Record<string, unknown>;
    const message = body.message as string;
    expect(message).toContain('[A-Za-z0-9._-]');
    expect(message.toLowerCase()).toContain('case-insensitive');
  });

  it('no-alnum branch (GET /quotes/...) → 400 with same expected block', async () => {
    const res = await fetch(`${baseUrl}/quotes/...`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
    expect((body.message as string).toLowerCase()).toMatch(/letter or digit/);
    expect(body.expected).toEqual({
      pattern: CANONICAL_PATTERN,
      minLength: 1,
      maxLength: 16,
      mustContainAlnum: true,
      canonicalisation: 'uppercase',
    });
  });

  it('expected.pattern fed back through new RegExp accepts lowercase input', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as { expected: { pattern: string } };
    expect(new RegExp(body.expected.pattern).test('aapl')).toBe(true);
    expect(new RegExp(body.expected.pattern).test('AAPL')).toBe(true);
    expect(new RegExp(body.expected.pattern).test('BRK.B')).toBe(true);
    expect(new RegExp(body.expected.pattern).test('!')).toBe(false);
    expect(new RegExp(body.expected.pattern).test('')).toBe(false);
  });

  it('drift guard: expected.pattern stays in sync with the exported source constant', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as { expected: { pattern: string } };
    // Constructing the same anchored regex from the exported source must
    // equal the wire pattern bit-for-bit.
    expect(body.expected.pattern).toBe(`^${ASCII_TICKER_RAW_SOURCE}$`);
  });

  it('regression: lowercase /quotes/aapl still canonicalises to AAPL and returns 404 no-quote', async () => {
    const res = await fetch(`${baseUrl}/quotes/aapl`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
  });

  it('regression: uppercase /quotes/AAPL still returns 404 no-quote (unchanged body)', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
  });

  it('regression: 400 envelope still ends with timestamp, timestampIso (envelope-order invariant from task 0041)', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('envelope ordering: expected sits after message and before path', async () => {
    const res = await fetch(`${baseUrl}/quotes/!`);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys.indexOf('message')).toBeLessThan(keys.indexOf('expected'));
    expect(keys.indexOf('expected')).toBeLessThan(keys.indexOf('path'));
  });
});
