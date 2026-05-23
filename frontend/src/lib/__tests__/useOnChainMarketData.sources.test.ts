import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

vi.mock('@/lib/usePriceFeeds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceFeeds')>('@/lib/usePriceFeeds')
  return {
    ...actual,
    usePriceFeeds: vi.fn(),
  }
})

import { useOnChainMarketData } from '@/lib/useOnChainMarketData'
import { usePriceFeeds, FALLBACK_PRICES } from '@/lib/usePriceFeeds'
import { useReadContracts } from 'wagmi'

const WETH_RAW = 3_000n * 10n ** 8n // $3000 at 8 decimals
const USDC_RAW = 1n * 10n ** 8n     // $1 at 8 decimals

describe('useOnChainMarketData — sources map (lane 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePriceFeeds).mockReturnValue({
      prices: { ...FALLBACK_PRICES },
      quotes: {},
      isLive: false,
      lastUpdated: null,
      error: null,
      unknownSymbols: [],
      sources: {},
    })
  })

  it('marks WETH/ETH/USDC as chain-oracle when the GoodLend oracle returns success', () => {
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: 'failure', error: new Error('no supply'), result: undefined },
        { status: 'failure', error: new Error('no reserves'), result: undefined },
        { status: 'failure', error: new Error('no reserves'), result: undefined },
        { status: 'success', result: WETH_RAW },
        { status: 'success', result: USDC_RAW },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useOnChainMarketData())
    expect(result.current.sources.ETH).toBe('chain-oracle')
    expect(result.current.sources.WETH).toBe('chain-oracle')
    expect(result.current.sources.USDC).toBe('chain-oracle')
  })

  it('falls through to coingecko (then fallback) when the oracle fails', () => {
    vi.mocked(usePriceFeeds).mockReturnValue({
      prices: { ...FALLBACK_PRICES, ETH: 3500, USDC: 1 },
      quotes: {},
      isLive: true,
      lastUpdated: new Date(),
      error: null,
      unknownSymbols: [],
      sources: { ETH: 'coingecko', WETH: 'coingecko', USDC: 'coingecko', 'G$': 'fallback' },
    })
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: 'failure', error: new Error('no supply'), result: undefined },
        { status: 'failure', error: new Error('no reserves'), result: undefined },
        { status: 'failure', error: new Error('no reserves'), result: undefined },
        { status: 'failure', error: new Error('no oracle'), result: undefined },
        { status: 'failure', error: new Error('no oracle'), result: undefined },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useOnChainMarketData())
    expect(result.current.sources.ETH).toBe('coingecko')
    expect(result.current.sources.USDC).toBe('coingecko')
    // G$ is not chain (no pool reserves), not in CG live (sources.G$ === 'fallback' in mock)
    expect(result.current.sources['G$']).toBe('fallback')
  })

  it('every TOKENS symbol receives a source (never undefined)', () => {
    vi.mocked(useReadContracts).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useOnChainMarketData())
    for (const t of result.current.tokens) {
      expect(result.current.sources[t.symbol]).toBeDefined()
    }
  })
})
