import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

import { usePerpsPriceSources } from '@/lib/usePerpsPriceSources'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import type { PerpPair } from '@/lib/perpsData'

function pair(overrides: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 84000, indexPrice: 84000, change24h: 1.5, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100,
    ...overrides,
  } as PerpPair
}

describe('usePerpsPriceSources', () => {
  beforeEach(() => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: null, nextRetryAt: null,
    })
  })

  it('returns chain-oracle when pair has a positive markPrice', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 })],
      isLoading: false, isLive: true,
    })

    const { result } = renderHook(() => usePerpsPriceSources())
    expect(result.current.sources['BTC-USD']).toBe('chain-oracle')
  })

  it('returns closed when price-service reports sessionState=closed (even if chain has a price)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 })],
      isLoading: false, isLive: true,
    })
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 1,
        quotes: [{ symbol: 'BTC', lastUpdateMs: 1000, sessionState: 'closed', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    const { result } = renderHook(() => usePerpsPriceSources())
    // /perps-specific policy: explicit session closure on the underlying
    // market wins over the chain-oracle reading. See doc comment.
    expect(result.current.sources['BTC-USD']).toBe('closed')
  })

  it('returns fallback when chain markPrice is 0 and no status quote available', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 0 })],
      isLoading: false, isLive: false,
    })

    const { result } = renderHook(() => usePerpsPriceSources())
    expect(result.current.sources['BTC-USD']).toBe('fallback')
  })

  it('buildEntries returns one entry per requested symbol with the right source', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 }),
        pair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500, marketId: 1 }),
      ],
      isLoading: false, isLive: true,
    })

    const { result } = renderHook(() => usePerpsPriceSources())
    const entries = result.current.buildEntries(['BTC-USD', 'ETH-USD'])
    expect(entries.map(e => e.symbol)).toEqual(['BTC-USD', 'ETH-USD'])
    expect(entries.every(e => e.source === 'chain-oracle')).toBe(true)
    expect(entries[0].price).toBe(84000)
  })

  it('buildEntries emits an unknown-source placeholder for symbols not in pairs', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 })],
      isLoading: false, isLive: true,
    })

    const { result } = renderHook(() => usePerpsPriceSources())
    const entries = result.current.buildEntries(['BTC-USD', 'XRP-USD'])
    expect(entries.find(e => e.symbol === 'XRP-USD')?.source).toBe('unknown')
  })
})
