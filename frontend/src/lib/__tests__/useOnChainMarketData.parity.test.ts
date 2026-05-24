/**
 * Task 0044 — `useOnChainMarketData` MUST route BTC/WBTC and ETH/WETH
 * through `useAttributedPrices` so the dollar value the /explore table
 * shows for WBTC matches the dollar value /perps' top strip shows for
 * BTC-USD. Pre-task the explore table read WBTC from CoinGecko while
 * /perps read BTC from the chain oracle, producing a silent ~10%
 * disagreement with no badge on either side.
 *
 * This test pins the canonical resolver behaviour at the hook level:
 *
 *  1. Chain oracle answers with BTC=$84,250 → WBTC row reports
 *     $84,250 and source=chain-oracle, divergence chip surfaces the
 *     CoinGecko number (10% off).
 *  2. Chain offline + CoinGecko WBTC=$75k → both surfaces fall through
 *     to coingecko with no divergent flag.
 *  3. Symmetric for ETH/WETH.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(() => ({ data: undefined, isLoading: false })),
  // `useAttributedPrices` → `useOnChainPairs` calls the single-read
  // helper internally; stub both so no live RPC connection is attempted.
  useReadContract: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceFeeds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceFeeds')>('@/lib/usePriceFeeds')
  return { ...actual, usePriceFeeds: vi.fn() }
})

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn().mockReturnValue({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

import { useOnChainMarketData } from '@/lib/useOnChainMarketData'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceFeeds, FALLBACK_PRICES } from '@/lib/usePriceFeeds'
import type { PerpPair } from '@/lib/perpsData'

function pair(over: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 0, indexPrice: 0, change24h: 0, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 10,
    ...over,
  }
}

function mockFeeds(over: {
  prices?: Record<string, number>
  sources?: Record<string, 'coingecko' | 'fallback'>
  isLive?: boolean
}) {
  vi.mocked(usePriceFeeds).mockReturnValue({
    prices: { ...FALLBACK_PRICES, ...(over.prices ?? {}) },
    sources: over.sources ?? {},
    quotes: {},
    isLive: over.isLive ?? true,
    lastUpdated: new Date(),
    error: null,
    unknownSymbols: [],
  })
}

describe('useOnChainMarketData — cross-page BTC/ETH parity (task 0044)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes WBTC and BTC through the chain-oracle BTC mark when /perps has one', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 })],
      isLoading: false, isLive: true,
    })
    // CoinGecko disagrees by ~10% — exactly the screenshot in the PRD.
    mockFeeds({ prices: { WBTC: 76_531 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useOnChainMarketData())
    const wbtc = result.current.tokens.find(t => t.symbol === 'WBTC')
    expect(wbtc?.price).toBe(84_250)
    expect(result.current.sources.WBTC).toBe('chain-oracle')
    expect(result.current.divergence.WBTC).not.toBeNull()
    expect(result.current.divergence.WBTC?.otherUsd).toBe(76_531)
  })

  it('routes WETH/ETH through the chain-oracle ETH mark when /perps has one', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { WETH: 3200, ETH: 3200 }, sources: { WETH: 'coingecko', ETH: 'coingecko' } })

    const { result } = renderHook(() => useOnChainMarketData())
    const weth = result.current.tokens.find(t => t.symbol === 'WETH')
    const eth  = result.current.tokens.find(t => t.symbol === 'ETH')
    expect(weth?.price).toBe(3500)
    expect(eth?.price).toBe(3500)
    expect(result.current.sources.WETH).toBe('chain-oracle')
    expect(result.current.sources.ETH).toBe('chain-oracle')
    expect(result.current.divergence.WETH).not.toBeNull()
    expect(result.current.divergence.WETH?.otherUsd).toBe(3200)
  })

  it('falls back to coingecko (no divergence) when no chain BTC pair is available', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({ prices: { WBTC: 75_000 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useOnChainMarketData())
    const wbtc = result.current.tokens.find(t => t.symbol === 'WBTC')
    expect(wbtc?.price).toBe(75_000)
    expect(result.current.sources.WBTC).toBe('coingecko')
    expect(result.current.divergence.WBTC).toBeNull()
  })

  it('omits divergence for symbols without an equivalence class', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({ prices: { SOL: 130 }, sources: { SOL: 'coingecko' } })

    const { result } = renderHook(() => useOnChainMarketData())
    // SOL has no canonical resolver wiring; it should pass through
    // untouched and divergence should report null (not undefined).
    expect(result.current.divergence.SOL ?? null).toBeNull()
  })

  it('keeps chain-mark even with divergence flag (chain wins, not coingecko)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { WBTC: 76_531 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useOnChainMarketData())
    const wbtc = result.current.tokens.find(t => t.symbol === 'WBTC')
    expect(wbtc?.price).toBe(84_250)
    expect(wbtc?.price).not.toBe(76_531)
  })
})
