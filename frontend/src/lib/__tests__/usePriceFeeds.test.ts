import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import {
  getPrice,
  FALLBACK_PRICES,
  usePriceFeeds,
  __resetPriceFeedStoreForTests,
} from '@/lib/usePriceFeeds'

describe('getPrice', () => {
  it('returns live price from prices map when available', () => {
    const prices = { ETH: 3500 }
    expect(getPrice(prices, 'ETH')).toBe(3500)
  })

  it('falls back to FALLBACK_PRICES when not in live prices', () => {
    const prices: Record<string, number> = {}
    expect(getPrice(prices, 'ETH')).toBe(FALLBACK_PRICES.ETH)
  })

  it('returns 0 for unknown symbol not in fallback', () => {
    expect(getPrice({}, 'UNKNOWN')).toBe(0)
  })

  it('live price overrides fallback', () => {
    const prices = { USDC: 0.9999 }
    expect(getPrice(prices, 'USDC')).toBe(0.9999)
  })
})

describe('FALLBACK_PRICES', () => {
  it('has ETH price', () => {
    expect(FALLBACK_PRICES.ETH).toBeGreaterThan(0)
  })

  it('has stable USD coins at ~$1', () => {
    expect(FALLBACK_PRICES.USDC).toBe(1.0)
    expect(FALLBACK_PRICES.USDT).toBe(1.0)
    expect(FALLBACK_PRICES.DAI).toBe(1.0)
  })

  it('has G$ price', () => {
    expect(FALLBACK_PRICES['G$']).toBeGreaterThan(0)
  })
})

// ─── Shared singleton hook tests ─────────────────────────────────────────────

describe('usePriceFeeds — shared singleton', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    __resetPriceFeedStoreForTests()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ethereum: { usd: 3500 },
          'usd-coin': { usd: 1.0 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    __resetPriceFeedStoreForTests()
  })

  it('returns initial fallback state synchronously', () => {
    const { result } = renderHook(() => usePriceFeeds(['ETH']))
    expect(result.current.prices.ETH).toBe(FALLBACK_PRICES.ETH)
    expect(result.current.isLive).toBe(false)
  })

  it('fetches live prices and exposes them via the hook', async () => {
    const { result } = renderHook(() => usePriceFeeds(['ETH']))

    await waitFor(() => {
      expect(result.current.isLive).toBe(true)
    })

    expect(result.current.prices.ETH).toBe(3500)
    expect(result.current.error).toBeNull()
    expect(result.current.lastUpdated).toBeInstanceOf(Date)
  })

  it('shares ONE fetch across multiple consumers (the whole point)', async () => {
    const a = renderHook(() => usePriceFeeds(['ETH']))
    const b = renderHook(() => usePriceFeeds(['ETH']))
    const c = renderHook(() => usePriceFeeds(['ETH']))

    await waitFor(() => {
      expect(a.result.current.isLive).toBe(true)
      expect(b.result.current.isLive).toBe(true)
      expect(c.result.current.isLive).toBe(true)
    })

    // 3 components, 1 shared symbol set, 1 newly tracked symbol → 1 fetch.
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('triggers an additional fetch when a new symbol is requested', async () => {
    const a = renderHook(() => usePriceFeeds(['ETH']))
    await waitFor(() => expect(a.result.current.isLive).toBe(true))
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Adds USDC, which is a brand-new tracked symbol.
    const b = renderHook(() => usePriceFeeds(['ETH', 'USDC']))
    await waitFor(() => expect(b.result.current.prices.USDC).toBe(1.0))

    // ETH was already tracked, so subscribing a duplicate ETH would NOT refetch.
    // But USDC is new → exactly one extra fetch.
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('does not refetch when a duplicate consumer subscribes to already-tracked symbols', async () => {
    const a = renderHook(() => usePriceFeeds(['ETH']))
    await waitFor(() => expect(a.result.current.isLive).toBe(true))
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const b = renderHook(() => usePriceFeeds(['ETH']))
    // Wait a tick; b should sync to existing state without firing fetch.
    await waitFor(() => expect(b.result.current.isLive).toBe(true))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('falls back gracefully when fetch fails', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'))
    const { result } = renderHook(() => usePriceFeeds(['ETH']))

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.isLive).toBe(false)
    // Still has fallback prices.
    expect(result.current.prices.ETH).toBe(FALLBACK_PRICES.ETH)
  })

  it('cleans up subscribers on unmount and stops the interval when idle', async () => {
    const a = renderHook(() => usePriceFeeds(['ETH']))
    await waitFor(() => expect(a.result.current.isLive).toBe(true))

    // Unmount the only consumer.
    act(() => {
      a.unmount()
    })

    // Mount again — because we cleared the tracked set, this becomes a new
    // first subscription and triggers a fresh fetch.
    const callsBefore = fetchSpy.mock.calls.length
    const b = renderHook(() => usePriceFeeds(['ETH']))
    await waitFor(() => expect(b.result.current.isLive).toBe(true))
    expect(fetchSpy.mock.calls.length).toBe(callsBefore + 1)
  })
})
