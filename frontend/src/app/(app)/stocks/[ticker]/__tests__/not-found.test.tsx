import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let currentParams: Record<string, string | undefined> = {}
let currentSearchParams = ''
const replace = vi.fn()
let chartPoints: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = []
let currentStocks: Array<{
  ticker: string
  name: string
  sector: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  high52w: number
  low52w: number
  sparkline7d: number[]
  peRatio: number
  eps: number
  dividendYield: number
  avgVolume: number
  description?: string
}> = []

const makeStock = () => ({
  ticker: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  price: 190,
  change24h: 1.2,
  marketCap: 1000000000,
  volume24h: 1000000,
  high52w: 210,
  low52w: 120,
  sparkline7d: [1, 2, 3, 4, 5],
  peRatio: 29.4,
  eps: 6.4,
  dividendYield: 0.52,
  avgVolume: 850000,
})

vi.mock('next/navigation', () => ({
  useParams: () => currentParams,
  usePathname: () => '/stocks/AAPL',
  useSearchParams: () => new URLSearchParams(currentSearchParams),
  useRouter: () => ({ push: vi.fn(), replace }),
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
  getChartData: () => chartPoints,
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  // These tests cover ticker validation, analysis-section rendering, and
  // peer-metric switching — none of which is about the oracle isLive gate
  // (task 0038). Using `isLive: true` keeps the Analysis card / Peer
  // Compare panel rendering through the live branch.
  useOnChainStocks: () => ({ stocks: currentStocks, isLive: true, isLoading: false }),
}))

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: () => ({ mint: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), phase: 'idle', error: null }),
  useStockPosition: () => ({ position: null, isLoading: false }),
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => true,
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: () => null },
}))

import StockDetailPage from '../page'

describe('StockDetailPage invalid ticker messaging hardening', () => {
  beforeEach(() => {
    currentParams = {}
    currentSearchParams = ''
    replace.mockReset()
    chartPoints = []
    currentStocks = []
  })

  it('renders a generic not-found message without echoing plain invalid ticker input', () => {
    currentParams = { ticker: 'NOTAREALSTOCK' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: /Stock Not Found/i })).toBeTruthy()
    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    expect(paragraph).toBeTruthy()
    expect(paragraph.textContent).not.toContain('NOTAREALSTOCK')
  })

  it('does not leak encoded whitespace payload (%20) in error copy', () => {
    currentParams = { ticker: '%20' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%20')
  })

  it('does not leak encoded null-byte payload (%00) in error copy', () => {
    currentParams = { ticker: '%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%00')
  })

  it('does not leak double-encoded whitespace payload (%2520) in error copy', () => {
    currentParams = { ticker: '%2520' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%2520')
    expect(text).not.toContain('%20')
  })

  it('does not leak encoded script-like payload (%3Csvg...) in error copy', () => {
    currentParams = { ticker: '%3Csvg%20onload%3Dalert(1)%3E' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%3C')
    expect(text).not.toContain('SVG')
    expect(text).not.toContain('ALERT')
  })

  it('does not leak encoded slash payload (%2F) in error copy', () => {
    currentParams = { ticker: '%2F' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%2F')
  })

  it('does not leak repeated percent-encoded payload (%252525252525) in error copy', () => {
    currentParams = { ticker: '%252525252525' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%252525252525')
  })

  it('does not leak double-encoded traversal payload (%252F..%252F%00) in error copy', () => {
    currentParams = { ticker: '%252F..%252F%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%252F')
    expect(text).not.toContain('..')
    expect(text).not.toContain('%00')
  })

  it('does not leak mixed alphanumeric null-byte payload (AAPL%00) in error copy', () => {
    currentParams = { ticker: 'AAPL%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('AAPL%00')
  })

  it('still provides quick recovery links', () => {
    currentParams = { ticker: 'NOTAREALSTOCK' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const aapl = screen.getByRole('link', { name: 'AAPL' })
    const msft = screen.getByRole('link', { name: 'MSFT' })
    const nvda = screen.getByRole('link', { name: 'NVDA' })
    expect(aapl.getAttribute('href')).toBe('/stocks/AAPL')
    expect(msft.getAttribute('href')).toBe('/stocks/MSFT')
    expect(nvda.getAttribute('href')).toBe('/stocks/NVDA')
  })

  it('resolves valid lowercase ticker to stock detail page', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'aapl' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Stock Not Found/i })).toBeNull()
  })

  it('resolves double-encoded valid ticker to stock detail page', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: '%2541APL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Stock Not Found/i })).toBeNull()
  })

  it('resolves encoded trailing-slash ticker payload to stock detail page', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL%2F' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Stock Not Found/i })).toBeNull()
  })

  it('shows stocks-focused next actions in empty-position state on valid detail pages', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const buyLink = screen.getByRole('link', { name: /Buy sAAPL/i })
    const portfolioLink = screen.getByRole('link', { name: /Open Stock Portfolio/i })
    const browseLink = screen.getByRole('link', { name: /Browse Stocks/i })

    expect(buyLink.getAttribute('href')).toBe('/stocks/AAPL#stock-order-form')
    expect(portfolioLink.getAttribute('href')).toBe('/stocks/portfolio')
    expect(browseLink.getAttribute('href')).toBe('/stocks')

    expect(screen.queryByRole('link', { name: /Explore crypto tokens/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Trade crypto perpetual futures/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Prediction markets/i })).toBeNull()
  })

  it('normalizes invalid tab query params to canonical fallback URL', async () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    currentSearchParams = 'tab=unknown'
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/stocks/AAPL', { scroll: false })
    })
  })

  it('renders analysis section with trend fallback when chart data is unavailable', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: /Analysis/i })).toBeTruthy()
    expect(screen.getByText(/Trend signal unavailable while chart data loads/i)).toBeTruthy()
    expect(screen.getByText(/P\/E 29.4x/i)).toBeTruthy()
  })

  it('supports peer metric switching in analysis section', () => {
    currentStocks = [
      makeStock(),
      {
        ...makeStock(),
        ticker: 'MSFT',
        name: 'Microsoft',
        sector: 'Technology',
        marketCap: 2800000000000,
        peRatio: 35.2,
      },
      {
        ...makeStock(),
        ticker: 'NVDA',
        name: 'NVIDIA',
        sector: 'Technology',
        marketCap: 2500000000000,
        peRatio: 44.5,
      },
    ]
    chartPoints = [
      { time: '2026-05-01', open: 180, high: 182, low: 178, close: 180, volume: 1_000_000 },
      { time: '2026-05-02', open: 180, high: 189, low: 179, close: 188, volume: 1_300_000 },
      { time: '2026-05-03', open: 188, high: 193, low: 186, close: 191, volume: 1_500_000 },
    ]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    fireEvent.click(screen.getByRole('button', { name: 'Mkt Cap' }))
    expect(screen.getAllByText('MSFT').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'P/E' }))
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)
  })
})
