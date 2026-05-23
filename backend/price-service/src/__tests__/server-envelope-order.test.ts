import express from 'express';
import { createServer } from '../server';
import { finalizeEnvelope, finalizeTimestamps } from '../envelope';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';

const NOW = 1779550000000;

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

function freshQuote(symbol: string, ts: number): NormalizedQuote {
  return computeSpread({
    source: 'etoro' as const,
    symbol,
    instrumentId: `${symbol}-1`,
    bid: 100,
    ask: 100.1,
    mid: 100.05,
    last: 100.05,
    timestamp: ts,
    sessionState: 'open' as const,
    confidence: 0.95,
    stale: false,
  });
}

describe('finalizeTimestamps — anchors timestamp+timestampIso last', () => {
  it('appends timestamp and timestampIso at the tail of any body', () => {
    const body: Record<string, unknown> = { a: 1, b: 2 };
    finalizeTimestamps(body, NOW);
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
    expect(body.timestamp).toBe(NOW);
    expect(body.timestampIso).toBe(new Date(NOW).toISOString());
  });

  it('re-anchors timestamp if it already existed earlier in the body', () => {
    const body: Record<string, unknown> = { timestamp: 0, payload: 'mid' };
    finalizeTimestamps(body, NOW);
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });
});

describe('finalizeEnvelope — canonical meta-tail order', () => {
  it('source < status < bootAt < timestamp', () => {
    const body: Record<string, unknown> = { payload: 'x' };
    finalizeEnvelope(body, NOW, {
      src: { connected: true, symbols: ['AAPL'], lastAttachAt: 1 },
      status: 'ok',
      boot: { ms: 0, iso: new Date(0).toISOString(), uptimeMs: NOW },
    });
    const keys = Object.keys(body);
    expect(keys.indexOf('source')).toBeLessThan(keys.indexOf('status'));
    expect(keys.indexOf('status')).toBeLessThan(keys.indexOf('bootAtMs'));
    expect(keys.indexOf('bootAtMs')).toBeLessThan(keys.indexOf('timestamp'));
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('omits absent meta fields (no nulls inserted)', () => {
    const body: Record<string, unknown> = { payload: 'x' };
    finalizeEnvelope(body, NOW, { status: 'ok' });
    expect('source' in body).toBe(false);
    expect('websocket' in body).toBe(false);
    expect('bootAtMs' in body).toBe(false);
    expect(body.status).toBe('ok');
  });

  it('repositions meta fields if a handler already wrote one early', () => {
    const body: Record<string, unknown> = {
      source: 'early-write-should-be-moved-to-canonical-slot',
      payload: 'mid',
    };
    finalizeEnvelope(body, NOW, {
      src: { connected: true, symbols: [], lastAttachAt: 1 },
    });
    const keys = Object.keys(body);
    expect(keys.indexOf('payload')).toBeLessThan(keys.indexOf('source'));
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });
});

describe('REST Server — canonical envelope key order across endpoints', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(freshQuote('AAPL', Date.now()));
    const sourceStatus: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: NOW - 5000,
    };
    const app = createServer(
      cache,
      { symbols: ['AAPL', 'TSLA'] },
      () => ({
        ingested: 100,
        rejected: 5,
        byReason: { 'stale-quote': 5 },
        firstAt: NOW - 60_000,
        lastAt: NOW - 100,
        writeErrors: 0,
      }),
      () => sourceStatus,
      () => NOW - 120_000,
      () => ({ port: 9301, host: 'localhost' }),
      () => ({ listening: true, bindError: null, port: 9301 }),
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  async function bodyOf(path: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${baseUrl}${path}`);
    return (await res.json()) as Record<string, unknown>;
  }

  const endpoints = [
    '/',
    '/health',
    '/quotes',
    '/quotes/fresh/all',
    '/quotes/AAPL',
    '/status/quotes',
    '/audit/stats',
    '/docs/source-reasons',
  ];

  it.each(endpoints)(
    '%s ends with timestamp, timestampIso as the last two keys',
    async (path) => {
      const body = await bodyOf(path);
      const keys = Object.keys(body);
      expect(keys.at(-2)).toBe('timestamp');
      expect(keys.at(-1)).toBe('timestampIso');
    },
  );

  it('catch-all 404 also ends with timestamp, timestampIso', async () => {
    const body = await bodyOf('/__definitely-not-a-route__');
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('405 method-not-allowed also ends with timestamp, timestampIso', async () => {
    const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(res.status).toBe(405);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('400 invalid-symbol body ends with timestamp, timestampIso', async () => {
    const body = await bodyOf('/quotes/!!!');
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('404 symbol-not-configured body ends with timestamp, timestampIso', async () => {
    const body = await bodyOf('/quotes/ZZZZZZ');
    expect(body.error).toBe('symbol-not-configured');
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });

  it('/health: source precedes status; status precedes bootAtMs', async () => {
    const body = await bodyOf('/health');
    const keys = Object.keys(body);
    const idx = (k: string) => keys.indexOf(k);
    expect(idx('source')).toBeGreaterThan(-1);
    expect(idx('status')).toBeGreaterThan(-1);
    expect(idx('bootAtMs')).toBeGreaterThan(-1);
    expect(idx('source')).toBeLessThan(idx('status'));
    expect(idx('status')).toBeLessThan(idx('bootAtMs'));
    expect(idx('bootAtMs')).toBeLessThan(idx('timestamp'));
  });

  it('/quotes: source precedes deprecations precedes timestamp', async () => {
    const body = await bodyOf('/quotes');
    const keys = Object.keys(body);
    const idx = (k: string) => keys.indexOf(k);
    expect(idx('source')).toBeGreaterThan(-1);
    expect(idx('deprecations')).toBeGreaterThan(-1);
    expect(idx('source')).toBeLessThan(idx('deprecations'));
    expect(idx('deprecations')).toBeLessThan(idx('timestamp'));
  });

  it('/status/quotes: source precedes healthy precedes deprecations', async () => {
    const body = await bodyOf('/status/quotes');
    const keys = Object.keys(body);
    const idx = (k: string) => keys.indexOf(k);
    expect(idx('source')).toBeGreaterThan(-1);
    expect(idx('healthy')).toBeGreaterThan(-1);
    expect(idx('deprecations')).toBeGreaterThan(-1);
    expect(idx('source')).toBeLessThan(idx('healthy'));
    expect(idx('healthy')).toBeLessThan(idx('deprecations'));
    expect(idx('deprecations')).toBeLessThan(idx('timestamp'));
  });

  it('/audit/stats: bootAtMs precedes timestamp; firstAt block stays in payload', async () => {
    const body = await bodyOf('/audit/stats');
    const keys = Object.keys(body);
    const idx = (k: string) => keys.indexOf(k);
    expect(idx('bootAtMs')).toBeGreaterThan(-1);
    expect(idx('firstAt')).toBeGreaterThan(-1);
    expect(idx('firstAt')).toBeLessThan(idx('bootAtMs'));
    expect(idx('bootAtMs')).toBeLessThan(idx('timestamp'));
  });

  it('/: source precedes websocket precedes status', async () => {
    const body = await bodyOf('/');
    const keys = Object.keys(body);
    const idx = (k: string) => keys.indexOf(k);
    expect(idx('source')).toBeGreaterThan(-1);
    expect(idx('websocket')).toBeGreaterThan(-1);
    expect(idx('status')).toBeGreaterThan(-1);
    expect(idx('source')).toBeLessThan(idx('websocket'));
    expect(idx('websocket')).toBeLessThan(idx('status'));
  });

  it('/quotes/AAPL (200 success) ends with timestamp, timestampIso', async () => {
    const body = await bodyOf('/quotes/AAPL');
    const keys = Object.keys(body);
    expect(keys.at(-2)).toBe('timestamp');
    expect(keys.at(-1)).toBe('timestampIso');
  });
});
