/**
 * Higher-order wrapper that gates a Next.js Node-runtime API route handler
 * with the canonical token-bucket rate limiter in `./rate-limit.ts`.
 *
 * Why this exists:
 *   - `frontend/src/middleware.ts` was removed (task 0021 + 0023) because
 *     Next.js 14.2.35 + Node 22 runs middleware inside an Edge Runtime
 *     sandbox that crashes with `EvalError: Code generation from strings
 *     disallowed for this context`.
 *   - Rate limiting therefore has to move from Edge middleware into
 *     individual Node-runtime route handlers.
 *
 * Contract:
 *   - On allow: returns the wrapped handler's response unchanged.
 *   - On deny: returns HTTP 429 with body `{ error, retryAfterSeconds }`
 *     and a `Retry-After` header.
 *
 * Limits:
 *   - Default RPM is 60, overridable via `RATE_LIMIT_RPM` env var.
 *   - Bucket state is per-process. For multi-instance deploys (PM2 cluster,
 *     multiple pods) replace with a Redis-backed limiter — see comment in
 *     `./rate-limit.ts`.
 *
 * Tracking:
 *   - .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md
 */

import { NextResponse, type NextRequest } from 'next/server'

import { checkRateLimit, getRealIp } from './rate-limit'

// Next.js passes a per-route context object (e.g. `{ params }`) whose shape
// depends on the route's dynamic segments. Modelled as `unknown` here so the
// wrapper stays route-agnostic; handlers should narrow as needed.
type RouteContext = unknown

export type ApiRouteHandler = (
  req: NextRequest,
  ctx?: RouteContext,
) => Promise<Response> | Response

export function withApiRateLimit(handler: ApiRouteHandler): ApiRouteHandler {
  return async (req, ctx) => {
    // Operator kill switch — mirrors the semantics of the (removed)
    // src/middleware.ts so existing deployment env files still behave the
    // same way. Setting RATE_LIMIT_ENABLED=false disables ALL per-route
    // limits.
    if (process.env.RATE_LIMIT_ENABLED === 'false') {
      return handler(req, ctx)
    }

    const ip = getRealIp(req)
    const { allowed, retryAfterSeconds } = checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        },
      )
    }

    return handler(req, ctx)
  }
}
