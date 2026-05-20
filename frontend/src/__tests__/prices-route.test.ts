import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Pass through the rate limiter so we exercise only the cache logic.
vi.mock('@/lib/withApiRateLimit', () => ({
  withApiRateLimit: <T extends (...args: unknown[]) => unknown>(h: T) => h,
}))

function makeReq(symbols: string): NextRequest {
  return new NextRequest(`http://localhost/api/prices?symbols=${symbols}`)
}

function mockUpstreamOnce(payload: Record<string, unknown>, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }) as unknown as Response,
  )
}

function mockUpstreamThrowsOnce(err: Error = new Error('ECONNREFUSED')) {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(err)
}

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
})

describe('GET /api/prices — caching & resilience', () => {
  it('returns 200 + X-Cache: MISS on first call, then HIT on identical second call', async () => {
    mockUpstreamOnce({ ethereum: { usd: 3000 }, 'usd-coin': { usd: 1 } })

    const { GET } = await import('../app/api/prices/route')

    const r1 = await GET(makeReq('ETH,USDC'))
    expect(r1.status).toBe(200)
    expect(r1.headers.get('X-Cache')).toBe('MISS')

    const r2 = await GET(makeReq('ETH,USDC'))
    expect(r2.status).toBe(200)
    expect(r2.headers.get('X-Cache')).toBe('HIT')

    const r2Json = await r2.json()
    expect(r2Json).toMatchObject({ ethereum: { usd: 3000 } })

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('caches per-key — alternating distinct baskets each MISS once then HIT', async () => {
    mockUpstreamOnce({ ethereum: { usd: 3000 } })
    mockUpstreamOnce({ 'usd-coin': { usd: 1 } })

    const { GET } = await import('../app/api/prices/route')

    const a1 = await GET(makeReq('ETH'))
    expect(a1.headers.get('X-Cache')).toBe('MISS')

    const b1 = await GET(makeReq('USDC'))
    expect(b1.headers.get('X-Cache')).toBe('MISS')

    const a2 = await GET(makeReq('ETH'))
    expect(a2.headers.get('X-Cache')).toBe('HIT')

    const b2 = await GET(makeReq('USDC'))
    expect(b2.headers.get('X-Cache')).toBe('HIT')

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('does NOT serve cross-key STALE — upstream fails on a key with no cached entry returns 502', async () => {
    mockUpstreamOnce({ ethereum: { usd: 3000 } }) // populate ETH cache
    mockUpstreamThrowsOnce() // USDC request fails

    const { GET } = await import('../app/api/prices/route')

    const eth = await GET(makeReq('ETH'))
    expect(eth.status).toBe(200)
    expect(eth.headers.get('X-Cache')).toBe('MISS')

    const usdc = await GET(makeReq('USDC'))
    expect(usdc.status).toBe(502)
    expect(usdc.headers.get('X-Cache')).toBeNull()
    const errBody = await usdc.json()
    expect(errBody.error).toBeTruthy()
  })

  it('serves same-key STALE when upstream fails on second call for same basket after TTL expiry', async () => {
    mockUpstreamOnce({ ethereum: { usd: 3000 } })

    const { GET } = await import('../app/api/prices/route')

    const fresh = await GET(makeReq('ETH'))
    expect(fresh.headers.get('X-Cache')).toBe('MISS')

    // Advance time past CACHE_TTL_MS (60_000) so the second call is a miss-then-stale.
    const realNow = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(realNow + 61_000)

    // Now arm the upstream failure for the re-fetch attempt.
    mockUpstreamThrowsOnce()

    const stale = await GET(makeReq('ETH'))
    expect(stale.status).toBe(200)
    expect(stale.headers.get('X-Cache')).toBe('STALE')
    const staleBody = await stale.json()
    expect(staleBody).toMatchObject({ ethereum: { usd: 3000 } })
  })

  it('rejects oversize symbol lists with 400', async () => {
    const { GET } = await import('../app/api/prices/route')

    const oversize = Array.from({ length: 60 }, (_, i) => `SYM${i}`).join(',')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await GET(makeReq(oversize))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Too many symbols/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('preserves existing 400 for missing symbols param', async () => {
    const { GET } = await import('../app/api/prices/route')

    const res = await GET(new NextRequest('http://localhost/api/prices'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Missing/i)
  })

  it('returns 200 + empty object for symbols with no Coingecko mapping', async () => {
    const { GET } = await import('../app/api/prices/route')

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await GET(makeReq('NOTREAL,ALSOFAKE'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({})
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
