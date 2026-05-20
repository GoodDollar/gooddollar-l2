// @vitest-environment node
/**
 * Integration regression suite for per-route 405 handlers.
 *
 * Each `app/api/*` route that only accepts a subset of HTTP methods now
 * exports explicit handlers for the other methods that delegate to the
 * shared `methodNotAllowed` helper. Without these handlers Next.js would
 * return its default HTML 405 page, breaking the JSON envelope contract.
 *
 * This suite asserts that every such route returns the canonical
 * `method_not_allowed` envelope with an `Allow` header for every unsupported
 * method we explicitly export. If a route gains a new method it should be
 * added here, and the offending route's `Allow` list should be kept in sync.
 */
import { describe, expect, it } from 'vitest'

import type { NextRequest } from 'next/server'

type Handler = (req: NextRequest) => Promise<Response> | Response

function makeReq(method: string, pathname: string): NextRequest {
  return new Request(`http://localhost${pathname}`, { method }) as unknown as NextRequest
}

async function expectMethodNotAllowed(
  handler: Handler,
  method: string,
  pathname: string,
  allowed: readonly string[],
) {
  const req = makeReq(method, pathname)
  const res = await handler(req)

  expect(res.status, `${method} ${pathname} should be 405`).toBe(405)
  expect(res.headers.get('content-type')).toMatch(/application\/json/)
  expect(res.headers.get('cache-control')).toBe('no-store')

  // Allow header is RFC 7231: comma-separated list (we use ", " for readability).
  const allowHeader = res.headers.get('allow')
  expect(allowHeader, `${method} ${pathname} should set Allow header`).not.toBeNull()
  for (const m of allowed) {
    expect(allowHeader).toContain(m)
  }

  const body = (await res.json()) as Record<string, unknown>
  expect(body.error).toBe('Method not allowed')
  expect(body.code).toBe('method_not_allowed')
  expect(body.path).toBe(pathname)
  expect(body.method).toBe(method)
  expect(body.allowed).toEqual([...allowed])
}

interface RouteCase {
  path: string
  modulePath: string
  allowed: readonly string[]
  rejected: readonly string[]
}

const CASES: readonly RouteCase[] = [
  {
    path: '/api/csp-report',
    modulePath: '../csp-report/route',
    allowed: ['POST'],
    rejected: ['GET', 'PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/rpc',
    modulePath: '../rpc/route',
    allowed: ['POST'],
    rejected: ['GET', 'PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/faucet',
    modulePath: '../faucet/route',
    allowed: ['GET', 'POST'],
    rejected: ['PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/analytics/overview',
    modulePath: '../analytics/overview/route',
    allowed: ['GET'],
    rejected: ['POST', 'PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/feedback',
    modulePath: '../feedback/route',
    allowed: ['POST'],
    rejected: ['GET', 'PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/predict/comments',
    modulePath: '../predict/comments/route',
    allowed: ['GET', 'POST'],
    rejected: ['PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/prices',
    modulePath: '../prices/route',
    allowed: ['GET'],
    rejected: ['POST', 'PUT', 'DELETE', 'PATCH'],
  },
  {
    path: '/api/status',
    modulePath: '../status/route',
    allowed: ['GET'],
    rejected: ['POST', 'PUT', 'DELETE', 'PATCH'],
  },
] as const

describe('per-route 405 envelopes', () => {
  for (const c of CASES) {
    describe(c.path, () => {
      for (const method of c.rejected) {
        it(`returns 405 method_not_allowed for ${method}`, async () => {
          const mod = (await import(c.modulePath)) as Record<string, Handler | undefined>
          const handler = mod[method]
          expect(handler, `${c.path} must export a ${method} handler`).toBeDefined()
          await expectMethodNotAllowed(handler as Handler, method, c.path, c.allowed)
        })
      }
    })
  }
})
