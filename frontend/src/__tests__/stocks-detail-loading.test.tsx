/**
 * Task 0025 — Stocks detail page must show a loading skeleton (not "Stock Not
 * Found") while `useOnChainStocks().isLoading` is true.
 *
 * Repro: a known ticker like JPM is in KNOWN_TICKERS but NOT in
 * FALLBACK_STOCKS. While on-chain reads are still in flight, `stocks` falls
 * back to FALLBACK_STOCKS (no JPM) → without the loading guard, the page
 * renders "Stock Not Found" before the real data arrives.
 *
 * Acceptance criteria:
 *  1. `isLoading=true` + no matching stock → render a loading skeleton with
 *     `data-testid="stocks-detail-loading"`. DO NOT render "Stock Not Found".
 *  2. `isLoading=false` + no matching stock → render the existing "Stock
 *     Not Found" page (this is the intended terminal failure state).
 *  3. `isLoading=false` + a matching stock → render the full detail page,
 *     never the loading skeleton or "Stock Not Found".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

// ─── Mocks ────────────────────────────────────────────────────────────────
// Note: page.tsx pulls in MANY hooks/components transitively. We only care
// about the early-return branches here, so we mock aggressively to avoid
// rendering the heavy detail layout in jsdom.

const mockUseParams = vi.fn(() => ({ ticker: 'JPM' }))
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}))

const mockUseOnChainStocks = vi.fn(() => ({
  stocks: [],
  isLoading: true,
  isLive: false,
}))
vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => mockUseOnChainStocks(),
}))

// wagmi + rainbowkit pull in a lot of runtime; only WalletGatedTradeButton
// uses them and that lives inside the trade form (after the early return).
vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: false, address: undefined }),
  useReadContract: () => ({ data: undefined, isLoading: false }),
  useReadContracts: () => ({ data: undefined, isLoading: false }),
  useWriteContract: () => ({ writeContractAsync: vi.fn() }),
  useWaitForTransactionReceipt: () => ({ data: undefined, isLoading: false }),
  useChainId: () => 42220,
  useBalance: () => ({ data: undefined }),
}))
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: { children: any }) => children({ openConnectModal: () => {} }) },
}))

// useStockPosition is invoked unconditionally — return an empty position so
// the early-return branches still execute deterministically.
vi.mock('@/lib/useStocks', () => ({
  useStockPosition: () => ({ position: null, isLoading: false }),
  useMintSynthetic: () => ({ mint: vi.fn(), isPending: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/useStockNews', () => ({
  useStockNews: () => ({ items: [], isLoading: false, error: null }),
}))

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => true,
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => ({ isReady: true }),
}))

// Heavy presentational components that only render after the early return —
// safe to stub.
vi.mock('@/components/PriceChart', () => ({ PriceChart: () => null }))
vi.mock('@/components/OracleStatusBadge', () => ({ OracleStatusBadge: () => null }))
vi.mock('@/components/stocks/AnalystOutlookCard', () => ({ AnalystOutlookCard: () => null }))
vi.mock('@/components/stocks/NewsEventsPanel', () => ({ NewsEventsPanel: () => null }))
vi.mock('@/components/stocks/RelatedMoversPanel', () => ({ RelatedMoversPanel: () => null }))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Import AFTER mocks are declared.
import StockDetailPage from '@/app/(app)/stocks/[ticker]/page'

beforeEach(() => {
  cleanup()
  mockUseParams.mockReturnValue({ ticker: 'JPM' })
  mockUseOnChainStocks.mockReturnValue({ stocks: [], isLoading: true, isLive: false })
})

describe('StockDetailPage — loading vs not-found', () => {
  it('shows a loading skeleton while on-chain reads are pending (does NOT show "Stock Not Found")', () => {
    mockUseOnChainStocks.mockReturnValue({ stocks: [], isLoading: true, isLive: false })

    render(<StockDetailPage />)

    expect(screen.getByTestId('stocks-detail-loading')).toBeInTheDocument()
    expect(screen.queryByText(/Stock Not Found/i)).not.toBeInTheDocument()
  })

  it('shows "Stock Not Found" once loading completes and the ticker is still missing', () => {
    mockUseOnChainStocks.mockReturnValue({ stocks: [], isLoading: false, isLive: false })

    render(<StockDetailPage />)

    expect(screen.getByText(/Stock Not Found/i)).toBeInTheDocument()
    expect(screen.queryByTestId('stocks-detail-loading')).not.toBeInTheDocument()
  })

  it('renders the stock detail once a matching stock is found (no loading, no not-found)', () => {
    const jpm = {
      ticker: 'JPM',
      name: 'sJPM',
      sector: 'Finance',
      description: 'JPMorgan Chase — banking & financial services.',
      price: 200,
      change24h: 0.5,
      volume24h: 0,
      marketCap: 0,
      high52w: 230,
      low52w: 150,
      sparkline7d: [200, 200, 200, 200, 200, 200, 200],
      peRatio: 0,
      eps: 0,
      dividendYield: 0,
      avgVolume: 0,
    }
    mockUseOnChainStocks.mockReturnValue({ stocks: [jpm], isLoading: false, isLive: true })

    render(<StockDetailPage />)

    expect(screen.queryByText(/Stock Not Found/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('stocks-detail-loading')).not.toBeInTheDocument()
    // JPM ticker appears in the rendered detail header.
    expect(screen.getAllByText('JPM').length).toBeGreaterThan(0)
  })
})
