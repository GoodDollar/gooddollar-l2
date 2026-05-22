import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const accountState = {
  address: undefined as `0x${string}` | undefined,
  isConnected: false,
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

const openConnectModal = vi.fn()

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: { openConnectModal: () => void }) => React.ReactNode }) =>
      <>{children({ openConnectModal })}</>,
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

const tradesState = {
  trades: [] as unknown[],
  isLoading: false,
}

vi.mock('@/lib/useStockTrades', () => ({
  useStockTrades: () => tradesState,
}))

vi.mock('@/components/ConnectWalletEmptyState', () => ({
  ConnectWalletEmptyState: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/InfoBanner', () => ({
  InfoBanner: () => null,
}))

import StocksPortfolioPage from '../page'

describe('StocksPortfolioPage — disconnected guidance and collateral states', () => {
  beforeEach(() => {
    accountState.address = undefined
    accountState.isConnected = false
    holdingsState.isLoading = false
    tradesState.isLoading = false
    openConnectModal.mockReset()
    window.sessionStorage.clear()
  })

  it('shows a guided disconnected portfolio setup card instead of metric placeholders', () => {
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

    expect(screen.getByText('Start your stock portfolio')).toBeInTheDocument()
    expect(screen.getByText('Connect your wallet to unlock portfolio value, collateral health, and UBI contribution tracking.')).toBeInTheDocument()
    expect(screen.getByText('Connect wallet')).toBeInTheDocument()
    expect(screen.getByText('Review live metrics')).toBeInTheDocument()
    expect(screen.getByText('Track impact and holdings')).toBeInTheDocument()
    expect(screen.getByText('Market benchmark preview')).toBeInTheDocument()
    expect(screen.getByText('Portfolio health preview')).toBeInTheDocument()
    expect(screen.getByText('Today\'s synthetic movers (read-only preview)')).toBeInTheDocument()
    expect(screen.queryByText('Total Value')).not.toBeInTheDocument()
    expect(screen.queryByText('0% — Critical')).not.toBeInTheDocument()
  })

  it('shows an actionable in-context connect CTA for disconnected users', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByRole('button', { name: 'Connect Wallet to Unlock Portfolio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect with In-browser Wallet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue in Read-only Mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More connection options' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try Another Connector' })).not.toBeInTheDocument()
    expect(screen.getByTestId('stocks-onboarding-checklist')).toBeInTheDocument()
  })

  it('uses widened desktop shell container for balanced portfolio canvas', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    const shell = screen.getByTestId('stocks-portfolio-shell')
    expect(shell.className).toContain('max-w-6xl')
    expect(shell.className).toContain('2xl:max-w-[84rem]')
  })

  it('opens connect modal from primary and fallback connect CTAs', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet to Unlock Portfolio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect with In-browser Wallet' }))

    expect(openConnectModal).toHaveBeenCalledTimes(2)
  })

  it('suppresses duplicate fallback rail once markets exploration is already recorded', () => {
    accountState.address = undefined
    accountState.isConnected = false
    window.sessionStorage.setItem(
      'gd-stocks-onboarding-progress',
      JSON.stringify({
        exploredMarkets: true,
        openedStockDetail: false,
        connectIntent: false,
      }),
    )

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.queryByText('Connection fallback options')).not.toBeInTheDocument()
    expect(screen.getByTestId('stocks-onboarding-checklist')).toBeInTheDocument()
  })

  it('hides impact loading placeholders when in guided disconnected mode', () => {
    accountState.address = undefined
    accountState.isConnected = false

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.queryByText('Loading impact insights…')).not.toBeInTheDocument()
    expect(screen.getByText('Connect wallet to unlock your holdings timeline')).toBeInTheDocument()
  })

  it('prioritizes disconnected holdings messaging over transient loading text', () => {
    accountState.address = undefined
    accountState.isConnected = false
    holdingsState.isLoading = true
    tradesState.isLoading = true

    render(
      <TestWrapper><StocksPortfolioPage /></TestWrapper>
    )

    expect(screen.getByText('Connect wallet to unlock your holdings timeline')).toBeInTheDocument()
    expect(screen.queryByText('Loading positions…')).not.toBeInTheDocument()
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
    expect(text).toContain('Start your stock portfolio')
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
    expect(screen.getByRole('heading', { name: 'Performance Stats' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top Contributors' })).toBeInTheDocument()
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)

    fireEvent.click(screen.getAllByRole('button', { name: '1M' })[0]!)

    expect(screen.getByRole('img', { name: /Portfolio P&L chart 1M/i })).toBeInTheDocument()
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
