/**
 * Probes a single backend service's health endpoint and normalises the
 * response into a `ServiceStatus`.
 *
 * Why we always parse the body — even on non-2xx:
 *   The aggregator is a status mirror, not a load balancer. Some lane
 *   services (price-service) deliberately return HTTP 503 with a
 *   structured body (`{status:'starting'}` / `{status:'degraded'}`) so
 *   HTTP probes correctly mark them unready while still emitting a
 *   semantic health signal. Short-circuiting on `!res.ok` would collapse
 *   that to a flat `error`, masking benign warmup as a hard failure on
 *   the proof page.
 *
 * Only when the body is missing or unparseable do we fall back to
 * `error: HTTP <code> (no parseable body)` — a 504 with no body or a
 * proxy emitting plain HTML.
 */

import { parseHealthStatus } from './parseHealthStatus';
import type { ServiceConfig } from './services';
import type { ServiceStatus } from './statusBuilder';

export interface CheckServiceOptions {
  /** Injectable fetch (defaults to global fetch). Used by tests. */
  fetchFn?: typeof fetch;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5000;

export async function checkService(
  svc: ServiceConfig,
  opts: CheckServiceOptions = {},
): Promise<ServiceStatus> {
  const fetchFn = opts.fetchFn ?? fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(svc.url, { signal: controller.signal });
    clearTimeout(timer);
    return buildStatusFromResponse(svc, res, Date.now() - start);
  } catch (err) {
    clearTimeout(timer);
    return buildErrorStatus(svc, err, Date.now() - start, timeoutMs);
  }
}

async function buildStatusFromResponse(
  svc: ServiceConfig,
  res: Response,
  latencyMs: number,
): Promise<ServiceStatus> {
  const body = await readJsonBody(res);
  const lastChecked = new Date().toISOString();

  if (!body) {
    return {
      name: svc.name,
      status: 'error',
      latencyMs,
      error: `HTTP ${res.status} (no parseable body)`,
      lastChecked,
    };
  }

  const svcStatus = parseHealthStatus(body);
  return {
    name: svc.name,
    status: svcStatus,
    latencyMs,
    uptime: typeof body.uptime === 'number' ? body.uptime : undefined,
    chainBlock: typeof body.chainBlock === 'number' ? body.chainBlock : undefined,
    error: pickErrorMessage(svcStatus, body, res.status),
    lastChecked,
  };
}

function buildErrorStatus(
  svc: ServiceConfig,
  err: unknown,
  latencyMs: number,
  timeoutMs: number,
): ServiceStatus {
  const isTimeout = err instanceof Error && err.name === 'AbortError';
  const message = err instanceof Error ? err.message : String(err);
  return {
    name: svc.name,
    status: isTimeout ? 'timeout' : 'unreachable',
    latencyMs,
    error: isTimeout ? `timeout after ${timeoutMs}ms` : (message || 'unreachable'),
    lastChecked: new Date().toISOString(),
  };
}

async function readJsonBody(res: Response): Promise<Record<string, unknown> | undefined> {
  try {
    const parsed = await res.json();
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function pickErrorMessage(
  svcStatus: ReturnType<typeof parseHealthStatus>,
  body: Record<string, unknown>,
  httpStatus: number,
): string | undefined {
  switch (svcStatus) {
    case 'ok':
      return undefined;
    case 'degraded':
      return firstString(body.reason, body.error);
    case 'health-only':
      return firstString(body.reason, body.error);
    case 'error':
      return firstString(body.error, body.reason) ?? `HTTP ${httpStatus}`;
    default: {
      const _exhaustive: never = svcStatus;
      return _exhaustive;
    }
  }
}

function firstString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}
