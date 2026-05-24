import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import {
  retryAfterSecondsForSeverity,
  RETRY_AFTER_SECONDS_BY_SEVERITY,
} from '../source-status';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';

function makeQuote(): NormalizedQuote {
  return computeSpread({
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
  });
}

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

const RETRY_PATHS: ReadonlyArray<string> = [
  '/health',
  '/quotes',
  '/quotes/fresh/all',
  '/status/quotes',
];

/**
 * Task 0066: RFC 9110 §15.6.4 says a 503 SHOULD ship `Retry-After`.
 * The four 503-capable endpoints (`/health`, `/quotes`,
 * `/quotes/fresh/all`, `/status/quotes`) ship none today. After this
 * task each 503 carries `Retry-After: <delta-seconds>` derived from
 * the upstream `source.severity` (5/15/60), and the same number rides
 * on the wire as `source.retryAfterSeconds` for JSON-only consumers.
 */
describe('retryAfterSecondsForSeverity (task 0066)', () => {
  it('maps severity → seconds per the RFC-9110 cadence table', () => {
    expect(retryAfterSecondsForSeverity('info')).toBe(5);
    expect(retryAfterSecondsForSeverity('degraded')).toBe(15);
    expect(retryAfterSecondsForSeverity('critical')).toBe(60);
    expect(retryAfterSecondsForSeverity('ok')).toBeUndefined();
  });

  it('RETRY_AFTER_SECONDS_BY_SEVERITY is the single source of truth for the helper', () => {
    expect(RETRY_AFTER_SECONDS_BY_SEVERITY.info).toBe(5);
    expect(RETRY_AFTER_SECONDS_BY_SEVERITY.degraded).toBe(15);
    expect(RETRY_AFTER_SECONDS_BY_SEVERITY.critical).toBe(60);
    expect(RETRY_AFTER_SECONDS_BY_SEVERITY.ok).toBeUndefined();
  });
});

describe('503 paths ship Retry-After + source.retryAfterSeconds (task 0066)', () => {
  const SEVERITY_CASES: Array<{
    label: string;
    status: SourceStatus;
    expectedSeconds: number;
  }> = [
    {
      label: 'critical (etoro-client-not-installed)',
      status: { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null },
      expectedSeconds: 60,
    },
    {
      label: 'info (not-attached, warmup)',
      status: { connected: false, reason: 'not-attached', lastAttachAt: null },
      expectedSeconds: 5,
    },
    {
      label: 'degraded (source-unavailable)',
      status: { connected: false, reason: 'source-unavailable', lastAttachAt: null },
      expectedSeconds: 15,
    },
  ];

  for (const sc of SEVERITY_CASES) {
    describe(sc.label, () => {
      let server: import('http').Server;
      let baseUrl: string;

      beforeAll(async () => {
        const cache = new QuoteCache({ cacheTtlMs: 30_000 });
        const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => sc.status);
        ({ server, baseUrl } = await listen(app));
      });

      afterAll(async () => {
        await close(server);
      });

      it.each(RETRY_PATHS)('%s 503 ships Retry-After: ' + sc.expectedSeconds, async (path) => {
        const res = await fetch(`${baseUrl}${path}`);
        expect(res.status).toBe(503);
        expect(res.headers.get('retry-after')).toBe(String(sc.expectedSeconds));
      });

      it.each(RETRY_PATHS)('%s 503 ships source.retryAfterSeconds === Retry-After header', async (path) => {
        const res = await fetch(`${baseUrl}${path}`);
        const headerValue = res.headers.get('retry-after');
        const body = (await res.json()) as Record<string, unknown>;
        const src = body.source as Record<string, unknown>;
        expect(src.retryAfterSeconds).toBe(Number(headerValue));
      });
    });
  }
});

describe('200 paths do NOT ship Retry-After (task 0066)', () => {
  let server: import('http').Server;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote());
    const status: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: Date.now(),
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => status);
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  it.each(RETRY_PATHS)('%s 200 ships no Retry-After header', async (path) => {
    const res = await fetch(`${baseUrl}${path}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('retry-after')).toBeNull();
  });

  it.each(RETRY_PATHS)('%s 200 ships source.retryAfterSeconds: 0 on the connected branch', async (path) => {
    const res = await fetch(`${baseUrl}${path}`);
    const body = (await res.json()) as Record<string, unknown>;
    const src = body.source as Record<string, unknown>;
    expect(src.retryAfterSeconds).toBe(0);
  });
});

describe('/docs/source-reasons advertises the retryAfterSeconds slot (task 0066)', () => {
  let server: import('http').Server;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  it('exposes retryAfterSecondsBySeverity map', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<string, unknown>;
    const m = body.retryAfterSecondsBySeverity as Record<string, unknown>;
    expect(m).toBeDefined();
    expect(m.info).toBe(5);
    expect(m.degraded).toBe(15);
    expect(m.critical).toBe(60);
    expect('ok' in m).toBe(true);
  });
});
