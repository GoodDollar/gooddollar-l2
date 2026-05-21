import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock wagmi hooks before importing the module under test
vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

// Mock chain config (must match what useStockHoldings imports from './chain')
vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    CollateralVault: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    StockPriceOracle: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
}))

// Mock useStockPrices to control its `isLoading` state explicitly
vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: vi.fn(() => ({
    prices: {},
    isLive: false,
    isLoading: false,
  })),
}))

import { useStockHoldings } from '@/lib/useStockHoldings'
import { useStockPrices } from '@/lib/useStockPrices'
import { useReadContracts } from 'wagmi'

describe('useStockHoldings — wallet-aware loading state (task 0026)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isLoading=false when wallet is disconnected, even if prices are still loading', () => {
    // Simulate prices still being fetched in the background
    vi.mocked(useStockPrices).mockReturnValue({
      prices: {},
      isLive: false,
      isLoading: true,
    })
    // No positions query runs when address is undefined (enabled: false)
    vi.mocked(useReadContracts).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useStockHoldings(undefined))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.holdings).toEqual([])
    expect(result.current.isLive).toBe(false)
  })

  it('returns isLoading=true when wallet connected and positions are still loading', () => {
    vi.mocked(useStockPrices).mockReturnValue({
      prices: { AAPL: 195 },
      isLive: true,
      isLoading: false,
    })
    vi.mocked(useReadContracts).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() =>
      useStockHoldings('0x1111111111111111111111111111111111111111'),
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('returns isLoading=true when wallet connected and prices are still loading', () => {
    vi.mocked(useStockPrices).mockReturnValue({
      prices: {},
      isLive: false,
      isLoading: true,
    })
    vi.mocked(useReadContracts).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() =>
      useStockHoldings('0x1111111111111111111111111111111111111111'),
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('returns isLoading=false when wallet connected and all data is ready', () => {
    vi.mocked(useStockPrices).mockReturnValue({
      prices: { AAPL: 195 },
      isLive: true,
      isLoading: false,
    })
    vi.mocked(useReadContracts).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() =>
      useStockHoldings('0x1111111111111111111111111111111111111111'),
    )

    expect(result.current.isLoading).toBe(false)
  })
})
