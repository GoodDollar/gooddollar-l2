/**
 * Unit tests for src/lib/withApiRateLimit.ts
 *
 * Verifies the Node-runtime route-handler wrapper:
 *   - Forwards to the underlying handler when under the limit.
 *   - Returns HTTP 429 + Retry-After header once the per-IP bucket is empty.
 *   - Tracks separate IPs independently.
 *   - Honours the RATE_LIMIT_RPM env override.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { _resetBuckets } from '../rate-limit'
import { withApiRateLimit, type ApiRouteHandler } from '../withApiRateLimit'

function makeReq(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    // NextRequest has many other fields; we only need .headers for getRealIp.
  } as unknown as Parameters<ApiRouteHandler>[0]
}

describe('withApiRateLimit', () => {
  beforeEach(() => {
    _resetBuckets()
    delete process.env.RATE_LIMIT_RPM
  })

  afterEach(() => {
    delete process.env.RATE_LIMIT_RPM
    vi.restoreAllMocks()
  })

  it('forwards to the underlying handler when under the limit', async () => {
    const handler: ApiRouteHandler = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    const wrapped = withApiRateLimit(handler)
    const res = await wrapped(makeReq({ 'x-real-ip': '10.0.0.1' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 429 with Retry-After header once the bucket is exhausted', async () => {
    // Tighten the limit for a fast test.
    process.env.RATE_LIMIT_RPM = '5'

    const handler: ApiRouteHandler = vi.fn(async () => new Response('OK', { status: 200 }))
    const wrapped = withApiRateLimit(handler)

    const headers = { 'x-real-ip': '10.0.0.2' }

    // First 5 should pass.
    for (let i = 0; i < 5; i++) {
      const ok = await wrapped(makeReq(headers))
      expect(ok.status).toBe(200)
    }

    // 6th must be denied.
    const denied = await wrapped(makeReq(headers))
    expect(denied.status).toBe(429)
    expect(handler).toHaveBeenCalledTimes(5)

    const retryAfter = denied.headers.get('Retry-After')
    expect(retryAfter).not.toBeNull()
    expect(Number(retryAfter)).toBeGreaterThan(0)

    const body = await denied.json()
    expect(body).toMatchObject({
      error: 'Too many requests',
      retryAfterSeconds: expect.any(Number),
    })
    expect(body.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks separate IPs independently', async () => {
    process.env.RATE_LIMIT_RPM = '3'

    const handler: ApiRouteHandler = vi.fn(async () => new Response('OK', { status: 200 }))
    const wrapped = withApiRateLimit(handler)

    // Exhaust IP A
    for (let i = 0; i < 3; i++) {
      const r = await wrapped(makeReq({ 'x-real-ip': '10.0.0.10' }))
      expect(r.status).toBe(200)
    }
    const aDenied = await wrapped(makeReq({ 'x-real-ip': '10.0.0.10' }))
    expect(aDenied.status).toBe(429)

    // IP B still has full bucket.
    const bOk = await wrapped(makeReq({ 'x-real-ip': '10.0.0.11' }))
    expect(bOk.status).toBe(200)
  })

  it('falls back to 127.0.0.1 when no IP headers are present', async () => {
    process.env.RATE_LIMIT_RPM = '2'

    const handler: ApiRouteHandler = vi.fn(async () => new Response('OK', { status: 200 }))
    const wrapped = withApiRateLimit(handler)

    // Two requests with no IP header → both bucket against 127.0.0.1.
    expect((await wrapped(makeReq({}))).status).toBe(200)
    expect((await wrapped(makeReq({}))).status).toBe(200)
    expect((await wrapped(makeReq({}))).status).toBe(429)
  })

  it('honours RATE_LIMIT_ENABLED=false kill switch (always forwards)', async () => {
    process.env.RATE_LIMIT_RPM = '1'
    process.env.RATE_LIMIT_ENABLED = 'false'

    const handler: ApiRouteHandler = vi.fn(async () => new Response('OK', { status: 200 }))
    const wrapped = withApiRateLimit(handler)

    // Without the kill switch, the 2nd call would be 429.
    for (let i = 0; i < 5; i++) {
      const r = await wrapped(makeReq({ 'x-real-ip': '10.0.0.50' }))
      expect(r.status).toBe(200)
    }
    expect(handler).toHaveBeenCalledTimes(5)

    delete process.env.RATE_LIMIT_ENABLED
  })

  it('preserves the handler context argument', async () => {
    const handler: ApiRouteHandler = vi.fn(async (_req, ctx) =>
      new Response(JSON.stringify(ctx ?? null), { status: 200 }),
    )

    const wrapped = withApiRateLimit(handler)
    const ctx = { params: { id: 'abc' } }
    const res = await wrapped(makeReq({ 'x-real-ip': '10.0.0.20' }), ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(ctx)
    expect(handler).toHaveBeenCalledWith(expect.anything(), ctx)
  })
})
