import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const push = vi.fn()
const refresh = vi.fn()

let stocksState: { stocks: Array<{ ticker: string; name: string; sector: string; price: number; change24h: number; volume24h: number; marketCap: number; high52w: number; low52w: number; sparkline7d: number[] | null; peRatio: number; eps: number; dividendYield: number; avgVolume: number }>; isLoading: boolean; isLive: boolean } = {
  stocks: [],
  isLoading: false,
  isLive: false,
}

let watchlistState: { watchlist: string[] } = { watchlist: [] }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => stocksState,
}))

vi.mock('@/lib/useWatchlist', () => ({
  useWatchlist: () => ({
    watchlist: watchlistState.watchlist,
    isWatched: (ticker: string) => watchlistState.watchlist.includes(ticker.toUpperCase()),
    toggle: vi.fn(),
  }),
}))

import StocksWatchlistPage from '../page'

describe('StocksWatchlistPage resilience states', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    stocksState = { stocks: [], isLoading: false, isLive: false }
    watchlistState = { watchlist: [] }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an explicit loading card while stock data is still loading', () => {
    stocksState = { stocks: [], isLoading: true, isLive: false }

    render(
      <TestWrapper>
        <StocksWatchlistPage />
      </TestWrapper>
    )

    expect(screen.getByText(/Loading watchlist…/i)).toBeInTheDocument()
    expect(screen.getByText(/Fetching latest stock and oracle data/i)).toBeInTheDocument()
  })

  it('switches to degraded fallback after prolonged loading and exposes recovery actions', () => {
    stocksState = { stocks: [], isLoading: true, isLive: false }

    render(
      <TestWrapper>
        <StocksWatchlistPage />
      </TestWrapper>
    )

    act(() => {
      vi.advanceTimersByTime(2600)
    })

    expect(screen.getByText(/Still fetching live stock data/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()

    const browse = screen.getByRole('link', { name: /Browse all stocks/i })
    expect(browse.getAttribute('href')).toBe('/stocks')
  })

  it('shows empty watchlist state once loading completes with zero tracked symbols', () => {
    stocksState = {
      stocks: [
        {
          ticker: 'AAPL',
          name: 'sAAPL',
          sector: 'Technology',
          price: 200,
          change24h: 1,
          volume24h: 100,
          marketCap: 1000,
          high52w: 210,
          low52w: 150,
          sparkline7d: [1, 2, 3],
          peRatio: 20,
          eps: 5,
          dividendYield: 0.3,
          avgVolume: 90,
        },
      ],
      isLoading: false,
      isLive: true,
    }
    watchlistState = { watchlist: [] }

    render(
      <TestWrapper>
        <StocksWatchlistPage />
      </TestWrapper>
    )

    expect(screen.getByText(/Your watchlist is empty/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Browse all stocks/i })).toBeInTheDocument()
  })
})
