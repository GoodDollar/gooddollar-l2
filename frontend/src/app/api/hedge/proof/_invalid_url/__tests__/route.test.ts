import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { GET, POST, PUT, DELETE, PATCH } from '../route'

/**
 * Lane 5 — synthesised `/api/hedge/proof/_invalid_url` route handler
 * (task 0074). The custom server's `normalizeMalformedHedgeProofApiPath`
 * rewrites malformed-percent-encoded `/api/hedge/proof/<id>` URLs here
 * before Next.js's framework-level pathname decoder can reject them
 * with an HTML 400 page. This handler returns the canonical
 * `ProofResponse`-shaped JSON envelope so the API surface stays
 * JSON-only end-to-end.
 */

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/hedge/proof/_invalid_url')
}

describe('GET /api/hedge/proof/_invalid_url', () => {
  it('returns HTTP 400 with application/json content type', async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(400)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
  })

  it('returns the canonical invalid_id JSON envelope with malformed-URL reason', async () => {
    const res = await GET(makeReq())
    const body = (await res.json()) as { status: string; reason: string }
    expect(body.status).toBe('invalid_id')
    expect(body.reason).toMatch(/malformed.*url|url.*encoding/i)
  })

  it('emits Cache-Control: no-store so proxies do not cache the 400', async () => {
    const res = await GET(makeReq())
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
})

describe('/api/hedge/proof/_invalid_url method allowlist', () => {
  it.each([
    ['POST', POST],
    ['PUT', PUT],
    ['DELETE', DELETE],
    ['PATCH', PATCH],
  ])('%s returns 405', async (method, handler) => {
    const req = new NextRequest(
      'http://localhost/api/hedge/proof/_invalid_url',
      { method },
    )
    const res = await handler(req)
    expect(res.status).toBe(405)
  })
})
