import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const push = vi.fn()
const replace = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }
const stocksState = { isLive: true }
const mountedState = { mounted: true }
const searchParamsState = { value: '' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/stocks',
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
  useParams: () => ({}),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => walletState,
  }
})

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => mountedState.mounted,
}))

const stocksFixture = [
  {
    ticker: 'AAPL',
    name: 'sAAPL',
    sector: 'Technology',
    description: 'Apple synthetic',
    price: 218.27,
    change24h: 1.3,
    volume24h: 62000000,
    marketCap: 3340000000000,
    high52w: 260,
    low52w: 150,
    sparkline7d: [210, 212, 214, 216, 218],
    peRatio: 32,
    eps: 6.8,
    dividendYield: 0.5,
    avgVolume: 55000000,
  },
  {
    ticker: 'MSFT',
    name: 'sMSFT',
    sector: 'Technology',
    description: 'Microsoft synthetic',
    price: 388.45,
    change24h: 0.9,
    volume24h: 22000000,
    marketCap: 2890000000000,
    high52w: 470,
    low52w: 300,
    sparkline7d: [382, 383, 384, 386, 388],
    peRatio: 36,
    eps: 9.1,
    dividendYield: 0.6,
    avgVolume: 32000000,
  },
  {
    ticker: 'PFE',
    name: 'sPFE',
    sector: 'Healthcare',
    description: 'Pfizer synthetic',
    price: 31.2,
    change24h: -1.9,
    volume24h: 18000000,
    marketCap: 176000000000,
    high52w: 44,
    low52w: 24,
    sparkline7d: [33, 32, 31, 31, 31],
    peRatio: 15,
    eps: 2.1,
    dividendYield: 4.1,
    avgVolume: 28000000,
  },
]

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: stocksFixture,
    isLoading: false,
    isLive: stocksState.isLive,
  }),
}))

import StocksPage from '../page'

describe('StocksPage search resilience', () => {
  beforeEach(() => {
    push.mockClear()
    replace.mockClear()
    mountedState.mounted = true
    stocksState.isLive = true
    searchParamsState.value = ''
  })

  it('keeps search input non-interactive until mounted to avoid pre-hydration drop', () => {
    mountedState.mounted = false

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    expect(screen.getByPlaceholderText('Search stocks...')).toBeDisabled()
  })

  it('hydrates search, filters, and sort from URL query params', () => {
    searchParamsState.value = 'search=NV&sector=Technology&cap=mega&momentum=gainers&liquidity=active&sortField=price&sortDir=asc'

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    expect((screen.getByPlaceholderText('Search stocks...') as HTMLInputElement).value).toBe('NV')
    expect((screen.getByLabelText('Filter by sector') as HTMLSelectElement).value).toBe('Technology')
    expect((screen.getByLabelText('Filter by market cap') as HTMLSelectElement).value).toBe('mega')
    expect((screen.getByLabelText('Filter by momentum') as HTMLSelectElement).value).toBe('gainers')
    expect((screen.getByLabelText('Filter by liquidity') as HTMLSelectElement).value).toBe('active')
  })

  it('shows no-results state for nonsense search once mounted', () => {
    mountedState.mounted = true

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const input = screen.getByPlaceholderText('Search stocks...')
    fireEvent.change(input, { target: { value: 'ZZZ_NOT_REAL_123' } })

    expect(screen.getAllByText(/No stocks match your search/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /clear search/i }).length).toBeGreaterThan(0)
  })

  it('applies sector and momentum filters, then clears all', () => {
    mountedState.mounted = true

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    fireEvent.change(screen.getByLabelText('Filter by sector'), { target: { value: 'Healthcare' } })
    fireEvent.change(screen.getByLabelText('Filter by momentum'), { target: { value: 'losers' } })

    const table = screen.getByRole('table')
    expect(within(table).getAllByText('PFE').length).toBeGreaterThan(0)
    expect(within(table).queryAllByText('AAPL').length).toBe(0)
    expect(within(table).queryAllByText('MSFT').length).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: /Clear all filters/i }))
    expect(within(table).getAllByText('AAPL').length).toBeGreaterThan(0)
    expect(within(table).getAllByText('MSFT').length).toBeGreaterThan(0)
  })

  it('clears filters from empty-state action when zero results are caused by filters only', () => {
    mountedState.mounted = true

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    fireEvent.change(screen.getByLabelText('Filter by sector'), { target: { value: 'Healthcare' } })
    fireEvent.change(screen.getByLabelText('Filter by market cap'), { target: { value: 'mega' } })

    expect(screen.getAllByText(/No stocks match your current filters/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Clear filters/i }).length).toBeGreaterThan(0)

    const table = screen.getByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: /Clear filters/i }))

    expect(screen.queryByRole('button', { name: /Sector: Healthcare/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /Cap: mega/i })).toBeNull()
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MSFT').length).toBeGreaterThan(0)
  })

  it('clears both search and filters from empty-state action when both are active', () => {
    mountedState.mounted = true

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const input = screen.getByPlaceholderText('Search stocks...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Filter by sector'), { target: { value: 'Healthcare' } })

    expect(screen.getAllByText(/No stocks match your search and filters/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Clear search & filters/i }).length).toBeGreaterThan(0)

    const table = screen.getByRole('table')
    fireEvent.click(within(table).getByRole('button', { name: /Clear search & filters/i }))

    expect(input.value).toBe('')
    expect(screen.queryByRole('button', { name: /Sector: Healthcare/i })).toBeNull()
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MSFT').length).toBeGreaterThan(0)
  })

  it('preserves active screener query params when previewing a ticker', () => {
    stocksState.isLive = false

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    fireEvent.change(screen.getByPlaceholderText('Search stocks...'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Filter by sector'), { target: { value: 'Technology' } })
    fireEvent.change(screen.getByLabelText('Filter by market cap'), { target: { value: 'mega' } })
    fireEvent.change(screen.getByLabelText('Filter by momentum'), { target: { value: 'gainers' } })
    fireEvent.change(screen.getByLabelText('Filter by liquidity'), { target: { value: 'active' } })

    fireEvent.click(screen.getByRole('button', { name: /Preview AAPL — demo data/i }))

    expect(push).toHaveBeenCalled()
    const pushed = push.mock.calls.at(-1)?.[0] as string
    expect(pushed).toContain('/stocks/AAPL?')
    expect(pushed).toContain('search=AAPL')
    expect(pushed).toContain('sector=Technology')
    expect(pushed).toContain('cap=mega')
    expect(pushed).toContain('momentum=gainers')
    expect(pushed).toContain('liquidity=active')
  })
})
