/**
 * Parse a service health-endpoint response body into a normalised status.
 *
 * Two conventions exist across our backend services:
 *   1. `{ status: 'ok' | 'degraded' | 'health-only' | 'error', ... }`  (most services)
 *   2. `{ ok: true | false, ... }`                     (indexer)
 *
 * The explicit `status` field wins if present. Otherwise we fall back to
 * `ok`. Unknown shapes are treated as `error` (safe default, preserves the
 * pre-fix behaviour for unfamiliar payloads).
 */
export type HealthStatus = 'ok' | 'degraded' | 'health-only' | 'error';

export function parseHealthStatus(body: Record<string, unknown>): HealthStatus {
  if (body.status === 'ok') return 'ok';
  if (body.status === 'degraded') return 'degraded';
  if (body.status === 'health-only') return 'health-only';
  if (body.status === 'error') return 'error';

  if (body.ok === true) return 'ok';
  if (body.ok === false) return 'error';

  return 'error';
}
