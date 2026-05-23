import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn(),
  FALLBACK_PRICES: {
    ETH: 3012.45,
    WBTC: 60125.80,
    'G$': 0.0102,
    USDC: 1,
  },
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn().mockReturnValue({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

import { useAttributedPrice, useAttributedPrices } from '@/lib/useAttributedPrice'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
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
  quotes?: Record<string, { price: number; change24h: number; volume24h: number; marketCap: number }>
  lastUpdated?: Date | null
}) {
  vi.mocked(usePriceFeeds).mockReturnValue({
    prices: over.prices ?? {},
    sources: over.sources ?? {},
    quotes: over.quotes ?? {},
    isLive: true,
    lastUpdated: over.lastUpdated ?? new Date(),
    error: null,
    unknownSymbols: [],
  })
}

describe('useAttributedPrice — cross-page shared source-of-truth (lane 4 / 0021)', () => {
  beforeEach(() => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: null, nextRetryAt: null,
    })
  })

  it('A: chain wins for BTC when on-chain pair has positive markPrice', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { WBTC: 75_270 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useAttributedPrice('BTC'))
    expect(result.current.priceUsd).toBe(84_250)
    expect(result.current.source).toBe('chain-oracle')
    expect(result.current.divergent).toBe(true)
    expect(result.current.divergenceOtherUsd).toBe(75_270)
  })

  it('A-alias: WBTC normalises to BTC for price (chain wins, divergence visible)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { WBTC: 75_270 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useAttributedPrice('WBTC'))
    expect(result.current.priceUsd).toBe(84_250)
    expect(result.current.source).toBe('chain-oracle')
    expect(result.current.divergent).toBe(true)
  })

  it('B: CoinGecko wins when chain markPrice is 0', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 0 })],
      isLoading: false, isLive: false,
    })
    mockFeeds({ prices: { WBTC: 75_270 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useAttributedPrice('WBTC'))
    expect(result.current.priceUsd).toBe(75_270)
    expect(result.current.source).toBe('coingecko')
    expect(result.current.divergent).toBe(false)
  })

  it('C: agreement under 0.5% threshold → divergent false', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 60_100 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { WBTC: 60_120 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useAttributedPrice('BTC'))
    expect(result.current.source).toBe('chain-oracle')
    expect(result.current.divergent).toBe(false)
  })

  it('D: disagreement over threshold → divergent true', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 60_000 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { WBTC: 75_270 }, sources: { WBTC: 'coingecko' } })

    const { result } = renderHook(() => useAttributedPrice('BTC'))
    expect(result.current.divergent).toBe(true)
    expect(result.current.divergenceOtherUsd).toBe(75_270)
  })

  it('E: unknown when no chain and no coingecko (and no fallback)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({})

    const { result } = renderHook(() => useAttributedPrice('XYZ'))
    expect(result.current.priceUsd).toBe(0)
    expect(result.current.source).toBe('unknown')
    expect(result.current.divergent).toBe(false)
  })

  it('falls back to FALLBACK_PRICES when neither chain nor coingecko has data', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({ sources: { ETH: 'fallback' } })

    const { result } = renderHook(() => useAttributedPrice('ETH'))
    expect(result.current.source).toBe('fallback')
    expect(result.current.priceUsd).toBe(3012.45)
  })

  it('honours stale state from price-service status (chain absent)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({ prices: { ETH: 3500 }, sources: { ETH: 'coingecko' } })
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 1,
        quotes: [{ symbol: 'ETH', lastUpdateMs: 120_000, sessionState: 'open', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    const { result } = renderHook(() => useAttributedPrice('ETH'))
    expect(result.current.source).toBe('stale')
  })

  it('useAttributedPrices returns a record keyed by the input symbols', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 }),
        pair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3_500, marketId: 1 }),
      ],
      isLoading: false, isLive: true,
    })
    mockFeeds({
      prices: { ETH: 3_500, WBTC: 75_270, USDC: 1, 'G$': 0.0002 },
      sources: { ETH: 'coingecko', WBTC: 'coingecko', USDC: 'coingecko', 'G$': 'coingecko' },
    })

    const { result } = renderHook(() => useAttributedPrices(['ETH', 'WBTC', 'USDC', 'G$']))
    expect(result.current.WBTC.priceUsd).toBe(84_250)
    expect(result.current.WBTC.source).toBe('chain-oracle')
    expect(result.current.ETH.priceUsd).toBe(3_500)
    expect(result.current.ETH.source).toBe('chain-oracle')
    expect(result.current.USDC.priceUsd).toBe(1)
    expect(result.current['G$'].priceUsd).toBe(0.0002)
  })

  it('keeps source attribution honest when only CoinGecko fired (no chain pair for asset)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 })],
      isLoading: false, isLive: true,
    })
    mockFeeds({ prices: { USDC: 1 }, sources: { USDC: 'coingecko' } })

    const { result } = renderHook(() => useAttributedPrice('USDC'))
    expect(result.current.source).toBe('coingecko')
    expect(result.current.priceUsd).toBe(1)
    expect(result.current.divergent).toBe(false)
  })

  it('exposes change24h from the coingecko quote when available', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({
      prices: { ETH: 3_500 },
      sources: { ETH: 'coingecko' },
      quotes: { ETH: { price: 3_500, change24h: -2.83, volume24h: 0, marketCap: 0 } },
    })

    const { result } = renderHook(() => useAttributedPrice('ETH'))
    expect(result.current.change24h).toBeCloseTo(-2.83, 2)
  })

  describe('task 0026 — fallback-substituted chain pairs must not claim chain-oracle', () => {
    it('falls through to coingecko when chain pair is fallback-substituted (RPC down, CG live)', () => {
      vi.mocked(useOnChainPairs).mockReturnValue({
        pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250, isFallback: true })],
        isLoading: false, isLive: false,
      })
      mockFeeds({ prices: { WBTC: 75_270 }, sources: { WBTC: 'coingecko' } })

      const { result } = renderHook(() => useAttributedPrice('BTC'))
      expect(result.current.source).toBe('coingecko')
      expect(result.current.priceUsd).toBe(75_270)
      expect(result.current.divergent).toBe(false)
      expect(result.current.divergenceOtherUsd).toBeNull()
    })

    it('falls through to fallback when chain pair is fallback-substituted AND CG is dead', () => {
      vi.mocked(useOnChainPairs).mockReturnValue({
        pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250, isFallback: true })],
        isLoading: false, isLive: false,
      })
      mockFeeds({})

      const { result } = renderHook(() => useAttributedPrice('WBTC'))
      expect(result.current.source).toBe('fallback')
      expect(result.current.priceUsd).toBe(60125.80)
      expect(result.current.divergent).toBe(false)
    })

    it('preserves chain-oracle attribution when chain pair is a real read (isFallback unset)', () => {
      vi.mocked(useOnChainPairs).mockReturnValue({
        pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 })],
        isLoading: false, isLive: true,
      })
      mockFeeds({ prices: { WBTC: 75_270 }, sources: { WBTC: 'coingecko' } })

      const { result } = renderHook(() => useAttributedPrice('BTC'))
      expect(result.current.source).toBe('chain-oracle')
      expect(result.current.priceUsd).toBe(84_250)
      expect(result.current.divergent).toBe(true)
    })

    it('preserves chain-oracle attribution when isFallback is explicitly false', () => {
      vi.mocked(useOnChainPairs).mockReturnValue({
        pairs: [pair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3_500, isFallback: false })],
        isLoading: false, isLive: true,
      })
      mockFeeds({ prices: { ETH: 3_500 }, sources: { ETH: 'coingecko' } })

      const { result } = renderHook(() => useAttributedPrice('ETH'))
      expect(result.current.source).toBe('chain-oracle')
      expect(result.current.priceUsd).toBe(3_500)
    })
  })
})
