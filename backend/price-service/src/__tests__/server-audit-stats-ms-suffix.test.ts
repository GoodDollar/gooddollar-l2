import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
import { QuoteCache } from '../quote-cache';
import { IngestStats } from '../types';

/**
 * Task 0053 polish-coverage:
 *
 *  1. Wire-shape contract on `/audit/stats`:
 *     - canonical `firstAtMs` / `lastAtMs` always present (null on
 *       a fresh boot)
 *     - legacy `firstAt` / `lastAt` aliases ride iff the canonical
 *       value is non-null, with matching `deprecations.firstAt` /
 *       `deprecations.lastAt` rename pointers
 *     - drift gate: when both fields are on the wire, they must
 *       carry the same number (matches the `count === totalCached`
 *       drift pattern from task 0035)
 *
 *  2. Codebase-wide naming convention guard: every `*At` field
 *     advertised in `ENDPOINT_CATALOG.responseShape` must either
 *     name a known legacy alias (`firstAt`, `lastAt`, `lastAttachAt`,
 *     `timestamp`, `bootAt*` umbrella, `lastUpdateMs`-style legacy)
 *     or be paired with `*Ms` / `*Iso` suffixes in the same string.
 */

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

describe('/audit/stats Ms-suffix wire shape (task 0053)', () => {
  it('null timestamps → canonical Ms+Iso ride; legacy alias + deprecations omitted', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const stats: IngestStats = {
      ingested: 0,
      rejected: 0,
      byReason: {},
      firstAtMs: null,
      lastAtMs: null,
      writeErrors: 0,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, () => stats);
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.firstAtMs).toBeNull();
      expect(body.firstAtIso).toBeNull();
      expect(body.lastAtMs).toBeNull();
      expect(body.lastAtIso).toBeNull();
      expect('firstAt' in body).toBe(false);
      expect('lastAt' in body).toBe(false);
      expect('deprecations' in body).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('populated timestamps → canonical + legacy ship together with rename pointers', async () => {
    const FIRST = 1700000000000;
    const LAST = 1700000005000;
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const stats: IngestStats = {
      ingested: 5,
      rejected: 1,
      byReason: { stale: 1 },
      firstAtMs: FIRST,
      lastAtMs: LAST,
      writeErrors: 0,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, () => stats);
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.firstAtMs).toBe(FIRST);
      expect(body.lastAtMs).toBe(LAST);
      expect(body.firstAt).toBe(FIRST);
      expect(body.lastAt).toBe(LAST);
      const dep = body.deprecations as Record<string, string>;
      expect(dep).toBeDefined();
      expect(dep.firstAt).toMatch(/firstAtMs/);
      expect(dep.lastAt).toMatch(/lastAtMs/);
    } finally {
      await close(server);
    }
  });

  it('drift gate: body.firstAt === body.firstAtMs and body.lastAt === body.lastAtMs', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const stats: IngestStats = {
      ingested: 1,
      rejected: 0,
      byReason: {},
      firstAtMs: 1700000123456,
      lastAtMs: 1700000123456,
      writeErrors: 0,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, () => stats);
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      expect(body.firstAt).toBe(body.firstAtMs);
      expect(body.lastAt).toBe(body.lastAtMs);
    } finally {
      await close(server);
    }
  });

  it('legacy alias only rides when its own canonical sibling is set (asymmetric population)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const stats: IngestStats = {
      ingested: 1,
      rejected: 0,
      byReason: {},
      firstAtMs: 1700000000000,
      lastAtMs: 1700000000000,
      writeErrors: 0,
    };
    const app = createServer(cache, { symbols: ['AAPL'] }, () => stats);
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<
        string,
        unknown
      >;
      const keys = Object.keys(body);
      expect(keys.indexOf('firstAtMs')).toBeLessThan(keys.indexOf('firstAt'));
      expect(keys.indexOf('lastAtMs')).toBeLessThan(keys.indexOf('lastAt'));
    } finally {
      await close(server);
    }
  });
});

describe('codebase-wide *At naming guard (task 0053)', () => {
  /**
   * Whitelist of `*At` field names that legitimately ship without an
   * `Ms`/`Iso` suffix. `firstAt` / `lastAt` are LEGACY aliases shipping
   * for one deprecation window; `lastAttachAt` is the source-block
   * legacy alias (task 0039); `timestamp` is the canonical envelope
   * top-level pair (grandfathered).
   */
  const ALLOWED_LEGACY_AT_FIELDS = new Set<string>([
    'firstAt',
    'lastAt',
    'lastAttachAt',
    'timestamp',
    'bootAt',
    'cacheAge',
  ]);

  it('every *At fragment in a responseShape is paired with *Ms/*Iso or whitelisted as legacy', () => {
    const offenders: string[] = [];
    const atFragmentRe = /\b([a-z][a-zA-Z]*)At(?!Ms|Iso)\b/g;
    for (const e of ENDPOINT_CATALOG) {
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      const re = new RegExp(atFragmentRe.source, 'g');
      while ((m = re.exec(e.responseShape)) !== null) {
        const full = `${m[1]}At`;
        if (seen.has(full)) continue;
        seen.add(full);
        if (ALLOWED_LEGACY_AT_FIELDS.has(full)) continue;
        const msPair = new RegExp(`\\b${full}Ms\\b`).test(e.responseShape);
        const isoPair = new RegExp(`\\b${full}Iso\\b`).test(e.responseShape);
        if (!(msPair && isoPair)) offenders.push(`${e.path}: ${full}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
