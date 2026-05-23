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

  it('keeps each card on its CoinGecko source when only the status feed is offline', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: 'status feed unavailable', nextRetryAt: null,
    })

    render(<AnalyticsPriceStrip />)
    // Cards stay on their truthful source — the status outage no longer poisons them.
    expect(screen.queryAllByText('Fallback price')).toHaveLength(0)
    expect(screen.getAllByText('Cached (CoinGecko)').length).toBe(4)
  })

  it('renders the price-status-offline chip when the status feed errors out', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: 'status feed unavailable', nextRetryAt: null,
    })

    render(<AnalyticsPriceStrip />)
    const chip = screen.getByTestId('price-status-offline')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveTextContent(/Status feed offline/i)
    expect(chip).toHaveTextContent(/CoinGecko \/ chain only/i)
  })

  it('does not render the price-status-offline chip when the status feed is healthy', () => {
    render(<AnalyticsPriceStrip />)
    expect(screen.queryByTestId('price-status-offline')).not.toBeInTheDocument()
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
