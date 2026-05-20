import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let currentParams: Record<string, string | undefined> = {}
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

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: currentStocks, isLive: false, isLoading: false }),
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
})
