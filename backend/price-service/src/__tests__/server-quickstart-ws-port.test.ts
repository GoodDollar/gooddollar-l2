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

/**
 * The WS recipe is the FIRST step whose request matches the wscat/
 * websocat shape; its `step` integer equals `STATIC_QUICKSTART.length
 * + 1` since the static array grows as new tasks add HTTP quickstart
 * steps (0077, 0080, 0081). Both length and step number are derived
 * from the static export so this test stays insulated from future
 * additions.
 */
const WS_REQUEST_RE = /^(wscat|websocat) (-c )?ws:\/\//;
function findWsStep(qs: Array<Record<string, unknown>>): Record<string, unknown> {
  const step = qs.find((s) => WS_REQUEST_RE.test(s.request as string));
  if (!step) throw new Error('WS quickstart step not found');
  return step;
}

describe('GET / quickstart WS step reflects live WS advertisement (tasks 0037, 0056)', () => {
  it('default WS port 9301: WS step request equals "wscat -c " + websocket.url with alternatives list', async () => {
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
      expect(qs.length).toBe(STATIC_QUICKSTART.length + 1);
      const wsStep = findWsStep(qs);
      expect(wsStep.step).toBe(STATIC_QUICKSTART.length + 1);
      expect(wsStep.request).toBe(`wscat -c ${ws.url}`);
      expect(wsStep.request as string).toMatch(/:9301$/);
      const alts = wsStep.alternatives as string[];
      expect(Array.isArray(alts)).toBe(true);
      expect(alts).toHaveLength(2);
      expect(alts[0]).toBe(`websocat ${ws.url}`);
      expect(alts[1]).toContain(`'${ws.url}'`);
      expect(alts[1]).toMatch(/^node -e/);
    } finally {
      await close(server);
    }
  });

  it('custom WS port (44444): WS step request and alternatives all embed the actual websocket.url', async () => {
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
      expect(qs.length).toBe(STATIC_QUICKSTART.length + 1);
      const wsStep = findWsStep(qs);
      expect(wsStep.request).toBe(`wscat -c ${ws.url}`);
      expect(wsStep.request as string).toMatch(/:44444$/);
      const alts = wsStep.alternatives as string[];
      for (const alt of alts) expect(alt).toMatch(/:44444/);
      expect(ws.port).toBe(44444);
    } finally {
      await close(server);
    }
  });

  it('no wsAddressGetter wired: quickstart length === STATIC_QUICKSTART.length (WS step omitted)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const qs = body.quickstart as Array<Record<string, unknown>>;
      expect(qs.length).toBe(STATIC_QUICKSTART.length);
      expect(qs.find((s) => WS_REQUEST_RE.test(s.request as string))).toBeUndefined();
      expect('websocket' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('WS bind failed (listening:false): quickstart omits WS step and websocketError is present', async () => {
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
      expect(qs.length).toBe(STATIC_QUICKSTART.length);
      expect(qs.find((s) => WS_REQUEST_RE.test(s.request as string))).toBeUndefined();
      expect(body.websocket).toBeUndefined();
      const wsErr = body.websocketError as Record<string, unknown>;
      expect(wsErr).toBeDefined();
      expect(wsErr.port).toBe(9301);
    } finally {
      await close(server);
    }
  });

  it('STATIC_QUICKSTART export uses 1-indexed contiguous step numbers and never hardcodes the WS port', () => {
    expect(STATIC_QUICKSTART.length).toBeGreaterThanOrEqual(3);
    STATIC_QUICKSTART.forEach((s, i) => expect(s.step).toBe(i + 1));
    const joined = STATIC_QUICKSTART.map((s) => `${s.request} ${s.goal} ${s.expect}`).join('|');
    expect(joined).not.toMatch(/9301/);
  });
});
