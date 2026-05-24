import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';
import { METRICS_CONTENT_TYPE } from '../metrics';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
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
    ...overrides,
  });
}

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

const RUNTIME = {
  etoroMode: 'sandbox',
  network: 'testnet',
  fixtureOnly: false,
  realTradingEnabled: true,
  configuredAtMs: 0,
  configuredAtIso: '1970-01-01T00:00:00.000Z',
};

describe('GET /metrics — Prometheus exposition (task 0080)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update(makeQuote({ symbol: 'AAPL' }));
    cache.update(makeQuote({ symbol: 'MSFT' }));
    cache.update(makeQuote({ symbol: 'NVDA' }));
    const stats = {
      ingested: 1100,
      rejected: 32,
      byReason: { 'stale-spread': 22, 'stale-timestamp': 10 },
      firstAtMs: 1,
      lastAtMs: 2,
      writeErrors: 0,
      bufferedDrops: 0,
    };
    const app = createServer(
      cache,
      { symbols: ['AAPL', 'MSFT', 'NVDA'] },
      () => stats,
      () => ({ connected: true, symbols: ['AAPL'], lastAttachAt: 0 }),
      () => 1000,
      () => ({ port: 9009 }),
      () => ({ listening: true, bindError: null, port: 9009 }),
      () => RUNTIME,
      () => 4,
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('returns HTTP 200 with the canonical Prometheus content-type', async () => {
    const res = await fetch(`${baseUrl}/metrics`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(METRICS_CONTENT_TYPE);
  });

  describe('emitted families (# HELP + # TYPE + at least one sample)', () => {
    const FAMILIES = [
      ['price_service_info', 'gauge'],
      ['price_service_uptime_seconds', 'gauge'],
      ['price_service_cache_size', 'gauge'],
      ['price_service_cache_fresh_size', 'gauge'],
      ['price_service_cache_age_seconds', 'gauge'],
      ['price_service_ingest_total', 'counter'],
      ['price_service_accepted_total', 'counter'],
      ['price_service_rejected_total', 'counter'],
      ['price_service_source_connected', 'gauge'],
      ['price_service_ws_listening', 'gauge'],
      ['price_service_ws_clients', 'gauge'],
      ['price_service_audit_write_errors_total', 'counter'],
      ['price_service_audit_buffered_drops_total', 'counter'],
    ] as const;

    it.each(FAMILIES)('%s family has # HELP and # TYPE %s', async (name, type) => {
      const body = await (await fetch(`${baseUrl}/metrics`)).text();
      expect(body).toMatch(new RegExp(`^# HELP ${name} `, 'm'));
      expect(body).toMatch(new RegExp(`^# TYPE ${name} ${type}$`, 'm'));
    });
  });

  it('price_service_info labels match getRuntime() and PACKAGE_VERSION', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toMatch(
      /price_service_info\{version="[^"]+",etoro_mode="sandbox",network="testnet",fixture_only="false",real_trading_enabled="true"\} 1/,
    );
  });

  it('price_service_cache_size + _fresh_size reflect the seeded cache', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toMatch(/^price_service_cache_size 3$/m);
    expect(body).toMatch(/^price_service_cache_fresh_size 3$/m);
  });

  it('emits a per-symbol cache_age_seconds sample for every cached symbol', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    for (const sym of ['AAPL', 'MSFT', 'NVDA']) {
      expect(body).toMatch(
        new RegExp(`^price_service_cache_age_seconds\\{symbol="${sym}"\\} [\\d.]+$`, 'm'),
      );
    }
  });

  it('emits one rejected_total line per observed reason; counts match', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toContain('price_service_rejected_total{reason="stale-spread"} 22');
    expect(body).toContain('price_service_rejected_total{reason="stale-timestamp"} 10');
  });

  it('ingest_total = accepted + rejected', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toMatch(/^price_service_ingest_total 1132$/m);
    expect(body).toMatch(/^price_service_accepted_total 1100$/m);
  });

  it('emits exactly one source_connected sample under the active reason', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    const matches = body.match(/^price_service_source_connected\{[^}]*\} \d+$/gm);
    expect(matches?.length).toBe(1);
    expect(matches?.[0]).toBe('price_service_source_connected{reason="connected"} 1');
  });

  it('reflects ws bind state and live client count', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toMatch(/^price_service_ws_listening 1$/m);
    expect(body).toMatch(/^price_service_ws_clients 4$/m);
  });

  it('does NOT 5xx — wrapper catches any internal throw', async () => {
    const res = await fetch(`${baseUrl}/metrics`);
    expect(res.status).toBeLessThan(500);
  });

  it('body ends with a single trailing newline (spec)', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body.endsWith('\n')).toBe(true);
    expect(body.endsWith('\n\n')).toBe(false);
  });

  it('every line is well-formed (parser-rules sanity)', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    const lines = body.split('\n');
    for (const line of lines) {
      if (line === '') continue;
      if (line.startsWith('# ')) {
        expect(line).toMatch(/^# (HELP|TYPE|UNAVAILABLE) /);
        continue;
      }
      expect(line).toMatch(/^[a-z_][a-z0-9_]*(\{[^}]*\})? -?[0-9.e+\-]+$/i);
    }
  });

  it('/metrics is advertised in the discovery catalog', () => {
    const entry = ENDPOINT_CATALOG.find((e) => e.path === '/metrics');
    expect(entry).toBeDefined();
    expect(entry?.methods).toEqual(['GET']);
    expect(entry?.responseShape).toContain('text/plain');
  });
});

describe('GET /metrics — degraded source still ships 200 (task 0080)', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => ({
        connected: false,
        reason: 'source-unavailable',
        detail: 'down',
        lastAttachAt: null,
      }),
      () => 1000,
      () => ({ port: 9009 }),
      () => ({ listening: false, bindError: 'ws-bind-failed', port: null }),
      () => RUNTIME,
      () => 0,
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('returns 200 even when source is dead AND cache is empty', async () => {
    const res = await fetch(`${baseUrl}/metrics`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(METRICS_CONTENT_TYPE);
  });

  it('source_connected sample carries the dead reason with value 0', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toMatch(
      /^price_service_source_connected\{reason="source-unavailable"\} 0$/m,
    );
  });

  it('ws_listening reads 0 when broadcaster bind failed', async () => {
    const body = await (await fetch(`${baseUrl}/metrics`)).text();
    expect(body).toMatch(/^price_service_ws_listening 0$/m);
  });
});
