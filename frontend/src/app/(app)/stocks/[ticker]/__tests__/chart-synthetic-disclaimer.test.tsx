/**
 * Task 0039 — `/stocks/[ticker]` candlestick chart panel must carry a
 * persistent "Illustrative chart — historical candles are synthetic"
 * disclaimer (with a "Last point: live …" attribution) regardless of
 * timeframe. The TradingView-style `TV` watermark must NOT be present
 * while the underlying data is a `generateOHLC()` random walk.
 *
 * Empty-state branch: when `stock.price` is missing or non-finite the
 * chart frame switches to "Chart unavailable — oracle feed pending"
 * and no `<PriceChart>` SVG is rendered.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type React from 'react'
import { TestWrapper } from '@/test-utils/wrapper'

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
})

const aaplFallback = {
  ticker: 'AAPL', name: 'sAAPL', displayName: 'Apple Inc.',
  sector: 'Technology', description: 'Apple synthetic.',
  price: 218.27, change24h: 1.3,
  volume24h: 62_000_000, marketCap: 3_340_000_000_000,
  high52w: 237.49, low52w: 164.08,
  sparkline7d: [213, 214, 215, 216, 217, 218, 218.27],
  peRatio: 33.8, eps: 6.46, dividendYield: 0.44, avgVolume: 58_000_000,
}

vi.mock('next/navigation', () => ({
  useParams: () => ({ ticker: 'AAPL' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/stocks/AAPL',
  useSearchParams: () => new URLSearchParams(''),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@/components/PriceChart', () => ({
  PriceChart: ({ data }: { data: Array<{ time: string }> }) => (
    <div data-testid="price-chart-svg" data-len={data.length} />
  ),
}))
vi.mock('@/components/OracleStatusBadge', () => ({ OracleStatusBadge: () => <div data-testid="oracle-status-badge" /> }))
vi.mock('@/components/stocks/AnalystOutlookCard', () => ({ AnalystOutlookCard: () => <div data-testid="analyst-outlook-card" /> }))
vi.mock('@/components/stocks/NewsEventsPanel', () => ({ NewsEventsPanel: () => <div data-testid="news-events-panel" /> }))
vi.mock('@/components/stocks/RelatedMoversPanel', () => ({ RelatedMoversPanel: () => <div data-testid="related-movers-panel" /> }))
vi.mock('@/components/stocks/DepthChart', () => ({ DepthChart: () => <div data-testid="depth-chart" /> }))
vi.mock('@/components/stocks/StockMarketData', () => ({ StockMarketData: () => <div data-testid="stock-market-data" /> }))

let mockStock: typeof aaplFallback | (typeof aaplFallback & { price: number }) = aaplFallback

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [mockStock], isLive: false, isLoading: false }),
}))

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: () => ({ mint: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), phase: 'idle', error: null }),
  useStockPosition: () => ({ position: null, isLoading: false }),
}))

vi.mock('@/lib/WalletReadyContext', () => ({ useWalletReady: () => true }))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({ data: [], isLoading: false, error: null, bySymbol: {} }),
}))

vi.mock('@/lib/marketHours', () => ({
  getMarketSession: () => ({
    label: 'Market Closed', state: 'closed',
    color: 'text-gray-400', dotColor: 'bg-gray-400',
    nextEventLabel: 'Opens Mon', nextEventDate: null,
  }),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return { ...actual, useAccount: () => ({ isConnected: false }) }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode }) =>
      children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

import StockDetailPage from '../page'

describe('Ticker chart panel — task 0039: synthetic disclaimer + watermark + empty state', () => {
  it('renders a persistent "synthetic" / "illustrative" disclaimer above the chart', () => {
    mockStock = aaplFallback
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const banner = screen.getByTestId('chart-synthetic-disclaimer')
    expect(banner).toBeTruthy()
    const text = banner.textContent?.toLowerCase() ?? ''
    expect(text).toMatch(/synthetic|illustrative/)
    expect(text).toMatch(/last point|live/)
  })

  it('does NOT render a "TV" TradingView-style watermark text node', () => {
    mockStock = aaplFallback
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    // No node whose entire text content is just "TV".
    expect(screen.queryByText(/^TV$/)).toBeNull()
  })

  it('keeps the disclaimer visible across timeframe selections', () => {
    mockStock = aaplFallback
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const timeframes = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y']
    for (const tf of timeframes) {
      fireEvent.click(screen.getByRole('button', { name: tf }))
      expect(screen.getByTestId('chart-synthetic-disclaimer')).toBeTruthy()
    }
  })

  it('shows "Chart unavailable" empty state and skips PriceChart when stock.price is not finite', () => {
    mockStock = { ...aaplFallback, price: 0 }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    expect(screen.getByTestId('chart-empty-state').textContent ?? '').toMatch(/chart unavailable/i)
    expect(screen.queryByTestId('price-chart-svg')).toBeNull()
  })
})
