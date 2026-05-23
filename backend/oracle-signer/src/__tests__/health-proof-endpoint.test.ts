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

function withServer(opts: { proofProvider?: () => unknown } = {}): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = startHealthServer({
      name: 'oracle-signer',
      port: 0,
      proofProvider: opts.proofProvider,
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
  it('returns 200 with proof snapshot when provider is wired', async () => {
    const store = new ProofStore();
    store.record('stocks', {
      txHash: '0xS1', blockNumber: 1, gasUsed: '100', symbols: ['AAPL'],
      roundTripMs: 5, submittedAtMs: 1, mids: { AAPL: 191.5 },
    });

    const srv = await withServer({ proofProvider: () => store.snapshot() });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.stocks).toHaveLength(1);
    expect(body.stocks[0].txHash).toBe('0xS1');
    expect(Array.isArray(body.crypto)).toBe(true);
    expect(typeof body.generatedAt).toBe('number');

    await srv.close();
  });

  it('returns 200 with empty rails when nothing has been recorded yet', async () => {
    const store = new ProofStore();
    const srv = await withServer({ proofProvider: () => store.snapshot() });

    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.stocks).toEqual([]);
    expect(body.crypto).toEqual([]);
    await srv.close();
  });

  it('returns 404 when no proof provider is wired (back-compat)', async () => {
    const srv = await withServer();
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(404);
    await srv.close();
  });

  it('GET /health remains the same shape', async () => {
    const srv = await withServer();
    const res = await get(`http://127.0.0.1:${srv.port}/health`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toBe('oracle-signer');
    expect(body.status).toMatch(/ok|degraded/);
    await srv.close();
  });
});
