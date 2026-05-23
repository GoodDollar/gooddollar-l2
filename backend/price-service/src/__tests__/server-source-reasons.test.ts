import express from 'express';
import { createServer } from '../server';
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

describe('REST Server — source reason enrichment surfaces', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => ({
        connected: false,
        reason: 'etoro-client-not-installed',
        lastAttachAt: null,
      }),
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /health source block exposes humanReason, nextStep, severity when disconnected', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    expect(src.reason).toBe('etoro-client-not-installed');
    expect(typeof src.humanReason).toBe('string');
    expect(typeof src.nextStep).toBe('string');
    expect(src.severity).toBe('critical');
  });

  it('GET /quotes/AAPL no-quote 404 also carries the enriched source block', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(404);
    const src = body.source as Record<string, unknown>;
    expect(src.connected).toBe(false);
    expect(src.severity).toBe('critical');
    expect(typeof src.humanReason).toBe('string');
    expect(typeof src.nextStep).toBe('string');
  });

  it('GET /docs/source-reasons enumerates the full catalog', async () => {
    const res = await fetch(`${baseUrl}/docs/source-reasons`);
    const body = (await res.json()) as Record<string, unknown>;
    const reasons = body.reasons as Record<
      string,
      { humanReason: string; nextStep: string; severity: string }
    >;
    expect(reasons['not-attached'].severity).toBe('info');
    expect(reasons['etoro-client-not-installed'].severity).toBe('critical');
    expect(reasons['source-unavailable'].severity).toBe('degraded');
    for (const v of Object.values(reasons)) {
      expect(typeof v.humanReason).toBe('string');
      expect(v.humanReason.length).toBeGreaterThan(0);
      expect(typeof v.nextStep).toBe('string');
      expect(v.nextStep.length).toBeGreaterThan(0);
    }
  });

  it('GET /docs/source-reasons present even when no source getter is wired', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server: s2, baseUrl: u2 } = await listen(app);
    try {
      const res = await fetch(`${u2}/docs/source-reasons`);
      const body = (await res.json()) as Record<string, unknown>;
      const reasons = body.reasons as Record<string, unknown>;
      expect(typeof reasons).toBe('object');
      expect(Object.keys(reasons).length).toBeGreaterThanOrEqual(3);
    } finally {
      await new Promise<void>((resolve) => s2.close(() => resolve()));
    }
  });

  it('connected source block stays unchanged (no enrichment fields)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => ({ connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 }),
    );
    const { server: s2, baseUrl: u2 } = await listen(app);
    try {
      const res = await fetch(`${u2}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      const src = body.source as Record<string, unknown>;
      expect(src.connected).toBe(true);
      expect(src.humanReason).toBeUndefined();
      expect(src.nextStep).toBeUndefined();
      expect(src.severity).toBeUndefined();
    } finally {
      await new Promise<void>((resolve) => s2.close(() => resolve()));
    }
  });
});
