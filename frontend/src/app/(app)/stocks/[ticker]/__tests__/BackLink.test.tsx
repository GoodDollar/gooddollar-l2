import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let currentParams: Record<string, string | undefined> = {}
let currentSearchParams = new URLSearchParams()
const routerPush = vi.fn()
const mockChartData = vi.hoisted(() => vi.fn())
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
  sparkline7d: number[] | null
  peRatio: number
  eps: number
  dividendYield: number
  avgVolume: number
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
  useRouter: () => ({ push: routerPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => currentSearchParams,
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
  getChartData: mockChartData,
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

describe('StockDetailPage back navigation link', () => {
  beforeEach(() => {
    currentParams = { ticker: 'AAPL' }
    currentStocks = [makeStock()]
    currentSearchParams = new URLSearchParams()
    routerPush.mockReset()
    mockChartData.mockReset()
    mockChartData.mockImplementation(() => [])
  })

  it('shows "Back to Markets" by default when no from param', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const backLink = screen.getByTestId('stocks-detail-back-link')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveTextContent(/Back to Markets/i)
    expect(backLink).toHaveAttribute('href', '/stocks')
  })

  it('shows "Back to Watchlist" when from=watchlist', () => {
    currentSearchParams = new URLSearchParams('from=watchlist')
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const backLink = screen.getByTestId('stocks-detail-back-link')
    expect(backLink).toHaveTextContent(/Back to Watchlist/i)
    expect(backLink).toHaveAttribute('href', '/stocks/watchlist')
  })

  it('shows "Back to Portfolio" when from=portfolio', () => {
    currentSearchParams = new URLSearchParams('from=portfolio')
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const backLink = screen.getByTestId('stocks-detail-back-link')
    expect(backLink).toHaveTextContent(/Back to Portfolio/i)
    expect(backLink).toHaveAttribute('href', '/stocks/portfolio')
  })

  it('falls back to Markets for unknown from values', () => {
    currentSearchParams = new URLSearchParams('from=unknown')
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const backLink = screen.getByTestId('stocks-detail-back-link')
    expect(backLink).toHaveTextContent(/Back to Markets/i)
    expect(backLink).toHaveAttribute('href', '/stocks')
  })

  it('back link has correct data-testid attribute', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByTestId('stocks-detail-back-link')).toBeInTheDocument()
  })
})
