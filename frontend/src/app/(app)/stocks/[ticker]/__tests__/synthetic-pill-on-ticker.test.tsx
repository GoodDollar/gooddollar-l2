/**
 * Task 0022: /stocks/[ticker] hero MUST NOT render "Market Closed" next
 * to the trade-24/7 promise. The hero (active route, page.tsx) wires
 * `<SyntheticStockHeaderBadge />` next to the ticker name and surfaces
 * the shared `useSyntheticStockHeader()` subhead.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
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
  name: 'Apple Inc.',
  sector: 'Technology',
  price: 190,
  change24h: 1.2,
  marketCap: 1_000_000_000,
  volume24h: 1_000_000,
  high52w: 210,
  low52w: 120,
  sparkline7d: [1, 2, 3, 4, 5],
  peRatio: 29.4,
  eps: 6.4,
  dividendYield: 0.52,
  avgVolume: 850_000,
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

vi.mock('@/lib/chartData', () => ({
  getChartData: () => [],
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [stock], isLive: false, isLoading: false }),
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
  getMarketSession: vi.fn(),
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

import { getMarketSession } from '@/lib/marketHours'
import StockDetailPage from '../page'

describe('Ticker hero synthetic-vs-underlying — task 0022', () => {
  beforeEach(() => {
    vi.mocked(getMarketSession).mockReset()
  })

  it('weekend / closed: ticker hero shows "Synthetic · trade 24/7" pill alongside subhead, no bare "Market Closed" in hero', () => {
    vi.mocked(getMarketSession).mockReturnValue({
      label: 'Market Closed',
      state: 'closed',
      color: 'text-gray-400',
      dotColor: 'bg-gray-400',
      nextEventLabel: 'Opens Mon',
      nextEventDate: null,
    })

    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const pill = screen.getByTestId('synthetic-stock-header-badge')
    expect(pill).toHaveTextContent('Synthetic · trade 24/7')

    const subhead = screen.getByTestId('ticker-hero-subhead')
    expect(subhead.textContent).toMatch(/24\/7/i)
    expect(subhead.textContent).toMatch(/underlying/i)
  })

  it('open: ticker hero shows "Live · oracle ticking" and subhead mentions live oracle prices', () => {
    vi.mocked(getMarketSession).mockReturnValue({
      label: 'Market Open',
      state: 'open',
      color: 'text-green-400',
      dotColor: 'bg-green-400',
      nextEventLabel: 'Closes 4:00 PM ET',
      nextEventDate: null,
    })

    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const pill = screen.getByTestId('synthetic-stock-header-badge')
    expect(pill).toHaveTextContent('Live · oracle ticking')

    const subhead = screen.getByTestId('ticker-hero-subhead')
    expect(subhead.textContent).toMatch(/oracle is publishing live prices/i)
    expect(subhead.textContent).not.toMatch(/until Mon/i)
  })
})
