/**
 * Task 0038 — `/stocks/[ticker]` Key Statistics, Analysis, and the
 * Mark/24h H/24h L/Vol price-strip must not reprint `FALLBACK_STOCKS`
 * fundamentals (P/E, EPS, market cap, 52W high/low, avg vol, peer 24h
 * percentages, trend summary) when the on-chain stocks oracle is
 * offline (`useOnChainStocks().isLive === false`).
 *
 * Only the headline `Mark` price keeps rendering (with its existing
 * fallback pill / source badge). Every derived value collapses to an
 * em-dash and the Peer Compare + Trend Summary sub-panels switch to
 * a "populates when the oracle is reachable" empty state.
 *
 * Live-path regression is locked in by `key-statistics-no-zero-leak`.
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

const fallbackAAPL = {
  ticker: 'AAPL',
  name: 'sAAPL',
  displayName: 'Apple Inc.',
  sector: 'Technology',
  description: 'Apple synthetic.',
  price: 218.27,
  change24h: 1.3,
  volume24h: 62_000_000,
  marketCap: 3_340_000_000_000,
  high52w: 237.49,
  low52w: 164.08,
  sparkline7d: [213, 214, 215, 216, 217, 218, 218.27],
  peRatio: 33.8,
  eps: 6.46,
  dividendYield: 0.44,
  avgVolume: 58_000_000,
}

const fallbackNVDA = { ...fallbackAAPL, ticker: 'NVDA', name: 'sNVDA', price: 104.75, change24h: 3.2, peRatio: 67.5 }
const fallbackMSFT = { ...fallbackAAPL, ticker: 'MSFT', name: 'sMSFT', price: 388.45, change24h: 0.9, peRatio: 36.9 }

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
  useOnChainStocks: () => ({
    stocks: [fallbackAAPL, fallbackNVDA, fallbackMSFT],
    isLive: false,
    isLoading: false,
  }),
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

describe('Ticker page — task 0038: no fabricated fundamentals when oracle is offline', () => {
  it('Key Statistics em-dashes every numeric cell (no $3340.00B, $237.49, 33.8x, $6.46, 0.44%, 58,000,000)', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const panel = screen.getByTestId('ticker-key-statistics')

    // None of the FALLBACK_STOCKS fundamentals leak through.
    expect(panel.textContent ?? '').not.toMatch(/\$3340\.00B/)
    expect(panel.textContent ?? '').not.toMatch(/\$237\.49/)
    expect(panel.textContent ?? '').not.toMatch(/\$164\.08/)
    expect(panel.textContent ?? '').not.toMatch(/33\.8x/)
    expect(panel.textContent ?? '').not.toMatch(/\$6\.46/)
    expect(panel.textContent ?? '').not.toMatch(/0\.44%/)
    expect(panel.textContent ?? '').not.toMatch(/58,000,000/)
    expect(panel.textContent ?? '').not.toMatch(/\$62\.0+M/)
    expect(panel.textContent ?? '').not.toMatch(/\+1\.30%/)

    // Specific cells render em-dash.
    expect(within(panel).getByText('Market Cap').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('24h Volume').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('52W High').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('52W Low').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('24h Change').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('P/E Ratio').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('EPS').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('Dividend Yield').nextElementSibling?.textContent).toBe('—')
    expect(within(panel).getByText('Avg Volume').nextElementSibling?.textContent).toBe('—')
    // Sector is static metadata — stays.
    expect(within(panel).getByText('Sector').nextElementSibling?.textContent).toBe('Technology')

    // "Source: feed pending" caption is present.
    expect(panel.textContent ?? '').toMatch(/feed pending/i)
  })

  it('Mark/24h H/24h L/Vol strip: never shows 24h H == Mark, dashes the derived cells', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)
    const strip = screen.getByTestId('stock-stats-bar')
    // Vol cell → em-dash (not $62.0M)
    expect(strip.textContent ?? '').not.toMatch(/\$62\.0+M/)
    // 24h % cell → em-dash (not +1.30%)
    expect(strip.textContent ?? '').not.toMatch(/\+1\.30%/)
    expect(strip.textContent ?? '').not.toMatch(/▲ \+1\.30%/)

    const labels = ['24h', '24h H', '24h L', 'Vol']
    for (const label of labels) {
      const value = within(strip).getByText(label).nextElementSibling?.textContent
      expect(value).toBe('—')
    }
    // Mark cell still renders the price.
    expect(within(strip).getByText('Mark').nextElementSibling?.textContent).toMatch(/\$218\.27/)
  })

  it('Analysis card replaces tiles with em-dashes and Peer Compare / Trend Summary with empty-state copy', () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    // Analysis tile em-dashes.
    expect(screen.getByTestId('analysis-pe').textContent).toMatch(/—/)
    expect(screen.getByTestId('analysis-eps').textContent).toMatch(/—/)
    expect(screen.getByTestId('analysis-avg-vol').textContent).toMatch(/—/)
    expect(screen.getByTestId('analysis-pe').textContent ?? '').not.toMatch(/33\.8x/)

    // No peer percentages from FALLBACK_STOCKS literals.
    const body = document.body.textContent ?? ''
    expect(body).not.toMatch(/NVDA[^\n]*\+3\.20%/)
    expect(body).not.toMatch(/MSFT[^\n]*\+0\.90%/)

    // Peer Compare / Trend Summary show empty-state copy.
    expect(body).toMatch(/Peer comparison populates when the stocks oracle is reachable/i)
    expect(body).toMatch(/Trend summary populates when the on-chain price history is available/i)
  })
})
