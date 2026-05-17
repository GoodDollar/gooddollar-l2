/**
 * Unit tests for parseHealthStatus().
 *
 * The status-aggregator polls many backend services. Two health-payload
 * conventions exist in the wild:
 *   1. `{ status: 'ok' | 'degraded' | 'error', ... }`  — 11 services
 *   2. `{ ok: true | false, ... }`                     — indexer
 *
 * parseHealthStatus() must understand both without mis-classifying healthy
 * services (especially the indexer) as `error`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHealthStatus } from '../src/parseHealthStatus';

test('status:ok shape returns ok', () => {
  assert.equal(parseHealthStatus({ status: 'ok', uptime: 42 }), 'ok');
});

test('status:degraded shape returns degraded', () => {
  assert.equal(parseHealthStatus({ status: 'degraded' }), 'degraded');
});

test('status:error shape returns error', () => {
  assert.equal(parseHealthStatus({ status: 'error', error: 'boom' }), 'error');
});

test('ok:true shape (indexer convention) returns ok — the bug we are fixing', () => {
  assert.equal(
    parseHealthStatus({ ok: true, service: 'gooddollar-indexer', last_indexed_block: 808967 }),
    'ok',
  );
});

test('ok:false shape returns error', () => {
  assert.equal(parseHealthStatus({ ok: false, service: 'gooddollar-indexer' }), 'error');
});

test('unknown shape falls back to error (preserves previous safe default)', () => {
  assert.equal(parseHealthStatus({ random: 'thing' }), 'error');
});

test('empty body falls back to error', () => {
  assert.equal(parseHealthStatus({}), 'error');
});

test('status field takes precedence over ok field when both are present', () => {
  // A service that supplies both should be trusted on its explicit `status`.
  assert.equal(parseHealthStatus({ status: 'degraded', ok: true }), 'degraded');
});
