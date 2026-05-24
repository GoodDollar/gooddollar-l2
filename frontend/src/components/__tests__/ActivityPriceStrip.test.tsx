import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn(),
  FALLBACK_PRICES: {},
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(() => ({ pairs: [], isLoading: false, isLive: false })),
}))

import { ActivityPriceStrip } from '@/components/ActivityPriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import { useOnChainPairs } from '@/lib/useOnChainPerps'

describe('ActivityPriceStrip', () => {
  beforeEach(() => {
    vi.mocked(usePriceFeeds).mockReturnValue({
      prices: { ETH: 3500, USDC: 1, 'G$': 0.0001, WBTC: 60000 },
      quotes: {},
      isLive: true,
      lastUpdated: new Date(),
      error: null,
      unknownSymbols: [],
      sources: { ETH: 'coingecko', USDC: 'coingecko', 'G$': 'coingecko', WBTC: 'coingecko' },
    })
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: null, nextRetryAt: null,
    })
  })

  it('renders the four asset cards', () => {
    render(<ActivityPriceStrip />)
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('G$')).toBeInTheDocument()
    expect(screen.getByText('WBTC')).toBeInTheDocument()
  })

  it('shows the Stale badge when ETH price-service quote is older than 60s', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 1,
        quotes: [{ symbol: 'ETH', lastUpdateMs: 120_000, sessionState: 'open', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    render(<ActivityPriceStrip />)
    expect(screen.getByText('Stale')).toBeInTheDocument()
  })

  it('shows the Market closed badge when status reports sessionState=closed', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 1,
        quotes: [{ symbol: 'ETH', lastUpdateMs: 1000, sessionState: 'closed', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    render(<ActivityPriceStrip />)
    // Both the badge and the freshness footer read "Market closed" — that's by design.
    expect(screen.getAllByText('Market closed').length).toBeGreaterThan(0)
  })

  it('does not label tiles as Chain oracle when useOnChainPairs only returned fallback substitutes (task 0026)', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        { marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
          markPrice: 84_250, indexPrice: 84_200, change24h: 2.4, volume24h: 0,
          fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100,
          isFallback: true },
        { marketId: 1, symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD',
          markPrice: 1_820, indexPrice: 1_818, change24h: -1.2, volume24h: 0,
          fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 50,
          isFallback: true },
      ],
      isLoading: false, isLive: false,
    })

    render(<ActivityPriceStrip />)
    expect(screen.queryByText('Chain oracle')).not.toBeInTheDocument()
    // ETH and WBTC tiles must now resolve to CoinGecko (which the test mock provides).
    expect(screen.getAllByText('Cached (CoinGecko)').length).toBeGreaterThanOrEqual(2)
  })
})
