/**
 * /stocks — page-level filters (sector, momentum, cap, liquidity, watchlist,
 * search) must propagate to the Drift & Rebalance dashboard and the Top
 * Movers section, not only the Browse table.
 *
 * Lane 4 promise: a filter narrows the page as a unit. Today, sector +
 * momentum filters drop the Browse table to "no stocks match" while the
 * Drift & Rebalance dashboard happily renders all 12 symbols and Top
 * Movers shows AAPL/TSLA/NVDA — three modules contradicting each other on
 * the same screen. After this fix, every per-symbol module honours the
 * filter; Upcoming Earnings and News Flow stay global by design but
 * surface the "Always shows all markets …" caption.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
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
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/stocks',
}))

// Replace next/dynamic so the MarketIntelligencePanel + Rebalance dashboard
// resolve to their real components synchronously inside the test.
vi.mock('next/dynamic', async () => {
  const intel = await import('@/components/stocks/MarketIntelligencePanel')
  const dash = await import('@/components/stocks/StocksRebalanceDashboard')
  return {
    default: (loader: () => Promise<unknown>) => {
      // Identify the loader by its toString to route to the correct component.
      const src = loader.toString()
      if (src.includes('MarketIntelligencePanel')) return intel.MarketIntelligencePanel
      if (src.includes('StocksRebalanceDashboard')) return dash.StocksRebalanceDashboard
      // Fallback: render nothing (e.g. unrelated dynamic imports).
      return () => null
    },
  }
})

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', chainId: 42220 }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

const tslaStock = {
  ticker: 'TSLA',
  name: 'Tesla',
  sector: 'Automotive',
  description: '',
  price: 250,
  change24h: 1.5,
  volume24h: 100_000_000,
  marketCap: 800_000_000_000,
  high52w: 300,
  low52w: 200,
  sparkline7d: [240, 245, 250],
  peRatio: 60,
  eps: 4,
  dividendYield: 0,
  avgVolume: 100_000_000,
}

const aaplStock = {
  ticker: 'AAPL',
  name: 'Apple',
  sector: 'Technology',
  description: '',
  price: 200,
  change24h: 0.5,
  volume24h: 80_000_000,
  marketCap: 3_000_000_000_000,
  high52w: 220,
  low52w: 170,
  sparkline7d: [195, 198, 200],
  peRatio: 30,
  eps: 6.5,
  dividendYield: 0.5,
  avgVolume: 80_000_000,
}

const msftStock = { ...aaplStock, ticker: 'MSFT', name: 'Microsoft', price: 410, change24h: 2.1 }
const nvdaStock = { ...aaplStock, ticker: 'NVDA', name: 'Nvidia', price: 800, change24h: 3.4 }

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: [tslaStock, aaplStock, msftStock, nvdaStock],
    isLoading: false,
    isLive: true,
  }),
}))

vi.mock('@/lib/useStockSources', () => ({
  useStockSources: () => ({
    TSLA: 'chain-oracle' as const,
    AAPL: 'chain-oracle' as const,
    MSFT: 'chain-oracle' as const,
    NVDA: 'chain-oracle' as const,
  }),
}))

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => ({
      status: null,
      isLoading: false,
      error: null,
      nextRetryAt: null,
    }),
  }
})

const rebalanceEntries = [tslaStock, aaplStock, msftStock, nvdaStock].map((s) => ({
  symbol: s.ticker,
  currentBlock: 100,
  oracleBlock: 100,
  products: { amm: 100, perps: 100, prediction: 100, lend: 100, yield: 100 },
  lastSyncedBlock: 100,
  blockSkew: 0,
  divergenceBps: 0,
  coherentBlock: true,
  stopReasons: [],
  riskIncreaseAllowed: true,
}))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({
    data: { generatedAt: '', currentBlock: 100, symbols: rebalanceEntries, stopActive: false },
    isLoading: false,
    error: null,
    bySymbol: Object.fromEntries(rebalanceEntries.map((e) => [e.symbol, e])),
  }),
}))

vi.mock('@/lib/useStockWatchlist', () => ({
  useStockWatchlist: () => ({
    favorites: new Set(),
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}))

import StocksPage from '../page'

describe('/stocks — filter propagation (task 0013)', () => {
  beforeEach(() => {
    push.mockReset()
  })

  it('Drift & Rebalance dashboard narrows to TSLA when Sector=Automotive', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const sectorSelect = screen.getByLabelText('Filter by sector') as HTMLSelectElement
    fireEvent.change(sectorSelect, { target: { value: 'Automotive' } })

    // After narrowing to Automotive, only TSLA should appear in the rebalance
    // dashboard. The heading should advertise "Showing 1 of 4 (filtered)".
    const heading = screen.getByTestId('rebalance-heading')
    expect(heading).toHaveTextContent(/Drift & Rebalance · Showing 1 of 4 \(filtered\)/)

    const rows = screen.getAllByTestId('rebalance-row')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('TSLA')
  })

  it('Drift & Rebalance dashboard renders the empty-state when no symbols pass', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    fireEvent.change(screen.getByLabelText('Filter by sector'), { target: { value: 'Automotive' } })
    fireEvent.change(screen.getByLabelText('Filter by momentum'), { target: { value: 'losers' } })

    // Automotive + Losers → no symbols pass (TSLA is +1.5%).
    expect(screen.getByTestId('rebalance-empty')).toHaveTextContent(/no symbols match the current filters\./i)
    expect(screen.queryAllByTestId('rebalance-row')).toHaveLength(0)
  })

  it('Top Movers honours filters; Upcoming Earnings + News Flow stay global with the explicit caption', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    fireEvent.change(screen.getByLabelText('Filter by sector'), { target: { value: 'Automotive' } })
    fireEvent.change(screen.getByLabelText('Filter by momentum'), { target: { value: 'losers' } })

    // No live movers under Automotive+Losers. Top Movers panel collapses
    // to a "No movers" empty-state (either "No movers available." for an
    // empty filtered set or "No movers yet, waiting for live feed." when
    // some pass but none have a live change).
    const intelSection = screen.getByLabelText('Market Intelligence')
    const moversArticle = within(intelSection).getByText(/^Top Movers$/).closest('article')!
    expect(within(moversArticle).getByText(/no movers/i)).toBeInTheDocument()

    // Upcoming Earnings + News Flow stay global. The "Always shows all markets"
    // caption signals to the user that the asymmetry is intentional.
    expect(screen.getByTestId('earnings-global-caption')).toHaveTextContent(/always shows all markets/i)
    expect(screen.getByTestId('news-global-caption')).toHaveTextContent(/filters apply to browse table and rebalance dashboard\./i)

    // News + earnings still render content from the unfiltered set — at least
    // one ticker from outside the Automotive sector should appear in the
    // Market Intelligence panel.
    const tickersInIntel = within(intelSection).getAllByText(/^(TSLA|AAPL|MSFT|NVDA)$/)
    expect(tickersInIntel.length).toBeGreaterThan(2)
  })

  it('Drift & Rebalance heading drops the (filtered) suffix when no filter is active', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('rebalance-heading')).toHaveTextContent(/^Drift & Rebalance$/)
    expect(screen.queryByTestId('earnings-global-caption')).not.toBeInTheDocument()
  })
})
