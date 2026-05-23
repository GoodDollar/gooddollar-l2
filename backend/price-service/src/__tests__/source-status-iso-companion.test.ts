import express from 'express';
import {
  sanitizeSourceStatus,
  LAST_ATTACH_AT_DEPRECATION,
} from '../source-status';
import { SourceStatus } from '../types';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';

const NOW = 1779547903356;
const NOW_ISO = '2026-05-23T14:51:43.356Z';

describe('sanitizeSourceStatus — lastAttachAt ISO companion (task 0039)', () => {
  it('connected:true ships lastAttachAtMs + lastAttachAtIso plus the legacy alias', () => {
    const status: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: NOW,
    };
    const out = sanitizeSourceStatus(status);
    expect(out.connected).toBe(true);
    if (!out.connected) throw new Error('unreachable');
    expect(out.lastAttachAtMs).toBe(NOW);
    expect(out.lastAttachAtIso).toBe(NOW_ISO);
    expect(out.lastAttachAt).toBe(NOW);
  });

  it('connected:false with non-null lastAttachAt pairs ms+iso correctly', () => {
    const status: SourceStatus = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: NOW,
    };
    const out = sanitizeSourceStatus(status);
    expect(out.connected).toBe(false);
    if (out.connected) throw new Error('unreachable');
    expect(out.lastAttachAtMs).toBe(NOW);
    expect(out.lastAttachAtIso).toBe(NOW_ISO);
    expect(out.lastAttachAt).toBe(NOW);
  });

  it('connected:false with null lastAttachAt → all three timestamp fields are null', () => {
    const status: SourceStatus = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const out = sanitizeSourceStatus(status);
    if (out.connected) throw new Error('unreachable');
    expect(out.lastAttachAtMs).toBeNull();
    expect(out.lastAttachAtIso).toBeNull();
    expect(out.lastAttachAt).toBeNull();
  });

  it('drift gate: lastAttachAtIso === new Date(lastAttachAtMs).toISOString() when ms is set', () => {
    const ts = 1700000000000;
    const out = sanitizeSourceStatus({
      connected: true,
      symbols: [],
      lastAttachAt: ts,
    });
    if (!out.connected) throw new Error('unreachable');
    expect(out.lastAttachAtIso).toBe(new Date(out.lastAttachAtMs).toISOString());
  });

  it('every branch carries a deprecations.lastAttachAt string naming the rename target', () => {
    const out1 = sanitizeSourceStatus({
      connected: true,
      symbols: [],
      lastAttachAt: NOW,
    });
    const out2 = sanitizeSourceStatus({
      connected: false,
      reason: 'source-unavailable',
      lastAttachAt: null,
    });
    for (const out of [out1, out2]) {
      expect(out.deprecations.lastAttachAt).toBe(LAST_ATTACH_AT_DEPRECATION);
      expect(out.deprecations.lastAttachAt).toMatch(/lastAttachAtMs/);
    }
  });
});

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

describe('REST Server — source.lastAttachAt ISO companion round-trip', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const sourceStatus: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: NOW,
    };
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => sourceStatus,
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  async function sourceOf(path: string): Promise<Record<string, unknown>> {
    const body = (await (await fetch(`${baseUrl}${path}`)).json()) as Record<string, unknown>;
    expect(body.source).toBeDefined();
    return body.source as Record<string, unknown>;
  }

  const sourcePaths = [
    '/',
    '/health',
    '/quotes',
    '/quotes/fresh/all',
    '/status/quotes',
    '/quotes/ZZNOPE',
  ];

  it.each(sourcePaths)('%s source carries lastAttachAtMs + lastAttachAtIso', async (path) => {
    const src = await sourceOf(path);
    expect(src.lastAttachAtMs).toBe(NOW);
    expect(src.lastAttachAtIso).toBe(NOW_ISO);
  });

  it.each(sourcePaths)('%s source carries legacy lastAttachAt alias for back-compat', async (path) => {
    const src = await sourceOf(path);
    expect(src.lastAttachAt).toBe(NOW);
  });

  it.each(sourcePaths)('%s source carries deprecations.lastAttachAt rename note', async (path) => {
    const src = await sourceOf(path);
    const dep = src.deprecations as Record<string, unknown>;
    expect(typeof dep.lastAttachAt).toBe('string');
    expect(dep.lastAttachAt).toMatch(/lastAttachAtMs/);
  });

  it('source key set is identical across every endpoint that ships source', async () => {
    const keySets = await Promise.all(
      sourcePaths.map(async (p) => {
        const src = await sourceOf(p);
        return Object.keys(src).sort().join(',');
      }),
    );
    const unique = new Set(keySets);
    expect(unique.size).toBe(1);
  });
});
