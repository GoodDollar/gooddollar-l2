import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const accountState = {
  address: undefined as `0x${string}` | undefined,
  isConnected: false,
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/stocks/portfolio',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => accountState,
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: { openConnectModal: () => void }) => React.ReactNode }) =>
      <>{children({ openConnectModal: vi.fn() })}</>,
  },
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
  beforeEach(() => {
    accountState.address = undefined
    accountState.isConnected = false
  })

  it('shows neutral disconnected summary placeholders instead of active $0 metrics', () => {
    accountState.address = undefined
    accountState.isConnected = false
    holdingsState.holdings = []
    holdingsState.totalValue = 0
    holdingsState.unrealizedPnl = 0
    holdingsState.pnlPercent = 0
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 0
    holdingsState.healthRatio = 0

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('Unrealized P&L')).toBeInTheDocument()
    expect(screen.getByText('UBI Contributed')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Connect wallet to view collateral health')).toBeInTheDocument()
    expect(screen.queryByText('0% — Critical')).not.toBeInTheDocument()
  })

  it('shows an actionable in-context connect CTA for disconnected users', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByRole('button', { name: 'Connect Wallet to View UBI Impact' })).toBeInTheDocument()
  })

  it('shows deferred impact section loading placeholders on first paint', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByText('Loading impact insights…')).toBeInTheDocument()
  })

  it('prioritizes a single onboarding path for disconnected first-time users', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByRole('heading', { name: /Get started in 3 steps/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Wallet to Start Portfolio' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Portfolio Diagnostics' })).not.toBeInTheDocument()
  })

  it('does NOT show "Critical" when collateral exists but required collateral is zero', () => {
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
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
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
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
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
    holdingsState.holdings = []
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 500
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('Not active yet')
    expect(text).not.toMatch(/Critical/)
    expect(text).toContain('Collateral health appears after you open a leveraged position')
    expect(text).not.toContain('$0.00 / $500.00 required')
  })

  it('keeps neutral collateral status for ghost holdings with zero shares', () => {
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
    holdingsState.holdings = [{
      ticker: 'AAPL',
      shares: 0,
      avgCost: 0,
      currentPrice: 200,
      collateralDeposited: 0,
      collateralRequired: 0,
    }]
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 500
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('Not active yet')
    expect(text).not.toMatch(/Critical/)
    expect(text).toContain('Collateral health appears after you open a leveraged position')
    expect(text).not.toContain('$0.00 / $500.00 required')
  })

  it('shows a neutral dash for collateral health when ratio is 0 with no collateral', () => {
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
    holdingsState.holdings = []
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

  it('still shows risk severity when positions exist and required collateral is non-zero', () => {
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
    holdingsState.holdings = [{
      ticker: 'AAPL',
      shares: 1,
      avgCost: 100,
      currentPrice: 100,
      collateralDeposited: 0,
      collateralRequired: 100,
    }]
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 100
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('0% — Critical')
    expect(text).toContain('$0.00 / $100.00 required')
  })

  it('keeps disconnected neutral state when address exists but wallet is not connected', () => {
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = false
    holdingsState.holdings = [{
      ticker: 'AAPL',
      shares: 1,
      avgCost: 100,
      currentPrice: 100,
      collateralDeposited: 0,
      collateralRequired: 100,
    }]
    holdingsState.totalCollateral = 0
    holdingsState.totalRequired = 100
    holdingsState.healthRatio = 0

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )
    const text = container.textContent || ''
    expect(text).toContain('Connect wallet to view collateral health')
    expect(text).not.toContain('0% — Critical')
  })

  it('renders portfolio analytics blocks and supports range/allocation toggles', () => {
    accountState.address = '0x1111111111111111111111111111111111111111'
    accountState.isConnected = true
    holdingsState.holdings = [
      { ticker: 'AAPL', shares: 2, avgCost: 180, currentPrice: 200, collateralDeposited: 0, collateralRequired: 0 },
      { ticker: 'MSFT', shares: 1, avgCost: 350, currentPrice: 330, collateralDeposited: 0, collateralRequired: 0 },
    ]
    holdingsState.totalValue = 730
    holdingsState.unrealizedPnl = 10
    holdingsState.pnlPercent = 1.4

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByRole('heading', { name: 'Allocation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Performance Trend' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top Contributors' })).toBeInTheDocument()
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Shares' }))
    fireEvent.click(screen.getAllByRole('button', { name: '1M' })[0]!)

    expect(screen.getByRole('img', { name: /1M portfolio performance/i })).toBeInTheDocument()
  })

  it('reserves right/bottom safe area on stocks portfolio for floating feedback controls', () => {
    accountState.address = undefined
    accountState.isConnected = false

    const { container } = render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    const wrapper = container.querySelector('div.w-full.max-w-5xl.mx-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.className).toContain('pb-24')
    expect(wrapper?.className).toContain('md:pr-24')
  })
})
