import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { RuntimeBlock } from '../runtime';
import { SourceStatus } from '../types';

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

const SAMPLE_RUNTIME: RuntimeBlock = {
  etoroMode: 'sandbox',
  realTradingEnabled: false,
  network: 'testnet',
  fixtureOnly: true,
  configuredAtMs: 1700000000000,
  configuredAtIso: '2023-11-14T22:13:20.000Z',
};

/**
 * Task 0075 — `/audit/stats` ships the same `runtime` safety block as
 * `/` and `/health` (task 0055). An SRE polling acceptance-ratio
 * and audit-log backpressure metrics now sees fixture/real-trading
 * state from the same request, without a second GET against
 * `/health`.
 */
describe('/audit/stats runtime block (task 0075)', () => {
  describe('runtimeGetter wired', () => {
    let server: import('http').Server;
    let baseUrl: string;

    const status: SourceStatus = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const app = createServer(
        cache,
        { symbols: ['AAPL'] },
        undefined,
        () => status,
        undefined,
        undefined,
        undefined,
        () => SAMPLE_RUNTIME,
      );
      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await close(server);
    });

    it('body carries runtime block with all six fields', async () => {
      const res = await fetch(`${baseUrl}/audit/stats`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      const runtime = body.runtime as Record<string, unknown>;
      expect(runtime).toBeDefined();
      expect(runtime.etoroMode).toBe('sandbox');
      expect(runtime.realTradingEnabled).toBe(false);
      expect(runtime.network).toBe('testnet');
      expect(runtime.fixtureOnly).toBe(true);
      expect(runtime.configuredAtMs).toBe(1700000000000);
      expect(runtime.configuredAtIso).toBe('2023-11-14T22:13:20.000Z');
    });

    it('runtime block matches /health.runtime byte-for-byte (drift gate)', async () => {
      const auditStats = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      const health = (await (await fetch(`${baseUrl}/health`)).json()) as Record<
        string,
        unknown
      >;
      expect(JSON.stringify(auditStats.runtime)).toBe(JSON.stringify(health.runtime));
    });

    it('runtime block matches GET / .runtime byte-for-byte (drift gate)', async () => {
      const auditStats = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      const root = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      expect(JSON.stringify(auditStats.runtime)).toBe(JSON.stringify(root.runtime));
    });

    it('runtime sits between the domain payload and the boot tail', async () => {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      const keys = Object.keys(body);
      const runtimeIdx = keys.indexOf('runtime');
      const bufferedDropsIdx = keys.indexOf('bufferedDrops');
      const bootIdx = keys.indexOf('bootAtMs');
      expect(runtimeIdx).toBeGreaterThan(-1);
      expect(bufferedDropsIdx).toBeGreaterThan(-1);
      expect(runtimeIdx).toBeGreaterThan(bufferedDropsIdx);
      if (bootIdx > -1) {
        expect(runtimeIdx).toBeLessThan(bootIdx);
      }
    });

    it('does not regress the existing audit-stats domain fields', async () => {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      expect(typeof body.ingested).toBe('number');
      expect(typeof body.rejected).toBe('number');
      expect(body.acceptanceRatio).toBeDefined();
      expect(typeof body.acceptanceRatioStatus).toBe('string');
      expect(typeof body.writeErrors).toBe('number');
      expect(typeof body.bufferedDrops).toBe('number');
      expect(typeof body.firstAtMs === 'number' || body.firstAtMs === null).toBe(true);
      expect(typeof body.lastAtMs === 'number' || body.lastAtMs === null).toBe(true);
    });
  });

  describe('runtimeGetter not wired (legacy boot)', () => {
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

    it('runtime block is omitted when runtimeGetter is not provided', async () => {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      expect('runtime' in body).toBe(false);
    });
  });

  it('responseShape for /audit/stats mentions runtime? and stays ≤ 240 chars', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as {
        endpoints: Array<{ path: string; responseShape: string }>;
      };
      const a = body.endpoints.find((e) => e.path === '/audit/stats');
      expect(a).toBeDefined();
      expect(a!.responseShape).toMatch(/runtime/);
      expect(a!.responseShape.length).toBeLessThanOrEqual(240);
    } finally {
      await close(server);
    }
  });
});
