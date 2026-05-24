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
let currentPriceServiceState: {
  status: null | {
    healthy: boolean
    freshCount: number
    totalCount: number
    quotes: Array<{ symbol: string; lastUpdateMs: number; sessionState: 'open'; confidence: number }>
  }
  error: Error | null
} = {
  status: null,
  error: new Error('offline'),
}

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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/stocks/AAPL',
  useSearchParams: () => new URLSearchParams(''),
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
  OracleStatusBadge: () => <div data-testid="oracle-status-badge">Oracle offline</div>,
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

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: () => currentPriceServiceState,
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void }) => React.ReactNode
    }) => <>{children({ openConnectModal: vi.fn() })}</>,
  },
}))

import StockDetailPage from '../page'

describe('StockDetailPage oracle trade guard', () => {
  beforeEach(() => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    currentPriceServiceState = {
      status: null,
      error: new Error('offline'),
    }
  })

  it('disables trade interactions and shows paused CTA when oracle is offline', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByTestId('stocks-trade-oracle-guard')).toHaveTextContent('Trading is paused while oracle status is offline')
    expect(screen.getByTestId('stocks-trade-paused-button')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Buy' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sell' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Market' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Limit' })).toBeDisabled()
  })

  it('keeps trading controls active when oracle quote is healthy and fresh', () => {
    currentPriceServiceState = {
      error: null,
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 5_000, sessionState: 'open', confidence: 95 }],
      },
    }

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.queryByTestId('stocks-trade-oracle-guard')).toBeNull()
    expect(screen.queryByTestId('stocks-trade-paused-button')).toBeNull()
    expect(screen.getByRole('button', { name: 'Buy' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sell' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Market' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Limit' })).toBeEnabled()
  })
})

