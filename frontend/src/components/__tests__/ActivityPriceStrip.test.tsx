import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn(),
  FALLBACK_PRICES: {},
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

import { ActivityPriceStrip } from '@/components/ActivityPriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'

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
    expect(screen.getByText('Market closed')).toBeInTheDocument()
  })
})
