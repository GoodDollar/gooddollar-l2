/**
 * Task 0023: /stocks/[ticker] — the spot-price header and the chart's
 * last-candle close MUST agree within 0.5 %. Also, the `+0.00%` lie on
 * the spot card MUST be replaced with an em-dash when the chain-path
 * has no real 24h change.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
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

const stock = {
  ticker: 'AAPL',
  name: 'sAAPL',
  displayName: 'Apple Inc.',
  sector: 'Technology',
  description: 'Apple Inc.',
  price: 193,
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  high52w: 193 * 1.15,
  low52w: 193 * 0.75,
  sparkline7d: null,
  peRatio: 0,
  eps: 0,
  dividendYield: 0,
  avgVolume: 0,
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

vi.mock('@/components/stocks/DepthChart', () => ({
  DepthChart: () => <div data-testid="depth-chart" />,
}))

vi.mock('@/components/stocks/StockMarketData', () => ({
  StockMarketData: () => <div data-testid="stock-market-data" />,
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [stock], isLive: true, isLoading: false }),
}))

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: () => ({ mint: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), phase: 'idle', error: null }),
  useStockPosition: () => ({ position: null, isLoading: false }),
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => true,
}))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({ data: [], isLoading: false, error: null, bySymbol: {} }),
}))

vi.mock('@/lib/marketHours', () => ({
  getMarketSession: () => ({
    label: 'Market Closed',
    state: 'closed',
    color: 'text-gray-400',
    dotColor: 'bg-gray-400',
    nextEventLabel: 'Opens Mon',
    nextEventDate: null,
  }),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ isConnected: false }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

import StockDetailPage from '../page'

describe('/stocks/[ticker] chart-spot agreement (task 0023)', () => {
  it('spot price and chart last-close agree within 0.5 % (no $25 lie)', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const spotEl = screen.getByTestId('stock-spot-price')
    const spot = Number(spotEl.textContent?.replace(/[^0-9.]/g, ''))
    expect(spot).toBeGreaterThan(0)

    const lastCloseEl = screen.getByTestId('chart-last-close')
    const lastClose = Number(lastCloseEl.getAttribute('data-value'))
    expect(lastClose).toBeGreaterThan(0)

    expect(Math.abs(spot - lastClose) / spot).toBeLessThan(0.005)
  })

  it('does NOT render the demo-chart ribbon when spot and chart agree', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    expect(screen.queryByTestId('chart-demo-ribbon')).toBeNull()
  })

  it('renders em-dash, not "+0.00%", when chain-path change24h is the no-data sentinel', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const changeEl = screen.getByTestId('stock-spot-change')
    expect(changeEl.textContent).toBe('—')
    expect(changeEl.textContent).not.toBe('+0.00%')
  })
})
