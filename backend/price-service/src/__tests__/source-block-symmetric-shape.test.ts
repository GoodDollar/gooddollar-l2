import express from 'express';
import {
  REASON_CATALOG,
  sanitizeSourceStatus,
  SourceSeverity,
} from '../source-status';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';

function listen(app: express.Express): Promise<{
  server: ReturnType<express.Express['listen']>;
  baseUrl: string;
}> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as import('net').AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

/**
 * Task 0019 added `humanReason`, `nextStep`, `severity` enrichment to the
 * disconnected branch of `sanitizeSourceStatus`. The connected branch
 * was left with the original `{symbols, lastAttachAtMs, ...}` shape, so
 * a consumer rendering a single coloured "source health" badge keyed
 * on `body.source.severity` got `undefined` exactly when the source
 * was healthy — the worst possible asymmetry.
 *
 * Task 0050 adds a fourth catalog slug (`connected` / severity `'ok'`)
 * and ships it on the connected branch, so both branches share the
 * same enrichment field-set and a consumer can render either one
 * with a single render path.
 */
describe('SanitizedSourceStatus is symmetric across branches (task 0050)', () => {
  it('connected branch carries reason, humanReason, nextStep, severity', () => {
    const out = sanitizeSourceStatus({
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    });
    if (!out.connected) throw new Error('expected connected branch');
    expect(out.reason).toBe('connected');
    expect(out.humanReason).toBe(REASON_CATALOG['connected'].humanReason);
    expect(out.nextStep).toBe(REASON_CATALOG['connected'].nextStep);
    expect(out.severity).toBe('ok');
    expect(out.symbols).toEqual(['AAPL']);
  });

  it('disconnected branch unchanged for known catalog slugs', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    if (out.connected) throw new Error('expected disconnected branch');
    expect(out.reason).toBe('not-attached');
    expect(out.humanReason).toBe(REASON_CATALOG['not-attached'].humanReason);
    expect(out.severity).toBe('info');
  });

  it('shared field-set: both branches expose the four enrichment keys', () => {
    const conn = sanitizeSourceStatus({
      connected: true,
      symbols: [],
      lastAttachAt: 1,
    });
    const disc = sanitizeSourceStatus({
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    const shared = ['reason', 'humanReason', 'nextStep', 'severity'];
    for (const k of shared) {
      expect(Object.keys(conn)).toContain(k);
      expect(Object.keys(disc)).toContain(k);
    }
  });

  it('drift gate: every branch output reason is a key of REASON_CATALOG', () => {
    const samples = [
      { connected: true as const, symbols: [] as string[], lastAttachAt: 1 },
      { connected: false as const, reason: 'not-attached', lastAttachAt: null },
      {
        connected: false as const,
        reason: 'etoro-client-not-installed',
        lastAttachAt: null,
      },
      {
        connected: false as const,
        reason: 'source-unavailable',
        lastAttachAt: null,
      },
    ];
    for (const s of samples) {
      const out = sanitizeSourceStatus(s);
      expect(REASON_CATALOG[out.reason]).toBeDefined();
    }
  });

  it('SourceSeverity widens to include "ok"', () => {
    const ok: SourceSeverity = 'ok';
    expect(ok).toBe('ok');
  });
});

describe('/docs/source-reasons advertises the connected slug (task 0050)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('catalog includes connected with severity ok', async () => {
    const res = await fetch(`${baseUrl}/docs/source-reasons`);
    const body = (await res.json()) as {
      reasons: Record<string, { severity: string }>;
      count: number;
    };
    expect(body.reasons.connected).toBeDefined();
    expect(body.reasons.connected.severity).toBe('ok');
  });

  it('catalog count reflects all four slugs', async () => {
    const res = await fetch(`${baseUrl}/docs/source-reasons`);
    const body = (await res.json()) as { count: number };
    expect(body.count).toBe(4);
  });
});

describe('/health connected branch ships catalog enrichment (task 0050)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => ({
        connected: true,
        symbols: ['AAPL'],
        lastAttachAt: 1700000000000,
      }),
    );
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('source.severity === "ok" on the connected branch', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as {
      source: Record<string, unknown>;
    };
    expect(body.source.connected).toBe(true);
    expect(body.source.severity).toBe('ok');
    expect(body.source.reason).toBe('connected');
    expect(body.source.humanReason).toBe(
      REASON_CATALOG['connected'].humanReason,
    );
    expect(body.source.nextStep).toBe(REASON_CATALOG['connected'].nextStep);
    expect(body.source.symbols).toEqual(['AAPL']);
  });
});
