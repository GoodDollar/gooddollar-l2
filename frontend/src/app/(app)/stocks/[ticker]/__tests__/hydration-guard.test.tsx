import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let currentParams: Record<string, string | undefined> = {}
let chartPoints: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> = []

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
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => false,
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  // Test is about pre-mount hydration guard, not the oracle isLive gate
  // introduced in task 0038. Keep `isLive: true` so the trend summary
  // falls through to its existing "chart data loads" empty state.
  useOnChainStocks: () => ({ stocks: [makeStock()], isLive: true, isLoading: false }),
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

describe('StockDetailPage hydration guard', () => {
  beforeEach(() => {
    currentParams = { ticker: 'AAPL' }
    chartPoints = [
      { time: '2026-05-01', open: 180, high: 190, low: 175, close: 186, volume: 1000 },
      { time: '2026-05-02', open: 186, high: 195, low: 184, close: 194, volume: 1200 },
    ]
  })

  it('keeps trend summary in fallback state before mount even when chart points exist', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByText(/Trend signal unavailable while chart data loads/i)).toBeTruthy()
    expect(screen.queryByText('Bullish')).toBeNull()
    expect(screen.queryByText('Bearish')).toBeNull()
  })
})
