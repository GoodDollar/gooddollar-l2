import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: () => ({ pairs: [], isLoading: false }),
  useOnChainPositions: () => ({ positions: [], isLoading: false }),
  useOnChainAccountSummary: () => ({
    summary: { equity: 0, usedMargin: 0, availableMargin: 0, marginRatio: 0, leverage: 0 },
    isLoading: false,
  }),
}))

vi.mock('@/lib/usePerpsHistory', () => ({
  useTradeHistory: () => ({ trades: [], isLoading: false }),
  useFundingPayments: () => ({ funding: [], isLoading: false }),
}))

vi.mock('@/lib/usePerps', () => ({
  useClosePosition: () => ({ closePosition: vi.fn(), phase: 'idle', error: null }),
}))

vi.mock('@/components/ConnectWalletEmptyState', () => ({
  ConnectWalletEmptyState: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/InfoBanner', () => ({
  InfoBanner: () => null,
}))

import PerpsPortfolioPage from '../page'

describe('PerpsPortfolioPage — JSX ternary rendering (task 0004)', () => {
  it('does NOT render raw JavaScript source code as visible text', () => {
    const { container } = render(
      <TestWrapper><PerpsPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).not.toContain('positions.length')
    expect(text).not.toContain('orders.length')
    expect(text).not.toContain('trades.length')
    expect(text).not.toContain('funding.length')
    expect(text).not.toContain('=== 0 ?')
  })

  it('shows empty state messages when arrays are empty', () => {
    const { container } = render(
      <TestWrapper><PerpsPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('No open positions')
  })

  it('keeps the positions table structure in empty state', () => {
    render(
      <TestWrapper><PerpsPortfolioPage /></TestWrapper>
    )

    expect(screen.getByRole('columnheader', { name: 'Pair' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Side' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'P&L' })).toBeInTheDocument()
  })
})
