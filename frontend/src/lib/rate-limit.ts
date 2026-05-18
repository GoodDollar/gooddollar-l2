/**
 * Canonical IP rate limiter for Next.js API route handlers (Node.js runtime).
 *
 * Implementation: token bucket, in-memory `Map`, per-process.
 * Default RPM: 60 (override with `RATE_LIMIT_RPM` env var).
 *
 * IMPORTANT: This module is for Node.js-runtime route handlers only. It must
 * never be imported from `src/middleware.ts` — Next.js 14.2.35 + Node 22 runs
 * middleware inside an Edge Runtime sandbox that crashes any request with
 *   EvalError: Code generation from strings disallowed for this context
 * (See `frontend/scripts/check-middleware-absent.mjs` and tasks
 *  0021-fix-middleware-evalerror-crashes-next-start.md and
 *  0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md.)
 *
 * Use the `withApiRateLimit` wrapper in `./withApiRateLimit.ts` to enforce
 * limits at the route-handler layer.
 *
 * Production deployments on multi-instance infrastructure should replace
 * the per-process Map with a Redis-backed store (e.g. @upstash/ratelimit)
 * or push the limiter into an upstream proxy (Cloudflare / nginx / Caddy).
 */

const DEFAULT_RPM = 60;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

/** Test-only helper to reset in-process state between tests. */
export function _resetBuckets(): void {
  buckets.clear();
  lastCleanup = Date.now();
}

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_THRESHOLD_MS) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(ip: string): RateLimitDecision {
  cleanup();

  const rpm = Number(process.env.RATE_LIMIT_RPM) || DEFAULT_RPM;
  const now = Date.now();
  const refillRate = rpm / 60_000; // tokens per ms

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: rpm, lastRefill: now };
    buckets.set(ip, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(rpm, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const waitMs = (1 - bucket.tokens) / refillRate;
  return { allowed: false, retryAfterSeconds: Math.ceil(waitMs / 1000) };
}

/**
 * Resolve the originating IP from a Web `Request` / `NextRequest`-compatible
 * object.
 *
 * Trusts forwarded headers in this order: `x-real-ip` then the first entry of
 * `x-forwarded-for`. Falls back to `127.0.0.1` when the request is missing
 * headers entirely (e.g. unit tests that invoke route handlers without a
 * Request), so the limiter still degrades gracefully in local development.
 * The repo sits behind Caddy (which sets `x-real-ip`), so the spoofing
 * surface is bounded to clients that can reach Caddy directly.
 */
export function getRealIp(
  req: { headers?: { get(name: string): string | null } } | null | undefined,
): string {
  const get = req?.headers?.get?.bind(req.headers);
  if (!get) return '127.0.0.1';

  const realIp = get('x-real-ip');
  if (realIp) return realIp;

  const forwarded = get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return '127.0.0.1';
}
