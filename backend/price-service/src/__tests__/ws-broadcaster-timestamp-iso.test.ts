import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { computeSpread, NormalizedQuote } from '../types';
import { createServer } from '../server';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.5,
    ask: 189.6,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 1,
    stale: false,
    ...overrides,
  };
  return computeSpread(base);
}

/**
 * Task 0048 closes a REST/WS drift on timestamps. Every REST envelope
 * ships `{timestamp, timestampIso}` per task 0023 via finalizeTimestamps;
 * the broadcaster bypassed that helper and shipped only `timestamp` (ms)
 * on both snapshot and quote frames. Consumers subscribed to BOTH
 * surfaces had to write a polymorphic
 * `tsString = body.timestampIso ?? new Date(body.timestamp).toISOString()`.
 *
 * After this task: both frames carry the same `{timestamp, timestampIso}`
 * pair, derived from a single `Date.now()` so the per-frame relation
 * `new Date(frame.timestamp).toISOString() === frame.timestampIso`
 * holds bit-for-bit.
 */
describe('WS frames carry timestampIso companion (task 0048)', () => {
  let broadcaster: WsBroadcaster;
  let cache: QuoteCache;
  let port: number;
  let wss: WebSocketServer;

  beforeEach((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    broadcaster = new WsBroadcaster();
    wss = broadcaster.start(0, cache);
    wss.on('listening', () => {
      const addr = wss.address();
      if (typeof addr === 'object' && addr) port = addr.port;
      done();
    });
  });

  afterEach(() => {
    broadcaster.stop();
  });

  it('snapshot frame: timestamp + timestampIso refer to the same instant', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('message', (data) => {
      const f = JSON.parse(data.toString()) as Record<string, unknown>;
      expect(f.type).toBe('snapshot');
      expect(typeof f.timestamp).toBe('number');
      expect(typeof f.timestampIso).toBe('string');
      expect(new Date(f.timestamp as number).toISOString()).toBe(
        f.timestampIso,
      );
      client.close();
      done();
    });
  });

  it('snapshot frame: timestampIso sits immediately after timestamp', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('message', (data) => {
      const f = JSON.parse(data.toString()) as Record<string, unknown>;
      const keys = Object.keys(f);
      const tsIdx = keys.indexOf('timestamp');
      const isoIdx = keys.indexOf('timestampIso');
      expect(tsIdx).toBeGreaterThanOrEqual(0);
      expect(isoIdx).toBe(tsIdx + 1);
      client.close();
      done();
    });
  });

  it('quote frame: timestamp + timestampIso refer to the same instant', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    let sawSnapshot = false;
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', last: 195 }));
    });
    client.on('message', (data) => {
      const f = JSON.parse(data.toString()) as Record<string, unknown>;
      if (f.type === 'snapshot') {
        sawSnapshot = true;
        return;
      }
      expect(sawSnapshot).toBe(true);
      expect(f.type).toBe('quote');
      expect(typeof f.timestamp).toBe('number');
      expect(typeof f.timestampIso).toBe('string');
      expect(new Date(f.timestamp as number).toISOString()).toBe(
        f.timestampIso,
      );
      client.close();
      done();
    });
  });

  it('quote frame: timestampIso sits immediately after timestamp', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', last: 199 }));
    });
    client.on('message', (data) => {
      const f = JSON.parse(data.toString()) as Record<string, unknown>;
      if (f.type === 'snapshot') return;
      const keys = Object.keys(f);
      const tsIdx = keys.indexOf('timestamp');
      const isoIdx = keys.indexOf('timestampIso');
      expect(isoIdx).toBe(tsIdx + 1);
      client.close();
      done();
    });
  });
});

describe('WS_FRAME_DOCS at /health name timestampIso for both frames (task 0048)', () => {
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
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as import('net').AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /health.websocket.snapshot doc string mentions timestampIso', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as { websocket: Record<string, unknown> };
    expect(body.websocket.snapshot).toMatch(/timestampIso/);
  });

  it('GET /health.websocket.quote doc string mentions timestampIso', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as { websocket: Record<string, unknown> };
    expect(body.websocket.quote).toMatch(/timestampIso/);
  });

  it('GET / .websocket.snapshot doc string mentions timestampIso', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as { websocket: Record<string, unknown> };
    expect(body.websocket.snapshot).toMatch(/timestampIso/);
  });
});
