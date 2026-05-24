import express from 'express';
import { createServer, ENDPOINT_CATALOG } from '../server';
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
 * Concrete probe paths covering every catalog row (parametric route
 * exercised at /quotes/AAPL). Drives the verb × path matrix in the
 * acceptance test so the contract holds across the entire wire surface.
 */
const CONCRETE_PATHS: readonly string[] = ENDPOINT_CATALOG.map((e) =>
  e.path === '/quotes/:symbol' ? '/quotes/AAPL' : e.path,
);

const VERBS: readonly string[] = ['POST', 'PUT', 'DELETE', 'PATCH'];

const CANONICAL_KEY_ORDER: readonly string[] = [
  'error',
  'message',
  'humanReason',
  'severity',
  'nextStep',
  // task 0078: `requestId` rides high (right after the triplet) so an
  // on-call grepping a body sees the support-trace key first.
  'requestId',
  'allowed',
  'method',
  'path',
  'timestamp',
  'timestampIso',
];

/**
 * Task 0057: 405 responses had a bare `{error, allowed, path, method,
 * timestamp*}` envelope — no `message`, no `humanReason`, no `severity`,
 * no `nextStep`. Every other 4xx/5xx on this service classifies itself
 * against the `SourceSeverity` ladder published at `/docs/source-reasons`.
 * After this task every 405 carries the full enrichment with
 * `severity:'info'`.
 */
describe('GET / 405 method-not-allowed envelope (task 0057)', () => {
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

  for (const path of CONCRETE_PATHS) {
    for (const verb of VERBS) {
      it(`${verb} ${path} → 405 with full enrichment envelope`, async () => {
        const res = await fetch(`${baseUrl}${path}`, { method: verb });
        expect(res.status).toBe(405);
        expect(res.headers.get('allow')).toBe('GET, OPTIONS');
        const body = (await res.json()) as Record<string, unknown>;
        expect(body.error).toBe('method-not-allowed');
        expect(body.severity).toBe('info');
        expect(typeof body.humanReason).toBe('string');
        expect((body.humanReason as string).length).toBeGreaterThan(0);
        expect(typeof body.nextStep).toBe('string');
        expect((body.nextStep as string).length).toBeGreaterThan(0);
        expect(typeof body.message).toBe('string');
        expect(body.message as string).toMatch(
          new RegExp(`Method '${verb}' is not allowed on ${path}\\.`),
        );
        expect(body.message as string).toContain('GET, OPTIONS');
        expect(body.allowed).toEqual(['GET', 'OPTIONS']);
        expect(body.method).toBe(verb);
        expect(body.path).toBe(path);
        expect(typeof body.timestamp).toBe('number');
        expect(typeof body.timestampIso).toBe('string');
      });
    }
  }

  it('field order matches the canonical envelope ordering (task 0041)', async () => {
    const res = await fetch(`${baseUrl}/`, { method: 'POST' });
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(CANONICAL_KEY_ORDER);
  });

  it('severity stays the literal "info" across every documented route', async () => {
    const severities = new Set<string>();
    for (const path of CONCRETE_PATHS) {
      for (const verb of VERBS) {
        const res = await fetch(`${baseUrl}${path}`, { method: verb });
        const body = (await res.json()) as Record<string, unknown>;
        severities.add(body.severity as string);
      }
    }
    expect([...severities]).toEqual(['info']);
  });

  it('Allow header is unchanged byte-for-byte vs pre-task wire contract', async () => {
    const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });

  it('humanReason / nextStep are static across paths (same failure mode)', async () => {
    const a = (await (
      await fetch(`${baseUrl}/`, { method: 'POST' })
    ).json()) as Record<string, unknown>;
    const b = (await (
      await fetch(`${baseUrl}/health`, { method: 'PUT' })
    ).json()) as Record<string, unknown>;
    expect(b.humanReason).toBe(a.humanReason);
    expect(b.nextStep).toBe(a.nextStep);
  });
});
