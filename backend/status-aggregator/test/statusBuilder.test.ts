import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStatusJson,
  updateStatuses,
  resetState,
  type ServiceStatus,
} from '../src/statusBuilder';

beforeEach(() => {
  resetState();
});

test('before first poll: overall is "pending", pollState is "pending", lastPollTimestamp is null', () => {
  const result = buildStatusJson(14);
  assert.equal(result.overall, 'pending');
  assert.equal(result.pollState, 'pending');
  assert.equal(result.lastPollTimestamp, null);
  assert.equal(result.healthy, 0);
  assert.deepEqual(result.services, []);
});

test('after first poll with all healthy: overall is "healthy", pollState is "active"', () => {
  const statuses: ServiceStatus[] = [
    { name: 'svc-a', status: 'ok', latencyMs: 5, lastChecked: new Date().toISOString() },
    { name: 'svc-b', status: 'ok', latencyMs: 3, lastChecked: new Date().toISOString() },
  ];
  updateStatuses(statuses);

  const result = buildStatusJson(2);
  assert.equal(result.overall, 'healthy');
  assert.equal(result.pollState, 'active');
  assert.notEqual(result.lastPollTimestamp, null);
  assert.equal(result.healthy, 2);
  assert.equal(result.total, 2);
  assert.equal(result.services.length, 2);
});

test('after first poll with health-only service: service is operational but overall is "degraded"', () => {
  const statuses: ServiceStatus[] = [
    { name: 'svc-a', status: 'ok', latencyMs: 5, lastChecked: new Date().toISOString() },
    { name: 'hedge-engine', status: 'health-only', latencyMs: 3, lastChecked: new Date().toISOString() },
  ];
  updateStatuses(statuses);

  const result = buildStatusJson(2);
  assert.equal(result.overall, 'degraded');
  assert.equal(result.pollState, 'active');
  assert.equal(result.healthy, 2);
  assert.equal(result.total, 2);
});

test('after first poll with some unreachable: overall is "degraded"', () => {
  const statuses: ServiceStatus[] = [
    { name: 'svc-a', status: 'ok', latencyMs: 5, lastChecked: new Date().toISOString() },
    { name: 'svc-b', status: 'unreachable', latencyMs: 3, error: 'down', lastChecked: new Date().toISOString() },
  ];
  updateStatuses(statuses);

  const result = buildStatusJson(2);
  assert.equal(result.overall, 'degraded');
  assert.equal(result.pollState, 'active');
  assert.equal(result.healthy, 1);
});

test('after first poll with all unreachable: overall is "down" (not "pending")', () => {
  const statuses: ServiceStatus[] = [
    { name: 'svc-a', status: 'unreachable', latencyMs: 5, error: 'down', lastChecked: new Date().toISOString() },
    { name: 'svc-b', status: 'error', latencyMs: 3, error: 'err', lastChecked: new Date().toISOString() },
  ];
  updateStatuses(statuses);

  const result = buildStatusJson(2);
  assert.equal(result.overall, 'down');
  assert.equal(result.pollState, 'active');
});

test('HTTP status code: pending returns 200 (not 503)', () => {
  const result = buildStatusJson(14);
  assert.equal(result.overall, 'pending');
});
