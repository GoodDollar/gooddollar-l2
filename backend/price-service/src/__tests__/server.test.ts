import http from 'http';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { DEFAULT_CONFIG, NormalizedQuote, IngestStats, SourceStatus, computeSpread } from '../types';
import express from 'express';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
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

describe('REST Server', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /health', () => {
    it('returns ok when empty cache', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(body.status).toBe('ok');
    });

    it('returns ok with fresh quotes', async () => {
      cache.update(makeQuote());
      const res = await fetch(`${baseUrl}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(body.freshQuotes).toBeGreaterThan(0);
    });

    it('includes symbols array matching cfg.symbols', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.symbols).toEqual(['AAPL', 'TSLA']);
      expect(body.configuredSymbols).toBe(2);
    });

    it('symbols and configuredSymbols stay in sync', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const body = (await res.json()) as { symbols: string[]; configuredSymbols: number };
      expect(body.symbols.length).toBe(body.configuredSymbols);
    });
  });

  describe('GET /quotes', () => {
    it('returns all quotes', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL' }));
      cache.update(makeQuote({ symbol: 'TSLA' }));
      const res = await fetch(`${baseUrl}/quotes`);
      const body = (await res.json()) as { quotes: Record<string, unknown> };
      expect(res.status).toBe(200);
      expect(body.quotes.AAPL).toBeDefined();
      expect(body.quotes.TSLA).toBeDefined();
    });

    it('includes spread and spreadPct on each quote', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL', bid: 100, ask: 100.5, mid: 100.25 }));
      const res = await fetch(`${baseUrl}/quotes`);
      const body = (await res.json()) as { quotes: Record<string, Record<string, number>> };
      expect(res.status).toBe(200);
      expect(body.quotes.AAPL.spread).toBeCloseTo(0.5, 6);
      expect(body.quotes.AAPL.spreadPct).toBeCloseTo((0.5 / 100.25) * 100, 6);
    });
  });

  describe('GET /quotes/:symbol', () => {
    it('returns specific quote', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL', last: 190 }));
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(body.symbol).toBe('AAPL');
      expect(body.last).toBe(190);
    });

    it('exposes spread and spreadPct fields', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL', bid: 100, ask: 100.5, mid: 100.25 }));
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      const body = (await res.json()) as Record<string, number>;
      expect(res.status).toBe(200);
      expect(body.spread).toBeCloseTo(0.5, 6);
      expect(body.spreadPct).toBeCloseTo((0.5 / 100.25) * 100, 6);
    });

    it('returns 404 for unknown symbol', async () => {
      const res = await fetch(`${baseUrl}/quotes/UNKNOWN`);
      expect(res.status).toBe(404);
    });

    it('normalizes symbol to uppercase', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL' }));
      const res = await fetch(`${baseUrl}/quotes/aapl`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /quotes/fresh/all', () => {
    it('returns only fresh quotes', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL' }));
      const res = await fetch(`${baseUrl}/quotes/fresh/all`);
      const body = (await res.json()) as { count: number; quotes: Array<{ symbol: string }> };
      expect(res.status).toBe(200);
      expect(body.count).toBe(1);
      expect(body.quotes[0].symbol).toBe('AAPL');
    });
  });

  describe('GET /status/quotes', () => {
    it('returns healthy status with fresh quotes', async () => {
      cache.clear();
      cache.update(makeQuote({ symbol: 'AAPL', sessionState: 'open', confidence: 92 }));
      cache.update(makeQuote({ symbol: 'TSLA', sessionState: 'pre-market', confidence: 75 }));
      const res = await fetch(`${baseUrl}/status/quotes`);
      const body = (await res.json()) as {
        healthy: boolean;
        freshCount: number;
        totalCount: number;
        quotes: Array<{ symbol: string; lastUpdateMs: number; sessionState: string; confidence: number }>;
        timestamp: number;
      };
      expect(res.status).toBe(200);
      expect(body.healthy).toBe(true);
      expect(body.freshCount).toBe(2);
      expect(body.totalCount).toBe(2);
      expect(body.quotes).toHaveLength(2);
      const aapl = body.quotes.find(q => q.symbol === 'AAPL');
      expect(aapl).toBeDefined();
      expect(aapl!.sessionState).toBe('open');
      expect(aapl!.confidence).toBe(92);
      expect(aapl!.lastUpdateMs).toBeGreaterThanOrEqual(0);
      expect(body.timestamp).toBeGreaterThan(0);
    });

    it('returns healthy when cache is empty', async () => {
      cache.clear();
      const res = await fetch(`${baseUrl}/status/quotes`);
      const body = (await res.json()) as { healthy: boolean; freshCount: number; totalCount: number };
      expect(res.status).toBe(200);
      expect(body.healthy).toBe(true);
      expect(body.freshCount).toBe(0);
      expect(body.totalCount).toBe(0);
    });

    it('includes CORS headers', async () => {
      const res = await fetch(`${baseUrl}/status/quotes`);
      expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});

describe('REST Server with stats getter', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let stats: IngestStats;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    stats = {
      ingested: 0,
      rejected: 0,
      byReason: {},
      firstAt: null,
      lastAt: null,
      writeErrors: 0,
    };
    app = createServer(cache, { symbols: ['AAPL', 'TSLA'] }, () => stats);
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /audit/stats', () => {
    it('returns empty stats shape when nothing ingested', async () => {
      const res = await fetch(`${baseUrl}/audit/stats`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(body.ingested).toBe(0);
      expect(body.rejected).toBe(0);
      expect(body.byReason).toEqual({});
      expect(body.acceptanceRatio).toBe(1);
      expect(body.firstAt).toBeNull();
      expect(body.lastAt).toBeNull();
      expect(body.timestamp).toBeGreaterThan(0);
    });

    it('reflects mutated stats from the getter', async () => {
      stats.ingested = 7;
      stats.rejected = 3;
      stats.byReason = { stale: 2, halted: 1 };
      stats.firstAt = 1700000000000;
      stats.lastAt = 1700000005000;
      stats.writeErrors = 0;

      const res = await fetch(`${baseUrl}/audit/stats`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(body.ingested).toBe(7);
      expect(body.rejected).toBe(3);
      expect(body.byReason).toEqual({ stale: 2, halted: 1 });
      expect(body.acceptanceRatio).toBeCloseTo(0.7, 6);
      expect(body.firstAt).toBe(1700000000000);
      expect(body.lastAt).toBe(1700000005000);
    });

    it('returns acceptanceRatio = 1 when only ingested with no rejects', async () => {
      stats.ingested = 5;
      stats.rejected = 0;
      stats.byReason = {};

      const res = await fetch(`${baseUrl}/audit/stats`);
      const body = (await res.json()) as Record<string, number>;
      expect(body.acceptanceRatio).toBe(1);
    });

    it('returns acceptanceRatio = 0 when only rejected', async () => {
      stats.ingested = 0;
      stats.rejected = 4;
      stats.byReason = { halted: 4 };

      const res = await fetch(`${baseUrl}/audit/stats`);
      const body = (await res.json()) as Record<string, number>;
      expect(body.acceptanceRatio).toBe(0);
    });

    it('exposes writeErrors counter', async () => {
      stats.writeErrors = 12;
      const res = await fetch(`${baseUrl}/audit/stats`);
      const body = (await res.json()) as Record<string, number>;
      expect(body.writeErrors).toBe(12);
    });
  });

  describe('GET /health with stats wired', () => {
    it('includes ingested, rejected, and acceptanceRatio', async () => {
      stats.ingested = 9;
      stats.rejected = 1;
      stats.byReason = { stale: 1 };

      const res = await fetch(`${baseUrl}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(body.ingested).toBe(9);
      expect(body.rejected).toBe(1);
      expect(body.acceptanceRatio).toBeCloseTo(0.9, 6);
    });
  });
});

describe('REST Server — error handling envelope', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('POST /quotes with malformed JSON returns 405 (no body parser, no parse attempt)', async () => {
    const res = await fetch(`${baseUrl}/quotes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
    expect(body.path).toBe('/quotes');
    expect(body.method).toBe('POST');
  });

  it('GET /health with json body is processed as a GET (body ignored)', async () => {
    const addr = (server.address() as import('net').AddressInfo);
    const malformed = '{not json';
    const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: addr.port,
          method: 'GET',
          path: '/health',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(malformed),
          },
        },
        (res) => {
          let buf = '';
          res.on('data', (chunk) => (buf += chunk));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: buf }));
        },
      );
      req.on('error', reject);
      req.write(malformed);
      req.end();
    });
    expect([200, 503]).toContain(result.status);
    const parsed = JSON.parse(result.body) as Record<string, unknown>;
    expect(parsed.error).not.toBe('malformed-json');
    expect(parsed.status === 'ok' || parsed.status === 'degraded').toBe(true);
  });

  it('route handler throw returns JSON 500 with literal "internal error"', async () => {
    // Drive the error handler through the production code path by making
    // a real cache method throw — no test-only routes leak into prod.
    const original = cache.getFresh.bind(cache);
    cache.getFresh = () => {
      throw new Error('boom: this should not reach the client');
    };
    try {
      const res = await fetch(`${baseUrl}/health`);
      const text = await res.text();
      const body = JSON.parse(text) as Record<string, unknown>;
      expect(res.status).toBe(500);
      expect(body.error).toBe('internal-error');
      expect(body.message).toBe('internal error');
      expect(text).not.toContain('boom');
      expect(text).not.toMatch(/\bat /);
      expect(text).not.toContain('node_modules');
    } finally {
      cache.getFresh = original;
    }
  });

  it('does not expose the X-Powered-By header', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});

describe('REST Server — 404 and 405 envelopes', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /unknown returns JSON 404 envelope (no HTML)', async () => {
    const res = await fetch(`${baseUrl}/this-does-not-exist`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type') || '').toMatch(/^application\/json/);
    expect(body.error).toBe('not-found');
    expect(body.path).toBe('/this-does-not-exist');
    expect(body.method).toBe('GET');
    expect(typeof body.timestamp).toBe('number');
    expect(text).not.toContain('<!DOCTYPE');
    expect(text).not.toContain('<html');
    expect(text).not.toContain('Cannot GET');
  });

  it('POST /quotes returns JSON 405 with Allow: GET, OPTIONS', async () => {
    const res = await fetch(`${baseUrl}/quotes`, { method: 'POST' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
    expect(body.path).toBe('/quotes');
    expect(body.method).toBe('POST');
    expect(typeof body.timestamp).toBe('number');
  });

  it('PUT /quotes/AAPL returns JSON 405 with Allow: GET, OPTIONS', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`, { method: 'PUT' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
    expect(body.path).toBe('/quotes/AAPL');
    expect(body.method).toBe('PUT');
  });

  it('DELETE /audit/stats returns JSON 405', async () => {
    const res = await fetch(`${baseUrl}/audit/stats`, { method: 'DELETE' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
  });

  it('GET /quotes// returns JSON 404 (not Express HTML default)', async () => {
    const res = await fetch(`${baseUrl}/quotes//`);
    const text = await res.text();
    expect(res.status).toBe(404);
    expect(text).not.toContain('Cannot GET');
    expect(text).not.toContain('<!DOCTYPE');
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
  });

  it('GET /quotes/.. (raw, unnormalized) returns JSON 404 with no HTML default', async () => {
    const addr = (server.address() as import('net').AddressInfo);
    const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = http.request(
        { host: '127.0.0.1', port: addr.port, method: 'GET', path: '/quotes/..' },
        (res) => {
          let buf = '';
          res.on('data', (chunk) => (buf += chunk));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: buf }));
        },
      );
      req.on('error', reject);
      req.end();
    });
    // Raw `/quotes/..` matches the parametric `/quotes/:symbol` route; the
    // symbol `..` passes the shape regex but is not in cfg.symbols, so the
    // response is a JSON 404 `symbol-not-configured` — no HTML default leaks.
    expect(result.status).toBe(404);
    expect(result.body).not.toContain('Cannot GET');
    expect(result.body).not.toContain('<!DOCTYPE');
    const body = JSON.parse(result.body) as Record<string, unknown>;
    expect(body.error).toBe('symbol-not-configured');
  });
});

describe('REST Server — GET /quotes/:symbol shape validation', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    // Configure every symbol whose *shape* this block exercises so the
    // regex acceptance is what's under test, not the membership check.
    app = createServer(cache, { symbols: ['AAPL', 'BRK.B', 'BTC-USD', 'BTC_USD'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('valid-shape miss returns bounded structured 404 no-quote envelope', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
    expect(typeof body.timestamp).toBe('number');
    // Bound stays small — the body holds a static message, the symbol,
    // configured flag, error code, and ms timestamp. No quote, no stack.
    expect(text.length).toBeLessThan(300);
  });

  it.each([
    ['BRK.B', 'BRK.B'],
    ['BTC-USD', 'BTC-USD'],
    ['BTC_USD', 'BTC_USD'],
  ])('accepts %s shape and returns no-quote 404', async (raw, expected) => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/${raw}`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe(expected);
  });

  it('rejects 5000-char symbol with bounded 400', async () => {
    const sym = 'A'.repeat(5000);
    const res = await fetch(`${baseUrl}/quotes/${sym}`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    // Bound is large enough to fit the reflected (truncated) path plus
    // the new timestampIso companion (~40 bytes). What matters is that
    // it does NOT scale with the 5000-char input.
    expect(text.length).toBeLessThan(260);
  });

  it('rejects NUL byte in symbol with no NUL in body', async () => {
    const res = await fetch(`${baseUrl}/quotes/AA%00PL`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    expect(text).not.toContain('\u0000');
    expect(text).not.toContain('\\u0000');
  });

  it('rejects emoji symbol', async () => {
    const res = await fetch(`${baseUrl}/quotes/${encodeURIComponent('💸PL')}`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
  });

  it('rejects script-tag-shaped symbol with no `<` or `>` in body', async () => {
    const res = await fetch(`${baseUrl}/quotes/${encodeURIComponent('<script>')}`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    expect(text).not.toContain('<');
    expect(text).not.toContain('>');
  });

  it('rejects 17-char symbol (one over the regex cap)', async () => {
    const res = await fetch(`${baseUrl}/quotes/${'A'.repeat(17)}`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
  });
});

describe('REST Server — /health and /status/quotes with source status wired', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => srcState,
    );
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('connected source + populated cache → 200 with source.connected=true', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(true);
    expect(src.symbols).toEqual(['AAPL']);
    expect(src.lastAttachAt).toBe(1700000000000);
  });

  it('disconnected source → 503 with source.connected=false and a single-line reason', async () => {
    cache.clear();
    srcState = {
      connected: false,
      reason: 'lost connection',
      lastAttachAt: null,
    };
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(503);
    expect(body.status).toBe('degraded');
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    expect(src.reason).toBe('lost connection');
    expect(src.lastAttachAt).toBeNull();
  });

  it('connected source + empty cache (warmup) → 200 status ok (not 503)', async () => {
    cache.clear();
    srcState = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('/status/quotes returns 503 + healthy:false when source dead and cache empty', async () => {
    cache.clear();
    srcState = { connected: false, reason: 'lost connection', lastAttachAt: null };
    const res = await fetch(`${baseUrl}/status/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(503);
    expect(body.healthy).toBe(false);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
  });

  it('/status/quotes returns 503 + healthy:false when source dead even with fresh quotes', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = { connected: false, reason: 'lost connection', lastAttachAt: null };
    const res = await fetch(`${baseUrl}/status/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(503);
    expect(body.healthy).toBe(false);
  });

  it('/status/quotes returns 200 + healthy:true when source connected with fresh quote', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const res = await fetch(`${baseUrl}/status/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.healthy).toBe(true);
  });

  it('/status/quotes returns 200 + healthy:true during warmup (source up, cache empty)', async () => {
    cache.clear();
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const res = await fetch(`${baseUrl}/status/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.healthy).toBe(true);
  });

  it('/status/quotes and /health agree on the degraded verdict for every input combo', async () => {
    type Combo = { src: SourceStatus; cacheFresh: boolean };
    const combos: Combo[] = [
      { src: { connected: true, symbols: ['AAPL'], lastAttachAt: 1 }, cacheFresh: true },
      { src: { connected: true, symbols: ['AAPL'], lastAttachAt: 1 }, cacheFresh: false },
      { src: { connected: false, reason: 'down', lastAttachAt: null }, cacheFresh: true },
      { src: { connected: false, reason: 'down', lastAttachAt: null }, cacheFresh: false },
    ];
    for (const combo of combos) {
      cache.clear();
      if (combo.cacheFresh) cache.update(makeQuote({ symbol: 'AAPL' }));
      srcState = combo.src;
      const [hRes, sRes] = await Promise.all([
        fetch(`${baseUrl}/health`),
        fetch(`${baseUrl}/status/quotes`),
      ]);
      const hBody = (await hRes.json()) as Record<string, unknown>;
      const sBody = (await sRes.json()) as Record<string, unknown>;
      expect(hRes.status).toBe(sRes.status);
      expect(hBody.status === 'ok').toBe(sBody.healthy === true);
    }
  });
});

describe('REST Server — source.reason redaction', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = {
      connected: false,
      reason:
        "Cannot find module '../../etoro-client/src/index'\n" +
        'Require stack:\n' +
        '- /home/goodclaw/proj/backend/price-service/dist/index.js',
      lastAttachAt: null,
    };
    app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => srcState,
    );
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('/health redacts a leaky multi-line reason', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    const reason = src.reason as string;
    expect(reason).not.toContain('\n');
    expect(reason).not.toMatch(/\/home\//);
    expect(reason).not.toContain('node_modules');
    expect(reason).not.toContain('Require stack');
    expect(reason).not.toMatch(/^at /m);
    expect(reason.length).toBeLessThan(120);
  });

  it('/status/quotes redacts a leaky multi-line reason', async () => {
    const res = await fetch(`${baseUrl}/status/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    const src = body.source as Record<string, unknown>;
    const reason = src.reason as string;
    expect(reason).not.toContain('\n');
    expect(reason).not.toMatch(/\/home\//);
    expect(reason).not.toContain('Require stack');
  });
});

describe('REST Server — CORS preflight', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const KNOWN_PATHS = [
    '/health',
    '/quotes',
    '/quotes/AAPL',
    '/quotes/fresh/all',
    '/audit/stats',
    '/status/quotes',
  ];

  it.each(KNOWN_PATHS)('OPTIONS %s returns 204 with full CORS allow headers', async (path) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toBe('Content-Type');
    expect(res.headers.get('access-control-max-age')).toBe('600');
    const text = await res.text();
    expect(text).toBe('');
  });

  it('OPTIONS to an unknown path returns 204 (preflight is not the discovery surface)', async () => {
    const res = await fetch(`${baseUrl}/this-does-not-exist`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });

  it('POST /quotes returns 405 with Allow header that includes OPTIONS', async () => {
    const res = await fetch(`${baseUrl}/quotes`, { method: 'POST' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
  });

  it('GET on a known path is unchanged after the preflight short-circuit', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe('ok');
  });
});

describe('REST Server — response shape unchanged when no source getter is wired', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('/health has no source field when no getter provided', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.source).toBeUndefined();
  });

  it('/status/quotes has no source field when no getter provided', async () => {
    const res = await fetch(`${baseUrl}/status/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.source).toBeUndefined();
  });

  it('/quotes has no source field when no getter provided', async () => {
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(Object.prototype.hasOwnProperty.call(body, 'source')).toBe(false);
  });

  it('/quotes/fresh/all has no source field when no getter provided', async () => {
    const res = await fetch(`${baseUrl}/quotes/fresh/all`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(Object.prototype.hasOwnProperty.call(body, 'source')).toBe(false);
  });

  it('/quotes/:symbol 200 keeps the legacy quote.source string when no getter provided', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    // Without a getter, the only `source` is the quote's hardcoded
    // `'etoro'` string — no upstream-status object is added.
    expect(body.source).toBe('etoro');
  });

  it('/quotes/:symbol 404 has no source field when no getter provided', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(Object.prototype.hasOwnProperty.call(body, 'source')).toBe(false);
  });
});

describe('REST Server — data endpoints carry source state when getter wired', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    app = createServer(
      cache,
      { symbols: ['AAPL', 'TSLA'] },
      undefined,
      () => srcState,
    );
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /quotes includes source.connected=false when getter reports disconnect', async () => {
    cache.clear();
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    expect(src.reason).toBe('etoro-client-not-installed');
    expect(src.lastAttachAt).toBeNull();
  });

  it('GET /quotes includes source.connected=true and symbols when source attached', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(true);
    expect(src.symbols).toEqual(['AAPL']);
    expect(src.lastAttachAt).toBe(1700000000000);
  });

  it('GET /quotes/fresh/all includes source.connected=true and symbols when source attached', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const res = await fetch(`${baseUrl}/quotes/fresh/all`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(true);
    expect(src.symbols).toEqual(['AAPL']);
  });

  it('GET /quotes/fresh/all includes source.connected=false when disconnected', async () => {
    cache.clear();
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    const res = await fetch(`${baseUrl}/quotes/fresh/all`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
  });

  it('GET /quotes/:symbol cached symbol returns 200 with source block', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL', last: 190 }));
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.symbol).toBe('AAPL');
    expect(body.last).toBe(190);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(true);
    expect(src.symbols).toEqual(['AAPL']);
  });

  it('GET /quotes/:symbol uncached symbol returns 404 with source block', async () => {
    cache.clear();
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    expect(src.reason).toBe('etoro-client-not-installed');
  });

  it('GET /quotes/:symbol redacts source.reason via sanitizeSourceStatus', async () => {
    cache.clear();
    srcState = {
      connected: false,
      reason:
        "Cannot find module '/home/x/y'\nRequire stack:\n- /home/x/z",
      lastAttachAt: null,
    };
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const text = await res.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(res.status).toBe(404);
    const src = body.source as Record<string, unknown>;
    const reason = src.reason as string;
    expect(reason).not.toContain('\n');
    expect(reason).not.toMatch(/\/home\//);
    expect(reason).not.toContain('Require stack');
  });

  it('GET /quotes redacts source.reason via sanitizeSourceStatus', async () => {
    cache.clear();
    srcState = {
      connected: false,
      reason: "Cannot find module '/home/x/y'\nRequire stack:\n- /home/x/z",
      lastAttachAt: null,
    };
    const res = await fetch(`${baseUrl}/quotes`);
    const body = (await res.json()) as Record<string, unknown>;
    const src = body.source as Record<string, unknown>;
    const reason = src.reason as string;
    expect(reason).not.toContain('\n');
    expect(reason).not.toMatch(/\/home\//);
  });

  it('GET /quotes/:symbol invalid-symbol 400 does NOT include source field', async () => {
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    const res = await fetch(`${baseUrl}/quotes/${'A'.repeat(17)}`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    expect(Object.prototype.hasOwnProperty.call(body, 'source')).toBe(false);
  });

  it('/quotes source matches /status/quotes source at the same instant', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL' }));
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const [qRes, sRes] = await Promise.all([
      fetch(`${baseUrl}/quotes`),
      fetch(`${baseUrl}/status/quotes`),
    ]);
    const qBody = (await qRes.json()) as Record<string, unknown>;
    const sBody = (await sRes.json()) as Record<string, unknown>;
    expect(qBody.source).toEqual(sBody.source);
  });
});

describe('REST Server — root index and 404 endpoint discovery', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const EXPECTED_PATHS = [
    '/',
    '/health',
    '/quotes',
    '/quotes/fresh/all',
    '/audit/stats',
    '/status/quotes',
    '/quotes/:symbol',
    '/docs/source-reasons',
  ];

  it('GET / returns 200 with service name and endpoint index', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type') || '').toMatch(/^application\/json/);
    expect(body.service).toBe('price-service');
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(typeof body.timestamp).toBe('number');
  });

  it('GET / endpoints list is derived from KNOWN_ROUTES + parametric (single source of truth)', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as {
      endpoints: Array<{ path: string; methods: string[] }>;
    };
    expect(res.status).toBe(200);
    const paths = body.endpoints.map((e) => e.path);
    expect(paths.sort()).toEqual([...EXPECTED_PATHS].sort());
    for (const ep of body.endpoints) {
      expect(typeof ep.path).toBe('string');
      expect(Array.isArray(ep.methods)).toBe(true);
      for (const m of ep.methods) expect(m).toBe('GET');
    }
    const health = body.endpoints.find((e) => e.path === '/health');
    expect(health).toBeDefined();
    expect(health!.methods).toEqual(['GET']);
  });

  it('POST / returns 405 with Allow: GET, OPTIONS', async () => {
    const res = await fetch(`${baseUrl}/`, { method: 'POST' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
    expect(body.error).toBe('method-not-allowed');
    expect(body.allowed).toEqual(['GET', 'OPTIONS']);
  });

  it('GET /openapi.json returns 404 with a catalog-shaped endpoints array', async () => {
    const res = await fetch(`${baseUrl}/openapi.json`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('not-found');
    expect(Array.isArray(body.endpoints)).toBe(true);
    const eps = body.endpoints as Array<{ path: string; methods: string[]; summary: string }>;
    const paths = eps.map((e) => e.path);
    expect(paths).toEqual(
      expect.arrayContaining(['/health', '/quotes', '/quotes/:symbol']),
    );
    for (const e of eps) {
      expect(typeof e.path).toBe('string');
      expect(e.path.length).toBeGreaterThan(0);
      expect(Array.isArray(e.methods)).toBe(true);
      expect(typeof e.summary).toBe('string');
      expect(e.summary.length).toBeGreaterThan(0);
    }
  });

  it('404 endpoints array contains no filesystem paths or version metadata', async () => {
    const res = await fetch(`${baseUrl}/this-is-a-typo`);
    const text = await res.text();
    expect(res.status).toBe(404);
    expect(text).not.toMatch(/\/home\//);
    expect(text).not.toContain('node_modules');
    expect(text).not.toMatch(/\.git\b/);
    expect(text).not.toContain('Require stack');
  });

  it('OPTIONS / preflight is unchanged (204, CORS headers)', async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://example.com', 'Access-Control-Request-Method': 'GET' },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, OPTIONS');
  });
});

describe('REST Server — /quotes/:symbol distinguishes unconfigured vs uncached', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('returns symbol-not-configured when symbol absent from cfg.symbols', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/BRKB`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('symbol-not-configured');
    expect(body.symbol).toBe('BRKB');
    expect(body.configured).toBe(false);
    expect(typeof body.message).toBe('string');
    expect((body.message as string).length).toBeGreaterThan(0);
    expect(typeof body.timestamp).toBe('number');
  });

  it('returns no-quote with configured:true when symbol is in cfg.symbols but uncached', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
    expect(body.configured).toBe(true);
    expect(typeof body.message).toBe('string');
  });

  it('cached symbol still returns 200 with quote envelope (no regression)', async () => {
    cache.clear();
    cache.update(makeQuote({ symbol: 'AAPL', last: 190 }));
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.symbol).toBe('AAPL');
    expect(body.last).toBe(190);
    expect(body.error).toBeUndefined();
  });

  it('lowercase path param matches uppercase configured symbol (case-insensitive)', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/aapl`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.symbol).toBe('AAPL');
    expect(body.configured).toBe(true);
  });

  it('mixed-case configured list still matches uppercase request (membership is case-insensitive)', async () => {
    const c2 = new QuoteCache({ cacheTtlMs: 30_000 });
    const app2 = createServer(c2, { symbols: ['aapl', 'Tsla'] });
    const s2 = app2.listen(0);
    try {
      await new Promise<void>((resolve) => s2.on('listening', () => resolve()));
      const addr = s2.address() as import('net').AddressInfo;
      const res = await fetch(`http://127.0.0.1:${addr.port}/quotes/AAPL`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(404);
      expect(body.error).toBe('no-quote');
      expect(body.configured).toBe(true);
    } finally {
      await new Promise<void>((resolve) => s2.close(() => resolve()));
    }
  });

  it('invalid-symbol still returns 400 (membership check is post-normalization)', async () => {
    const res = await fetch(`${baseUrl}/quotes/${encodeURIComponent('!@#$')}`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid-symbol');
    expect(body.configured).toBeUndefined();
  });

  it('symbol-not-configured 404 has stable message hint (operator-readable)', async () => {
    const res = await fetch(`${baseUrl}/quotes/NVDA`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('symbol-not-configured');
    const msg = body.message as string;
    expect(msg.toLowerCase()).toContain('subscription');
    expect(msg).not.toContain('\n');
  });
});

describe('REST Server — /quotes/:symbol distinguishes with source getter wired', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let srcState: SourceStatus;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    app = createServer(cache, { symbols: ['AAPL', 'TSLA'] }, undefined, () => srcState);
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('symbol-not-configured 404 includes source block when getter wired', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/BRKB`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('symbol-not-configured');
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    expect(src.reason).toBe('etoro-client-not-installed');
  });

  it('no-quote 404 still includes source block (regression — task 0012 plumbing)', async () => {
    cache.clear();
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    expect(body.error).toBe('no-quote');
    expect(body.configured).toBe(true);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
  });
});

describe('REST Server — /health symbols list reflects cfg.symbols', () => {
  it('symbols is the default 10-ticker list when no config override', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache);
    const server = app.listen(0);
    try {
      await new Promise<void>((resolve) => server.on('listening', () => resolve()));
      const addr = server.address() as import('net').AddressInfo;
      const res = await fetch(`http://127.0.0.1:${addr.port}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.symbols).toEqual(DEFAULT_CONFIG.symbols);
      expect(body.configuredSymbols).toBe(DEFAULT_CONFIG.symbols.length);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('symbols echoes custom config verbatim (order preserved, special chars allowed)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['BRK.B', 'BTC-USD', 'AAPL'] });
    const server = app.listen(0);
    try {
      await new Promise<void>((resolve) => server.on('listening', () => resolve()));
      const addr = server.address() as import('net').AddressInfo;
      const res = await fetch(`http://127.0.0.1:${addr.port}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.symbols).toEqual(['BRK.B', 'BTC-USD', 'AAPL']);
      expect(body.configuredSymbols).toBe(3);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('REST Server — bootAtMs / uptimeMs on /health and /audit/stats', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let bootAtMs: number;
  let stats: IngestStats;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    bootAtMs = Date.now() - 1000;
    stats = {
      ingested: 0,
      rejected: 0,
      byReason: {},
      firstAt: null,
      lastAt: null,
      writeErrors: 0,
    };
    app = createServer(
      cache,
      { symbols: ['AAPL'] },
      () => stats,
      undefined,
      () => bootAtMs,
    );
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /health includes bootAtMs and uptimeMs when bootAtGetter wired', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.bootAtMs).toBe(bootAtMs);
    expect(typeof body.uptimeMs).toBe('number');
    expect(body.uptimeMs as number).toBeGreaterThanOrEqual(1000);
    expect(body.uptimeMs as number).toBeLessThan(60_000);
  });

  it('GET /audit/stats includes bootAtMs and uptimeMs when bootAtGetter wired', async () => {
    const res = await fetch(`${baseUrl}/audit/stats`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.bootAtMs).toBe(bootAtMs);
    expect(typeof body.uptimeMs).toBe('number');
    expect(body.uptimeMs as number).toBeGreaterThanOrEqual(0);
  });

  it('uptimeMs is monotonic across two requests separated by setTimeout(15)', async () => {
    const r1 = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, number>;
    await new Promise((r) => setTimeout(r, 15));
    const r2 = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, number>;
    expect(r2.uptimeMs).toBeGreaterThanOrEqual(r1.uptimeMs + 10);
  });

  it('bootAtMs is stable across requests to the same server instance', async () => {
    const r1 = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, number>;
    const r2 = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<string, number>;
    expect(r1.bootAtMs).toBe(r2.bootAtMs);
  });

  it('uptimeMs is non-negative', async () => {
    const r = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, number>;
    expect(r.uptimeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('REST Server — bootAtMs/uptimeMs omitted when no getter (regression)', () => {
  let cache: QuoteCache;
  let app: express.Express;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    app = createServer(cache, { symbols: ['AAPL'] }, () => ({
      ingested: 0,
      rejected: 0,
      byReason: {},
      firstAt: null,
      lastAt: null,
      writeErrors: 0,
    }));
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('/health omits bootAtMs and uptimeMs when no bootAtGetter supplied', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(body, 'bootAtMs')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'uptimeMs')).toBe(false);
  });

  it('/audit/stats omits bootAtMs and uptimeMs when no bootAtGetter supplied', async () => {
    const res = await fetch(`${baseUrl}/audit/stats`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(body, 'bootAtMs')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'uptimeMs')).toBe(false);
  });
});
