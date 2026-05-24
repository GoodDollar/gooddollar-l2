import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStockSources } from '../useStockSources'

vi.mock('../useStockPrices', () => ({
  useStockPrices: vi.fn(),
}))

vi.mock('../usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

import { useStockPrices } from '../useStockPrices'
import { usePriceServiceStatus } from '../usePriceServiceStatus'

const mockUseStockPrices = vi.mocked(useStockPrices)
const mockUsePriceServiceStatus = vi.mocked(usePriceServiceStatus)

describe('useStockSources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mirrors base sources when price-service is silent', () => {
    mockUseStockPrices.mockReturnValue({
      prices: { AAPL: 200, TSLA: 250 },
      sources: { AAPL: 'chain-oracle', TSLA: 'fallback' },
      hasLiveData: true,
      isLoading: false,
      isPartial: false,
      isFallback: false,
      missingSymbols: [],
    } as never)
    mockUsePriceServiceStatus.mockReturnValue({
      status: null,
      isLoading: false,
      error: null,
      nextRetryAt: null,
    } as never)

    const { result } = renderHook(() => useStockSources())
    expect(result.current).toEqual({
      AAPL: 'chain-oracle',
      TSLA: 'fallback',
    })
  })

  it('overrides to closed when sessionState is closed', () => {
    mockUseStockPrices.mockReturnValue({
      prices: { AAPL: 200 },
      sources: { AAPL: 'chain-oracle' },
      hasLiveData: true,
      isLoading: false,
      isPartial: false,
      isFallback: false,
      missingSymbols: [],
    } as never)
    mockUsePriceServiceStatus.mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 1000, sessionState: 'closed', confidence: 1 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    } as never)

    const { result } = renderHook(() => useStockSources())
    expect(result.current.AAPL).toBe('closed')
  })

  it('overrides to stale when chain price is fresh-base but lastUpdateMs exceeds 60s', () => {
    mockUseStockPrices.mockReturnValue({
      prices: { AAPL: 200 },
      sources: { AAPL: 'chain-oracle' },
      hasLiveData: true,
      isLoading: false,
      isPartial: false,
      isFallback: false,
      missingSymbols: [],
    } as never)
    mockUsePriceServiceStatus.mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 120_000, sessionState: 'open', confidence: 1 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    } as never)

    const { result } = renderHook(() => useStockSources())
    expect(result.current.AAPL).toBe('stale')
  })

  it('does not downgrade fallback to stale (override only applies to chain-oracle base)', () => {
    mockUseStockPrices.mockReturnValue({
      prices: { AAPL: 200 },
      sources: { AAPL: 'fallback' },
      hasLiveData: false,
      isLoading: false,
      isPartial: false,
      isFallback: true,
      missingSymbols: [],
    } as never)
    mockUsePriceServiceStatus.mockReturnValue({
      status: {
        healthy: true,
        freshCount: 0,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 200_000, sessionState: 'open', confidence: 1 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    } as never)

    const { result } = renderHook(() => useStockSources())
    expect(result.current.AAPL).toBe('fallback')
  })

  it('closed status wins over stale', () => {
    mockUseStockPrices.mockReturnValue({
      prices: { AAPL: 200 },
      sources: { AAPL: 'chain-oracle' },
      hasLiveData: true,
      isLoading: false,
      isPartial: false,
      isFallback: false,
      missingSymbols: [],
    } as never)
    mockUsePriceServiceStatus.mockReturnValue({
      status: {
        healthy: true,
        freshCount: 0,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 999_999, sessionState: 'halted', confidence: 1 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    } as never)

    const { result } = renderHook(() => useStockSources())
    expect(result.current.AAPL).toBe('closed')
  })
})
