import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn(),
  FALLBACK_PRICES: {},
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

import { AnalyticsPriceStrip } from '@/components/AnalyticsPriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'

describe('AnalyticsPriceStrip', () => {
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

  it('renders the four protocol asset cards', () => {
    render(<AnalyticsPriceStrip />)
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('G$')).toBeInTheDocument()
    expect(screen.getByText('WBTC')).toBeInTheDocument()
  })

  it('renders fallback badge on every card when price-service status errors out', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: 'status feed unavailable', nextRetryAt: null,
    })

    render(<AnalyticsPriceStrip />)
    // Some cards reflect fallback. Because all sources start as coingecko and
    // error is set, they all downgrade to fallback.
    const fallbackLabels = screen.getAllByText('Fallback price')
    expect(fallbackLabels.length).toBe(4)
  })

  it('honours stale state from price-service status', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 1,
        quotes: [{ symbol: 'ETH', lastUpdateMs: 120_000, sessionState: 'open', confidence: 100 }],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    render(<AnalyticsPriceStrip />)
    expect(screen.getByText('Stale')).toBeInTheDocument()
  })
})
