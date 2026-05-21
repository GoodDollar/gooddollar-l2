import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let currentParams: Record<string, string | undefined> = {}
let walletConnected = false
let oracleGuardState: { health: 'live' | 'degraded' | 'offline'; reason: string | null; isLoading: boolean } = {
  health: 'live',
  reason: null,
  isLoading: false,
}

const stock = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  price: 190,
  change24h: 1.2,
  marketCap: 1000000000,
  volume24h: 1000000,
  high52w: 210,
  low52w: 120,
  sparkline7d: [1, 2, 3, 4, 5],
  peRatio: 29.4,
  eps: 6.4,
  dividendYield: 0.52,
  avgVolume: 850000,
}

vi.mock('next/navigation', () => ({
  useParams: () => currentParams,
  useRouter: () => ({ push: vi.fn() }),
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
  OracleStatusBadge: () => <div data-testid="oracle-badge" />,
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

vi.mock('@/lib/useStocksOracleGuard', () => ({
  useStocksOracleGuard: () => oracleGuardState,
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ isConnected: walletConnected }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => React.ReactNode }) => (
      <>{children({ openConnectModal: () => {} })}</>
    ),
  },
}))

import StockDetailPage from '../page'

describe('StockDetailPage wallet gate + oracle guard', () => {
  beforeEach(() => {
    currentParams = { ticker: 'AAPL' }
    walletConnected = false
    oracleGuardState = { health: 'offline', reason: 'Quote stale.', isLoading: false }
  })

  it('keeps connect-wallet onboarding visible even when oracle trading guard is active', async () => {
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(await screen.findByRole('button', { name: /Connect Wallet to Trade/i })).toBeTruthy()
    expect(await screen.findByText(/Trading is temporarily limited due to oracle health/i)).toBeTruthy()
  })
})
