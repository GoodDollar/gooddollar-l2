import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { SourceStatus } from '../types';

/**
 * Task 0052 polish-coverage: every endpoint that ships a `source` block
 * must avoid leaking `null` top-level fields, and the `deprecations`
 * sub-block must ride iff the legacy `lastAttachAt` alias is on the
 * wire. Walks every endpoint that may emit `source` and re-asserts the
 * rule across the never-attached, source-unavailable, and connected
 * states so a future regression that re-adds a null on any branch
 * trips the build.
 */

const SOURCE_PATHS = [
  '/',
  '/health',
  '/quotes',
  '/quotes/fresh/all',
  '/status/quotes',
  '/quotes/AAPL',
  '/quotes/ZZNOPE',
] as const;

const SCENARIOS: Array<{
  name: string;
  status: SourceStatus;
  expectsTimestamp: boolean;
  expectsDetail: boolean;
}> = [
  {
    name: 'never-attached',
    status: { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null },
    expectsTimestamp: false,
    expectsDetail: false,
  },
  {
    name: 'source-unavailable with detail',
    status: {
      connected: false,
      reason: 'source-unavailable',
      detail: 'redacted ts compile error',
      lastAttachAt: null,
    },
    expectsTimestamp: false,
    expectsDetail: true,
  },
  {
    name: 'source-unavailable post-attach',
    status: {
      connected: false,
      reason: 'source-unavailable',
      detail: 'eToro sandbox is down',
      lastAttachAt: 1700000000000,
    },
    expectsTimestamp: true,
    expectsDetail: true,
  },
  {
    name: 'connected post-attach',
    status: { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 },
    expectsTimestamp: true,
    expectsDetail: false,
  },
];

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

async function fetchSource(
  baseUrl: string,
  path: string,
): Promise<Record<string, unknown> | undefined> {
  const body = (await (await fetch(`${baseUrl}${path}`)).json()) as Record<string, unknown>;
  return body.source as Record<string, unknown> | undefined;
}

describe('source block null-hygiene (task 0052)', () => {
  for (const scenario of SCENARIOS) {
    describe(scenario.name, () => {
      let server: import('http').Server;
      let baseUrl: string;

      beforeAll(async () => {
        const cache = new QuoteCache({ cacheTtlMs: 30_000 });
        const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => scenario.status);
        ({ server, baseUrl } = await listen(app));
      });

      afterAll(async () => {
        await close(server);
      });

      it.each(SOURCE_PATHS)('%s source ships no null top-level field', async (path) => {
        const src = await fetchSource(baseUrl, path);
        expect(src).toBeDefined();
        for (const [key, value] of Object.entries(src!)) {
          expect({ key, value }).not.toEqual(expect.objectContaining({ value: null }));
        }
      });

      it.each(SOURCE_PATHS)('%s deprecations rides iff legacy lastAttachAt is on the wire', async (path) => {
        const src = await fetchSource(baseUrl, path);
        expect(src).toBeDefined();
        const hasLegacy = 'lastAttachAt' in src!;
        const hasDeprecations = 'deprecations' in src!;
        expect(hasDeprecations).toBe(hasLegacy);
      });

      it.each(SOURCE_PATHS)('%s timestamp triplet rides together (Ms+Iso+legacy or none)', async (path) => {
        const src = await fetchSource(baseUrl, path);
        expect(src).toBeDefined();
        const hasMs = 'lastAttachAtMs' in src!;
        const hasIso = 'lastAttachAtIso' in src!;
        const hasLegacy = 'lastAttachAt' in src!;
        expect(hasMs).toBe(scenario.expectsTimestamp);
        expect(hasIso).toBe(scenario.expectsTimestamp);
        expect(hasLegacy).toBe(scenario.expectsTimestamp);
      });

      it.each(SOURCE_PATHS)('%s detail rides iff populated on the input status', async (path) => {
        const src = await fetchSource(baseUrl, path);
        expect(src).toBeDefined();
        if (scenario.status.connected) {
          expect('detail' in src!).toBe(false);
        } else {
          expect('detail' in src!).toBe(scenario.expectsDetail);
        }
      });
    });
  }

  describe('field ordering on the disconnected post-attach branch (task 0041)', () => {
    let server: import('http').Server;
    let baseUrl: string;

    beforeAll(async () => {
      const cache = new QuoteCache({ cacheTtlMs: 30_000 });
      const status: SourceStatus = {
        connected: false,
        reason: 'source-unavailable',
        detail: 'eToro sandbox is down',
        lastAttachAt: 1700000000000,
      };
      const app = createServer(cache, { symbols: ['AAPL'] }, undefined, () => status);
      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await close(server);
    });

    it('canonical lastAttachAtMs precedes legacy lastAttachAt; deprecations is last', async () => {
      const src = await fetchSource(baseUrl, '/health');
      expect(src).toBeDefined();
      const keys = Object.keys(src!);
      const idx = (k: string): number => keys.indexOf(k);
      expect(idx('lastAttachAtMs')).toBeGreaterThan(-1);
      expect(idx('lastAttachAtMs')).toBeLessThan(idx('lastAttachAt'));
      expect(idx('lastAttachAtIso')).toBeGreaterThan(idx('lastAttachAtMs'));
      expect(idx('deprecations')).toBeGreaterThan(idx('lastAttachAt'));
    });
  });
});
