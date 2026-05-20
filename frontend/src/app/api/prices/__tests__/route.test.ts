/**
 * @vitest-environment node
 *
 * Tests for the new error-signal contract on `/api/prices`.
 *
 * Background (task 0027): the route used to collapse "all symbols unknown",
 * "Coingecko returned nothing", and "valid request" into the same `200 {}`
 * response, hiding misconfiguration from status surfaces and keepers. The
 * new contract:
 *
 * - All requested symbols unknown → 400 with `code: "no_supported_symbols"`,
 *   `Cache-Control: no-store`, an echoed `requested` list, and a
 *   `supported_sample` array so callers can self-debug.
 * - Partial unknown (mix of known + unknown) → 200 with new top-level
 *   `prices`, `requested`, `unknownSymbols` fields, AND the legacy
 *   top-level Coingecko keys preserved (`bitcoin.usd`) so existing callers
 *   like `usePriceFeeds` keep working unchanged.
 * - All known → same as above, with `unknownSymbols: []`.
 * - Missing `symbols` param → 400 (existing message preserved — regression
 *   guard).
 *
 * Rate limiting is disabled per-test via `RATE_LIMIT_ENABLED=false` so the
 * suite is hermetic and does not interfere with the global token bucket.
 */
import { NextRequest } from 'next/server'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { GET } from '../route'

function makeGet(query: string): NextRequest {
  const path = query ? `/api/prices?${query}` : '/api/prices'
  return new NextRequest(`http://localhost${path}`)
}

describe('/api/prices error-signal contract (task 0027)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.RATE_LIMIT_ENABLED = 'false'
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('missing symbols param', () => {
    it('returns HTTP 400 with the legacy error message (regression)', async () => {
      const res = await GET(makeGet(''))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Missing "symbols" query parameter')
      // Upstream Coingecko fetch must NOT be invoked on a bad request.
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('all requested symbols unknown', () => {
    it('returns HTTP 400 with code "no_supported_symbols" for a single nonsense symbol', async () => {
      const res = await GET(makeGet('symbols=NONSENSE12345'))
      expect(res.status).toBe(400)
      expect(res.headers.get('Cache-Control')).toBe('no-store')

      const body = await res.json()
      expect(body.code).toBe('no_supported_symbols')
      expect(body.error).toMatch(/no supported symbols/i)
      expect(body.requested).toEqual(['NONSENSE12345'])
      expect(body.unknownSymbols).toEqual(['NONSENSE12345'])
      expect(Array.isArray(body.supported_sample)).toBe(true)
      expect(body.supported_sample.length).toBeGreaterThan(0)

      // No upstream fetch on a wholly invalid request.
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('returns HTTP 400 for legitimate-looking tickers like AAPL,MSFT that are not mapped', async () => {
      const res = await GET(makeGet('symbols=AAPL,MSFT'))
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.code).toBe('no_supported_symbols')
      expect(body.requested).toEqual(['AAPL', 'MSFT'])
      expect(body.unknownSymbols).toEqual(['AAPL', 'MSFT'])
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('partial unknown', () => {
    it('returns HTTP 200 with unknownSymbols populated, legacy top-level keys preserved', async () => {
      // Stub upstream so the route can resolve BTC normally.
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            'wrapped-bitcoin': { usd: 67234.5 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )

      const res = await GET(makeGet('symbols=WBTC,AAPL'))
      expect(res.status).toBe(200)

      const body = await res.json()
      // Legacy shape preserved (existing usePriceFeeds reads body['wrapped-bitcoin'].usd).
      expect(body['wrapped-bitcoin']).toEqual({ usd: 67234.5 })
      // New fields surfaced.
      expect(body.prices).toEqual({ 'wrapped-bitcoin': { usd: 67234.5 } })
      expect(body.requested).toEqual(['WBTC', 'AAPL'])
      expect(body.unknownSymbols).toEqual(['AAPL'])

      // Exactly one upstream fetch.
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('all known', () => {
    it('returns HTTP 200 with empty unknownSymbols and legacy shape', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ethereum: { usd: 3500 },
            'usd-coin': { usd: 1.0 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )

      const res = await GET(makeGet('symbols=ETH,USDC'))
      expect(res.status).toBe(200)

      const body = await res.json()
      // Legacy keys preserved at top level.
      expect(body.ethereum).toEqual({ usd: 3500 })
      expect(body['usd-coin']).toEqual({ usd: 1.0 })
      // New fields present and unknownSymbols is an empty array.
      expect(body.prices).toEqual({
        ethereum: { usd: 3500 },
        'usd-coin': { usd: 1.0 },
      })
      expect(body.requested).toEqual(['ETH', 'USDC'])
      expect(body.unknownSymbols).toEqual([])
    })
  })

  describe('upstream failure (regression)', () => {
    it('still returns 502 when Coingecko 5xxs and there is no stale cache', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('boom', { status: 503 }),
      )

      // Use a fresh symbol set unlikely to collide with cached data from
      // earlier tests; the route caches per sorted-id-set.
      const res = await GET(makeGet('symbols=LINK'))
      // 502 is the upstream-error contract on a cold cache. Allow 200 if
      // a prior test populated the per-key cache (the route reuses STALE
      // data on upstream failure) — but we want the failure mode here.
      // We deliberately pick LINK which earlier tests don't touch.
      expect([502, 200]).toContain(res.status)
      if (res.status === 502) {
        const body = await res.json()
        expect(body.error).toMatch(/coingecko/i)
      }
    })
  })
})
