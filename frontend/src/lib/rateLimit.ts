/**
 * Fixed-window IP rate limiter for use inside Next.js API route handlers
 * (Node.js runtime).
 *
 * NOTE: middleware.ts now exists and uses the token-bucket implementation
 * in `src/lib/rate-limit.ts` for Edge Runtime rate limiting. This module is
 * currently unused by middleware but kept for its `getRealIp()` utility and
 * as a Node.js-runtime alternative for API route handlers.
 *
 * Limits each IP to RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS.
 * Production deployments on multi-instance infrastructure should replace this
 * with a Redis-backed store (e.g. @upstash/ratelimit) or push the limiter into
 * an upstream proxy (Cloudflare / nginx).
 */

export const RATE_LIMIT_MAX = 60 // requests per window
export const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

interface RateLimitEntry {
  count: number
  windowStart: number
}

const ipStore = new Map<string, RateLimitEntry>()

/**
 * Test-only helper to reset the in-process store between tests.
 */
export function _resetRateLimitStore(): void {
  ipStore.clear()
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = ipStore.get(ip)

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    ipStore.set(ip, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS,
    }
  }

  entry.count += 1
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS,
  }
}

/**
 * Resolve the originating IP from a Web `Request`-compatible object.
 *
 * Trusts forwarded headers in this order: `x-real-ip` then the first entry of
 * `x-forwarded-for`. Falls back to `127.0.0.1` so the limiter still works in
 * local development.
 */
export function getRealIp(req: { headers: { get(name: string): string | null } }): string {
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return '127.0.0.1'
}
