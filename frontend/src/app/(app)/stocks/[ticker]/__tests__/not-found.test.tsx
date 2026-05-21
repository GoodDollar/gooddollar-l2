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
let oracleGuardState: { health: 'live' | 'degraded' | 'offline'; reason: string | null; isLoading: boolean } = {
  health: 'live',
  reason: null,
  isLoading: false,
}
let walletConnected = false

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

vi.mock('@/components/OracleStatusBadge', () => ({
  OracleStatusBadge: () => <div data-testid="oracle-badge" />,
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

vi.mock('@/lib/useStocksOracleGuard', () => ({
  useStocksOracleGuard: () => oracleGuardState,
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ isConnected: walletConnected }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: () => null },
}))

import StockDetailPage from '../page'

describe('StockDetailPage invalid ticker messaging hardening', () => {
  beforeEach(() => {
    currentParams = {}
    currentStocks = []
    oracleGuardState = { health: 'live', reason: null, isLoading: false }
    walletConnected = false
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

  it('shows a prominent risk banner when oracle guard reports offline', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    oracleGuardState = {
      health: 'offline',
      reason: 'Price data is stale (321s old).',
      isLoading: false,
    }

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Trading is paused/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Price data is stale/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows first-trade checklist with required states for disconnected users', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    walletConnected = false
    oracleGuardState = { health: 'degraded', reason: 'Quotes are delayed.', isLoading: false }

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByText(/First trade checklist/i)).toBeTruthy()
    expect(screen.getByText('1. Connect wallet')).toBeTruthy()
    expect(screen.getByText('Required')).toBeTruthy()
    expect(screen.getByText('2. Confirm live prices')).toBeTruthy()
    expect(screen.getAllByText('Blocked').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('3. Submit order')).toBeTruthy()
    expect(screen.getByText('Waiting')).toBeTruthy()
  })

  it('shows synthetic token explainer above company description in About section', () => {
    const stockWithDesc = { ...makeStock(), description: 'Apple Inc. designs and sells electronics.' }
    currentStocks = [stockWithDesc]
    currentParams = { ticker: 'AAPL' }
    walletConnected = false
    oracleGuardState = { health: 'live', reason: null, isLoading: false }

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByText(/sAAPL is a synthetic token/i)).toBeTruthy()
    expect(screen.getByText(/tracks.*Apple Inc/i)).toBeTruthy()
    expect(screen.getByText(/24\/7/i)).toBeTruthy()
    expect(screen.getByText(/Universal Basic Income/i)).toBeTruthy()
    expect(screen.getByText('Apple Inc. designs and sells electronics.')).toBeTruthy()
  })

  it('shows actionable recovery links when oracle is not live', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    walletConnected = true
    oracleGuardState = { health: 'offline', reason: 'Price data is stale.', isLoading: false }

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const browseStocks = screen.getByRole('link', { name: /Browse trade-ready stocks/i })
    const portfolioLinks = screen.getAllByRole('link', { name: /Open Stock Portfolio/i })
    expect(browseStocks.getAttribute('href')).toBe('/stocks')
    expect(portfolioLinks.some(link => link.getAttribute('href') === '/stocks/portfolio')).toBe(true)
  })
})
