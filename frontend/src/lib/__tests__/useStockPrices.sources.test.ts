import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    StocksPriceOracle: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
}))

vi.mock('@/lib/stockData', () => ({
  getAllTickers: () => ['AAPL', 'TSLA', 'NVDA'],
  getStockByTicker: (t: string) =>
    ({ AAPL: { price: 195 }, TSLA: { price: 300 }, NVDA: { price: 950 } } as Record<string, { price: number }>)[t] ??
    null,
}))

import { useStockPrices } from '@/lib/useStockPrices'
import { useReadContracts } from 'wagmi'

describe('useStockPrices — sources map (lane 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports every ticker as chain-oracle when every oracle slot returns success', () => {
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: 'success', result: 19500000000n },
        { status: 'success', result: 30000000000n },
        { status: 'success', result: 95000000000n },
      ],
      isLoading: false,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useStockPrices())
    expect(result.current.sources).toEqual({
      AAPL: 'chain-oracle',
      TSLA: 'chain-oracle',
      NVDA: 'chain-oracle',
    })
    expect(result.current.isLive).toBe(true)
  })

  it('reports per-ticker fallback when only some oracle slots succeed', () => {
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: 'success', result: 19500000000n },
        { status: 'failure', error: new Error('reverted'), result: undefined },
        { status: 'success', result: 95000000000n },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useStockPrices())
    expect(result.current.sources.AAPL).toBe('chain-oracle')
    expect(result.current.sources.TSLA).toBe('fallback')
    expect(result.current.sources.NVDA).toBe('chain-oracle')
  })

  it('reports every ticker as fallback when no multicall result is available', () => {
    vi.mocked(useReadContracts).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useStockPrices())
    expect(result.current.sources).toEqual({
      AAPL: 'fallback',
      TSLA: 'fallback',
      NVDA: 'fallback',
    })
    expect(result.current.isLive).toBe(false)
  })
})
