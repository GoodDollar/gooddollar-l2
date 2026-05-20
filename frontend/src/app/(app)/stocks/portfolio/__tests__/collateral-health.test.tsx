import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [], isLoading: false }),
}))

const holdingsState = {
  holdings: [] as unknown[],
  totalValue: 0,
  unrealizedPnl: 0,
  pnlPercent: 0,
  totalCollateral: 0,
  totalRequired: 0,
  healthRatio: 0,
  isLoading: false,
}

vi.mock('@/lib/useStockHoldings', () => ({
  useStockHoldings: () => holdingsState,
}))

vi.mock('@/lib/useStockTrades', () => ({
  useStockTrades: () => ({ trades: [], isLoading: false }),
}))

vi.mock('@/components/ConnectWalletEmptyState', () => ({
  ConnectWalletEmptyState: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/InfoBanner', () => ({
  InfoBanner: () => null,
}))

import StocksPortfolioPage from '../page'

describe('StocksPortfolioPage — CollateralHealth empty state (task 0005)', () => {
  it('does NOT show "Critical" when collateral exists but required collateral is zero', () => {
    holdingsState.totalCollateral = 250
    holdingsState.totalRequired = 0
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    const text = container.textContent || ''
    expect(text).not.toMatch(/Critical/)
  })

  it('does NOT show "Critical" when there are no positions', () => {
    holdingsState.holdings = []
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 0
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).not.toMatch(/Critical/)
  })

  it('keeps neutral collateral status when no holdings exist even if required collateral is stale/non-zero', () => {
    holdingsState.holdings = []
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 500
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('No open positions yet')
    expect(text).not.toMatch(/Critical/)
    expect(text).toContain('Collateral health will appear after your first trade')
    expect(text).not.toContain('$0.00 / $500.00 required')
  })

  it('shows a neutral dash for collateral health when ratio is 0 with no collateral', () => {
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 0
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('Collateral Health')
    expect(text).not.toMatch(/0%\s*[—–-]\s*Critical/)
  })
})
