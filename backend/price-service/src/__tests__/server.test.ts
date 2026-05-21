import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote } from '../types';
import express from 'express';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return {
    source: 'etoro',
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 1,
    stale: false,
    ...overrides,
  };
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
