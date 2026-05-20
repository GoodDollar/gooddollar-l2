// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { apiError, methodNotAllowed, type ApiErrorBody } from '../api-error'

describe('apiError', () => {
  it('returns a NextResponse with JSON content-type and the requested status', async () => {
    const res = apiError(404, 'api_route_not_found', 'API route not found')

    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    expect(res.headers.get('content-type')).toMatch(/charset=utf-8/)
  })

  it('serialises an envelope with error, code, and timestamp', async () => {
    const res = apiError(404, 'api_route_not_found', 'API route not found', {
      path: '/api/totally/bogus',
      method: 'GET',
    })

    const body = (await res.json()) as ApiErrorBody & { path?: string; method?: string }
    expect(body.error).toBe('API route not found')
    expect(body.code).toBe('api_route_not_found')
    expect(body.path).toBe('/api/totally/bogus')
    expect(body.method).toBe('GET')
    // timestamp is optional but if present must be ISO-8601-ish.
    if (body.timestamp) {
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    }
  })

  it('sets Cache-Control: no-store on 4xx responses', () => {
    const res = apiError(404, 'api_route_not_found', 'API route not found')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('sets Cache-Control: no-store on 5xx responses', () => {
    const res = apiError(503, 'service_unavailable', 'Service unavailable')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('honours custom headers passed via extra (e.g. Allow on 405)', () => {
    const res = apiError(405, 'method_not_allowed', 'Method not allowed', {
      path: '/api/csp-report',
      method: 'GET',
      allowed: ['POST'],
      headers: { Allow: 'POST' },
    })

    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
  })

  it('merges extra fields into the JSON body without clobbering core fields', async () => {
    const res = apiError(400, 'bad_request', 'Bad request', {
      field: 'symbols',
      hint: 'pass a comma-separated list',
    })

    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Bad request')
    expect(body.code).toBe('bad_request')
    expect(body.field).toBe('symbols')
    expect(body.hint).toBe('pass a comma-separated list')
  })
})

describe('methodNotAllowed', () => {
  function makeReq(method: string, pathname: string): Request {
    return new Request(`http://localhost${pathname}`, { method })
  }

  it('returns 405 with method_not_allowed envelope and Allow header', async () => {
    const req = makeReq('GET', '/api/csp-report')
    const res = methodNotAllowed(req, ['POST'])

    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    expect(res.headers.get('cache-control')).toBe('no-store')

    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe('Method not allowed')
    expect(body.code).toBe('method_not_allowed')
    expect(body.method).toBe('GET')
    expect(body.path).toBe('/api/csp-report')
    expect(body.allowed).toEqual(['POST'])
  })

  it('joins multiple allowed methods with comma in Allow header', () => {
    const req = makeReq('DELETE', '/api/faucet')
    const res = methodNotAllowed(req, ['GET', 'POST'])

    expect(res.headers.get('allow')).toBe('GET, POST')
  })
})
