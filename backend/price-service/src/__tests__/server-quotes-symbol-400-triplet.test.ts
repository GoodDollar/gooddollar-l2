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
 * Task 0073 — every 400 envelope on the service must ride the same
 * `{error, message, humanReason, severity, nextStep, ...}` contract
 * the 405 (task 0057), the catch-all 404 (task 0063), and the
 * per-symbol 404 (task 0072) already use. Triplets source from
 * `ERROR_REASONS_PUBLIC` so the body and `/docs/source-reasons`
 * cannot drift.
 */
describe('/quotes/:symbol 400 envelope enrichment (task 0073)', () => {
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

  describe('invalid-symbol (regex violation)', () => {
    it('body carries humanReason / severity:info / nextStep from catalog', async () => {
      const res = await fetch(`${baseUrl}/quotes/${encodeURIComponent('!!!')}`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      const entry = ERROR_REASONS_PUBLIC['invalid-symbol'];
      expect(entry).toBeDefined();
      expect(body.error).toBe('invalid-symbol');
      expect(body.humanReason).toBe(entry!.humanReason);
      expect(body.severity).toBe('info');
      expect(body.severity).toBe(entry!.severity);
      expect(body.nextStep).toBe(entry!.nextStep);
    });

    it('leading key order is error,message,humanReason,severity,nextStep', async () => {
      const res = await fetch(`${baseUrl}/quotes/${encodeURIComponent('!!!')}`);
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

    it('still ships expected + deprecations + path + method tail', async () => {
      const res = await fetch(`${baseUrl}/quotes/${encodeURIComponent('!!!')}`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.expected).toBeDefined();
      expect(body.deprecations).toBeDefined();
      expect(typeof body.path).toBe('string');
      expect(body.method).toBe('GET');
    });
  });

  describe('invalid-symbol-or-path (near-miss steer)', () => {
    it('body carries humanReason / severity:info / nextStep from catalog', async () => {
      const res = await fetch(`${baseUrl}/quotes/fresh`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      const entry = ERROR_REASONS_PUBLIC['invalid-symbol-or-path'];
      expect(entry).toBeDefined();
      expect(body.error).toBe('invalid-symbol-or-path');
      expect(body.humanReason).toBe(entry!.humanReason);
      expect(body.severity).toBe('info');
      expect(body.severity).toBe(entry!.severity);
      expect(body.nextStep).toBe(entry!.nextStep);
    });

    it('leading key order is error,message,humanReason,severity,nextStep', async () => {
      const res = await fetch(`${baseUrl}/quotes/fresh`);
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

    it('still ships didYouMean + path + method tail', async () => {
      const res = await fetch(`${baseUrl}/quotes/fresh`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(typeof body.didYouMean).toBe('string');
      expect(typeof body.path).toBe('string');
      expect(body.method).toBe('GET');
    });
  });

  it('both 400 envelopes still ship timestamp + timestampIso tail', async () => {
    for (const path of [`/quotes/${encodeURIComponent('!!!')}`, '/quotes/fresh']) {
      const res = await fetch(`${baseUrl}${path}`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(typeof body.timestamp).toBe('number');
      expect(typeof body.timestampIso).toBe('string');
    }
  });
});

describe('malformed-uri 400 envelope enrichment (task 0073)', () => {
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

  it('body carries humanReason / severity:info / nextStep from catalog', async () => {
    const res = await fetch(`${baseUrl}/%E0%A4%A`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    const entry = ERROR_REASONS_PUBLIC['malformed-uri'];
    expect(entry).toBeDefined();
    expect(body.error).toBe('malformed-uri');
    expect(body.humanReason).toBe(entry!.humanReason);
    expect(body.severity).toBe('info');
    expect(body.severity).toBe(entry!.severity);
    expect(body.nextStep).toBe(entry!.nextStep);
  });

  it('leading key order is error,message,humanReason,severity,nextStep', async () => {
    const res = await fetch(`${baseUrl}/%E0%A4%A`);
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

  it('still ships expected + discovery + path + method tail', async () => {
    const res = await fetch(`${baseUrl}/%E0%A4%A`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.expected).toBeDefined();
    expect(body.discovery).toBe('/');
    expect(typeof body.path).toBe('string');
    expect(typeof body.method).toBe('string');
  });

  it('still ships timestamp + timestampIso tail', async () => {
    const res = await fetch(`${baseUrl}/%E0%A4%A`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.timestamp).toBe('number');
    expect(typeof body.timestampIso).toBe('string');
  });
});

describe('ERROR_REASONS_PUBLIC catalog extension — 400 family (task 0073)', () => {
  it('exposes invalid-symbol entry with severity:info', () => {
    const entry = ERROR_REASONS_PUBLIC['invalid-symbol'];
    expect(entry).toBeDefined();
    expect(typeof entry!.humanReason).toBe('string');
    expect(entry!.humanReason.length).toBeGreaterThan(0);
    expect(typeof entry!.nextStep).toBe('string');
    expect(entry!.nextStep.length).toBeGreaterThan(0);
    expect(entry!.severity).toBe('info');
  });

  it('exposes invalid-symbol-or-path entry with severity:info', () => {
    const entry = ERROR_REASONS_PUBLIC['invalid-symbol-or-path'];
    expect(entry).toBeDefined();
    expect(typeof entry!.humanReason).toBe('string');
    expect(entry!.humanReason.length).toBeGreaterThan(0);
    expect(typeof entry!.nextStep).toBe('string');
    expect(entry!.nextStep.length).toBeGreaterThan(0);
    expect(entry!.severity).toBe('info');
  });

  it('exposes malformed-uri entry with severity:info', () => {
    const entry = ERROR_REASONS_PUBLIC['malformed-uri'];
    expect(entry).toBeDefined();
    expect(typeof entry!.humanReason).toBe('string');
    expect(entry!.humanReason.length).toBeGreaterThan(0);
    expect(typeof entry!.nextStep).toBe('string');
    expect(entry!.nextStep.length).toBeGreaterThan(0);
    expect(entry!.severity).toBe('info');
  });
});

describe('GET /docs/source-reasons lists 400 slugs (task 0073)', () => {
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

  it('errorReasons block surfaces invalid-symbol, invalid-symbol-or-path, malformed-uri', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<
      string,
      unknown
    >;
    const errorReasons = body.errorReasons as Record<string, unknown>;
    expect(errorReasons['invalid-symbol']).toBeDefined();
    expect(errorReasons['invalid-symbol-or-path']).toBeDefined();
    expect(errorReasons['malformed-uri']).toBeDefined();
    expect(body.errorReasonCount).toBe(Object.keys(errorReasons).length);
  });
});
