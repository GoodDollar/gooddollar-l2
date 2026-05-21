import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '../route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/status/quotes', () => {
  it('proxies quote status when upstream is reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          healthy: true,
          freshCount: 9,
          totalCount: 10,
          quotes: [{ symbol: 'AAPL', lastUpdateMs: 1200, sessionState: 'open', confidence: 95 }],
          timestamp: 1779300000000,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.healthy).toBe(true)
    expect(data.freshCount).toBe(9)
    expect(data.totalCount).toBe(10)
  })

  it('returns 502 when upstream returns non-OK status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('bad gateway', { status: 500 }))

    const res = await GET()
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain('error')
  })

  it('returns degraded fallback when upstream is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await GET()
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toContain('unavailable')
    expect(data.healthy).toBe(false)
    expect(data.totalCount).toBe(0)
    expect(Array.isArray(data.quotes)).toBe(true)
  })
})
