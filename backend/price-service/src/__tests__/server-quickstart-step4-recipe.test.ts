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
 * Task 0056: the WS quickstart step used to ship `CONNECT
 * ws://localhost:9301` — `CONNECT` is HTTP's proxy-tunnel verb,
 * not a WebSocket recipe, and not paste-runnable in any client.
 * The new shape ships `wscat -c ws://…` as the canonical request
 * with `websocat` and a Node `ws` one-liner as alternatives, all
 * embedding the live broadcaster URL on every response.
 *
 * Step number is dynamic: tasks 0077+ added new static HTTP steps,
 * so this test locates the WS recipe by its shape (wscat/websocat
 * verb) rather than by a hardcoded index.
 */
function findWsStep(qs: Array<Record<string, unknown>>): Record<string, unknown> {
  const step = qs.find((s) => /^(wscat|websocat) (-c )?ws:\/\//.test(s.request as string));
  if (!step) throw new Error('WS quickstart step not found in quickstart array');
  return step;
}

describe('quickstart WS recipe paste-runnable (task 0056)', () => {
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

  it('WS step request matches /^(wscat|websocat) (-c )?ws:\\// (PRD acceptance regex)', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    const wsStep = findWsStep(qs);
    expect(wsStep.request as string).toMatch(/^(wscat|websocat) (-c )?ws:\/\//);
  });

  it('WS step request never starts with the bogus CONNECT verb', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    for (const s of qs) {
      expect(s.request as string).not.toMatch(/^CONNECT\s/);
    }
  });

  it('WS step alternatives is a 2-element array carrying websocat + node -e recipes', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const ws = body.websocket as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    const alts = findWsStep(qs).alternatives as string[];
    expect(Array.isArray(alts)).toBe(true);
    expect(alts).toHaveLength(2);
    expect(alts[0]).toBe(`websocat ${ws.url}`);
    expect(alts[1]).toMatch(/^node -e ".*new \(require\('ws'\)\)/);
    expect(alts[1]).toContain(`'${ws.url}'`);
  });

  it('only the WS step carries the alternatives field; static HTTP steps do not', async () => {
    const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
    const qs = body.quickstart as Array<Record<string, unknown>>;
    const wsStep = findWsStep(qs);
    for (const s of qs) {
      if (s === wsStep) {
        expect('alternatives' in s).toBe(true);
      } else {
        expect('alternatives' in s).toBe(false);
      }
    }
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
