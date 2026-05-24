import * as http from 'http';
import { AddressInfo } from 'net';
import { startHealthServer } from '../healthServer';
import { ProofStore } from '../proof-store';

async function get(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let chunks = '';
      res.on('data', (c) => { chunks += c.toString(); });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: chunks }));
    }).on('error', reject);
  });
}

function withServer(opts: {
  proofProvider?: () => unknown;
  proofStatusProvider?: () => { status: 'ok' | 'degraded'; reason?: string };
} = {}): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = startHealthServer({
      name: 'oracle-signer',
      port: 0,
      proofProvider: opts.proofProvider,
      proofStatusProvider: opts.proofStatusProvider,
    });
    server.on('listening', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        port,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

describe('GET /proof', () => {
  it('returns canonical proof shape when provider is wired', async () => {
    const store = new ProofStore();
    store.setRailEnabled('stocks', true);
    store.record('stocks', {
      txHash: '0xS1',
      blockNumber: 1,
      gasUsed: '100',
      symbols: ['AAPL'],
      roundTripMs: 5,
      submittedAtMs: 1,
      mids: { AAPL: 191.5 },
    });

    const srv = await withServer({ proofProvider: () => store.snapshot() });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toEqual({ status: 'ok' });
    expect(body.stocks[0].txHash).toBe('0xS1');
    expect(body.crypto).toEqual([]);
    expect(body.rails.stocks.enabled).toBe(true);
    expect(body.failures).toEqual({ stocks: [], crypto: [] });
    expect(body.counts).toEqual({
      stocks: { ok: 1, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    });

    await srv.close();
  });

  it('preserves canonical shape on degraded proof responses', async () => {
    const store = new ProofStore();
    const srv = await withServer({
      proofProvider: () => store.snapshot(),
      proofStatusProvider: () => ({ status: 'degraded', reason: 'ORACLE_SIGNER_KEY is not set; signer loop disabled' }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);

    expect(res.status).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.service).toEqual({
      status: 'degraded',
      reason: 'ORACLE_SIGNER_KEY is not set; signer loop disabled',
    });
    expect(body.rails.stocks.enabled).toBe(false);
    expect(body.failures).toEqual({ stocks: [], crypto: [] });
    expect(body.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    });

    await srv.close();
  });

  it('keeps /health behavior when no proof provider is wired', async () => {
    const srv = await withServer();

    const proof = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(proof.status).toBe(404);

    const health = await get(`http://127.0.0.1:${srv.port}/health`);
    expect(health.status).toBe(200);
    expect(JSON.parse(health.body).service).toBe('oracle-signer');

    await srv.close();
  });
});
