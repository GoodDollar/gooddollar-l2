/**
 * Task 0054 — /portfolio fabricates totals and positions for a disconnected wallet.
 *
 * With no wallet connected (or connected to the wrong chain), the page must NOT
 * render the fabricated $26K total, +$725.25 P&L, 7 Active Positions, or any
 * GoodLend SUPPLIED/BORROWED rows / Net Lending Value / Total Yield Earned that
 * come from the mock GoodLend + GoodYield hooks. Mirrors the empty-state
 * treatment that Stocks/Predictions/Perps already use on the same page.
 *
 * Connected-on-devnet case: the existing mock-driven demo numbers MUST still
 * render so we do not regress the connected demo experience.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

// ─── wagmi: drive wallet state per test via a mutable object ─────────────────

const walletState: {
  address: `0x${string}` | undefined
  chainId: number | undefined
  isConnected: boolean
} = { address: undefined, chainId: undefined, isConnected: false }

vi.mock('wagmi', () => ({
  useAccount: () => walletState,
  useReadContract: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useReadContracts: vi
    .fn()
    .mockReturnValue({ data: undefined, isLoading: false, isError: false }),
}))

// ─── On-chain hooks: return empty arrays (mirrors real disconnected behavior) ─

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainHoldings: () => ({ holdings: [], isLoading: false }),
}))

vi.mock('@/lib/useOnChainPredict', () => ({
  useOnChainPredictPositions: () => ({ positions: [], resolved: [], isLoading: false }),
  useOnChainPredictSummary: () => ({
    totalInvested: 0,
    currentValue: 0,
    unrealizedPnl: 0,
    totalPositions: 0,
  }),
  useOnChainMarkets: () => ({ markets: [], isLoading: false, isLive: false }),
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPositions: () => ({ positions: [], isLoading: false }),
  useOnChainAccountSummary: () => ({
    summary: {
      balance: 0,
      equity: 0,
      unrealizedPnl: 0,
      marginUsed: 0,
      availableMargin: 0,
      marginRatio: 0,
    },
    isLoading: false,
  }),
}))

// ConnectWalletBanner uses RainbowKit's ConnectButton.Custom render-prop.
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: {
        openConnectModal: () => void
        openChainModal: () => void
      }) => React.ReactNode
    }) => children({ openConnectModal: () => {}, openChainModal: () => {} }),
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// PortfolioOnChain is rendered conditionally inside the page but reads its own
// wagmi hook to decide whether to render. Stub it as a no-op so we don't have
// to mock its entire dependency graph (it has its own tests).
vi.mock('@/components/PortfolioOnChain', () => ({
  PortfolioOnChain: () => null,
}))

import PortfolioPage from '../page'

const DEVNET = 42069 as const
const MOCK_ADDR = '0x1234567890123456789012345678901234567890' as `0x${string}`

describe('/portfolio honesty when wallet is disconnected', () => {
  beforeEach(() => {
    walletState.address = undefined
    walletState.chainId = undefined
    walletState.isConnected = false
  })

  it('does not render the fabricated $26K Total Value tile', () => {
    render(<PortfolioPage />)
    expect(screen.queryByText('$26K')).toBeNull()
  })

  it('does not render the fabricated +$725.25 Unrealized P&L', () => {
    render(<PortfolioPage />)
    expect(screen.queryByText(/\+\$725\.25/)).toBeNull()
  })

  it('does not render "7" as the Active Positions count', () => {
    render(<PortfolioPage />)
    // Find the "Active Positions" label and assert the sibling value cell is
    // an em-dash, not "7".
    const label = screen.getByText('Active Positions')
    const card = label.parentElement!
    expect(within(card).queryByText('7')).toBeNull()
    expect(within(card).getByText('—')).toBeInTheDocument()
  })

  it('renders em-dash on every summary tile (Total Value / P&L / Active Positions)', () => {
    render(<PortfolioPage />)
    for (const label of ['Total Value', 'Unrealized P&L', 'Active Positions']) {
      const el = screen.getByText(label)
      const card = el.parentElement!
      expect(within(card).getByText('—')).toBeInTheDocument()
    }
  })

  it('does not paint a positive Unrealized P&L in green when disconnected', () => {
    render(<PortfolioPage />)
    const label = screen.getByText('Unrealized P&L')
    const card = label.parentElement!
    const dash = within(card).getByText('—')
    // The em-dash must NOT carry the fabricated-positive green color.
    expect(dash.className).not.toMatch(/text-green-400/)
  })

  it('does not render any fabricated GoodLend supplied/borrowed rows', () => {
    render(<PortfolioPage />)
    expect(screen.queryByText('gAAPL')).toBeNull()
    expect(screen.queryByText('gTSLA')).toBeNull()
    // "G$" appears in microcopy elsewhere; scope the assertion to the SUPPLIED
    // section by looking for the "supplied" amount string from MOCK_SUPPLIES.
    expect(screen.queryByText(/5,000 supplied/)).toBeNull()
    expect(screen.queryByText(/2,000 borrowed/)).toBeNull()
    expect(screen.queryByText(/Net Lending Value/i)).toBeNull()
    expect(screen.queryByText(/\$6,861\.50/)).toBeNull()
  })

  it('renders the GoodLend empty state', () => {
    render(<PortfolioPage />)
    expect(screen.getByText('No lending positions')).toBeInTheDocument()
  })

  it('does not render fabricated GoodYield vaults or Total Yield Earned', () => {
    render(<PortfolioPage />)
    expect(screen.queryByText('GoodStocks LP')).toBeNull()
    expect(screen.queryByText('Stable Yield')).toBeNull()
    expect(screen.queryByText('Stock Index')).toBeNull()
    expect(screen.queryByText(/Total Yield Earned/i)).toBeNull()
  })

  it('renders the GoodYield empty state', () => {
    render(<PortfolioPage />)
    expect(screen.getByText('No yield positions')).toBeInTheDocument()
  })
})

describe('/portfolio honesty when connected to wrong chain', () => {
  beforeEach(() => {
    walletState.address = MOCK_ADDR
    walletState.chainId = 1 // mainnet, not the devnet
    walletState.isConnected = true
  })

  it('treats wrong-chain the same as disconnected for summary tiles', () => {
    render(<PortfolioPage />)
    const label = screen.getByText('Total Value')
    expect(within(label.parentElement!).getByText('—')).toBeInTheDocument()
  })

  it('treats wrong-chain the same as disconnected for GoodLend', () => {
    render(<PortfolioPage />)
    expect(screen.getByText('No lending positions')).toBeInTheDocument()
    expect(screen.queryByText(/Net Lending Value/i)).toBeNull()
  })
})

describe('/portfolio when wallet is connected to devnet — no regression', () => {
  beforeEach(() => {
    walletState.address = MOCK_ADDR
    walletState.chainId = DEVNET
    walletState.isConnected = true
  })

  it('renders the demo mock GoodLend rows (gAAPL, gTSLA) when live', () => {
    render(<PortfolioPage />)
    expect(screen.getByText('gAAPL')).toBeInTheDocument()
    expect(screen.getByText('gTSLA')).toBeInTheDocument()
  })

  it('renders the fabricated Net Lending Value $6,861.50 when live (demo state)', () => {
    render(<PortfolioPage />)
    expect(screen.getByText(/Net Lending Value/i)).toBeInTheDocument()
    expect(screen.getByText('$6,861.50')).toBeInTheDocument()
  })

  it('renders the Total Value $26K tile when live (demo state)', () => {
    render(<PortfolioPage />)
    expect(screen.getByText('$26K')).toBeInTheDocument()
  })

  it('renders the +$725.25 unrealized P&L when live (demo state)', () => {
    render(<PortfolioPage />)
    // Appears twice in the live demo (P&L tile + Total Yield Earned footer).
    const matches = screen.getAllByText(/\+\$725\.25/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders "7" as Active Positions when live (demo state)', () => {
    render(<PortfolioPage />)
    const label = screen.getByText('Active Positions')
    expect(within(label.parentElement!).getByText('7')).toBeInTheDocument()
  })
})
