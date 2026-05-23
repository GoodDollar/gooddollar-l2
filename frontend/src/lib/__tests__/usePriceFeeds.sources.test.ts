import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  usePriceFeeds,
  __resetPriceFeedStoreForTests,
} from '@/lib/usePriceFeeds'

describe('usePriceFeeds — sources map (lane 4)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    __resetPriceFeedStoreForTests()
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
    __resetPriceFeedStoreForTests()
  })

  it('initial snapshot exposes an empty sources object', () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
    const { result } = renderHook(() => usePriceFeeds([]))
    expect(result.current.sources).toEqual({})
  })

  it('marks symbols returned live by /api/prices as `coingecko`', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ethereum:  { usd: 3500 },
          'usd-coin': { usd: 1.0 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => usePriceFeeds(['ETH', 'USDC']))
    await waitFor(() => expect(result.current.isLive).toBe(true))

    expect(result.current.sources.ETH).toBe('coingecko')
    expect(result.current.sources.USDC).toBe('coingecko')
  })

  it('marks unmapped / unrequested symbols as `fallback`', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ ethereum: { usd: 3500 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => usePriceFeeds(['ETH', 'NOPE']))
    await waitFor(() => expect(result.current.isLive).toBe(true))

    expect(result.current.sources.ETH).toBe('coingecko')
    expect(result.current.sources.NOPE).toBe('fallback')
  })

  it('marks all requested symbols as `fallback` when fetch fails', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => usePriceFeeds(['ETH', 'USDC']))
    await waitFor(() => expect(result.current.error).not.toBeNull())

    expect(result.current.sources.ETH).toBe('fallback')
    expect(result.current.sources.USDC).toBe('fallback')
  })

  it('symbols requested but not returned by CG are tagged `fallback`', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ ethereum: { usd: 3500 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => usePriceFeeds(['ETH', 'WBTC']))
    await waitFor(() => expect(result.current.isLive).toBe(true))

    expect(result.current.sources.ETH).toBe('coingecko')
    // WBTC is mapped to wrapped-bitcoin but server did not return it →
    // we don't have a live value for it, so the source is `fallback`.
    expect(result.current.sources.WBTC).toBe('fallback')
  })
})
