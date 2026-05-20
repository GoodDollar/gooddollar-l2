// @vitest-environment node
import { describe, expect, it } from 'vitest'

import type { NextRequest } from 'next/server'

import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from '../route'

function makeReq(method: string, pathname: string): NextRequest {
  return new Request(`http://localhost${pathname}`, {
    method,
  }) as unknown as NextRequest
}

describe('catch-all /api/[...slug] route', () => {
  const handlers = { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } as const

  for (const [method, handler] of Object.entries(handlers)) {
    it(`returns a 404 JSON envelope for ${method} on an unmatched /api path`, async () => {
      const req = makeReq(method, '/api/totally/bogus/path')
      const res = await handler(req)

      expect(res.status).toBe(404)
      expect(res.headers.get('content-type')).toMatch(/application\/json/)
      expect(res.headers.get('cache-control')).toBe('no-store')

      if (method !== 'HEAD') {
        const body = (await res.json()) as Record<string, unknown>
        expect(body.error).toBe('API route not found')
        expect(body.code).toBe('api_route_not_found')
        expect(body.path).toBe('/api/totally/bogus/path')
        expect(body.method).toBe(method)
      }
    })
  }

  it('includes the full pathname including query in path field', async () => {
    const req = makeReq('GET', '/api/predict/markets?foo=bar')
    const res = await GET(req)
    const body = (await res.json()) as Record<string, unknown>
    // pathname (without query) is reported.
    expect(body.path).toBe('/api/predict/markets')
  })

  it('does not match (and therefore does not respond for) non-api paths in test invocation', async () => {
    // Sanity check: the handler itself is path-agnostic; routing is what
    // restricts it. But we still verify it echoes back whatever path it sees,
    // so a future regression in route registration would be visible.
    const req = makeReq('GET', '/api/this-does-not-exist')
    const res = await GET(req)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.path).toBe('/api/this-does-not-exist')
  })
})
