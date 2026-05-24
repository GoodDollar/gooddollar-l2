import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const pushMock = vi.fn()
const replaceMock = vi.fn()
let searchParamsString = ''
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParamsString),
}))

vi.mock('@/components/TokenIcon', () => ({
  TokenIcon: ({ symbol }: { symbol: string }) => <span data-testid={`icon-${symbol}`}>{symbol}</span>,
}))

vi.mock('@/lib/useOnChainMarketData', () => ({
  TOKEN_COLORS: {} as Record<string, string>,
  useOnChainMarketData: () => ({
    isLive: true,
    isLoading: false,
    tokens: [
      {
        symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0',
        category: 'Infrastructure' as const, color: '#627EEA',
        price: 3500, change1h: 0.5, change24h: 1.2, change7d: -2.0,
        volume24h: 1e9, marketCap: 4e11, sparkline7d: [3400, 3450, 3500],
        description: 'Ethereum',
      },
      {
        symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
        category: 'GoodDollar' as const, color: '#13C636',
        price: 0.0002, change1h: 0.1, change24h: -0.5, change7d: 1.0,
        volume24h: 5e5, marketCap: 1e7, sparkline7d: [0.00019, 0.0002, 0.00021],
        description: 'GoodDollar UBI token',
      },
    ],
    sources: { ETH: 'chain-oracle', 'G$': 'chain-oracle' } as Record<string, string>,
  }),
}))

import ExplorePage from '../page'

describe('ExplorePage', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
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

// Task 0076: the URL must always reflect the *actually applied* category.
// Otherwise users bookmark/share a URL ("?category=BogusCategory") that
// silently shows All, with no feedback that their filter was ignored.
describe('ExplorePage — invalid ?category= canonicalization (task 0076)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
    searchParamsString = ''
  })

  it('does NOT call router.replace when category is valid (exact match)', () => {
    searchParamsString = 'category=GoodDollar'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    expect(replaceMock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('category-notice')).not.toBeInTheDocument()
  })

  it('does NOT call router.replace when no category param is present', () => {
    searchParamsString = ''
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    expect(replaceMock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('category-notice')).not.toBeInTheDocument()
  })

  it('canonicalizes case-mismatched category (gooddollar → GoodDollar) and shows notice', () => {
    searchParamsString = 'category=gooddollar'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // URL gets rewritten to the canonical casing.
    expect(replaceMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith('/explore?category=GoodDollar')
    // User sees a polite aria-live notice explaining what we did.
    const notice = screen.getByTestId('category-notice')
    expect(notice).toHaveAttribute('aria-live', 'polite')
    expect(notice).toHaveAttribute('role', 'status')
    expect(notice.textContent).toMatch(/GoodDollar/)
    expect(notice.textContent).toMatch(/gooddollar/)
    // Filter is actually applied (G$ only → header + 1 row).
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(2)
  })

  it('strips unknown ?category= from URL and shows "unknown category" notice', () => {
    searchParamsString = 'category=BogusCategory'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // The bogus param is dropped from the URL entirely.
    expect(replaceMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith('/explore')
    // Notice tells the user we ignored their filter.
    const notice = screen.getByTestId('category-notice')
    expect(notice.textContent).toMatch(/Unknown/i)
    expect(notice.textContent).toMatch(/BogusCategory/)
    // Falls back to showing all tokens.
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(3)
  })

  it('preserves other query params (e.g. ?search=) when canonicalizing category', () => {
    searchParamsString = 'search=ether&category=BogusCategory'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // search= must survive the rewrite.
    expect(replaceMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith('/explore?search=ether')
  })

  it('clicking a category button updates the URL via router.replace', () => {
    searchParamsString = ''
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // Pick the "GoodDollar" category button.
    const gdButton = screen.getByRole('button', { name: 'GoodDollar' })
    fireEvent.click(gdButton)
    expect(replaceMock).toHaveBeenCalledWith('/explore?category=GoodDollar')
  })

  it('clicking "All" removes ?category= from the URL', () => {
    searchParamsString = 'category=GoodDollar'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const allButton = screen.getByRole('button', { name: 'All' })
    fireEvent.click(allButton)
    expect(replaceMock).toHaveBeenCalledWith('/explore')
  })
})

// Task 0084 — the "no results" empty state must NOT be a bare grey line of
// text. It has to:
//   1. Echo the user's actual query (so they know which string filtered
//      everything out — vs feeling like the page silently broke).
//   2. Offer a one-click recovery button (Clear search / Show all tokens)
//      that resets the relevant state, instead of forcing the user to
//      hand-delete their input.
// Same family as task 0080 (Portfolio empty states) and brand-integrity
// fixes in tasks 0046/0061/0068/0069/0073/0074/0075/0076/0077/0079/0082.
describe('ExplorePage — search-table empty state (task 0084)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
    searchParamsString = ''
  })

  it('echoes the user\'s query when the search filters everything out', () => {
    searchParamsString = 'search=zzznomatchzzz'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // Header + empty-state row only (the implementation renders the
    // empty state as a <tr> with colSpan).
    expect(screen.getAllByRole('row').length).toBe(2)
    // The empty cell must include the literal query the user typed —
    // not the generic "No tokens match your search" string from the
    // pre-task-0084 bare-grey-text version. Use a function matcher
    // that walks the cell's textContent so we ignore the search input
    // (its value lives in the attribute, not in text content).
    const emptyRow = screen.getAllByRole('row')[1]
    expect(emptyRow.textContent || '').toMatch(/zzznomatchzzz/)
  })

  it('renders a "Clear search" button when a query has filtered everything out', () => {
    searchParamsString = 'search=zzznomatchzzz'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    expect(clearBtn).toBeInTheDocument()
  })

  it('clicking "Clear search" resets the query and restores the table', () => {
    searchParamsString = 'search=zzznomatchzzz'
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    // Header + empty-state row before clearing.
    expect(screen.getAllByRole('row').length).toBe(2)
    const clearBtn = screen.getByRole('button', { name: /clear search/i })
    fireEvent.click(clearBtn)
    // Both ETH and G$ should reappear in addition to the header.
    expect(screen.getAllByRole('row').length).toBe(3)
    // And the search input is now empty.
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('does NOT show the empty-state recovery UI when results exist', () => {
    // Sanity: ensure the buttons / SearchX icon are NOT injected into the
    // page when there is at least one matching row.
    render(<TestWrapper><ExplorePage /></TestWrapper>)
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show all tokens/i })).not.toBeInTheDocument()
  })

  it('marks the empty-state icon as aria-hidden so screen readers skip it', () => {
    searchParamsString = 'search=zzznomatchzzz'
    const { container } = render(<TestWrapper><ExplorePage /></TestWrapper>)
    // The SearchX lucide icon renders as an <svg> — assert it carries the
    // aria-hidden attribute so screen readers only narrate the prose +
    // recovery buttons (which carry their own accessible names).
    const hiddenSvg = container.querySelector('svg[aria-hidden="true"]')
    expect(hiddenSvg).not.toBeNull()
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
            category: 'GoodDollar' as const, color: '#13C636',
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
        sources: { 'G$': 'chain-oracle' } as Record<string, string>,
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

// Task 0098 — when no token reports a positive market cap, the Total Market
// Cap card must NOT render "$0" with a fully-filled green sparkline (which
// reads as a strong positive trend even though there is literally no data).
// The card must show "—" with no chart, matching the existing 24h-change
// "— (24h)" fallback. Per-row Market Cap cells must also fall back to "—"
// instead of "$0" when token.marketCap <= 0.
describe('ExplorePage — zero market cap fallback (task 0098)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
  })

  it('Total Market Cap card shows "—" and no sparkline when no token has marketCap > 0', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
            category: 'GoodDollar' as const, color: '#13C636',
            price: 0.0002, change1h: null, change24h: null, change7d: null,
            volume24h: null, marketCap: 0, sparkline7d: null,
            description: 'GoodDollar UBI token', maxSupply: null,
          },
        ],
        sources: { 'G$': 'chain-oracle' } as Record<string, string>,
      }),
    }))
    const { default: ExplorePageZeroCap } = await import('../page')
    const { container } = render(<TestWrapper><ExplorePageZeroCap /></TestWrapper>)
    // The page renders the Market Stats Bar twice (desktop grid + mobile
    // carousel), so each title appears 2x — both must show the same fallback.
    const cardTitles = screen.getAllByText('Total Market Cap')
    expect(cardTitles.length).toBeGreaterThan(0)
    for (const title of cardTitles) {
      // Walk up to the card root (4 levels up from the title <div>).
      const card = title.closest('.bg-dark-100') ?? title.parentElement!.parentElement!.parentElement!
      // The card must NOT contain the misleading "$0" / "$0.00" string.
      expect(card.textContent || '').not.toMatch(/\$0(?![.0-9])/)
      // It SHOULD contain an em-dash placeholder.
      expect(card.textContent || '').toContain('—')
      // And it must NOT render the 120x40 sparkline svg.
      const sparkline = card.querySelector('svg[width="120"][height="40"]')
      expect(sparkline).toBeNull()
    }
    // Sanity: confirm at least one "—" placeholder is present overall too.
    expect(container.textContent).toContain('—')
  })

  it('Total Market Cap card still renders the sparkline when at least one token has marketCap > 0', () => {
    // Uses the default top-of-file mock (ETH 4e11, G$ 1e7) — so total > 0.
    const { container } = render(<TestWrapper><ExplorePage /></TestWrapper>)
    const sparkline = container.querySelector('svg[width="120"][height="40"]')
    expect(sparkline).not.toBeNull()
  })

  it('per-row Market Cap cell renders "—" when token.marketCap <= 0', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
            category: 'GoodDollar' as const, color: '#13C636',
            price: 0.0002, change1h: 0, change24h: 0, change7d: 0,
            volume24h: null, marketCap: 0, sparkline7d: null,
            description: 'GoodDollar UBI token', maxSupply: null,
          },
        ],
        sources: { 'G$': 'chain-oracle' } as Record<string, string>,
      }),
    }))
    const { default: ExplorePageZeroCap } = await import('../page')
    render(<TestWrapper><ExplorePageZeroCap /></TestWrapper>)
    const gRow = screen.getByTestId('icon-G$').closest('tr')!
    // The Market Cap <td> is the one carrying our "Market cap unavailable"
    // tooltip — find it by that title attribute and assert content.
    const mcapCell = gRow.querySelector('td span[title="Market cap unavailable"]')
    expect(mcapCell).not.toBeNull()
    expect(mcapCell!.textContent).toBe('—')
  })
})

// Task 0041 — per-row source attribution on /explore. Every Lane 4 surface
// already carries a PriceSourceBadge except /explore; this is the densest
// price surface in the app and must show provenance on every row, must
// collapse fallback/unknown rows to em-dashes (no fake sparklines), and
// must exclude non-live rows from the headline aggregate.
describe('ExplorePage — per-row source attribution (task 0041)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
  })

  /**
   * Helper — find the `<tr>` element that holds a given token icon. The
   * Trending / Top Gainers cards render the same `TokenIcon` mock, so
   * `getByTestId` returns multiple matches. We narrow to the row that
   * actually sits inside a `<table>` (i.e. the data row), which is the
   * one carrying the per-row source badge.
   */
  function findTokenRow(symbol: string): HTMLTableRowElement {
    const icons = screen.getAllByTestId(`icon-${symbol}`)
    for (const icon of icons) {
      const row = icon.closest('tr')
      if (row && row.closest('table')) return row as HTMLTableRowElement
    }
    throw new Error(`no <tr> inside <table> found for ${symbol}`)
  }

  it('renders a PriceSourceBadge in every populated token row', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0',
            category: 'Infrastructure' as const, color: '#627EEA',
            price: 3500, change1h: 0.5, change24h: 1.2, change7d: -2.0,
            volume24h: 1e9, marketCap: 4e11, sparkline7d: [3400, 3450, 3500],
            description: 'Ethereum',
          },
          {
            symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
            category: 'GoodDollar' as const, color: '#13C636',
            price: 0.0102, change1h: 0.1, change24h: -0.5, change7d: 1.0,
            volume24h: 5e5, marketCap: 1e7, sparkline7d: [0.01, 0.0102, 0.0101],
            description: 'GoodDollar UBI token',
          },
        ],
        sources: { ETH: 'chain-oracle', 'G$': 'chain-oracle' } as Record<string, string>,
      }),
    }))
    const { default: Page } = await import('../page')
    render(<TestWrapper><Page /></TestWrapper>)
    const ethRow = findTokenRow('ETH')
    const gdRow = findTokenRow('G$')
    expect(ethRow.querySelector('[data-testid="price-source-badge"]')).not.toBeNull()
    expect(gdRow.querySelector('[data-testid="price-source-badge"]')).not.toBeNull()
    expect(
      ethRow.querySelector('[data-testid="price-source-badge"]')?.getAttribute('data-source'),
    ).toBe('chain-oracle')
  })

  it('collapses fallback-source rows to em-dashes for change / volume / market cap and renders no live sparkline', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '', decimals: 8, address: '0xab',
            category: 'Bitcoin' as const, color: '#F7931A',
            price: 60125.8, change1h: 0.5, change24h: 1.2, change7d: -2.0,
            volume24h: 1e9, marketCap: 4e11, sparkline7d: [60000, 60100, 60125],
            description: 'Wrapped Bitcoin',
          },
        ],
        sources: { WBTC: 'fallback' } as Record<string, string>,
      }),
    }))
    const { default: Page } = await import('../page')
    render(<TestWrapper><Page /></TestWrapper>)
    const wbtcRow = findTokenRow('WBTC')
    // Source badge reads "fallback".
    const badge = wbtcRow.querySelector('[data-testid="price-source-badge"]')
    expect(badge?.getAttribute('data-source')).toBe('fallback')
    // The row must contain at least one em-dash placeholder (24h column).
    expect(wbtcRow.textContent).toContain('—')
    // Sparkline cell must not render a polyline (only the dashed unavailable baseline).
    const polylines = wbtcRow.querySelectorAll('polyline')
    expect(polylines.length).toBe(0)
  })

  it('excludes non-live source rows from the Total Market Cap aggregate', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '', decimals: 8, address: '0xab',
            category: 'Bitcoin' as const, color: '#F7931A',
            price: 60125.8, change1h: null, change24h: null, change7d: null,
            volume24h: null, marketCap: 1.2e12, sparkline7d: null,
            description: 'Wrapped Bitcoin',
          },
          {
            symbol: 'UNI', name: 'Uniswap', icon: '', decimals: 18, address: '0xcd',
            category: 'DeFi' as const, color: '#FF007A',
            price: 7.92, change1h: null, change24h: null, change7d: null,
            volume24h: null, marketCap: 4.5e9, sparkline7d: null,
            description: 'Uniswap',
          },
        ],
        sources: { WBTC: 'fallback', UNI: 'fallback' } as Record<string, string>,
      }),
    }))
    const { default: Page } = await import('../page')
    render(<TestWrapper><Page /></TestWrapper>)
    // Every market cap row is fallback → headline aggregate must show "—",
    // not "$1.2T" / "$1,204.5B".
    const cardTitles = screen.getAllByText('Total Market Cap')
    expect(cardTitles.length).toBeGreaterThan(0)
    for (const title of cardTitles) {
      const card = title.closest('.bg-dark-100') ?? title.parentElement!.parentElement!.parentElement!
      expect(card.textContent || '').toContain('—')
      // The headline value must NOT include a trillion/billion suffix from fallback data.
      expect(card.textContent || '').not.toMatch(/\$1\.2T/)
    }
  })

  it('renders a divergence chip on canonical rows when chain & CoinGecko disagree (task 0044)', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '', decimals: 8, address: '0xab',
            category: 'Bitcoin' as const, color: '#F7931A',
            price: 84_250, change1h: 0.5, change24h: 1.2, change7d: -2.0,
            volume24h: 1e9, marketCap: 4e11, sparkline7d: [83000, 83500, 84250],
            description: 'Wrapped Bitcoin',
          },
          {
            symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0',
            category: 'Infrastructure' as const, color: '#627EEA',
            price: 3500, change1h: 0.5, change24h: 1.2, change7d: -2.0,
            volume24h: 1e9, marketCap: 4e11, sparkline7d: [3400, 3450, 3500],
            description: 'Ethereum',
          },
        ],
        sources: { WBTC: 'chain-oracle', ETH: 'chain-oracle' } as Record<string, string>,
        // Chain mark $84,250 vs CoinGecko $76,531 — the PRD screenshot.
        divergence: { WBTC: { otherUsd: 76_531 }, ETH: null } as Record<string, { otherUsd: number } | null>,
      }),
    }))
    const { default: Page } = await import('../page')
    render(<TestWrapper><Page /></TestWrapper>)
    const wbtcRow = findTokenRow('WBTC')
    const ethRow = findTokenRow('ETH')
    const wbtcChip = wbtcRow.querySelector('[data-testid="price-divergence-chip"]')
    expect(wbtcChip).not.toBeNull()
    expect(wbtcChip!.textContent).toMatch(/disagrees|drift/i)
    // The other source's number is exposed (title attribute or visible text).
    const wbtcChipText = (wbtcChip!.getAttribute('title') ?? '') + ' ' + (wbtcChip!.textContent ?? '')
    expect(wbtcChipText).toMatch(/76,?531/)
    // Non-canonical / non-divergent rows do not get a chip.
    expect(ethRow.querySelector('[data-testid="price-divergence-chip"]')).toBeNull()
  })

  it('omits the divergence chip when the canonical resolver reports no disagreement (task 0044)', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '', decimals: 8, address: '0xab',
            category: 'Bitcoin' as const, color: '#F7931A',
            price: 84_250, change1h: 0.5, change24h: 1.2, change7d: -2.0,
            volume24h: 1e9, marketCap: 4e11, sparkline7d: [83000, 83500, 84250],
            description: 'Wrapped Bitcoin',
          },
        ],
        sources: { WBTC: 'chain-oracle' } as Record<string, string>,
        divergence: { WBTC: null } as Record<string, { otherUsd: number } | null>,
      }),
    }))
    const { default: Page } = await import('../page')
    render(<TestWrapper><Page /></TestWrapper>)
    const wbtcRow = findTokenRow('WBTC')
    expect(wbtcRow.querySelector('[data-testid="price-divergence-chip"]')).toBeNull()
  })

  it('includes only chain/coingecko rows in the Total Market Cap aggregate', async () => {
    vi.doMock('@/lib/useOnChainMarketData', () => ({
      TOKEN_COLORS: {} as Record<string, string>,
      useOnChainMarketData: () => ({
        isLive: true,
        isLoading: false,
        tokens: [
          {
            symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0',
            category: 'Infrastructure' as const, color: '#627EEA',
            price: 3500, change1h: 0.5, change24h: 1.2, change7d: -2.0,
            volume24h: 1e9, marketCap: 4e11, sparkline7d: [3400, 3450, 3500],
            description: 'Ethereum',
          },
          {
            symbol: 'UNI', name: 'Uniswap', icon: '', decimals: 18, address: '0xcd',
            category: 'DeFi' as const, color: '#FF007A',
            price: 7.92, change1h: null, change24h: null, change7d: null,
            volume24h: null, marketCap: 4.5e9, sparkline7d: null,
            description: 'Uniswap',
          },
        ],
        sources: { ETH: 'chain-oracle', UNI: 'fallback' } as Record<string, string>,
      }),
    }))
    const { default: Page } = await import('../page')
    const { container } = render(<TestWrapper><Page /></TestWrapper>)
    // Aggregate should be ETH's $400B only — not $404.5B (would include UNI).
    expect(container.textContent || '').toContain('$400.00B')
    expect(container.textContent || '').not.toContain('$404.50B')
  })
})
