import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// Mutable param mock — each test sets `currentParams` before rendering.
let currentParams: Record<string, string | undefined> = {}

vi.mock('next/navigation', () => ({
  useParams: () => currentParams,
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@/components/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart" />,
}))

vi.mock('@/lib/chartData', () => ({
  getChartData: () => [],
}))

// Stocks list never contains any of the test tickers, so we always hit the
// "Stock Not Found" branch.
vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [], isLive: false, isLoading: false }),
}))

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: () => ({ mint: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), phase: 'idle', error: null }),
  useStockPosition: () => ({ position: null, isLoading: false }),
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => true,
}))

// Keep `wagmi` real so TestWrapper's provider works; the page only calls
// `useAccount()`, which safely returns the disconnected state. Stub
// rainbowkit so it doesn't blow up trying to connect to anything in jsdom.
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: () => null },
}))

import StockDetailPage from '../page'

describe('StockDetailPage — "Stock Not Found" ticker truncation', () => {
  beforeEach(() => {
    currentParams = {}
  })

  // Long contiguous URL segments must not push the layout past the viewport.
  // 500 'A's is the same probe used in the original Explore fix (task 0054).
  const longTicker = 'A'.repeat(500)

  it('renders the not-found state without crashing on an empty-ish ticker', () => {
    // params.ticker is undefined when the route segment is somehow missing;
    // the component uppercases the result and ends up with undefined, so we
    // simulate that here. The render must not throw.
    currentParams = {}
    expect(() =>
      render(<TestWrapper><StockDetailPage /></TestWrapper>)
    ).not.toThrow()

    expect(screen.getByRole('heading', { name: /Stock Not Found/i })).toBeTruthy()
  })

  it('renders short tickers (e.g. AAPL) verbatim — no ellipsis, no overflow', () => {
    currentParams = { ticker: 'aapl' } // exercises the .toUpperCase() path
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    expect(paragraph.textContent).toContain('AAPL')
    expect(paragraph.textContent).not.toContain('…')
  })

  it('truncates a 25-character ticker (just over the 24-char cap)', () => {
    const justOverCap = 'B'.repeat(25)
    currentParams = { ticker: justOverCap }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('…')
    expect(text).not.toContain(justOverCap) // full string never appears

    // The span carries the raw value in its `title=` attribute so screen
    // readers and hover tooltips still expose it.
    const span = paragraph.querySelector('span[title]')
    expect(span).not.toBeNull()
    expect(span?.getAttribute('title')).toBe(justOverCap)
  })

  it('truncates a 500-character ticker and exposes the raw value via title', () => {
    currentParams = { ticker: longTicker }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    // Visible body of the paragraph is bounded.
    expect(text.length).toBeLessThan(120)
    expect(text).toContain('…')
    // The full 500-char run must not appear in the rendered text.
    expect(text.includes(longTicker)).toBe(false)

    const span = paragraph.querySelector('span[title]')
    expect(span).not.toBeNull()
    expect(span?.getAttribute('title')).toBe(longTicker)
  })

  it('applies break-all + max-w-md so any remaining contiguous run still wraps', () => {
    currentParams = { ticker: longTicker }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    // These two classes together prevent the 24 leading 'A's (before the
    // ellipsis) from extending past the card and producing a horizontal
    // scrollbar on the whole document.
    expect(paragraph.className).toMatch(/break-all/)
    expect(paragraph.className).toMatch(/max-w-/)
  })

  it('still renders the "Back to Stocks" affordance regardless of ticker length', () => {
    currentParams = { ticker: longTicker }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const link = screen.getByRole('link', { name: /Back to Stocks/i })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/stocks')
  })

  it('normalizes URL-encoded whitespace ticker to a safe fallback label', () => {
    currentParams = { ticker: '%20' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('UNKNOWN')
    expect(text).not.toContain('%20')
  })

  it('normalizes URL-encoded null-byte ticker to UNKNOWN', () => {
    currentParams = { ticker: '%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('UNKNOWN')
    expect(text).not.toContain('%00')
  })

  it('normalizes double-encoded whitespace ticker to UNKNOWN', () => {
    currentParams = { ticker: '%2520' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('UNKNOWN')
    expect(text).not.toContain('%2520')
    expect(text).not.toContain('%20')
  })

  it('normalizes triple-encoded whitespace ticker to UNKNOWN', () => {
    currentParams = { ticker: '%252520' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('UNKNOWN')
    expect(text).not.toContain('%252520')
    expect(text).not.toContain('%2520')
    expect(text).not.toContain('%20')
  })

  it('decodes double-encoded valid symbols before rendering fallback copy', () => {
    currentParams = { ticker: '%2541APL' } // double-encoded AAPL
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('AAPL')
    expect(text).not.toContain('%2541')
  })

  it('does not leak encoded script-like payload in not-found copy', () => {
    currentParams = { ticker: '%3Cscript%3Ealert(1)%3C%2Fscript%3E' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/is not available/i)
    const text = paragraph.textContent ?? ''
    expect(text).toContain('UNKNOWN')
    expect(text).not.toContain('%3C')
    expect(text).not.toContain('SCRIPT')
  })

  it('offers quick recovery links for popular tickers', () => {
    currentParams = { ticker: 'NOTAREALSTOCK' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const aapl = screen.getByRole('link', { name: 'AAPL' })
    const msft = screen.getByRole('link', { name: 'MSFT' })
    const nvda = screen.getByRole('link', { name: 'NVDA' })
    expect(aapl.getAttribute('href')).toBe('/stocks/AAPL')
    expect(msft.getAttribute('href')).toBe('/stocks/MSFT')
    expect(nvda.getAttribute('href')).toBe('/stocks/NVDA')
  })
})
