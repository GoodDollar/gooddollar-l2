import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, IngestStats, computeSpread } from '../types';
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
