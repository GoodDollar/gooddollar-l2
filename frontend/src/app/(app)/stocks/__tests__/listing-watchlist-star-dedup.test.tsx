import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
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

const mockStocks = ['AAPL', 'MSFT'].map((ticker) => ({
  ticker,
  name: `s${ticker}`,
  sector: 'Technology',
  description: `${ticker} synthetic`,
  price: 100,
  change24h: 1.2,
  volume24h: 60_000_000,
  marketCap: 250_000_000_000,
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

const rebalanceSymbols: RebalanceInvariantResult[] = mockStocks.map((stock) => ({
  symbol: stock.ticker,
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

import StocksPage from '../page'

const WATCHLIST_LABEL = /(add|remove)\s+.*?\b(to|from)\s+watchlist/i

async function findStocksListingTable(): Promise<HTMLElement> {
  return await screen.findByRole('table', { name: /stocks listing/i })
}

describe('Stocks listing — watchlist star de-duplication', () => {
  beforeEach(() => {
    walletState.address = undefined
    push.mockReset()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('renders exactly one watchlist toggle button per table row', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const table = await findStocksListingTable()
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.length).toBe(mockStocks.length)

    for (const row of rows) {
      const buttons = within(row).getAllByRole('button')
      const watchlistButtons = buttons.filter((button) => {
        const label = button.getAttribute('aria-label') ?? ''
        return WATCHLIST_LABEL.test(label)
      })
      expect(watchlistButtons).toHaveLength(1)
    }
  })

  it('toggles the row star aria-pressed when clicked without navigating', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const table = await findStocksListingTable()
    const firstDataRow = within(table).getAllByRole('row')[1]
    const star = within(firstDataRow).getByRole('button', {
      name: /add aapl to watchlist/i,
    })
    expect(star.getAttribute('aria-pressed')).toBe('false')

    await act(async () => {
      await user.click(star)
    })

    const flipped = within(firstDataRow).getByRole('button', {
      name: /remove aapl from watchlist/i,
    })
    expect(flipped.getAttribute('aria-pressed')).toBe('true')
    expect(push).not.toHaveBeenCalled()
  })

  it('declares a Watchlist column header via accessible name', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const table = await findStocksListingTable()
    const headers = within(table).getAllByRole('columnheader')
    const watchlistHeader = headers.find((header) => /watchlist/i.test(header.getAttribute('aria-label') ?? '') || /watchlist/i.test(header.textContent ?? ''))
    expect(watchlistHeader).toBeTruthy()
  })
})
