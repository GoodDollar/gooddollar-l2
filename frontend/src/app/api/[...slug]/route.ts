import type { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api-error'

/**
 * Catch-all `/api/*` 404 handler.
 *
 * Next.js App Router falls back to the global `app/not-found.tsx` (HTML)
 * when a request hits an `/api/*` path that no route file matches.
 *
 * This catch-all route claims every otherwise-unmatched `/api/*` path and
 * returns the canonical JSON error envelope from {@link apiError}. The route
 * is intentionally lower-priority than concrete sibling routes (Next.js
 * static routes take precedence over dynamic ones), so existing endpoints
 * such as `/api/prices` and `/api/status` continue to work.
 *
 * All HTTP methods get the same 404 envelope so keepers, status pages and
 * external integrators see a consistent response regardless of verb.
 */
function notFound(req: NextRequest | Request): NextResponse {
  // `NextRequest` exposes `nextUrl`; raw `Request` (used in tests) does not.
  // Fall back to URL parsing in that case.
  const urlString = req.url
  let pathname = '/'
  try {
    pathname = new URL(urlString).pathname
  } catch {
    // best-effort
  }

  return apiError(404, 'api_route_not_found', 'API route not found', {
    path: pathname,
    method: req.method,
  })
}

export function GET(req: NextRequest) {
  return notFound(req)
}

export function POST(req: NextRequest) {
  return notFound(req)
}

export function PUT(req: NextRequest) {
  return notFound(req)
}

export function PATCH(req: NextRequest) {
  return notFound(req)
}

export function DELETE(req: NextRequest) {
  return notFound(req)
}

export function OPTIONS(req: NextRequest) {
  return notFound(req)
}

export function HEAD(req: NextRequest) {
  return notFound(req)
}
