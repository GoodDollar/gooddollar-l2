import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/oracle/status', () => {
  it('returns upstream quote status payload when reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        healthy: true,
        freshCount: 5,
        totalCount: 5,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 1200, sessionState: 'open', confidence: 92 }],
        timestamp: 1710000000000,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.healthy).toBe(true)
    expect(data.quotes).toHaveLength(1)
  })

  it('returns 502 when upstream responds with non-OK status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('bad gateway', { status: 502 }))

    const res = await GET()
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain('returned 502')
  })

  it('returns 503 fallback payload when upstream is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await GET()
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toContain('unavailable')
    expect(data.healthy).toBe(false)
    expect(Array.isArray(data.quotes)).toBe(true)
  })
})
