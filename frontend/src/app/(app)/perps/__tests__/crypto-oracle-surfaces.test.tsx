/**
 * Task 0037 — perps page crypto-oracle surfacing.
 *
 * Asserts the page-level integration: when `useCryptoRailHealth`
 * reports the crypto rail offline, the StalePriceBanner mounts above
 * the pair selector. The CryptoOracleStatusBadge always mounts inside
 * the pair-info card. When the rail recovers to "live", the banner
 * disappears but the badge stays.
 *
 * The PairInfoBar em-dash gating is locked down at the unit layer by
 * the FALLBACK_PAIRS shape test — every quantitative field is zero (or
 * markPrice for H/L), which is exactly the condition the bar guards on.
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

describe('PerpsPage — crypto oracle surfaces (task 0037)', () => {
  beforeEach(() => {
    railHealthMock.mockReset()
  })

  it('mounts the crypto StalePriceBanner when the rail is offline', () => {
    railHealthMock.mockReturnValue({ health: 'offline', ageMs: null, isLoading: false })

    render(<TestWrapper><PerpsPage /></TestWrapper>)

    const banner = screen.getByTestId('stale-price-banner')
    expect(banner.textContent).toMatch(/Crypto oracle offline/i)
  })

  it('mounts the crypto StalePriceBanner when the rail is degraded', () => {
    railHealthMock.mockReturnValue({ health: 'degraded', ageMs: 120_000, isLoading: false })

    render(<TestWrapper><PerpsPage /></TestWrapper>)

    expect(screen.getByTestId('stale-price-banner')).toBeInTheDocument()
  })

  it('hides the banner when the rail is live (badge still shows)', () => {
    railHealthMock.mockReturnValue({ health: 'live', ageMs: 3_000, isLoading: false })

    render(<TestWrapper><PerpsPage /></TestWrapper>)

    expect(screen.queryByTestId('stale-price-banner')).not.toBeInTheDocument()
    const badge = screen.getByTestId('crypto-oracle-status-badge')
    expect(badge.getAttribute('data-status')).toBe('live')
  })

  it('renders em-dashes for 24h H / 24h L / Vol / Funding / OI when the rail has nothing', () => {
    railHealthMock.mockReturnValue({ health: 'offline', ageMs: null, isLoading: false })

    const { container } = render(<TestWrapper><PerpsPage /></TestWrapper>)

    const labels = ['24h H', '24h L', 'Vol', 'Funding', 'OI']
    for (const label of labels) {
      const cell = container.querySelector(`[data-pair-info-cell="${label}"]`)
      expect(cell, `${label} cell present`).not.toBeNull()
      expect(cell!.textContent, `${label} renders em-dash`).toMatch(/—/)
    }
  })

  it('does NOT mount the banner while the crypto rail health is still loading', () => {
    railHealthMock.mockReturnValue({ health: 'offline', ageMs: null, isLoading: true })

    render(<TestWrapper><PerpsPage /></TestWrapper>)

    expect(screen.queryByTestId('stale-price-banner')).not.toBeInTheDocument()
  })
})
