/**
 * Task 0063 — /perps trading chart must carry the same
 * "Demo chart · candles are illustrative" honesty overlay that
 * /stocks/[ticker] has shipped since task 0043. The chart data
 * source on /perps is `getChartData()` — synthetic, hash-seeded
 * OHLC — so the overlay must be present regardless of rail
 * health until a real OHLC pipe lands.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/perps',
}))

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => React.ReactNode }) =>
    <>{children({ openConnectModal: () => undefined })}</>,
  },
}))

vi.mock('wagmi', async () => {
  const actual = await vi.importActual<typeof import('wagmi')>('wagmi')
  return {
    ...actual,
    useAccount: () => ({ address: undefined, isConnected: false }),
    useReadContract: () => ({ data: undefined, isLoading: false }),
    useReadContracts: () => ({ data: undefined, isLoading: false }),
    useWriteContract: () => ({ writeContractAsync: vi.fn(), isPending: false }),
  }
})

const fallbackPair = {
  marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
  markPrice: 84250, indexPrice: 84250,
  change24h: 0, volume24h: 0, fundingRate: 0,
  nextFundingTime: Date.now() + 4 * 3600000,
  openInterest: 0, maxLeverage: 100,
  high24h: 84250, low24h: 84250,
}

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: () => ({ pairs: [fallbackPair], isLoading: false }),
  useOnChainAccountSummary: () => ({
    summary: { equity: 0, usedMargin: 0, availableMargin: 0, marginRatio: 0, leverage: 0 },
    isLoading: false,
  }),
}))

vi.mock('@/lib/usePerps', () => ({
  useOpenPosition: () => ({ openPosition: vi.fn(), phase: 'idle', error: null }),
}))

vi.mock('@/lib/useSymbolSyncGuard', () => ({
  useSymbolSyncGuard: () => ({ allowRiskIncrease: true, reason: null }),
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => ({ isReady: false }),
}))

const railHealthMock = vi.fn()
vi.mock('@/lib/useCryptoRailHealth', () => ({
  useCryptoRailHealth: () => railHealthMock(),
}))

import PerpsPage from '../page'

describe('PerpsPage — chart demo overlay (task 0063)', () => {
  beforeEach(() => {
    railHealthMock.mockReset()
  })

  it('renders the "Demo chart · candles are illustrative" pill on the chart panel', () => {
    railHealthMock.mockReturnValue({ health: 'offline', ageMs: null, isLoading: false })
    render(<TestWrapper><PerpsPage /></TestWrapper>)
    expect(screen.getByText(/Demo chart · candles are illustrative/i)).toBeInTheDocument()
  })

  it('keeps the overlay mounted even when the rail reports live (chart data source is still synthetic)', () => {
    railHealthMock.mockReturnValue({ health: 'live', ageMs: 3_000, isLoading: false })
    render(<TestWrapper><PerpsPage /></TestWrapper>)
    expect(screen.getByText(/Demo chart · candles are illustrative/i)).toBeInTheDocument()
  })

  it('exposes the illustrative-chart aria-label on the chart container', () => {
    railHealthMock.mockReturnValue({ health: 'offline', ageMs: null, isLoading: false })
    const { container } = render(<TestWrapper><PerpsPage /></TestWrapper>)
    const labelled = container.querySelector('[aria-label*="illustrative chart"]')
    expect(labelled).not.toBeNull()
    expect(labelled!.getAttribute('aria-label')).toMatch(/BTC-USD illustrative chart/i)
  })
})
