import express from 'express';
import { createServer } from '../server';
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
 * Task 0089: the previously-merged 'shape' rejection bucket now
 * splits into six distinct sub-reasons (leading-zero, negative,
 * decimal, too-many-digits, non-numeric, empty), each with its
 * own actionable message tail. `body.invalidReason` carries the
 * enum directly so SDK retry adapters switch on the structured
 * field instead of regexing English copy.
 */
describe('/quotes/:symbol ?maxAgeMs= structured invalidReason (task 0089)', () => {
  let server: import('http').Server;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll(async () => {
    await close(server);
  });

  const cases: Array<[string, string, string]> = [
    ['0', 'leading-zero', 'saw a non-positive integer'],
    ['-1', 'negative', 'saw a negative integer'],
    ['1.5', 'decimal', 'saw a decimal value'],
    ['999999999999999', 'too-many-digits', 'saw a value longer than 11 digits'],
    ['ABC', 'non-numeric', 'saw a non-numeric value'],
  ];

  it.each(cases)(
    '?maxAgeMs=%s ships invalidReason=%s and message tail %j',
    async (input, expectedReason, expectedMessageFragment) => {
      const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=${input}`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.invalidReason).toBe(expectedReason);
      expect(body.message).toContain(expectedMessageFragment);
    },
  );

  it('?maxAgeMs= (empty) ships invalidReason=empty + omit-hint', async () => {
    const res = await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.invalidReason).toBe('empty');
    expect(body.message).toContain('saw an empty string');
    expect(body.message).toContain('omit ?maxAgeMs=');
  });

  it('back-compat: expected/severity/humanReason/nextStep stay byte-identical across sub-reasons', async () => {
    const sample = await Promise.all(
      cases.map(([q]) =>
        fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=${q}`).then((r) => r.json() as Promise<Record<string, unknown>>),
      ),
    );
    const first = sample[0];
    for (const body of sample) {
      expect(body.expected).toEqual(first.expected);
      expect(body.severity).toBe(first.severity);
      expect(body.humanReason).toBe(first.humanReason);
      expect(body.nextStep).toBe(first.nextStep);
    }
  });

  it('leading-5 key ordering preserved on every sub-reason (task 0073 contract)', async () => {
    for (const [q] of cases) {
      const body = (await (
        await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=${q}`)
      ).json()) as Record<string, unknown>;
      const keys = Object.keys(body);
      expect(keys.slice(0, 5)).toEqual([
        'error',
        'message',
        'humanReason',
        'severity',
        'nextStep',
      ]);
    }
  });

  it('per-symbol envelope carries the symbol field; fresh-all envelope does not', async () => {
    const a = (await (
      await fetch(`${baseUrl}/quotes/AAPL?maxAgeMs=ABC`)
    ).json()) as Record<string, unknown>;
    const b = (await (
      await fetch(`${baseUrl}/quotes/fresh/all?maxAgeMs=ABC`)
    ).json()) as Record<string, unknown>;
    expect(a.symbol).toBe('AAPL');
    expect('symbol' in b).toBe(false);
    // The two envelopes carry the same invalidReason + message + tail.
    expect(a.invalidReason).toBe(b.invalidReason);
    expect(a.message).toBe(b.message);
    expect(a.expected).toEqual(b.expected);
  });
});

describe('/quotes/:symbol ?maxAgeMs=ABC&maxAgeMs=10 (array shape) classifies as type (task 0089)', () => {
  it('array via repeated key → invalidReason=type with type-specific tail', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const res = await fetch(
        `${baseUrl}/quotes/AAPL?maxAgeMs=ABC&maxAgeMs=10`,
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.invalidReason).toBe('type');
      expect(body.message).toContain('saw a non-string');
      expect(body.message).toContain('the query parameter was repeated');
    } finally {
      await close(server);
    }
  });
});
