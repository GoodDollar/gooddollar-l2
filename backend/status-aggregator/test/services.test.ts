/**
 * Tests pinning the lane-1 service registration against the SDK
 * deployment surface. Task 0039: price-service must appear in the
 * aggregator's `SERVICES` list so the upstream eToro feed is visible
 * on the dashboard alongside `hedge-engine` and `oracle-signer`.
 *
 * Imports `buildServices` rather than `SERVICES` directly so port
 * overrides can be tested without mutating `process.env`.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildServices, SERVICES } from '../src/services';

test('SERVICES includes the lane-1 price-service entry', () => {
  const entry = SERVICES.find((s) => s.name === 'price-service');
  assert.ok(entry, 'price-service must be registered in SERVICES');
  assert.ok(
    entry!.url.endsWith(':9300/health'),
    `price-service URL must default to :9300/health, got ${entry!.url}`,
  );
});

test('price-service URL honours PRICE_SERVICE_PORT env override', () => {
  const services = buildServices({ PRICE_SERVICE_PORT: '9999' });
  const entry = services.find((s) => s.name === 'price-service');
  assert.ok(entry, 'price-service must be present in buildServices output');
  assert.equal(entry!.url, 'http://localhost:9999/health');
});

test('SERVICES still includes the other lane-1 entries (hedge-engine, oracle-signer)', () => {
  assert.ok(SERVICES.find((s) => s.name === 'hedge-engine'), 'hedge-engine must remain registered');
  assert.ok(SERVICES.find((s) => s.name === 'oracle-signer'), 'oracle-signer must remain registered');
});

test('lane-1 cluster sits together near the end of the registry', () => {
  const names = SERVICES.map((s) => s.name);
  const priceIdx = names.indexOf('price-service');
  const hedgeIdx = names.indexOf('hedge-engine');
  const oracleIdx = names.indexOf('oracle-signer');
  assert.ok(priceIdx >= 0 && hedgeIdx >= 0 && oracleIdx >= 0);
  assert.ok(
    priceIdx < hedgeIdx && hedgeIdx < oracleIdx,
    'lane-1 entries must read price-service → hedge-engine → oracle-signer in order',
  );
});
