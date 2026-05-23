import express from 'express';
import { createServer, normalizeSymbol } from '../server';
import { QuoteCache } from '../quote-cache';

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

describe('normalizeSymbol — reject non-alphanumeric-only inputs (task 0036)', () => {
  const NO_ALNUM: readonly string[] = [
    '................',
    '----------------',
    '________________',
    '.-_',
    '...',
    '---',
    '_._',
  ];

  for (const s of NO_ALNUM) {
    test(`normalizeSymbol(${JSON.stringify(s)}) → {ok:false, reason:'no-alnum'}`, () => {
      const r = normalizeSymbol(s);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('no-alnum');
    });
  }

  const HAS_ALNUM_VALID: readonly string[] = [
    'A',
    '1',
    '.A',
    'A.',
    'A-',
    '-A',
    'AAPL',
    'aapl',
    'BRK.B',
    'BTC-USD',
    'BTC_USD',
    'AAAAAAAAAAAAAAAA',
  ];

  for (const s of HAS_ALNUM_VALID) {
    test(`normalizeSymbol(${JSON.stringify(s)}) → {ok:true} (alnum present)`, () => {
      const r = normalizeSymbol(s);
      expect(r.ok).toBe(true);
    });
  }

  test('shape failure (non-ASCII) returns reason: "shape"', () => {
    const r = normalizeSymbol('ß');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('shape');
  });

  test('shape failure (length > 16) returns reason: "shape"', () => {
    const r = normalizeSymbol('AAAAAAAAAAAAAAAAA');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('shape');
  });

  test('shape failure (empty string) returns reason: "shape"', () => {
    const r = normalizeSymbol('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('shape');
  });
});

describe('GET /quotes/<non-alnum> returns 400 with "letter or digit" (task 0036)', () => {
  let app: express.Express;
  let server: import('http').Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = createServer(new QuoteCache({ cacheTtlMs: 30_000 }), { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  it('GET /quotes/................ → 400 with "letter or digit" message', async () => {
    const r = await fetch(`${baseUrl}/quotes/................`);
    expect(r.status).toBe(400);
    const body = (await r.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
    expect((body.message as string).toLowerCase()).toMatch(/letter or digit/);
    expect(body.source).toBeUndefined();
  });

  it('GET /quotes/---------------- → 400', async () => {
    const r = await fetch(`${baseUrl}/quotes/----------------`);
    expect(r.status).toBe(400);
    const body = (await r.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
    expect((body.message as string).toLowerCase()).toMatch(/letter or digit/);
  });

  it('GET /quotes/________________ → 400', async () => {
    const r = await fetch(`${baseUrl}/quotes/________________`);
    expect(r.status).toBe(400);
    const body = (await r.json()) as Record<string, unknown>;
    expect((body.message as string).toLowerCase()).toMatch(/letter or digit/);
  });

  it('GET /quotes/.-_ → 400', async () => {
    const r = await fetch(`${baseUrl}/quotes/.-_`);
    expect(r.status).toBe(400);
    const body = (await r.json()) as Record<string, unknown>;
    expect((body.message as string).toLowerCase()).toMatch(/letter or digit/);
  });

  it('GET /quotes/.AAPL → NOT 400; falls through to 404 symbol-not-configured', async () => {
    const r = await fetch(`${baseUrl}/quotes/.AAPL`);
    expect(r.status).not.toBe(400);
    expect(r.status).toBe(404);
    const body = (await r.json()) as Record<string, unknown>;
    expect(body.error).toBe('symbol-not-configured');
  });

  it('GET /quotes/A (single letter) → NOT 400', async () => {
    const r = await fetch(`${baseUrl}/quotes/A`);
    expect(r.status).not.toBe(400);
  });

  it('GET /quotes/1 (single digit) → NOT 400', async () => {
    const r = await fetch(`${baseUrl}/quotes/1`);
    expect(r.status).not.toBe(400);
  });

  it('GET /quotes/AAPL still resolves to existing handler (200 or 404, never 400)', async () => {
    const r = await fetch(`${baseUrl}/quotes/AAPL`);
    expect(r.status).not.toBe(400);
  });

  it('GET /quotes/BRK.B (alnum + dot) unchanged', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app2 = createServer(cache, { symbols: ['BRK.B'] });
    const { server: s2, baseUrl: b2 } = await listen(app2);
    try {
      const r = await fetch(`${b2}/quotes/BRK.B`);
      expect(r.status).not.toBe(400);
    } finally {
      await close(s2);
    }
  });

  it('GET /quotes/fresh still routes to didYouMean 400 (route name has alnum)', async () => {
    const r = await fetch(`${baseUrl}/quotes/fresh`);
    expect(r.status).toBe(400);
    const body = (await r.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol-or-path');
    expect(body.didYouMean).toBe('/quotes/fresh/all');
  });
});
