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

vi.mock('@/components/OracleStatusBadge', () => ({
  OracleStatusBadge: () => <div data-testid="oracle-status-badge" />,
}))

vi.mock('@/components/stocks/AnalystOutlookCard', () => ({
  AnalystOutlookCard: () => <div data-testid="analyst-outlook-card" />,
}))

vi.mock('@/components/stocks/NewsEventsPanel', () => ({
  NewsEventsPanel: () => <div data-testid="news-events-panel" />,
}))

vi.mock('@/components/stocks/RelatedMoversPanel', () => ({
  RelatedMoversPanel: () => <div data-testid="related-movers-panel" />,
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

describe('StockDetailPage mobile hierarchy order', () => {
  beforeEach(() => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
  })

  it('keeps primary ticker context column first on mobile and avoids reverse-order utility classes', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buy/i })).toBeInTheDocument()

    const mainColumn = screen.getByTestId('stocks-detail-main-column')
    const sideColumn = screen.getByTestId('stocks-detail-side-column')

    expect(mainColumn.className).not.toContain('order-2')
    expect(sideColumn.className).not.toContain('order-1')
  })
})
