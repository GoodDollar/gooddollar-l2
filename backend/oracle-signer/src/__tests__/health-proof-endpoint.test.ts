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

  it('forwards ingest counters when the proof provider includes them', async () => {
    const store = new ProofStore();
    const ingest = {
      accepted: 42, droppedJsonParse: 3, droppedShape: 0,
      droppedInvalidMid: 1, droppedMissingSymbol: 0,
    };
    const srv = await withServer({
      proofProvider: () => ({ ...store.snapshot(), ingest }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ingest).toEqual(ingest);
    await srv.close();
  });
});

describe('GET /proof — service status (task 0010)', () => {
  it('returns 200 + service.status:ok by default (no proofStatusProvider)', async () => {
    const store = new ProofStore();
    const srv = await withServer({ proofProvider: () => store.snapshot() });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toEqual({ status: 'ok' });
    await srv.close();
  });

  it('returns 200 + service.status:ok when proofStatusProvider reports ok', async () => {
    const store = new ProofStore();
    const srv = await withServer({
      proofProvider: () => store.snapshot(),
      proofStatusProvider: () => ({ status: 'ok' }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toEqual({ status: 'ok' });
    await srv.close();
  });

  it('returns 503 + service.status:degraded when proofStatusProvider reports degraded', async () => {
    const store = new ProofStore();
    const srv = await withServer({
      proofProvider: () => store.snapshot(),
      proofStatusProvider: () => ({ status: 'degraded', reason: 'refused: non-devnet chain id 1' }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.service).toEqual({ status: 'degraded', reason: 'refused: non-devnet chain id 1' });
    expect(Array.isArray(body.stocks)).toBe(true);
    expect(Array.isArray(body.crypto)).toBe(true);
    expect(typeof body.generatedAt).toBe('number');
    await srv.close();
  });

  it('503 body preserves the canonical proof shape (rails, counts, failures present)', async () => {
    const store = new ProofStore();
    const srv = await withServer({
      proofProvider: () => store.snapshot(),
      proofStatusProvider: () => ({ status: 'degraded', reason: 'no rail configured' }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.rails.stocks.enabled).toBe(false);
    expect(body.rails.crypto.enabled).toBe(false);
    expect(body.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    });
    expect(body.failures).toEqual({ stocks: [], crypto: [] });
    await srv.close();
  });

  it('omits service.reason when provider reports ok', async () => {
    const store = new ProofStore();
    const srv = await withServer({
      proofProvider: () => store.snapshot(),
      proofStatusProvider: () => ({ status: 'ok' }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    const body = JSON.parse(res.body);
    expect(body.service.reason).toBeUndefined();
    await srv.close();
  });

  it('forwards a long-hex-bearing reason verbatim from the provider (provider redacts upstream)', async () => {
    // The provider's responsibility is to pass a redacted reason. The
    // health server does not double-redact; it just merges what it's given.
    const store = new ProofStore();
    const srv = await withServer({
      proofProvider: () => store.snapshot(),
      proofStatusProvider: () => ({ status: 'degraded', reason: 'rpc error <redacted-hex>' }),
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    const body = JSON.parse(res.body);
    expect(body.service.reason).toBe('rpc error <redacted-hex>');
    await srv.close();
  });
  it('returns canonical redacted degraded shape when proof provider throws', async () => {
    const srv = await withServer({
      proofProvider: () => { throw new Error('boom 0x' + 'a'.repeat(64)); },
    });
    const res = await get(`http://127.0.0.1:${srv.port}/proof`);
    expect(res.status).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.service).toEqual({ status: 'degraded', reason: 'proof provider error' });
    expect(body.stocks).toEqual([]);
    expect(body.crypto).toEqual([]);
    expect(body.counts).toEqual({ stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } });
    expect(JSON.stringify(body)).not.toContain('boom');
    await srv.close();
  });

});
