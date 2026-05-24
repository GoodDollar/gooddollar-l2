/**
 * Unit tests for checkService().
 *
 * The aggregator polls /health endpoints across the lane. Some services
 * (price-service) deliberately return HTTP 503 with a structured body
 * (`{status:'starting'}` / `{status:'degraded'}`) to signal "alive but
 * not ready / not fully healthy" so HTTP probes correctly mark them
 * unready. The aggregator is not a load balancer — it should preserve
 * those semantics by parsing the body before deciding ok / degraded /
 * error, falling back to error only when the body is missing or
 * unparseable.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkService } from '../src/checkService';
import type { ServiceConfig } from '../src/services';

const SVC: ServiceConfig = {
  name: 'price-service',
  url: 'http://price-service.invalid/health',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('503 with {status:"degraded"} body surfaces as degraded with the upstream reason', async () => {
  const fetchFn = async () => jsonResponse(
    { status: 'degraded', reason: 'no fresh quotes (cache stale or all rejected)' },
    503,
  );
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'degraded');
  assert.equal(result.error, 'no fresh quotes (cache stale or all rejected)');
  assert.equal(result.name, 'price-service');
  assert.equal(typeof result.latencyMs, 'number');
});

test('503 with {status:"starting"} body surfaces as degraded with the starting reason', async () => {
  const fetchFn = async () => jsonResponse(
    { status: 'starting', reason: 'no quote ingested yet' },
    503,
  );
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'degraded');
  assert.equal(result.error, 'no quote ingested yet');
});

test('502 with non-JSON body falls back to error with explicit no-parseable-body marker', async () => {
  const fetchFn = async () => new Response('<html>nginx</html>', { status: 502 });
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'error');
  assert.match(result.error ?? '', /HTTP 502 \(no parseable body\)/);
});

test('200 with {status:"ok"} continues to surface as ok with uptime/chainBlock', async () => {
  const fetchFn = async () => jsonResponse(
    { status: 'ok', uptime: 42, chainBlock: 808967 },
    200,
  );
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'ok');
  assert.equal(result.uptime, 42);
  assert.equal(result.chainBlock, 808967);
  assert.equal(result.error, undefined);
});

test('200 with {status:"error", error:"boom"} surfaces as error with the upstream message', async () => {
  const fetchFn = async () => jsonResponse(
    { status: 'error', error: 'boom' },
    200,
  );
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'error');
  assert.equal(result.error, 'boom');
});

test('AbortError from fetch maps to status:timeout', async () => {
  const fetchFn = async () => {
    const err: Error & { name: string } = new Error('timeout');
    err.name = 'AbortError';
    throw err;
  };
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'timeout');
  assert.match(result.error ?? '', /timeout after 1000ms/);
});

test('non-abort fetch error maps to status:unreachable', async () => {
  const fetchFn = async () => {
    throw new Error('ECONNREFUSED');
  };
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'unreachable');
  assert.match(result.error ?? '', /ECONNREFUSED/);
});

test('200 with {ok:true} indexer convention surfaces as ok (back-compat)', async () => {
  const fetchFn = async () => jsonResponse(
    { ok: true, service: 'gooddollar-indexer' },
    200,
  );
  const result = await checkService(SVC, { fetchFn, timeoutMs: 1000 });
  assert.equal(result.status, 'ok');
});
