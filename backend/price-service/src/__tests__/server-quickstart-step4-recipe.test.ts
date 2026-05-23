import express from 'express';
import { createServer, buildWsQuickstartAlternatives } from '../server';
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
 * Task 0056: step 4 of the quickstart used to ship `CONNECT
 * ws://localhost:9301` — `CONNECT` is HTTP's proxy-tunnel verb,
 * not a WebSocket recipe, and not paste-runnable in any client.
 * The new shape ships `wscat -c ws://…` as the canonical request
 * with `websocat` and a Node `ws` one-liner as alternatives, all
 * embedding the live broadcaster URL on every response.
 */
describe('quickstart step 4 paste-runnable WS recipe (task 0056)', () => {
  let server: import('http').Server;
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
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  it('step 4 request matches /^(wscat|websocat) (-c )?ws:\\// (PRD acceptance regex)', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    const step4 = qs[3];
    expect(step4.request as string).toMatch(/^(wscat|websocat) (-c )?ws:\/\//);
  });

  it('step 4 request never starts with the bogus CONNECT verb', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    expect(qs[3].request as string).not.toMatch(/^CONNECT\s/);
  });

  it('step 4 alternatives is a 2-element array carrying websocat + node -e recipes', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const ws = body.websocket as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    const alts = qs[3].alternatives as string[];
    expect(Array.isArray(alts)).toBe(true);
    expect(alts).toHaveLength(2);
    expect(alts[0]).toBe(`websocat ${ws.url}`);
    expect(alts[1]).toMatch(/^node -e ".*new \(require\('ws'\)\)/);
    expect(alts[1]).toContain(`'${ws.url}'`);
  });

  it('static HTTP steps 1–3 do NOT carry the alternatives field (only step 4 has it)', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    expect(qs).toHaveLength(4);
    for (let i = 0; i < 3; i++) {
      expect('alternatives' in qs[i]).toBe(false);
    }
    expect('alternatives' in qs[3]).toBe(true);
  });

  it('buildWsQuickstartAlternatives is pure: same URL → same recipes', () => {
    const url = 'ws://example.com:9999';
    const a = buildWsQuickstartAlternatives(url);
    const b = buildWsQuickstartAlternatives(url);
    expect(a).toEqual(b);
    expect(a[0]).toBe(`websocat ${url}`);
    expect(a[1]).toContain(`'${url}'`);
  });
});
