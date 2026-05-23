import { describe, it, expect, vi } from 'vitest'
import type React from 'react'
import { render, screen } from '@testing-library/react'

// Drive wallet state per test via a mutable object so we can simulate
// disconnected and connected-on-devnet states.
const walletState: {
  isConnected: boolean
  chainId: number | undefined
} = { isConnected: false, chainId: undefined }

vi.mock('wagmi', () => ({
  useAccount: () => walletState,
}))

// All on-chain hooks return empty so the test only exercises the page's
// summary-card and section gating logic.
vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainHoldings: () => ({ holdings: [], isLoading: false }),
}))

vi.mock('@/lib/useOnChainPredict', () => ({
  useOnChainPredictPositions: () => ({ positions: [], isLoading: false }),
  useOnChainPredictSummary: () => ({
    currentValue: 0,
    unrealizedPnl: 0,
  }),
  useOnChainMarkets: () => ({ markets: [], isLoading: false }),
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPositions: () => ({ positions: [], isLoading: false }),
  useOnChainAccountSummary: () => ({
    summary: {
      equity: 0,
      usedMargin: 0,
      availableMargin: 0,
      marginRatio: 0,
      leverage: 0,
    },
    isLoading: false,
  }),
}))

vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: () => ({ sources: {}, prices: {} }),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: () => ({ status: null, isLoading: false }),
}))

// Heavy children that rely on wagmi providers — replace with stubs so we
// only exercise the PortfolioPage gating logic in this test.
vi.mock('@/components/PortfolioOnChain', () => ({
  PortfolioOnChain: () => null,
}))

vi.mock('@/components/PortfolioPriceStrip', () => ({
  PortfolioPriceStrip: () => null,
}))

vi.mock('@/components/ConnectWalletBanner', () => ({
  ConnectWalletBanner: () => null,
}))

vi.mock('@/components/ConnectWalletEmptyState', () => ({
  ConnectWalletEmptyState: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import PortfolioPage from '../page'

describe('PortfolioPage — disconnected wallet (task 0007d-0016)', () => {
  it('renders dash placeholders for the three summary cards when not connected', () => {
    walletState.isConnected = false
    walletState.chainId = undefined

    render(<PortfolioPage />)

    expect(screen.getByTestId('portfolio-summary-disabled')).toBeInTheDocument()
    expect(screen.getByTestId('portfolio-summary-totalValue').textContent).toBe('—')
    expect(screen.getByTestId('portfolio-summary-totalPnl').textContent).toBe('—')
    expect(screen.getByTestId('portfolio-summary-totalPositions').textContent).toBe('—')
  })

  it('shows lend + yield empty states when not connected', () => {
    walletState.isConnected = false
    walletState.chainId = undefined

    render(<PortfolioPage />)

    expect(screen.getByTestId('lend-empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('yield-empty-state')).toBeInTheDocument()
    // The Net Lending Value summary line must NOT render alongside an empty state.
    expect(screen.queryByText('Net Lending Value')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Yield Earned')).not.toBeInTheDocument()
  })

  it('does not advertise any mock dollar values for a disconnected wallet', () => {
    walletState.isConnected = false
    walletState.chainId = undefined

    const { container } = render(<PortfolioPage />)
    const text = container.textContent || ''

    // Specific mock numbers from the previous MOCK_SUPPLIES / MOCK_VAULTS:
    // 26K total value, +725.25 yield, 7 positions count, 6,861.50 net.
    expect(text).not.toContain('$26K')
    expect(text).not.toContain('$26,861')
    expect(text).not.toContain('$6,861.50')
    expect(text).not.toContain('+$725.25')
    expect(text).not.toContain('Active Positions: 7')
  })

  it('reverts to numeric summary cards once connected to the canonical devnet chain', async () => {
    walletState.isConnected = true
    walletState.chainId = 42069

    render(<PortfolioPage />)

    expect(screen.getByTestId('portfolio-summary')).toBeInTheDocument()
    expect(screen.queryByTestId('portfolio-summary-disabled')).not.toBeInTheDocument()
    expect(screen.getByTestId('portfolio-summary-totalValue').textContent).toBe('$0')
    expect(screen.getByTestId('portfolio-summary-totalPositions').textContent).toBe('0')
  })

  it('treats a wrong-chain wallet the same as disconnected for the summary cards', () => {
    walletState.isConnected = true
    walletState.chainId = 1

    render(<PortfolioPage />)

    expect(screen.getByTestId('portfolio-summary-disabled')).toBeInTheDocument()
    expect(screen.getByTestId('portfolio-summary-totalValue').textContent).toBe('—')
  })
})
