import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import AgentDetailPage from '../agents/[address]/page'

// Mock next/navigation — the address is per-test mutable so we can cover
// invalid-input cases (non-hex, wrong length, empty, etc.). Default to a
// well-formed 0x-prefixed 20-byte hex address so the happy-path tests
// don't accidentally trip the invalid-address guard.
const VALID_ADDR = '0x' + 'a'.repeat(40)
let mockAddress: string | undefined = VALID_ADDR
vi.mock('next/navigation', () => ({
  useParams: () => ({ address: mockAddress }),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// Mock wagmi
vi.mock('wagmi', () => ({
  useReadContract: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useReadContracts: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useAccount: vi.fn().mockReturnValue({ address: undefined }),
}))

const MOCK_PROFILE = {
  name: 'DeltaNeutral',
  avatarURI: '',
  strategy: 'Delta-neutral hedging across perps and lending',
  owner: '0xOwner1234567890abcdef',
  registeredAt: 1711900000,
  active: true,
}

const MOCK_STATS = {
  totalTrades: 42,
  totalVolume: '1,234.5678',
  totalVolumeRaw: BigInt('1234567800000000000000'),
  totalFeesGenerated: '12.3456',
  totalFeesRaw: BigInt('12345600000000000000'),
  ubiContribution: '4.1148',
  ubiContributionRaw: BigInt('4114800000000000000'),
  totalPnL: '3.5',
  pnlPositive: true,
  lastActiveAt: 1711990000,
}

const MOCK_BREAKDOWN = [
  { protocol: 'perps' as const, trades: 20, volume: '800', volumeRaw: 0n, fees: '8.0', feesRaw: 0n },
  { protocol: 'lend' as const, trades: 15, volume: '300', volumeRaw: 0n, fees: '3.0', feesRaw: 0n },
  { protocol: 'swap' as const, trades: 7, volume: '134.5', volumeRaw: 0n, fees: '1.345', feesRaw: 0n },
]

// Mock useAgentDetail
vi.mock('@/lib/useAgentDetail', () => ({
  useAgentDetail: vi.fn().mockReturnValue({
    profile: null,
    stats: null,
    protocolBreakdown: [],
    isLoading: false,
    isValidAddr: true,
    allProtocols: ['swap', 'perps', 'predict', 'lend', 'stable', 'stocks', 'yield'],
  }),
}))

import { useAgentDetail } from '@/lib/useAgentDetail'
const mockUseAgentDetail = useAgentDetail as unknown as ReturnType<typeof vi.fn>

describe('AgentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddress = VALID_ADDR
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading state', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: null, stats: null, protocolBreakdown: [], isLoading: true, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Loading agent data…')).toBeDefined()
  })

  it('shows not found for unregistered agent', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: null, stats: null, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Agent Not Found')).toBeDefined()
  })

  it('renders agent profile header', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('DeltaNeutral')).toBeDefined()
    expect(screen.getByText('Active')).toBeDefined()
    expect(screen.getByText('Delta-neutral hedging across perps and lending')).toBeDefined()
  })

  it('renders stats grid', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('42')).toBeDefined()
    expect(screen.getByText('4.1148 ETH')).toBeDefined()
  })

  it('renders UBI breakdown section', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Fee & UBI Breakdown')).toBeDefined()
    expect(screen.getByText('→ UBI Pool (20%)')).toBeDefined()
  })

  it('renders protocol breakdown cards', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: MOCK_BREAKDOWN, isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Perpetuals')).toBeDefined()
    expect(screen.getByText('Lending')).toBeDefined()
    expect(screen.getByText('Swaps')).toBeDefined()
  })

  it('shows empty state when no protocol activity', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('No protocol activity recorded yet')).toBeDefined()
  })

  it('renders P&L with correct sign', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('+3.5 ETH')).toBeDefined()
    expect(screen.getByText('🟢 Profitable')).toBeDefined()
  })

  it('renders negative P&L', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE,
      stats: { ...MOCK_STATS, pnlPositive: false },
      protocolBreakdown: [],
      isLoading: false,
      isValidAddr: true,
      allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('-3.5 ETH')).toBeDefined()
    expect(screen.getByText('🔴 In the red')).toBeDefined()
  })

  it('has back link to leaderboard', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    const backLink = screen.getByText('← Leaderboard')
    expect(backLink.closest('a')?.getAttribute('href')).toBe('/agents')
  })

  it('renders explorer link', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: MOCK_PROFILE, stats: MOCK_STATS, protocolBreakdown: [], isLoading: false, isValidAddr: true, allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('View on Explorer →')).toBeDefined()
  })

  it('shows inactive badge for deactivated agents', () => {
    mockUseAgentDetail.mockReturnValue({
      profile: { ...MOCK_PROFILE, active: false },
      stats: MOCK_STATS,
      protocolBreakdown: [],
      isLoading: false,
      isValidAddr: true,
      allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Inactive')).toBeDefined()
  })

  // ─── Invalid-address & stuck-loading guards (task 0017) ────────────────────

  it('renders Agent Not Found immediately for a non-hex address (no spinner)', () => {
    mockAddress = 'nonexistent'
    mockUseAgentDetail.mockReturnValue({
      profile: null,
      stats: null,
      protocolBreakdown: [],
      isLoading: false,
      isValidAddr: false,
      allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Agent Not Found')).toBeDefined()
    expect(screen.queryByText('Loading agent data…')).toBeNull()
  })

  it('renders Agent Not Found immediately for an address with wrong length', () => {
    mockAddress = '0x1002aabbccdd' // 14 hex chars, not 40
    mockUseAgentDetail.mockReturnValue({
      profile: null,
      stats: null,
      protocolBreakdown: [],
      isLoading: false,
      isValidAddr: false,
      allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Agent Not Found')).toBeDefined()
  })

  it('renders Agent Not Found for an empty address param', () => {
    mockAddress = ''
    mockUseAgentDetail.mockReturnValue({
      profile: null,
      stats: null,
      protocolBreakdown: [],
      isLoading: false,
      isValidAddr: false,
      allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Agent Not Found')).toBeDefined()
  })

  it('falls back to Agent Not Found when fetch stays loading past the timeout', () => {
    vi.useFakeTimers()
    try {
      mockAddress = '0x' + 'a'.repeat(40)
      mockUseAgentDetail.mockReturnValue({
        profile: null,
        stats: null,
        protocolBreakdown: [],
        isLoading: true,
        isValidAddr: true,
        allProtocols: [],
      })
      render(<AgentDetailPage />)
      // Initially we should be in the loading state, not the not-found state.
      expect(screen.queryByText('Agent Not Found')).toBeNull()
      expect(screen.getByText('Loading agent data…')).toBeDefined()
      // After the 5s mount-only timer the page must drop the spinner and
      // render the not-found UI even if the hook is still "loading".
      act(() => {
        vi.advanceTimersByTime(6_000)
      })
      expect(screen.getByText('Agent Not Found')).toBeDefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('still shows spinner while loading is active and timeout has not fired', () => {
    mockAddress = '0x' + 'b'.repeat(40)
    mockUseAgentDetail.mockReturnValue({
      profile: null,
      stats: null,
      protocolBreakdown: [],
      isLoading: true,
      isValidAddr: true,
      allProtocols: [],
    })
    render(<AgentDetailPage />)
    expect(screen.getByText('Loading agent data…')).toBeDefined()
    expect(screen.queryByText('Agent Not Found')).toBeNull()
  })
})
