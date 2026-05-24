import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TestWrapper } from '@/test-utils/wrapper'
import type { RebalanceInvariantResult } from '@/lib/stocksRebalanceInvariant'

beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }
})

const push = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }
const watchlistState = { watchlist: [] as string[] }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/stocks',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => walletState,
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => unknown }) =>
      children({ openConnectModal: vi.fn() }),
  },
}))

const TEN_TICKERS = ['AAPL', 'AMD', 'AMZN', 'COIN', 'GOOGL', 'META', 'MSFT', 'NFLX', 'NVDA', 'TSLA'] as const

const sectorByTicker: Record<string, string> = {
  AAPL: 'Technology',
  AMD: 'Technology',
  AMZN: 'Consumer Cyclical',
  COIN: 'Financial Services',
  GOOGL: 'Technology',
  META: 'Technology',
  MSFT: 'Technology',
  NFLX: 'Communication Services',
  NVDA: 'Technology',
  TSLA: 'Automotive',
}

const mockStocks = TEN_TICKERS.map((ticker) => ({
  ticker,
  name: `s${ticker}`,
  sector: sectorByTicker[ticker],
  description: `${ticker} synthetic`,
  // Large-cap for everything except TSLA which we mark mid-cap so Sector=Automotive + Cap=Mega yields zero matches.
  price: 100,
  change24h: 1.2,
  volume24h: 60_000_000,
  marketCap: ticker === 'TSLA' ? 50_000_000_000 : 250_000_000_000,
  high52w: 200,
  low52w: 80,
  sparkline7d: [90, 95, 100, 102, 105],
  peRatio: 30,
  eps: 5,
  dividendYield: 0.5,
  avgVolume: 50_000_000,
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: mockStocks, isLoading: false, isLive: true }),
}))

const rebalanceSymbols: RebalanceInvariantResult[] = TEN_TICKERS.map((symbol) => ({
  symbol,
  currentBlock: 100,
  oracleBlock: 100,
  products: { amm: 100, perps: 100, prediction: 100, lend: 100, yield: 100 },
  lastSyncedBlock: 100,
  blockSkew: 0,
  divergenceBps: 12,
  coherentBlock: true,
  stopReasons: [],
  riskIncreaseAllowed: true,
}))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({
    data: {
      generatedAt: '2025-01-01T00:00:00.000Z',
      currentBlock: 100,
      symbols: rebalanceSymbols,
      stopActive: false,
    },
    isLoading: false,
    error: null,
    bySymbol: rebalanceSymbols.reduce<Record<string, RebalanceInvariantResult>>((acc, entry) => {
      acc[entry.symbol] = entry
      return acc
    }, {}),
  }),
}))

vi.mock('@/lib/useWatchlist', () => ({
  useWatchlist: () => ({
    watchlist: watchlistState.watchlist,
    isWatched: (ticker: string) => watchlistState.watchlist.includes(ticker.toUpperCase()),
    add: (ticker: string) => {
      const upper = ticker.toUpperCase()
      if (!watchlistState.watchlist.includes(upper)) {
        watchlistState.watchlist = [...watchlistState.watchlist, upper].sort()
      }
    },
    remove: (ticker: string) => {
      const upper = ticker.toUpperCase()
      watchlistState.watchlist = watchlistState.watchlist.filter((t) => t !== upper)
    },
    toggle: (ticker: string) => {
      const upper = ticker.toUpperCase()
      if (watchlistState.watchlist.includes(upper)) {
        watchlistState.watchlist = watchlistState.watchlist.filter((t) => t !== upper)
      } else {
        watchlistState.watchlist = [...watchlistState.watchlist, upper].sort()
      }
    },
  }),
}))

import StocksPage from '../page'

async function findDashboardSection() {
  return await screen.findByRole('region', { name: /stocks drift and rebalance dashboard/i })
}

describe('Stocks Drift & Rebalance dashboard — filter wiring', () => {
  beforeEach(() => {
    walletState.address = undefined
    watchlistState.watchlist = []
    push.mockReset()
  })

  it('renders all 10 dashboard rows when no filter is active', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const dashboard = await findDashboardSection()
    const dashTable = within(dashboard).getByRole('table')
    const rows = within(dashTable).getAllByRole('row').slice(1)
    expect(rows.length).toBe(10)
    expect(within(dashboard).queryByText(/of 10\)/)).not.toBeInTheDocument()
  })

  it('collapses dashboard rows to zero when sector + cap filter yields zero listing matches', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    await user.selectOptions(screen.getByLabelText(/filter by sector/i), 'Automotive')
    await user.selectOptions(screen.getByLabelText(/filter by market cap/i), 'mega')

    const dashboard = await findDashboardSection()
    expect(within(dashboard).queryByRole('table')).not.toBeInTheDocument()
    expect(
      within(dashboard).getByText(/No symbols match your current filters\./i),
    ).toBeInTheDocument()
    expect(within(dashboard).getByText(/\(0 of 10\)/)).toBeInTheDocument()
  })

  it('shows watchlist-empty copy in the dashboard when watchlist filter is active and empty', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    await user.click(screen.getByRole('button', { name: /filter watchlist/i }))

    const dashboard = await findDashboardSection()
    expect(within(dashboard).queryByRole('table')).not.toBeInTheDocument()
    expect(
      within(dashboard).getByText(/Your watchlist is empty — star a stock to track its oracle health here\./i),
    ).toBeInTheDocument()
  })

  it('narrows dashboard to exactly the filtered tickers and shows (N of M) subtitle', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    await user.selectOptions(screen.getByLabelText(/filter by sector/i), 'Technology')

    const expectedTickers = Object.entries(sectorByTicker)
      .filter(([, sector]) => sector === 'Technology')
      .map(([ticker]) => ticker)

    const dashboard = await findDashboardSection()
    const dashTable = within(dashboard).getByRole('table')
    const rows = within(dashTable).getAllByRole('row').slice(1)
    expect(rows.length).toBe(expectedTickers.length)
    for (const ticker of expectedTickers) {
      expect(within(dashTable).getByText(ticker)).toBeInTheDocument()
    }
    expect(
      within(dashboard).getByText(new RegExp(`\\(${expectedTickers.length} of 10\\)`)),
    ).toBeInTheDocument()
  })
})
