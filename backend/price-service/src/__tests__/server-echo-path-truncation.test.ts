import express from 'express';
import http from 'http';
import {
  createServer,
  echoPath,
  MAX_ECHOED_PATH_BYTES,
} from '../server';
import { QuoteCache } from '../quote-cache';

interface RawResponse {
  status: number;
  body: string;
}

function rawGet(path: string, port: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path, method: 'GET' },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => resolve({ status: res.statusCode!, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function listen(app: express.Express): Promise<{
  server: ReturnType<express.Express['listen']>;
  port: number;
}> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as import('net').AddressInfo;
      resolve({ server, port: addr.port });
    });
  });
}

/**
 * Task 0058: every 4xx envelope echoes `req.path` back to the caller. Prior
 * to this task only the `invalid-symbol` 400 truncated; the truncation
 * used a U+2026 horizontal ellipsis glyph with no metadata. The
 * `echoPath` helper unifies path-echo behaviour across every error
 * envelope and replaces the U+2026 trick with three companion fields
 * (`pathTruncated`, `pathOriginalLength`, `pathPrefixLength`).
 */
describe('echoPath helper — verbatim prefix + truncation metadata', () => {
  it('empty string round-trips verbatim, no truncation fields', () => {
    expect(echoPath('')).toEqual({ path: '' });
  });

  it('short ASCII path round-trips verbatim', () => {
    expect(echoPath('/quotes/AAPL')).toEqual({ path: '/quotes/AAPL' });
  });

  it(`exactly ${MAX_ECHOED_PATH_BYTES} bytes round-trips verbatim (cap edge)`, () => {
    const at = '/'.padEnd(MAX_ECHOED_PATH_BYTES, 'A');
    expect(Buffer.byteLength(at, 'utf8')).toBe(MAX_ECHOED_PATH_BYTES);
    expect(echoPath(at)).toEqual({ path: at });
  });

  it(`exactly ${MAX_ECHOED_PATH_BYTES + 1} bytes truncates (cap+1)`, () => {
    const over = '/'.padEnd(MAX_ECHOED_PATH_BYTES + 1, 'A');
    const out = echoPath(over);
    expect(out.pathTruncated).toBe(true);
    expect(out.pathOriginalLength).toBe(MAX_ECHOED_PATH_BYTES + 1);
    expect(out.pathPrefixLength).toBe(MAX_ECHOED_PATH_BYTES);
    expect(out.path.length).toBe(MAX_ECHOED_PATH_BYTES);
  });

  it('200-byte ASCII input truncates with correct counters', () => {
    const long = '/quotes/' + 'A'.repeat(200);
    const out = echoPath(long);
    expect(out.pathTruncated).toBe(true);
    expect(out.pathOriginalLength).toBe(208);
    expect(out.pathPrefixLength).toBe(MAX_ECHOED_PATH_BYTES);
    expect(long.startsWith(out.path)).toBe(true);
  });

  it('multi-byte UTF-8 input is truncated on a codepoint boundary', () => {
    // 'ß' is 2 bytes in UTF-8; build a string whose byte length is
    // 130 (cap+2) so the trim must back off ONE codepoint to land
    // exactly under cap.
    const prefix = 'A'.repeat(MAX_ECHOED_PATH_BYTES);
    const overByOne = prefix + 'ß';
    expect(Buffer.byteLength(overByOne, 'utf8')).toBe(MAX_ECHOED_PATH_BYTES + 2);
    const out = echoPath(overByOne);
    expect(out.pathTruncated).toBe(true);
    expect(Buffer.byteLength(out.path, 'utf8')).toBeLessThanOrEqual(
      MAX_ECHOED_PATH_BYTES,
    );
    expect(out.path).toBe(prefix);
  });

  it('no U+2026 ever appears in the output path', () => {
    const out = echoPath('/quotes/' + 'A'.repeat(500));
    expect(out.path).not.toContain('\u2026');
  });
});

describe('error envelopes echo path through echoPath (task 0058)', () => {
  let server: ReturnType<express.Express['listen']>;
  let port: number;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, port } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  const LONG = 'A'.repeat(200);

  it('invalid-symbol 400: 200-char input → ASCII path + three truncation fields', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/quotes/${LONG}`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
    expect(body.pathTruncated).toBe(true);
    expect(typeof body.pathOriginalLength).toBe('number');
    expect(typeof body.pathPrefixLength).toBe('number');
    expect(body.pathPrefixLength).toBe(MAX_ECHOED_PATH_BYTES);
    expect(body.pathOriginalLength).toBeGreaterThan(MAX_ECHOED_PATH_BYTES);
    expect(body.path as string).not.toContain('\u2026');
    expect((body.path as string).length).toBe(MAX_ECHOED_PATH_BYTES);
  });

  it('invalid-symbol 400: short input → no truncation fields, verbatim path', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/quotes/!`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
    expect(body.path).toBe('/quotes/!');
    expect('pathTruncated' in body).toBe(false);
    expect('pathOriginalLength' in body).toBe(false);
    expect('pathPrefixLength' in body).toBe(false);
  });

  it('404 not-found: 200-char path → ASCII path + three truncation fields', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/${LONG}`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('not-found');
    expect(body.pathTruncated).toBe(true);
    expect(body.pathPrefixLength).toBe(MAX_ECHOED_PATH_BYTES);
    expect(body.path as string).not.toContain('\u2026');
  });

  it('404 not-found: short path → no truncation fields', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/nope`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.path).toBe('/nope');
    expect('pathTruncated' in body).toBe(false);
  });

  it('405 method-not-allowed: short path → verbatim, no truncation fields', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      method: 'POST',
    });
    expect(res.status).toBe(405);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.path).toBe('/health');
    expect('pathTruncated' in body).toBe(false);
  });

  it('malformed-uri 400: long malformed input → truncation fields present', async () => {
    const longMalformed = '/quotes/' + 'A'.repeat(200) + '%';
    const res = await rawGet(longMalformed, port);
    expect(res.status).toBe(400);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body.error).toBe('malformed-uri');
    expect(body.pathTruncated).toBe(true);
    expect(body.pathPrefixLength).toBe(MAX_ECHOED_PATH_BYTES);
    expect((body.path as string).length).toBe(MAX_ECHOED_PATH_BYTES);
  });

  it('malformed-uri 400: short input → no truncation fields', async () => {
    const res = await rawGet('/quotes/AAPL%', port);
    expect(res.status).toBe(400);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body.path).toBe('/quotes/AAPL%');
    expect('pathTruncated' in body).toBe(false);
  });

  it('invalid-symbol-or-path 400 (near-miss): short path → verbatim', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/quotes/fresh`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol-or-path');
    expect(body.path).toBe('/quotes/fresh');
    expect('pathTruncated' in body).toBe(false);
  });

  it('path field is byte-for-byte the prefix of req.path on truncation', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/quotes/${LONG}`);
    const body = (await res.json()) as Record<string, unknown>;
    const original = `/quotes/${LONG}`;
    expect(original.startsWith(body.path as string)).toBe(true);
    expect(body.pathPrefixLength).toBe((body.path as string).length);
  });
});
