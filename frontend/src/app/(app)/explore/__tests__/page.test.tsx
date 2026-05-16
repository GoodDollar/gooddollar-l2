import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const pushMock = vi.fn()
let searchParamsString = ''
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsString),
}))

vi.mock('@/components/TokenIcon', () => ({
  TokenIcon: ({ symbol }: { symbol: string }) => <span data-testid={`icon-${symbol}`}>{symbol}</span>,
}))

vi.mock('@/lib/useOnChainMarketData', () => ({
  TOKEN_COLORS: {} as Record<string, string>,
  useOnChainMarketData: () => ({ isLive: true, isLoading: false, tokens: [
    {
      symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0',
      category: 'Infrastructure' as const, color: '#627EEA',
      price: 3500, change1h: 0.5, change24h: 1.2, change7d: -2.0,
      volume24h: 1e9, marketCap: 4e11, sparkline7d: [3400, 3450, 3500],
      description: 'Ethereum',
    },
    {
      symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
      category: 'GoodDollar' as const, color: '#00B0A0',
      price: 0.0002, change1h: 0.1, change24h: -0.5, change7d: 1.0,
      volume24h: 5e5, marketCap: 1e7, sparkline7d: [0.00019, 0.0002, 0.00021],
      description: 'GoodDollar UBI token',
    },
  ]}),
}))

import ExplorePage from '../page'

describe('ExplorePage', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
  })

  it('renders token data immediately without artificial delay', () => {
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('navigates to token detail page when row is clicked', () => {
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
    fireEvent.click(rows[1])
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/explore/'))
  })

  it('shows a Swap button on each data row', () => {
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const swapButtons = screen.getAllByRole('button', { name: /swap/i })
    expect(swapButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('Swap button click navigates to swap with ?buy= param', () => {
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const swapButtons = screen.getAllByRole('button', { name: /swap/i })
    fireEvent.click(swapButtons[0])
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/?buy='))
  })

  it('initializes the search input from ?search= URL param', () => {
    searchParamsString = 'search=ETH'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement
    expect(input.value).toBe('ETH')
  })

  it('filters tokens based on ?search= URL param on mount', () => {
    searchParamsString = 'search=ether'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // Table has 1 header row + N data rows. Only ETH (name="Ether") should
    // remain — so we expect exactly 2 rows.
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(2)
  })

  it('filters tokens based on ?category= URL param on mount', () => {
    searchParamsString = 'category=GoodDollar'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // Only G$ (category "GoodDollar") remains — header + 1 row.
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(2)
  })

  it('ignores unknown ?category= values gracefully', () => {
    searchParamsString = 'category=BogusCategory'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // Should fall back to All — header + both tokens = 3 rows.
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(3)
  })

  it('renders without errors when no URL params are present', () => {
    searchParamsString = ''
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement
    expect(input.value).toBe('')
  })
})

// Separate suite exercising the "G$ has no off-chain market data" code path —
// the original P0 bug from task 0073 where missing volume/change appeared as
// misleading $0 / 0% values instead of "—".
describe('ExplorePage — null market data (G$ has no CoinGecko quote)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
  })

  it('renders "—" placeholders instead of $0/0% when G$ data is unavailable', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
            category: 'GoodDollar' as const, color: '#00B0A0',
            // Price is real (from on-chain pools), but off-chain quote data is missing.
            price: 0.0002,
            change1h: null,
            change24h: null,
            change7d: null,
            volume24h: null,
            marketCap: 1e7,
            sparkline7d: null,
            description: 'GoodDollar UBI token',
            maxSupply: null,
          },
        ],
      }),
    }))
    const { default: ExplorePageNullCase } = await import('../page')
    render(<TestWrapper><ExplorePageNullCase /></TestWrapper>)
    // Find the G$ row via the mocked TokenIcon (unambiguous per-token marker).
    const gRow = screen.getByTestId('icon-G$').closest('tr')
    expect(gRow).not.toBeNull()
    // At least one "—" placeholder should show in the row (volume / changes).
    expect(gRow!.textContent).toContain('—')
    // And explicitly: there should NOT be a "$0" volume cell pretending real
    // data exists. The price is "$0.00020" so we exclude "$0." prefixes.
    expect(gRow!.textContent).not.toMatch(/\$0(?![.0-9])/)
  })
})
