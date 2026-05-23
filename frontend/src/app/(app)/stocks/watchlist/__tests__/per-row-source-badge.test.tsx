import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type React from 'react'
import { TestWrapper } from '@/test-utils/wrapper'

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
})

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/stocks/watchlist',
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: [
      {
        ticker: 'AAPL', name: 'Apple', displayName: 'Apple', sector: 'Technology',
        description: 'Apple synthetic', price: 218.27, change24h: 1.3,
        volume24h: 62_000_000, marketCap: 3_340_000_000_000,
        high52w: 260, low52w: 150, sparkline7d: [210, 212, 214, 216, 218],
      },
      {
        ticker: 'TSLA', name: 'Tesla', displayName: 'Tesla', sector: 'Auto',
        description: 'Tesla synthetic', price: 250, change24h: -0.5,
        volume24h: 80_000_000, marketCap: 800_000_000_000,
        high52w: 300, low52w: 180, sparkline7d: [240, 245, 250, 252, 250],
      },
    ],
    isLoading: false,
    isLive: true,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/lib/useWatchlist', () => ({
  useWatchlist: () => ({
    watchlist: ['AAPL', 'TSLA'],
    isWatched: (t: string) => t === 'AAPL' || t === 'TSLA',
  }),
}))

vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: () => ({
    prices: { AAPL: 218.27, TSLA: 250 },
    sources: { AAPL: 'chain-oracle', TSLA: 'chain-oracle' } as Record<string, 'chain-oracle' | 'fallback'>,
    hasLiveData: true,
    isLoading: false,
    isPartial: false,
    isFallback: false,
    missingSymbols: [],
  }),
}))

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => ({
      status: {
        healthy: false,
        freshCount: 1,
        totalCount: 2,
        quotes: [
          { symbol: 'AAPL', lastUpdateMs: 1000, sessionState: 'closed', confidence: 1 },
          { symbol: 'TSLA', lastUpdateMs: 1000, sessionState: 'open', confidence: 1 },
        ],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    }),
  }
})

import StocksWatchlistPage from '../page'

describe('StocksWatchlistPage — per-row PriceSourceBadge', () => {
  beforeEach(() => {
    push.mockReset()
  })

  it('renders a price-source-badge for every watched row', () => {
    render(
      <TestWrapper>
        <StocksWatchlistPage />
      </TestWrapper>
    )

    const badges = screen.getAllByTestId('price-source-badge')
    expect(badges.length).toBeGreaterThanOrEqual(2)
  })

  it('shows "Market closed" badge for AAPL when sessionState=closed', () => {
    render(
      <TestWrapper>
        <StocksWatchlistPage />
      </TestWrapper>
    )

    const aaplCells = screen.getAllByText('AAPL').map(el => el.closest('tr')).filter(Boolean) as HTMLTableRowElement[]
    const badge = within(aaplCells[0]!).getByTestId('price-source-badge')
    expect(badge.textContent).toMatch(/Market closed/i)
  })

  it('shows "Chain oracle" badge for TSLA when chain live & session open', () => {
    render(
      <TestWrapper>
        <StocksWatchlistPage />
      </TestWrapper>
    )

    const tslaCells = screen.getAllByText('TSLA').map(el => el.closest('tr')).filter(Boolean) as HTMLTableRowElement[]
    const badge = within(tslaCells[0]!).getByTestId('price-source-badge')
    expect(badge.textContent).toMatch(/Chain oracle/i)
  })
})
