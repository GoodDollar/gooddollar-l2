import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn(),
  FALLBACK_PRICES: {},
}))

vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: vi.fn(),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

import { PortfolioPriceStrip } from '@/components/PortfolioPriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { useStockPrices } from '@/lib/useStockPrices'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'

describe('PortfolioPriceStrip', () => {
  beforeEach(() => {
    vi.mocked(usePriceFeeds).mockReturnValue({
      prices: { ETH: 3500, BTC: 84000 },
      quotes: { ETH: { price: 3500, change24h: 1.0, volume24h: 0, marketCap: 0 } },
      isLive: true,
      lastUpdated: new Date(),
      error: null,
      unknownSymbols: [],
      sources: { ETH: 'coingecko', BTC: 'coingecko' },
    })
    vi.mocked(useStockPrices).mockReturnValue({
      prices: { AAPL: 195, TSLA: 300 },
      isLive: true,
      isLoading: false,
      sources: { AAPL: 'chain-oracle', TSLA: 'chain-oracle' },
    })
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: null, nextRetryAt: null,
    })
  })

  it('renders one card per distinct holding (stocks + crypto)', () => {
    render(<PortfolioPriceStrip stockTickers={['AAPL', 'TSLA']} cryptoSymbols={['ETH', 'BTC']} />)
    expect(screen.getAllByTestId('live-price-card')).toHaveLength(4)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('renders the empty state (not skeletons) when both lists are empty', () => {
    render(<PortfolioPriceStrip stockTickers={[]} cryptoSymbols={[]} />)
    expect(screen.getByTestId('live-price-empty')).toBeInTheDocument()
    expect(screen.queryAllByTestId('live-price-skeleton')).toHaveLength(0)
  })

  it('deduplicates repeated symbols within a list', () => {
    render(<PortfolioPriceStrip stockTickers={['AAPL', 'AAPL']} cryptoSymbols={['ETH', 'ETH']} />)
    expect(screen.getAllByTestId('live-price-card')).toHaveLength(2)
  })

  it('shows "Market closed" badge when stocks session state is closed', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true, freshCount: 1, totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 1000, sessionState: 'closed', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    render(<PortfolioPriceStrip stockTickers={['AAPL']} cryptoSymbols={[]} />)
    expect(screen.getByText('Market closed')).toBeInTheDocument()
  })

  it('shows "Stale" badge when AAPL last update is older than 60s', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 90_000, sessionState: 'open', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    render(<PortfolioPriceStrip stockTickers={['AAPL']} cryptoSymbols={[]} />)
    expect(screen.getByText('Stale')).toBeInTheDocument()
  })
})
