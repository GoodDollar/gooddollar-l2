import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
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

describe('REST Server — endpoint responseShape catalog', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 9301 }),
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('every catalog endpoint declares a non-empty responseShape on GET /', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    expect(Array.isArray(body.endpoints)).toBe(true);
    const eps = body.endpoints as Array<Record<string, unknown>>;
    for (const e of eps) {
      expect(typeof e.responseShape).toBe('string');
      expect((e.responseShape as string).length).toBeGreaterThan(0);
    }
  });

  it('every responseShape is <= 240 characters', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const eps = body.endpoints as Array<Record<string, unknown>>;
    for (const e of eps) {
      expect((e.responseShape as string).length).toBeLessThanOrEqual(240);
    }
  });

  it('/quotes/:symbol responseShape mentions 200, 400, and 404 branches', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const eps = body.endpoints as Array<Record<string, unknown>>;
    const sym = eps.find((e) => e.path === '/quotes/:symbol');
    expect(sym).toBeDefined();
    expect(sym!.responseShape as string).toMatch(/400/);
    expect(sym!.responseShape as string).toMatch(/404/);
    expect(sym!.responseShape as string).toMatch(/200/);
  });

  it('/health responseShape references degraded / 503 branch', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const eps = body.endpoints as Array<Record<string, unknown>>;
    const h = eps.find((e) => e.path === '/health');
    expect(h).toBeDefined();
    expect(h!.responseShape as string).toMatch(/degraded|503/);
  });

  it('/status/quotes responseShape references degraded / 503 branch', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const eps = body.endpoints as Array<Record<string, unknown>>;
    const s = eps.find((e) => e.path === '/status/quotes');
    expect(s).toBeDefined();
    expect(s!.responseShape as string).toMatch(/degraded|503/);
  });

  it('no catalog entry advertises a bare ts field on the wire (task 0038)', () => {
    const offenders = ENDPOINT_CATALOG.filter((e) =>
      /,\s*ts\s*[}|]/.test(e.responseShape),
    );
    expect(offenders.map((e) => e.path)).toEqual([]);
  });

  it('every responseShape mentioning timestamp also mentions timestampIso (task 0038)', () => {
    const offenders: string[] = [];
    for (const e of ENDPOINT_CATALOG) {
      if (/\btimestamp\b/.test(e.responseShape) && !/\btimestampIso\b/.test(e.responseShape)) {
        offenders.push(e.path);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every responseShape mentioning *At anchors pairs with the *AtIso companion (task 0038)', () => {
    const anchors: ReadonlyArray<{ base: RegExp; iso: RegExp }> = [
      { base: /\bfirstAt\b/, iso: /\bfirstAtIso\b/ },
      { base: /\blastAt\b/, iso: /\blastAtIso\b/ },
      { base: /\bbootAt\*/, iso: /\bbootAtIso\b|bootAt\*/ },
    ];
    const offenders: string[] = [];
    for (const e of ENDPOINT_CATALOG) {
      for (const { base, iso } of anchors) {
        if (base.test(e.responseShape) && !iso.test(e.responseShape)) {
          offenders.push(`${e.path}: ${base}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('404 hint list intentionally drops responseShape (task 0027: compact 404)', async () => {
    // Full per-endpoint discovery (summary + responseShape) lives on
    // `GET /`; the 404 ships only `{path, methods}` so wrong-URL traffic
    // (typos, /favicon.ico, misconfigured probes) doesn't pay a 2.8 KB tax.
    const body = (await (await fetch(`${baseUrl}/no-such-path`)).json()) as Record<string, unknown>;
    expect(Array.isArray(body.endpoints)).toBe(true);
    const eps = body.endpoints as Array<Record<string, unknown>>;
    for (const e of eps) {
      expect('responseShape' in e).toBe(false);
      expect('summary' in e).toBe(false);
    }
  });
});
