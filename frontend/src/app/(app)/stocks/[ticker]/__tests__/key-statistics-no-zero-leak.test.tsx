/**
 * Task 0024: Key Statistics panel on /stocks/[ticker] MUST em-dash
 * zero-sentinel fields (P/E, EPS, Avg Volume, 24h Change) and MUST
 * em-dash the chain-path 52W placeholder (`price * 1.15` / `0.75`).
 * Live numbers MUST still render verbatim.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

let activeStock = {
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

vi.mock('@/components/PriceChart', () => ({ PriceChart: () => <div data-testid="price-chart" /> }))
vi.mock('@/components/OracleStatusBadge', () => ({ OracleStatusBadge: () => <div data-testid="oracle-status-badge" /> }))
vi.mock('@/components/stocks/AnalystOutlookCard', () => ({ AnalystOutlookCard: () => <div data-testid="analyst-outlook-card" /> }))
vi.mock('@/components/stocks/NewsEventsPanel', () => ({ NewsEventsPanel: () => <div data-testid="news-events-panel" /> }))
vi.mock('@/components/stocks/RelatedMoversPanel', () => ({ RelatedMoversPanel: () => <div data-testid="related-movers-panel" /> }))
vi.mock('@/components/stocks/DepthChart', () => ({ DepthChart: () => <div data-testid="depth-chart" /> }))
vi.mock('@/components/stocks/StockMarketData', () => ({ StockMarketData: () => <div data-testid="stock-market-data" /> }))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [activeStock], isLive: true, isLoading: false }),
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
  return { ...actual, useAccount: () => ({ isConnected: false }) }
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

describe('Key Statistics panel — no zero leak (task 0024)', () => {
  it('chain-path stock with all-zero extras renders em-dashes, not 0.0x / $0.00 / +0.00%', () => {
    activeStock = {
      ...activeStock,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      peRatio: 0,
      eps: 0,
      dividendYield: 0,
      avgVolume: 0,
      high52w: 193 * 1.15,
      low52w: 193 * 0.75,
    }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const panel = screen.getByTestId('ticker-key-statistics')

    expect(panel.textContent).not.toMatch(/0\.0x/)
    expect(panel.textContent).not.toMatch(/\$0\.00/)
    expect(panel.textContent).not.toMatch(/\+0\.00%/)
    // Avg Volume must be em-dash, not "0".
    const avgVolumeLabel = within(panel).getByText('Avg Volume')
    const avgVolumeValue = avgVolumeLabel.nextElementSibling
    expect(avgVolumeValue?.textContent).toBe('—')
    // 52W H/L must be em-dashes when they look like the placeholder.
    expect(within(panel).getByText('52W High').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('52W Low').nextElementSibling?.textContent).toBe('—')
  })

  it('renders real fallback numbers verbatim — no false em-dashes on live data', () => {
    activeStock = {
      ...activeStock,
      change24h: 1.3,
      volume24h: 62_000_000,
      marketCap: 3_340_000_000_000,
      peRatio: 33.8,
      eps: 6.46,
      dividendYield: 0.44,
      avgVolume: 58_000_000,
      high52w: 237.49,
      low52w: 164.08,
    }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const panel = screen.getByTestId('ticker-key-statistics')

    expect(within(panel).getByText('P/E Ratio').nextElementSibling?.textContent).toBe('33.8x')
    expect(within(panel).getByText('EPS').nextElementSibling?.textContent).toBe('$6.46')
    expect(within(panel).getByText('Avg Volume').nextElementSibling?.textContent).toBe('58,000,000')
    expect(within(panel).getByText('52W High').nextElementSibling?.textContent).toBe('$237.49')
    expect(within(panel).getByText('52W Low').nextElementSibling?.textContent).toBe('$164.08')
  })
})
