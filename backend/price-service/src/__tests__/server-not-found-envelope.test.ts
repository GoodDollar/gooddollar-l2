import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { ERROR_REASONS_PUBLIC } from '../source-status';

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
 * Tasks 0050 (source-block disconnected branch) and 0057 (405 envelope)
 * pinned the operator-readable error contract on every other 4xx/5xx
 * body. Task 0063 brings the catch-all 404 onto the same contract so a
 * consumer routing 4xx envelopes to a runbook page can dispatch on
 * `severity` for every reachable error path.
 */
describe('catch-all 404 envelope enrichment (task 0063)', () => {
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

  const CASES: ReadonlyArray<{ path: string; label: string }> = [
    { path: '/foo', label: 'bare typo' },
    { path: '/HEALTH', label: 'case-fold steer' },
    { path: '/quotes/aapl/', label: 'trailing-slash steer (parametric)' },
    { path: '/quotes/', label: 'parametric parent' },
    { path: '/etc/passwd', label: 'multi-segment typo' },
  ];

  it.each(CASES)('$label — body carries error,message,humanReason,severity,nextStep', async ({ path }) => {
    const res = await fetch(`${baseUrl}${path}`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(typeof body.message).toBe('string');
    expect((body.message as string).length).toBeGreaterThan(0);
    expect(typeof body.humanReason).toBe('string');
    expect((body.humanReason as string).length).toBeGreaterThan(0);
    expect(body.severity).toBe('info');
    expect(typeof body.nextStep).toBe('string');
    expect((body.nextStep as string).length).toBeGreaterThan(0);
  });

  it.each(CASES)('$label — leading key order is error,message,humanReason,severity,nextStep', async ({ path }) => {
    const res = await fetch(`${baseUrl}${path}`);
    const body = (await res.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    expect(keys.slice(0, 5)).toEqual([
      'error',
      'message',
      'humanReason',
      'severity',
      'nextStep',
    ]);
  });

  it('parametric parent /quotes/ rides PARAMETRIC_PARENT_MESSAGE on message (NOT humanReason)', async () => {
    const res = await fetch(`${baseUrl}/quotes/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toMatch(/append a ticker/);
    expect(body.humanReason).not.toMatch(/append a ticker/);
    expect(body.humanReason).toBe(ERROR_REASONS_PUBLIC['not-found']!.humanReason);
  });

  it('bare typo /foo has per-request message that names method + path', async () => {
    const res = await fetch(`${baseUrl}/foo`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toMatch(/GET/);
    expect(body.message).toMatch(/\/foo/);
  });

  it('every 404 body is below the 1024-byte boot guard', async () => {
    for (const { path } of CASES) {
      const res = await fetch(`${baseUrl}${path}`);
      const text = await res.text();
      expect(Buffer.byteLength(text, 'utf8')).toBeLessThanOrEqual(1024);
    }
  });

  it('humanReason and nextStep come from ERROR_REASONS_PUBLIC[not-found]', async () => {
    const res = await fetch(`${baseUrl}/foo`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.humanReason).toBe(ERROR_REASONS_PUBLIC['not-found']!.humanReason);
    expect(body.nextStep).toBe(ERROR_REASONS_PUBLIC['not-found']!.nextStep);
    expect(body.severity).toBe(ERROR_REASONS_PUBLIC['not-found']!.severity);
  });
});

describe('ERROR_REASONS_PUBLIC catalog (task 0063)', () => {
  it('exposes the not-found entry with the canonical inner shape', () => {
    const entry = ERROR_REASONS_PUBLIC['not-found'];
    expect(entry).toBeDefined();
    expect(typeof entry!.humanReason).toBe('string');
    expect(typeof entry!.nextStep).toBe('string');
    expect(entry!.severity).toBe('info');
  });
});

describe('GET /docs/source-reasons surfaces errorReasons (task 0063)', () => {
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

  it('exposes errorReasons map alongside the existing reasons map', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<string, unknown>;
    expect(body.errorReasons).toBeDefined();
    const errorReasons = body.errorReasons as Record<string, unknown>;
    expect(typeof errorReasons['not-found']).toBe('object');
    expect(body.errorReasonCount).toBe(Object.keys(errorReasons).length);
  });

  it('errorReasons entries match the canonical {humanReason,nextStep,severity} shape', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<string, unknown>;
    const errorReasons = body.errorReasons as Record<string, Record<string, unknown>>;
    for (const [code, doc] of Object.entries(errorReasons)) {
      expect(typeof code).toBe('string');
      expect(typeof doc.humanReason).toBe('string');
      expect(typeof doc.nextStep).toBe('string');
      expect(doc.severity).toMatch(/^(ok|info|degraded|critical)$/);
    }
  });
});
