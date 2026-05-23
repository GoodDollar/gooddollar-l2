import * as http from 'http';
import { startHedgeStatusServer, HedgeStatusProvider } from '../hedgeStatusServer';
import { ReconciliationSnapshot } from '../types';

function get(port: number, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let body: any = text;
        try { body = JSON.parse(text); } catch { /* not json */ }
        resolve({ status: res.statusCode ?? 0, body });
      });
    });
    req.on('error', reject);
  });
}

function makeSnapshot(over?: Partial<ReconciliationSnapshot>): ReconciliationSnapshot {
  return {
    timestamp: 1700000000000,
    exposures: [
      { symbol: 'AAPL', netDelta: 10, absExposure: 10, blockNumber: 1, readTimestamp: 1700000000000 },
    ],
    etoroPositions: [],
    hedgesExecuted: [],
    residuals: new Map([['AAPL', 0]]),
    ...over,
  };
}

let server: http.Server | undefined;
let port: number;

afterEach((done) => {
  if (server) server.close(() => done());
  else done();
});

function startWith(provider: HedgeStatusProvider, p: number = 0): Promise<number> {
  return new Promise((resolve) => {
    server = startHedgeStatusServer({ port: p, provider });
    server.on('listening', () => {
      const address = server!.address();
      resolve(typeof address === 'object' && address ? address.port : p);
    });
  });
}

describe('hedgeStatusServer', () => {
  it('GET /hedge/snapshot returns 503 before the first tick', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => null,
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/snapshot');
    expect(r.status).toBe(503);
    expect(r.body).toHaveProperty('error');
  });

  it('GET /hedge/snapshot returns 200 with the full envelope after the first tick', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => ({ dailyNotionalUsd: 50, dailyOrders: 1, cycleOrders: 0, dayKey: '2026-05-23' }),
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/snapshot');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      snapshot: { timestamp: 1700000000000 },
      capSnapshot: { dailyOrders: 1 },
      breakerState: { tripped: false },
      killSwitchEngaged: false,
    });
  });

  it('GET /hedge/receipts?limit=5 returns up to 5 receipts', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async (limit: number) =>
        Array.from({ length: limit }, (_, i) => ({
          v: 1 as const,
          id: `r-${i}`,
          timestamp: 1000 + i,
          symbol: 'AAPL',
          side: 'buy' as const,
          notionalUsd: 50,
          success: true,
          beforeExposure: 0,
          afterExposure: 0,
          dryRun: false,
          mode: 'demo' as const,
        })),
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/receipts?limit=5');
    expect(r.status).toBe(200);
    expect(r.body.receipts).toHaveLength(5);
  });

  it('GET /hedge/receipts?limit=NaN returns 400', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/receipts?limit=oops');
    expect(r.status).toBe(400);
  });

  it('GET /hedge/proof/latest returns 404 when no proof exists', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/proof/latest');
    expect(r.status).toBe(404);
    expect(r.body).toHaveProperty('error');
  });

  it('GET /hedge/proof/latest returns 200 with the proof envelope when available', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => ({
        path: '/proofs/run-2026-05-23.md',
        timestamp: 1700000000000,
        summary: 'demo run 2 orders',
      }),
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/proof/latest');
    expect(r.status).toBe(200);
    expect(r.body.path).toContain('run-2026-05-23.md');
  });

  it('any other route → 404', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await get(port, '/hedge/banana');
    expect(r.status).toBe(404);
  });

  it('non-GET method → 405', async () => {
    const provider: HedgeStatusProvider = {
      getLastSnapshot: () => makeSnapshot(),
      getCapSnapshot: () => null,
      getBreakerState: () => ({ tripped: false }),
      isKillSwitchEngaged: () => false,
      readReceipts: async () => [],
      readLatestProof: async () => null,
    };
    port = await startWith(provider);
    const r = await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port,
        path: '/hedge/snapshot',
        method: 'POST',
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const t = Buffer.concat(chunks).toString('utf8');
          let body: any = t;
          try { body = JSON.parse(t); } catch { /* not json */ }
          resolve({ status: res.statusCode ?? 0, body });
        });
      });
      req.on('error', reject);
      req.end();
    });
    expect(r.status).toBe(405);
  });
});
