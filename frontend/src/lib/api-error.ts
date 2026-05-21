import { NextResponse } from 'next/server'

/**
 * Canonical JSON error envelope returned by every `/api/*` route.
 *
 * Shape is intentionally small and stable so keepers, status pages,
 * dashboards, and external integrators can parse responses uniformly.
 *
 * Routes may attach additional contextual fields (path, method, allowed,
 * errorId, etc.) via the `extra` parameter on {@link apiError}.
 */
export interface ApiErrorBody {
  /** Human-readable error message. Always present. */
  error: string
  /** Machine-readable error code in snake_case (e.g. `api_route_not_found`). */
  code: string
  /** ISO-8601 timestamp the error was generated. Optional, included by default. */
  timestamp?: string
  /** Request path that triggered the error, if known. */
  path?: string
  /** HTTP method of the offending request, if known. */
  method?: string
  /** For 405 responses: list of HTTP methods the route does accept. */
  allowed?: string[]
  /** Opaque correlation id for sensitive failures. */
  errorId?: string
}

interface ApiErrorExtra {
  /** Additional headers (e.g. `Allow` for 405). Merged into the response. */
  headers?: Record<string, string>
  /** Override the default `Cache-Control: no-store` policy. */
  cacheControl?: string
  /** Any other JSON-serialisable fields to merge into the body. */
  [key: string]: unknown
}

/**
 * Build a Next.js `NextResponse` carrying a structured JSON error envelope.
 *
 * Defaults:
 * - `Content-Type: application/json; charset=utf-8`
 * - `Cache-Control: no-store` for 4xx/5xx (override via `extra.cacheControl`)
 * - `timestamp` field with current ISO-8601 time
 *
 * @example
 * return apiError(404, 'api_route_not_found', 'API route not found', {
 *   path: req.nextUrl.pathname,
 *   method: req.method,
 * })
 *
 * @example
 * return apiError(405, 'method_not_allowed', 'Method not allowed', {
 *   path: req.nextUrl.pathname,
 *   method: req.method,
 *   allowed: ['POST'],
 *   headers: { Allow: 'POST' },
 * })
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  extra?: ApiErrorExtra,
): NextResponse {
  const { headers: extraHeaders, cacheControl, ...rest } = extra ?? {}

  const body: ApiErrorBody & Record<string, unknown> = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...rest,
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  }

  if (cacheControl) {
    headers['Cache-Control'] = cacheControl
  } else if (status >= 400) {
    headers['Cache-Control'] = 'no-store'
  }

  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      headers[k] = v
    }
  }

  return NextResponse.json(body, { status, headers })
}

/**
 * Convenience helper for 405 Method Not Allowed responses.
 *
 * Generates a canonical JSON envelope with `code: 'method_not_allowed'`,
 * the offending `method` and `path`, the list of `allowed` methods, and
 * an RFC 7231-compliant `Allow` header (`"GET, POST"`).
 *
 * Pass any standard `Request` (including `NextRequest`); the helper reads
 * only `req.method` and `req.url`, so it works inside route handlers and
 * unit tests alike.
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   return methodNotAllowed(req, ['POST'])
 * }
 */
export function methodNotAllowed(
  req: Request,
  allowed: readonly string[],
): NextResponse {
  const url = new URL(req.url)
  const allowedUpper = allowed.map((m) => m.toUpperCase())

  return apiError(405, 'method_not_allowed', 'Method not allowed', {
    path: url.pathname,
    method: req.method,
    allowed: allowedUpper,
    headers: { Allow: allowedUpper.join(', ') },
  })
}
