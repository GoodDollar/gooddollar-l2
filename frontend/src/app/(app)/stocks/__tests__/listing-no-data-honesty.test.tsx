import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { TestWrapper } from '@/test-utils/wrapper'

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
const priceStatusState = {
  status: { healthy: true, freshCount: 1, totalCount: 1, quotes: [], timestamp: 1716286200000 },
  isLoading: false,
  error: null as string | null,
  nextRetryAt: null as number | null,
}

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

const mockStocks = [
  {
    ticker: 'AAPL',
    name: 'sAAPL',
    displayName: 'Apple Inc.',
    sector: 'Technology',
    description: '',
    price: 194,
    change24h: 0,
    volume24h: 0,
    marketCap: 0,
    high52w: 0,
    low52w: 0,
    sparkline7d: [100, 100, 100, 100, 100, 100, 100],
    peRatio: 0,
    eps: 0,
    dividendYield: 0,
    avgVolume: 0,
  },
  {
    ticker: 'MSFT',
    name: 'sMSFT',
    displayName: 'Microsoft Corp.',
    sector: 'Technology',
    description: '',
    price: 388,
    change24h: 1.5,
    volume24h: 22_000_000,
    marketCap: 2_890_000_000_000,
    high52w: 460,
    low52w: 260,
    sparkline7d: [380, 385, 390, 388, 389],
    peRatio: 0,
    eps: 0,
    dividendYield: 0,
    avgVolume: 0,
  },
]

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: mockStocks, isLoading: false, isLive: true }),
}))

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => priceStatusState,
    refreshPriceServiceStatus: vi.fn(async () => {}),
  }
})

import StocksPage from '../page'

function getDesktopRows() {
  const table = screen.getByRole('table')
  return within(table).getAllByRole('row').slice(1)
}

describe('Stocks listing — no-data honesty', () => {
  it('renders em-dash placeholders for AAPL volume/marketCap and percent', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const rows = getDesktopRows()
    const aaplRow = rows.find((r) => within(r).queryByText('AAPL'))
    expect(aaplRow).toBeDefined()
    // AAPL row: at least 3 em-dashes (Volume, MarketCap, 24h percent).
    expect(within(aaplRow!).getAllByText('—').length).toBeGreaterThanOrEqual(3)
    // No '$0' text in AAPL row.
    expect(within(aaplRow!).queryByText('$0')).not.toBeInTheDocument()
    expect(within(aaplRow!).queryByText('+0.00%')).not.toBeInTheDocument()
  })

  it('renders real data for MSFT row unchanged', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const rows = getDesktopRows()
    const msftRow = rows.find((r) => within(r).queryByText('MSFT'))
    expect(msftRow).toBeDefined()
    expect(within(msftRow!).getByText(/1\.50%/)).toBeInTheDocument()
    expect(within(msftRow!).getByText(/\$22\.0M/)).toBeInTheDocument()
    expect(within(msftRow!).getByText(/\$2\.89T/)).toBeInTheDocument()
  })

  it('AAPL row sparkline cell exposes "data unavailable" aria-label', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const rows = getDesktopRows()
    const aaplRow = rows.find((r) => within(r).queryByText('AAPL'))
    expect(aaplRow).toBeDefined()
    const cell = aaplRow!.querySelector('[aria-label*="data unavailable"]')
    expect(cell).not.toBeNull()
  })

  // Task 0035 — AAPL is the canonical zero-data fixture for this suite.
  // The 24h Change column must never paint a coloured percentage value
  // for a row where the oracle has nothing to report, and the fallback
  // dataset's previously-hardcoded percentages were exactly what was
  // bypassing the listing guard.
  it('AAPL row renders no percentage-change badge when oracle has no data', async () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )
    const rows = getDesktopRows()
    const aaplRow = rows.find((r) => within(r).queryByText('AAPL'))
    expect(aaplRow).toBeDefined()
    expect(aaplRow!.textContent ?? '').not.toMatch(/[+-]?\d+(\.\d+)?%/)
  })
})

