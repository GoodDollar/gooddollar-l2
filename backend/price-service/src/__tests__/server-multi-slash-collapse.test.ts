import http from 'http';
import express from 'express';
import { createServer, canonicalSuggestion } from '../server';
import { QuoteCache } from '../quote-cache';

function rawGet(path: string, port: number): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, method: 'GET', path },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => (buf += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(buf) as Record<string, unknown>);
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function listen(app: express.Express): Promise<{
  server: import('http').Server;
  baseUrl: string;
  port: number;
}> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}`, port };
}

async function close(s: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => s.close(() => resolve()));
}

/**
 * Task 0065: `canonicalSuggestion` already handled case-fold
 * (`/HEALTH` → `/health`) and trailing-slash (`/quotes/aapl/` →
 * `/quotes/aapl`) near-misses. It missed the multi-slash family —
 * `//health`, `/quotes//AAPL`, `///foo` — that a script joining a
 * base URL with a leading-slash path emits accidentally.
 */
describe('canonicalSuggestion — multi-slash collapse (task 0065)', () => {
  describe('positive — multi-slash only', () => {
    it.each([
      ['//health', '/health'],
      ['///health', '/health'],
      ['////health', '/health'],
      ['/quotes//AAPL', '/quotes/AAPL'],
      ['/quotes///AAPL', '/quotes/AAPL'],
      ['//docs//source-reasons', '/docs/source-reasons'],
    ])('canonicalSuggestion(%s) → %s', (input, expected) => {
      expect(canonicalSuggestion(input)).toBe(expected);
    });
  });

  describe('combined — case-fold + trailing-slash + multi-slash', () => {
    it.each([
      ['//HEALTH//', '/health'],
      ['/QUOTES//AAPL/', '/quotes/AAPL'],
      ['///HEALTH', '/health'],
      ['//QUOTES///AAPL//', '/quotes/AAPL'],
    ])('canonicalSuggestion(%s) → %s', (input, expected) => {
      expect(canonicalSuggestion(input)).toBe(expected);
    });
  });

  describe('regression — existing behaviour', () => {
    it.each([
      ['/health', undefined],
      ['/HEALTH', '/health'],
      ['/quotes/aapl/', '/quotes/aapl'],
      ['/HEALTH/', '/health'],
      ['/', undefined],
      ['/foo', undefined],
    ])('canonicalSuggestion(%s) → %s', (input, expected) => {
      expect(canonicalSuggestion(input)).toBe(expected);
    });
  });
});

describe('GET //health surfaces multi-slash steer in 404 body (task 0065)', () => {
  let server: import('http').Server;
  let port: number;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, port } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  it('GET //health returns 404 with didYouMean /health', async () => {
    // whatwg-fetch normalises multi-slashes; use a raw http request to
    // preserve `//health` literally on the wire.
    const body = await rawGet('//health', port);
    expect(body.error).toBe('not-found');
    expect(body.didYouMean).toBe('/health');
  });

  it('GET /quotes//AAPL returns 404 with didYouMean /quotes/AAPL', async () => {
    const body = await rawGet('/quotes//AAPL', port);
    expect(body.didYouMean).toBe('/quotes/AAPL');
  });
});
