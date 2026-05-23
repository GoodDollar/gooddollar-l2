import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

const dummyReq = new NextRequest('http://localhost/api/hedge/status');

const SNAPSHOT_ENVELOPE = {
  snapshot: {
    timestamp: 1700000000000,
    exposures: [],
    etoroPositions: [],
    hedgesExecuted: [],
    residuals: {},
  },
  capSnapshot: { dailyNotionalUsd: 50, dailyOrders: 1, cycleOrders: 0, dayKey: '2026-05-23' },
  breakerState: { tripped: false },
  killSwitchEngaged: false,
  mode: 'demo' as const,
};

const RECEIPTS_RESPONSE = {
  receipts: [
    {
      v: 1,
      id: 'r-1',
      timestamp: 1700000000000,
      symbol: 'AAPL',
      side: 'buy',
      notionalUsd: 50,
      success: true,
      etoroOrderId: 'etoro-1',
      beforeExposure: 100,
      afterExposure: 50,
      dryRun: false,
      mode: 'demo',
    },
  ],
};

const PROOF_RESPONSE = {
  path: '.autobuilder/initiatives/0007e-hedging-demo/proofs/run-2026-05-23.md',
  timestamp: 1700000000000,
  summary: 'demo — 1 receipts (1 ok, 0 failed)',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/hedge/status', () => {
  it('200 happy path — merges snapshot + receipts + proof', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockImplementation(async (url: string | URL | Request) => {
      const u = url.toString();
      if (u.includes('/hedge/snapshot')) {
        return new Response(JSON.stringify(SNAPSHOT_ENVELOPE), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/hedge/receipts')) {
        return new Response(JSON.stringify(RECEIPTS_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/hedge/proof/latest')) {
        return new Response(JSON.stringify(PROOF_RESPONSE), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw new Error(`unexpected fetch: ${u}`);
    });

    const res = await GET(dummyReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.snapshot).toEqual(SNAPSHOT_ENVELOPE.snapshot);
    expect(body.capSnapshot).toEqual(SNAPSHOT_ENVELOPE.capSnapshot);
    expect(body.breakerState).toEqual({ tripped: false });
    expect(body.killSwitchEngaged).toBe(false);
    expect(body.mode).toBe('demo');
    expect(body.receipts).toHaveLength(1);
    expect(body.proof.path).toContain('run-');
  });

  it('forwards mode=null when the engine envelope omits mode', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: string | URL | Request) => {
      const u = url.toString();
      if (u.includes('/hedge/snapshot')) {
        const env = { ...SNAPSHOT_ENVELOPE } as { mode?: string };
        delete env.mode;
        return new Response(JSON.stringify(env), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (u.includes('/hedge/receipts')) {
        return new Response(JSON.stringify({ receipts: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'no_proof_yet' }), { status: 404 });
    });
    const res = await GET(dummyReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBeNull();
  });

  it('503 envelope includes mode:null for stable shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await GET(dummyReq);
    const body = await res.json();
    expect(body.mode).toBeNull();
  });

  it('returns a 503 envelope when the hedge engine is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await GET(dummyReq);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('unreachable');
    expect(body.snapshot).toBeNull();
    expect(body.receipts).toEqual([]);
  });

  it('returns 502 when /hedge/snapshot returns a non-503 error', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('boom', { status: 500 }));
    const res = await GET(dummyReq);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('error');
  });

  it('tolerates a 503 from /hedge/snapshot (engine alive, no tick yet)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: string | URL | Request) => {
      const u = url.toString();
      if (u.includes('/hedge/snapshot')) {
        return new Response(JSON.stringify({ error: 'no_snapshot_yet' }), { status: 503 });
      }
      if (u.includes('/hedge/receipts')) {
        return new Response(JSON.stringify({ receipts: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'no_proof_yet' }), { status: 404 });
    });
    const res = await GET(dummyReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.snapshot).toBeNull();
    expect(body.receipts).toEqual([]);
    expect(body.proof).toBeNull();
  });
});

describe('POST /api/hedge/status', () => {
  it('rejects non-GET methods with 405', async () => {
    const req = new NextRequest('http://localhost/api/hedge/status', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(405);
  });
});
