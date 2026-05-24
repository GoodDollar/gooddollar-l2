import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
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
 * Task 0072 — per-symbol 404 envelopes (`no-quote`,
 * `symbol-not-configured`) must ride the same
 * `{error, message, humanReason, severity, nextStep, ...}` contract
 * as the catch-all 404 (task 0063) and the 405 (task 0057). The
 * `humanReason / severity / nextStep` triplet sources from the
 * `ERROR_REASONS_PUBLIC` catalog so the live body and
 * `/docs/source-reasons.errorReasons` cannot drift.
 */
describe('/quotes/:symbol 404 envelope enrichment (task 0072)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('symbol-not-configured (permanent — critical)', () => {
    it('body carries humanReason / severity:critical / nextStep from catalog', async () => {
      const res = await fetch(`${baseUrl}/quotes/UNKNOWNSYM`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      const entry = ERROR_REASONS_PUBLIC['symbol-not-configured'];
      expect(entry).toBeDefined();
      expect(body.error).toBe('symbol-not-configured');
      expect(body.humanReason).toBe(entry!.humanReason);
      expect(body.severity).toBe('critical');
      expect(body.severity).toBe(entry!.severity);
      expect(body.nextStep).toBe(entry!.nextStep);
    });

    it('leading key order is error,message,humanReason,severity,nextStep', async () => {
      const res = await fetch(`${baseUrl}/quotes/UNKNOWNSYM`);
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

    it('still ships configured:false, configuredSymbols, configuredSymbolCount tail', async () => {
      const res = await fetch(`${baseUrl}/quotes/UNKNOWNSYM`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.symbol).toBe('UNKNOWNSYM');
      expect(body.configured).toBe(false);
      expect(body.configuredSymbols).toEqual(['AAPL', 'TSLA']);
      expect(body.configuredSymbolCount).toBe(2);
    });

    it('didYouMean omitted when no near-miss candidate', async () => {
      const res = await fetch(`${baseUrl}/quotes/XYZZY`);
      const body = (await res.json()) as Record<string, unknown>;
      expect('didYouMean' in body).toBe(false);
    });

    it('didYouMean still rides when near-miss present', async () => {
      const res = await fetch(`${baseUrl}/quotes/APPL`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.didYouMean).toBe('AAPL');
    });
  });

  describe('no-quote (transient — info)', () => {
    it('body carries humanReason / severity:info / nextStep from catalog', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      expect(res.status).toBe(404);
      const body = (await res.json()) as Record<string, unknown>;
      const entry = ERROR_REASONS_PUBLIC['no-quote'];
      expect(entry).toBeDefined();
      expect(body.error).toBe('no-quote');
      expect(body.humanReason).toBe(entry!.humanReason);
      expect(body.severity).toBe('info');
      expect(body.severity).toBe(entry!.severity);
      expect(body.nextStep).toBe(entry!.nextStep);
    });

    it('leading key order is error,message,humanReason,severity,nextStep', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
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

    it('still ships symbol + configured:true', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.symbol).toBe('AAPL');
      expect(body.configured).toBe(true);
    });

    it('does NOT carry configuredSymbols or didYouMean', async () => {
      const res = await fetch(`${baseUrl}/quotes/AAPL`);
      const body = (await res.json()) as Record<string, unknown>;
      expect('configuredSymbols' in body).toBe(false);
      expect('configuredSymbolCount' in body).toBe(false);
      expect('didYouMean' in body).toBe(false);
    });
  });

  it('both per-symbol 404 envelopes still ship timestamp + timestampIso tail', async () => {
    for (const path of ['/quotes/AAPL', '/quotes/UNKNOWNSYM']) {
      const res = await fetch(`${baseUrl}${path}`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(typeof body.timestamp).toBe('number');
      expect(typeof body.timestampIso).toBe('string');
    }
  });

  it('responseShape for /quotes/:symbol mentions humanReason/severity/nextStep', () => {
    const entry = ENDPOINT_CATALOG.find((e) => e.path === '/quotes/:symbol');
    expect(entry).toBeDefined();
    expect(entry!.responseShape).toMatch(/humanReason/);
    expect(entry!.responseShape).toMatch(/severity/);
    expect(entry!.responseShape).toMatch(/nextStep/);
    expect(entry!.responseShape.length).toBeLessThanOrEqual(240);
  });
});

describe('ERROR_REASONS_PUBLIC catalog extension (task 0072)', () => {
  it('exposes no-quote entry with severity:info', () => {
    const entry = ERROR_REASONS_PUBLIC['no-quote'];
    expect(entry).toBeDefined();
    expect(typeof entry!.humanReason).toBe('string');
    expect(entry!.humanReason.length).toBeGreaterThan(0);
    expect(typeof entry!.nextStep).toBe('string');
    expect(entry!.nextStep.length).toBeGreaterThan(0);
    expect(entry!.severity).toBe('info');
  });

  it('exposes symbol-not-configured entry with severity:critical', () => {
    const entry = ERROR_REASONS_PUBLIC['symbol-not-configured'];
    expect(entry).toBeDefined();
    expect(typeof entry!.humanReason).toBe('string');
    expect(entry!.humanReason.length).toBeGreaterThan(0);
    expect(typeof entry!.nextStep).toBe('string');
    expect(entry!.nextStep.length).toBeGreaterThan(0);
    expect(entry!.severity).toBe('critical');
  });

  it('keeps the original not-found entry intact', () => {
    expect(ERROR_REASONS_PUBLIC['not-found']).toBeDefined();
    expect(ERROR_REASONS_PUBLIC['not-found']!.severity).toBe('info');
  });
});

describe('GET /docs/source-reasons lists new error slugs (task 0072)', () => {
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

  it('errorReasons block surfaces no-quote and symbol-not-configured', async () => {
    const body = (await (await fetch(`${baseUrl}/docs/source-reasons`)).json()) as Record<
      string,
      unknown
    >;
    const errorReasons = body.errorReasons as Record<string, unknown>;
    expect(errorReasons['no-quote']).toBeDefined();
    expect(errorReasons['symbol-not-configured']).toBeDefined();
    expect(errorReasons['not-found']).toBeDefined();
    expect(body.errorReasonCount).toBe(Object.keys(errorReasons).length);
  });
});
