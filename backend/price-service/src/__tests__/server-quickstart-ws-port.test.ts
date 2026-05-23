import express from 'express';
import { createServer, STATIC_QUICKSTART } from '../server';
import { QuoteCache } from '../quote-cache';

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

describe('GET / quickstart step 4 reflects live WS advertisement (task 0037)', () => {
  it('default WS port 9301: step 4 request equals "CONNECT " + websocket.url', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 9301 }),
    );
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const qs = body.quickstart as Array<Record<string, unknown>>;
      const ws = body.websocket as Record<string, unknown>;
      expect(qs.length).toBe(4);
      expect(qs[3].step).toBe(4);
      expect(qs[3].request).toBe(`CONNECT ${ws.url}`);
      expect(qs[3].request).toMatch(/:9301$/);
    } finally {
      await close(server);
    }
  });

  it('custom WS port (44444): step 4 request matches the actual websocket.url', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 44444 }),
    );
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const qs = body.quickstart as Array<Record<string, unknown>>;
      const ws = body.websocket as Record<string, unknown>;
      expect(qs.length).toBe(4);
      expect(qs[3].request).toBe(`CONNECT ${ws.url}`);
      expect(qs[3].request).toMatch(/:44444$/);
      expect(ws.port).toBe(44444);
    } finally {
      await close(server);
    }
  });

  it('no wsAddressGetter wired: quickstart length === 3 (step 4 omitted)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const qs = body.quickstart as Array<Record<string, unknown>>;
      expect(qs.length).toBe(3);
      expect(qs.find((s) => s.step === 4)).toBeUndefined();
      expect('websocket' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('WS bind failed (listening:false): quickstart length === 3 and websocketError present', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 9301 }),
      () => ({ listening: false, bindError: 'ws-bind-failed', port: 9301 }),
    );
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const qs = body.quickstart as Array<Record<string, unknown>>;
      expect(qs.length).toBe(3);
      expect(qs.find((s) => s.step === 4)).toBeUndefined();
      expect(body.websocket).toBeUndefined();
      const wsErr = body.websocketError as Record<string, unknown>;
      expect(wsErr).toBeDefined();
      expect(wsErr.port).toBe(9301);
    } finally {
      await close(server);
    }
  });

  it('STATIC_QUICKSTART export carries exactly steps 1..3 and no literal 9301', () => {
    expect(STATIC_QUICKSTART.length).toBe(3);
    expect(STATIC_QUICKSTART.map((s) => s.step)).toEqual([1, 2, 3]);
    const joined = STATIC_QUICKSTART.map((s) => `${s.request} ${s.goal} ${s.expect}`).join('|');
    expect(joined).not.toMatch(/9301/);
  });
});
