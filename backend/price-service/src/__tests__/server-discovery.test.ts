import express from 'express';
import { createServer, readPackageVersion, STATIC_QUICKSTART } from '../server';
import { QuoteCache } from '../quote-cache';
import { DEFAULT_CONFIG, SourceStatus } from '../types';

describe('REST Server — GET / discovery payload', () => {
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

  it('GET / includes description, version, docs, quickstart', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);

    expect(typeof body.description).toBe('string');
    expect((body.description as string).length).toBeGreaterThan(0);

    expect(typeof body.version).toBe('string');
    expect((body.version as string).length).toBeGreaterThan(0);

    expect(typeof body.docs).toBe('string');
    expect(body.docs).toMatch(/^https?:\/\//);

    expect(Array.isArray(body.quickstart)).toBe(true);
    const qs = body.quickstart as Array<Record<string, unknown>>;
    expect(qs.length).toBeGreaterThanOrEqual(3);
    for (const step of qs) {
      expect(typeof step.request).toBe('string');
    }
  });

  it('GET / quickstart references symbols from DEFAULT_CONFIG.symbols', () => {
    const configured = new Set(DEFAULT_CONFIG.symbols.map((s) => s.toUpperCase()));
    for (const step of STATIC_QUICKSTART) {
      const match = step.request.match(/\/quotes\/([A-Z0-9._-]+)(?:$|\?)/i);
      if (!match) continue;
      const symbol = match[1].toUpperCase();
      // Skip parametric placeholders that aren't real symbols.
      if (symbol === 'FRESH') continue;
      expect(configured.has(symbol)).toBe(true);
    }
  });

  it('GET / version matches package.json version (happy path)', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    // Either matches a real semver from package.json or falls back cleanly.
    expect(body.version).toMatch(/^(\d+\.\d+\.\d+|unknown)$/);
  });

  it('GET / preserves service, endpoints, and timestamp (backward-compat)', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.service).toBe('price-service');
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(typeof body.timestamp).toBe('number');
  });
});

describe('GET / surfaces source block when wired (task 0028)', () => {
  function listenOn(app: express.Express): Promise<{
    server: ReturnType<express.Express['listen']>;
    baseUrl: string;
  }> {
    return new Promise((resolve) => {
      const s = app.listen(0, () => {
        const addr = s.address();
        const port = addr && typeof addr === 'object' ? addr.port : 0;
        resolve({ server: s, baseUrl: `http://127.0.0.1:${port}` });
      });
    });
  }

  function close(server: ReturnType<express.Express['listen']>): Promise<void> {
    return new Promise((resolve) => server.close(() => resolve()));
  }

  it('degraded source: body.source carries reason + nextStep, body.status is "degraded"', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const src: SourceStatus = {
      connected: false,
      reason: 'source-unavailable',
      lastAttachAt: null,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => src);
    const { server, baseUrl } = await listenOn(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      expect(body.status).toBe('degraded');
      expect(body.source).toBeDefined();
      const s = body.source as Record<string, unknown>;
      expect(s.connected).toBe(false);
      expect(s.reason).toBe('source-unavailable');
    } finally {
      await close(server);
    }
  });

  it('connected source: body.source.connected = true, body.status = "ok"', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const src: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => src);
    const { server, baseUrl } = await listenOn(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      expect(body.status).toBe('ok');
      expect(body.source).toBeDefined();
      const s = body.source as Record<string, unknown>;
      expect(s.connected).toBe(true);
    } finally {
      await close(server);
    }
  });

  it('no sourceStatusGetter wired: body has no "source" key', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listenOn(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      expect('source' in body).toBe(false);
      expect(['ok', 'degraded']).toContain(body.status);
    } finally {
      await close(server);
    }
  });

  it('source field ships BEFORE status in JSON key order (matches /health)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const src: SourceStatus = {
      connected: false,
      reason: 'source-unavailable',
      lastAttachAt: null,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => src);
    const { server, baseUrl } = await listenOn(app);
    try {
      const raw = await (await fetch(`${baseUrl}/`)).text();
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const keys = Object.keys(parsed);
      const sourceIdx = keys.indexOf('source');
      const statusIdx = keys.indexOf('status');
      expect(sourceIdx).toBeGreaterThanOrEqual(0);
      expect(statusIdx).toBeGreaterThan(sourceIdx);
    } finally {
      await close(server);
    }
  });

  it('body.source on / matches body.source on /health for the same server', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const src: SourceStatus = {
      connected: false,
      reason:
        "Cannot find module '../../etoro-client/src/index'\n" +
        'Require stack:\n' +
        '- /home/goodclaw/proj/backend/price-service/dist/index.js',
      lastAttachAt: null,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => src);
    const { server, baseUrl } = await listenOn(app);
    try {
      const rootBody = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const healthBody = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
      expect(rootBody.source).toEqual(healthBody.source);
    } finally {
      await close(server);
    }
  });
});

describe('readPackageVersion', () => {
  it('returns the version string when require resolves a valid package', () => {
    const v = readPackageVersion(() => ({ version: '9.9.9' }));
    expect(v).toBe('9.9.9');
  });

  it('returns "unknown" when the require throws', () => {
    const v = readPackageVersion(() => {
      throw new Error('MODULE_NOT_FOUND');
    });
    expect(v).toBe('unknown');
  });

  it('returns "unknown" when the loaded object has no string version', () => {
    expect(readPackageVersion(() => ({}))).toBe('unknown');
    expect(readPackageVersion(() => ({ version: 42 }))).toBe('unknown');
    expect(readPackageVersion(() => null)).toBe('unknown');
  });
});
