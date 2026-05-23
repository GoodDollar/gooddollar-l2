import { WebSocketServer } from 'ws';
import express from 'express';
import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { createServer } from '../server';

describe('WsBroadcaster.getStatus — bind-failure surface (task 0032)', () => {
  it('defaults to listening:false, bindError:null, port:null pre-start', () => {
    const bc = new WsBroadcaster();
    expect(bc.getStatus()).toEqual({
      listening: false,
      bindError: null,
      port: null,
    });
  });

  it("flips listening:true and records port on 'listening' event", (done) => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const bc = new WsBroadcaster();
    const wss = bc.start(0, cache);
    wss.on('listening', () => {
      const s = bc.getStatus();
      expect(s.listening).toBe(true);
      expect(s.bindError).toBe(null);
      expect(s.port).toBeGreaterThan(0);
      bc.stop();
      done();
    });
  });

  it("flips listening:false and records ws-bind-failed slug on EADDRINUSE-shaped error", (done) => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const bc = new WsBroadcaster();
    const wss = bc.start(0, cache);
    wss.on('listening', () => {
      const synthetic = Object.assign(
        new Error('listen EADDRINUSE: address already in use :::65535'),
        { code: 'EADDRINUSE' as const },
      );
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      wss.emit('error', synthetic);
      setTimeout(() => {
        const s = bc.getStatus();
        expect(s.listening).toBe(false);
        expect(s.bindError).toBe('ws-bind-failed');
        errSpy.mockRestore();
        bc.stop();
        done();
      }, 10);
    });
  });

  it('EADDRINUSE repro: second broadcaster on same port reports listening:false', (done) => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const a = new WsBroadcaster();
    const wssA = a.start(0, cache);
    wssA.on('listening', () => {
      const addr = wssA.address() as { port: number };
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const b = new WsBroadcaster();
      const wssB = b.start(addr.port, cache);
      wssB.on('error', () => {
        const s = b.getStatus();
        expect(s.listening).toBe(false);
        expect(s.bindError).toBe('ws-bind-failed');
        errSpy.mockRestore();
        a.stop();
        b.stop();
        done();
      });
    });
  });

  it('stop() resets the status to defaults', (done) => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const bc = new WsBroadcaster();
    const wss = bc.start(0, cache);
    wss.on('listening', () => {
      bc.stop();
      expect(bc.getStatus()).toEqual({
        listening: false,
        bindError: null,
        port: null,
      });
      done();
    });
  });
});

async function listen(app: express.Express): Promise<{ server: import('http').Server; baseUrl: string }> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(server: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

const wsDownGetter = () => ({
  listening: false,
  bindError: 'ws-bind-failed',
  port: 3123,
});

const wsUpGetter = () => ({
  listening: true,
  bindError: null,
  port: 3123,
});

describe('server with wsStatusGetter reporting bind failure (task 0032)', () => {
  it('/health returns 503 and omits websocket; includes websocketError block', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update({
      source: 'etoro', symbol: 'AAPL', instrumentId: 'AAPL-1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5, spread: 1, spreadPct: 0.995,
      timestamp: Date.now(), sessionState: 'open', confidence: 1, stale: false,
    });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 3123 }),
      wsDownGetter,
    );
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/health`);
      expect(r.status).toBe(503);
      const body = await r.json() as Record<string, unknown>;
      expect(body.status).toBe('degraded');
      expect(body.websocket).toBeUndefined();
      const wsErr = body.websocketError as Record<string, unknown>;
      expect(wsErr).toBeDefined();
      expect(wsErr.reason).toBe('ws-bind-failed');
      expect(wsErr.port).toBe(3123);
      expect(typeof wsErr.humanReason).toBe('string');
      expect(typeof wsErr.nextStep).toBe('string');
      expect(wsErr.severity).toBe('critical');
    } finally {
      await close(server);
    }
  });

  it('/status/quotes returns 503 + healthy:false when WS is down (cache+source healthy)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update({
      source: 'etoro', symbol: 'AAPL', instrumentId: 'AAPL-1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5, spread: 1, spreadPct: 0.995,
      timestamp: Date.now(), sessionState: 'open', confidence: 1, stale: false,
    });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => ({ connected: true, symbols: ['AAPL'], lastAttachAt: Date.now() }),
      undefined,
      () => ({ port: 3123 }),
      wsDownGetter,
    );
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/status/quotes`);
      expect(r.status).toBe(503);
      const body = await r.json() as Record<string, unknown>;
      expect(body.healthy).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('GET / has status:"degraded" and websocketError but no websocket', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 3123 }),
      wsDownGetter,
    );
    const { server, baseUrl } = await listen(app);
    try {
      const body = await (await fetch(`${baseUrl}/`)).json() as Record<string, unknown>;
      expect(body.status).toBe('degraded');
      expect(body.websocket).toBeUndefined();
      expect(body.websocketError).toBeDefined();
    } finally {
      await close(server);
    }
  });

  it('404 catch-all endpoints[] excludes the ws:// row when WS down', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 3123 }),
      wsDownGetter,
    );
    const { server, baseUrl } = await listen(app);
    try {
      const body = await (await fetch(`${baseUrl}/no-such-path`)).json() as {
        endpoints: Array<{ path: string }>;
      };
      const wsRow = body.endpoints.find((e) => e.path.startsWith('ws://'));
      expect(wsRow).toBeUndefined();
    } finally {
      await close(server);
    }
  });

  it("regression: no wsStatusGetter wired → today's behaviour unchanged", async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update({
      source: 'etoro', symbol: 'AAPL', instrumentId: 'AAPL-1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5, spread: 1, spreadPct: 0.995,
      timestamp: Date.now(), sessionState: 'open', confidence: 1, stale: false,
    });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 3123 }),
    );
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/health`);
      expect(r.status).toBe(200);
      const body = await r.json() as Record<string, unknown>;
      expect(body.websocket).toBeDefined();
      expect(body.websocketError).toBeUndefined();
    } finally {
      await close(server);
    }
  });

  it('wsStatusGetter reporting listening:true → /health 200, websocket present, no websocketError', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    cache.update({
      source: 'etoro', symbol: 'AAPL', instrumentId: 'AAPL-1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5, spread: 1, spreadPct: 0.995,
      timestamp: Date.now(), sessionState: 'open', confidence: 1, stale: false,
    });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 3123 }),
      wsUpGetter,
    );
    const { server, baseUrl } = await listen(app);
    try {
      const r = await fetch(`${baseUrl}/health`);
      expect(r.status).toBe(200);
      const body = await r.json() as Record<string, unknown>;
      expect(body.websocket).toBeDefined();
      expect(body.websocketError).toBeUndefined();
    } finally {
      await close(server);
    }
  });

  it("responseShape for / and /health mention websocketError? and stay ≤ 240 chars", async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const root = await (await fetch(`${baseUrl}/`)).json() as {
        endpoints: Array<{ path: string; responseShape: string }>;
      };
      const slash = root.endpoints.find((e) => e.path === '/');
      const health = root.endpoints.find((e) => e.path === '/health');
      expect(slash!.responseShape).toMatch(/websocketError\?/);
      expect(health!.responseShape).toMatch(/websocketError\?/);
      expect(slash!.responseShape.length).toBeLessThanOrEqual(240);
      expect(health!.responseShape.length).toBeLessThanOrEqual(240);
    } finally {
      await close(server);
    }
  });
});
