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

describe('REST Server — GET / quickstart array', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('quickstart is an array of typed steps with all required fields', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    expect(Array.isArray(body.quickstart)).toBe(true);
    const qs = body.quickstart as Array<Record<string, unknown>>;
    expect(qs.length).toBeGreaterThanOrEqual(3);
    for (const s of qs) {
      expect(typeof s.step).toBe('number');
      expect(typeof s.goal).toBe('string');
      expect(typeof s.request).toBe('string');
      expect(typeof s.expect).toBe('string');
      expect((s.goal as string).length).toBeGreaterThan(0);
      expect((s.expect as string).length).toBeGreaterThan(0);
      expect((s.request as string).length).toBeGreaterThan(0);
    }
  });

  it('quickstart[0].request is "GET /health"', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    expect(qs[0].request).toBe('GET /health');
  });

  it('quickstart step numbers are 1-indexed contiguous', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    qs.forEach((s, i) => {
      expect(s.step).toBe(i + 1);
    });
  });

  it('every quickstart request is paste-runnable: HTTP verb path or wscat/websocat ws:// recipe (task 0056)', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    const re = /^(?:(?:GET|POST|PUT|PATCH|DELETE) \/\S+|(?:wscat|websocat)(?: -c)? ws:\/\/)/;
    for (const s of qs) {
      expect(s.request as string).toMatch(re);
      expect(s.request as string).not.toMatch(/^CONNECT\s/);
    }
  });

  it('legacy examples field is removed from the discovery payload', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    expect('examples' in body).toBe(false);
  });
});
