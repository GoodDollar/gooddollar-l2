/**
 * Task 0037 — `/stocks` browse table must NOT render fabricated 24h Change /
 * Volume / Market Cap / Sparkline values from `FALLBACK_STOCKS` literals
 * while the on-chain stocks oracle is offline. Under an "Oracle offline"
 * banner the table presents `Price` with its existing "Fallback price" pill
 * and dashes every other quantitative column.
 *
 * The same gate also disables the sortable column headers for those columns
 * and the momentum / cap / liquidity filter chips — otherwise the user can
 * still rank or partition the table by fiction.
 *
 * Live-path regression: when `isLive === true`, the columns render as before.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/stocks',
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', chainId: 42220 }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode }) =>
      children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: () => ({
    prices: {},
    sources: {},
    hasLiveData: false,
    isLoading: false,
    isPartial: false,
    isFallback: true,
    missingSymbols: [],
  }),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: () => ({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({
    data: [], isLoading: false, error: null, bySymbol: {},
  }),
}))

vi.mock('@/lib/useStockWatchlist', () => ({
  useStockWatchlist: () => ({
    favorites: new Set(),
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}))

import { useOnChainStocks } from '@/lib/useOnChainStocks'
import StocksPage from '../page'
import type { Stock } from '@/lib/stockData'

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: vi.fn(),
}))

function fallbackRow(over: Partial<Stock> = {}): Stock {
  return {
    ticker: 'AAPL', name: 'sAAPL', displayName: 'Apple Inc.',
    sector: 'Technology', description: 'Apple',
    price: 218.27, change24h: 1.3, volume24h: 62_000_000,
    marketCap: 3_340_000_000_000, high52w: 237.49, low52w: 164.08,
    sparkline7d: [213, 214, 215, 216, 217, 218, 218.27],
    peRatio: 33.8, eps: 6.46, dividendYield: 0.44, avgVolume: 58_000_000,
    ...over,
  }
}

describe('StocksPage browse table — task 0037: no fabricated columns when oracle is offline', () => {
  it('renders em-dashes for 24h Change / Volume / Market Cap / sparkline when !isLive', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [
        fallbackRow({ ticker: 'AAPL', change24h: 1.3, volume24h: 62_000_000, marketCap: 3_340_000_000_000 }),
        fallbackRow({ ticker: 'NVDA', name: 'sNVDA', change24h: 3.2, volume24h: 310_000_000, marketCap: 2_580_000_000_000, price: 104.75 }),
        fallbackRow({ ticker: 'COIN', name: 'sCOIN', change24h: 4.2, volume24h: 12_000_000, marketCap: 43_500_000_000, price: 178.54 }),
      ],
      isLoading: false,
      isLive: false,
      refetch: vi.fn(),
    })

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    // The fabricated literals from FALLBACK_STOCKS must NOT appear in the body.
    expect(container.textContent ?? '').not.toMatch(/\+1\.30%/)
    expect(container.textContent ?? '').not.toMatch(/\+3\.20%/)
    expect(container.textContent ?? '').not.toMatch(/\+4\.20%/)
    expect(container.textContent ?? '').not.toMatch(/\$62\.0+M/)
    expect(container.textContent ?? '').not.toMatch(/\$310\.0+M/)
    expect(container.textContent ?? '').not.toMatch(/\$3\.34T/)
    expect(container.textContent ?? '').not.toMatch(/\$2\.58T/)

    // No coloured "▲"/"▼" sign in any row.
    expect(container.textContent ?? '').not.toMatch(/▲/)
    expect(container.textContent ?? '').not.toMatch(/▼/)

    // Sort headers for the dashed columns are aria-disabled.
    const changeHeader = screen.getByRole('columnheader', { name: /24h Change/i })
    const volumeHeader = screen.getByRole('columnheader', { name: /Volume/i })
    const capHeader = screen.getByRole('columnheader', { name: /Market Cap/i })
    expect(changeHeader.getAttribute('aria-disabled')).toBe('true')
    expect(volumeHeader.getAttribute('aria-disabled')).toBe('true')
    expect(capHeader.getAttribute('aria-disabled')).toBe('true')

    // Momentum / cap / liquidity filter chips are visibly disabled.
    expect(screen.getByLabelText('Filter by momentum')).toBeDisabled()
    expect(screen.getByLabelText('Filter by market cap')).toBeDisabled()
    expect(screen.getByLabelText('Filter by liquidity')).toBeDisabled()
  })

  it('renders real values when isLive === true (regression guard)', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [
        fallbackRow({
          ticker: 'AAPL',
          price: 200,
          change24h: 1.5,
          volume24h: 50_000_000,
          marketCap: 3_000_000_000_000,
          sparkline7d: [195, 196, 197, 198, 199, 200, 200],
        }),
      ],
      isLoading: false,
      isLive: true,
      refetch: vi.fn(),
    })

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    expect(container.textContent ?? '').toMatch(/\+1\.50%/)
    expect(container.textContent ?? '').toMatch(/\$50\.0+M/)
    expect(container.textContent ?? '').toMatch(/\$3\.00T/)

    // Sort headers are interactive.
    const changeHeader = screen.getByRole('columnheader', { name: /24h Change/i })
    expect(changeHeader.getAttribute('aria-disabled')).not.toBe('true')

    expect(screen.getByLabelText('Filter by momentum')).not.toBeDisabled()
  })
})

describe('StocksPage browse table — footnote copy', () => {
  it('uses the consolidated caption when !isLive', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [fallbackRow()],
      isLoading: false,
      isLive: false,
      refetch: vi.fn(),
    })

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    expect(container.textContent ?? '').toMatch(/24h change, volume, market cap/i)
  })
})

describe('StocksPage browse table — mobile card list mirrors the desktop gate', () => {
  it('hides fabricated 24h change / sparkline on mobile when !isLive', () => {
    // matchMedia returns true for max-width:639px → mobile branch
    window.matchMedia = ((query: string) => ({
      matches: query.includes('max-width: 639px'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList))

    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [fallbackRow()],
      isLoading: false,
      isLive: false,
      refetch: vi.fn(),
    })

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    expect(container.textContent ?? '').not.toMatch(/\+1\.30%/)
    // Mobile card list contains the price (still attributed) but no
    // coloured percent change.
    expect(within(container).queryAllByText('+1.30%').length).toBe(0)
  })
})
