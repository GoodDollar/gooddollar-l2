import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { SourceStatus } from '../types';

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

describe("REST Server — GET / status field mirrors /health verdict", () => {
  describe('healthy source', () => {
    let server: ReturnType<express.Express['listen']>;
    let baseUrl: string;

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const app = createServer(
        cache,
        { symbols: ['AAPL'] },
        undefined,
        () => ({ connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 }),
      );
      ({ server, baseUrl } = await listen(app));
    });

    afterAll((done) => {
      server.close(done);
    });

    it('GET / includes status field equal to "ok" when source is healthy', async () => {
      const res = await fetch(`${baseUrl}/`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(200);
      expect(typeof body.status).toBe('string');
      expect(body.status).toBe('ok');
    });

    it('GET / status mirrors /health body status (healthy)', async () => {
      const rootBody = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const healthBody = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
      expect(rootBody.status).toBe(healthBody.status);
      expect(rootBody.status).toBe('ok');
    });
  });

  describe('disconnected source', () => {
    let server: ReturnType<express.Express['listen']>;
    let baseUrl: string;

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const srcState: SourceStatus = {
        connected: false,
        reason: 'etoro-client-not-installed',
        lastAttachAt: null,
      };
      const app = createServer(
        cache,
        { symbols: ['AAPL'] },
        undefined,
        () => srcState,
      );
      ({ server, baseUrl } = await listen(app));
    });

    afterAll((done) => {
      server.close(done);
    });

    it('GET / status equals "degraded" when source is disconnected', async () => {
      const res = await fetch(`${baseUrl}/`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.status).toBe('degraded');
    });

    it('GET / returns HTTP 200 even when status is "degraded"', async () => {
      const res = await fetch(`${baseUrl}/`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.status).toBe('degraded');
    });

    it('GET / status mirrors /health body status (degraded)', async () => {
      const rootBody = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const healthBody = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
      expect(rootBody.status).toBe(healthBody.status);
      expect(rootBody.status).toBe('degraded');
    });
  });

  describe('back-compat: no sourceStatusGetter wired', () => {
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

    it('GET / without sourceStatusGetter still emits status: "ok"', async () => {
      const res = await fetch(`${baseUrl}/`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.status).toBe('ok');
      expect('source' in body).toBe(false);
    });
  });
});
