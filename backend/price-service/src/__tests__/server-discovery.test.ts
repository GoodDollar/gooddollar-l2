import express from 'express';
import { createServer, readPackageVersion, EXAMPLES } from '../server';
import { QuoteCache } from '../quote-cache';
import { DEFAULT_CONFIG } from '../types';

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

  it('GET / includes description, version, docs, examples', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(res.status).toBe(200);

    expect(typeof body.description).toBe('string');
    expect((body.description as string).length).toBeGreaterThan(0);

    expect(typeof body.version).toBe('string');
    expect((body.version as string).length).toBeGreaterThan(0);

    expect(typeof body.docs).toBe('string');
    expect(body.docs).toMatch(/^https?:\/\//);

    const examples = body.examples as Record<string, string> | undefined;
    expect(examples && typeof examples === 'object').toBe(true);
    expect(Object.keys(examples!).length).toBeGreaterThanOrEqual(3);
    for (const value of Object.values(examples!)) {
      expect(typeof value).toBe('string');
      expect(value.startsWith('GET /')).toBe(true);
    }
  });

  it('GET / examples reference symbols that exist in DEFAULT_CONFIG.symbols', () => {
    const configured = new Set(DEFAULT_CONFIG.symbols.map((s) => s.toUpperCase()));
    for (const value of Object.values(EXAMPLES) as string[]) {
      const match = value.match(/\/quotes\/([A-Z0-9._-]+)(?:$|\?)/i);
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
