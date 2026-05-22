import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const routerPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}))
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123', isConnected: true }),
}))
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: { children: (p: Record<string, unknown>) => React.ReactNode }) => children({ openConnectModal: vi.fn() }) },
}))
vi.mock('@/lib/useStockHoldings', () => ({
  useStockHoldings: () => ({
    holdings: [
      { ticker: 'AAPL', shares: 10, avgCost: 150, currentPrice: 190 },
      { ticker: 'TSLA', shares: 5, avgCost: 200, currentPrice: 210 },
    ],
    totalValue: 2950,
    unrealizedPnl: 450,
    pnlPercent: 18,
    totalCollateral: 3000,
    totalRequired: 2000,
    healthRatio: 150,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))
vi.mock('@/lib/useStockTrades', () => ({
  useStockTrades: () => ({ trades: [], isLoading: false, isError: false, refetch: vi.fn() }),
}))
vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => true,
}))

import StocksPortfolioPage from '../page'

describe('HoldingRow tap affordance', () => {
  beforeEach(() => {
    routerPush.mockReset()
  })

  it('renders a trailing chevron icon in each holding row', () => {
    render(<StocksPortfolioPage />)
    const chevrons = screen.getAllByTestId('portfolio-holding-chevron')
    expect(chevrons).toHaveLength(2)
  })

  it('has role="link" and tabIndex=0 on holding rows', () => {
    render(<StocksPortfolioPage />)
    const rows = screen.getAllByRole('link', { name: /AAPL|TSLA/i })
    expect(rows.length).toBeGreaterThanOrEqual(2)
    for (const row of rows) {
      expect(row.tabIndex).toBe(0)
    }
  })

  it('navigates to stock detail on Enter key', () => {
    render(<StocksPortfolioPage />)
    const rows = screen.getAllByTestId(/^portfolio-holding-row-/)
    fireEvent.keyDown(rows[0], { key: 'Enter' })
    expect(routerPush).toHaveBeenCalledWith('/stocks/AAPL?from=portfolio')
  })

  it('navigates to stock detail on click', () => {
    render(<StocksPortfolioPage />)
    const rows = screen.getAllByTestId(/^portfolio-holding-row-/)
    fireEvent.click(rows[0])
    expect(routerPush).toHaveBeenCalledWith('/stocks/AAPL?from=portfolio')
  })

  it('shows active:bg press state class on rows', () => {
    render(<StocksPortfolioPage />)
    const rows = screen.getAllByTestId(/^portfolio-holding-row-/)
    expect(rows[0].className).toContain('active:bg-white')
  })
})
