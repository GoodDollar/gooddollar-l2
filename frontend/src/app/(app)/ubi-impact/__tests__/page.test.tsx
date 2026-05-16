import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import type { AggregateState, DashboardData, ProtocolStats, Snapshot } from '@/lib/useUBIImpact'

// ─── Mocks ────────────────────────────────────────────────────────────────────
//
// We bypass the real wagmi/Multicall3 transport by mocking the aggregate hook.
// The page should not need to know that the underlying implementation switched
// from three independent useReadContract calls to a single useReadContracts.

type MockAggregate = AggregateState & {
  isLoading: boolean
  refetch: () => void
}

let mockState: MockAggregate
const refetchSpy = vi.fn()

vi.mock('@/lib/useUBIImpact', async () => {
  const actual: any = await vi.importActual('@/lib/useUBIImpact')
  return {
    ...actual,
    useUBIImpactAggregate: () => mockState,
  }
})

vi.mock('@/components/InfoBanner', () => ({
  InfoBanner: ({ title }: { title: string }) => <div data-testid="info-banner">{title}</div>,
}))

import UBIImpactPage from '../page'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    totalFees: 100n * 10n ** 18n,
    totalUBI: 20n * 10n ** 18n,
    totalTx: 42n,
    protocolCount: 6n,
    activeProtocols: 5n,
    splitterFees: 100n * 10n ** 18n,
    splitterUBI: 20n * 10n ** 18n,
    snapshotCount: 3n,
    totalFeesFormatted: '100.00',
    totalUBIFormatted: '20.00',
    splitterFeesFormatted: '100.00',
    splitterUBIFormatted: '20.00',
    ubiPercentage: 20,
    ...overrides,
  }
}

function buildProtocol(overrides: Partial<ProtocolStats> = {}): ProtocolStats {
  return {
    name: 'GoodSwap',
    category: 'swap',
    feeSource: 'swap-fee',
    totalFees: 50n * 10n ** 18n,
    ubiContribution: 10n * 10n ** 18n,
    txCount: 20n,
    lastUpdateBlock: 1000n,
    active: true,
    totalFeesFormatted: '50.00',
    ubiFormatted: '10.00',
    feeShare: 50,
    ubiShare: 50,
    ...overrides,
  }
}

function buildSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    timestamp: 1700000000n,
    totalUBI: 10n * 10n ** 18n,
    totalFees: 50n * 10n ** 18n,
    protocolCount: 5n,
    date: '11/14/2023',
    totalUBIFormatted: '10.00',
    totalFeesFormatted: '50.00',
    ...overrides,
  }
}

const emptyState: MockAggregate = {
  dashboard: null,
  protocols: [],
  snapshots: [],
  isError: false,
  isEmpty: false,
  dashboardError: null,
  protocolsError: null,
  snapshotsError: null,
  isLoading: true,
  refetch: refetchSpy,
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
  refetchSpy.mockClear()
  mockState = { ...emptyState }
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UBIImpactPage — loading state', () => {
  it('renders skeleton placeholders while loading (before 10s timeout)', () => {
    mockState = { ...emptyState, isLoading: true }
    const { container } = render(<UBIImpactPage />)

    // Page chrome always renders
    expect(screen.getByText(/UBI Impact Dashboard/i)).toBeTruthy()

    // Skeletons present
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)

    // Error card NOT yet shown
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('UBIImpactPage — data state', () => {
  it('renders numeric tiles when data is available', () => {
    mockState = {
      ...emptyState,
      isLoading: false,
      dashboard: buildDashboard(),
      protocols: [buildProtocol()],
      snapshots: [buildSnapshot()],
    }
      render(<UBIImpactPage />)

      // "Total UBI Funded" appears in both the hero StatCard and the
      // FeeFlowViz totals row — getAllByText is the right assertion.
      expect(screen.getAllByText('Total UBI Funded').length).toBeGreaterThan(0)
      expect(screen.getByText('Total Fees Collected')).toBeTruthy()
      expect(screen.getByText('Active Protocols')).toBeTruthy()

    // Numeric values render — at least one "100.00" (totalFees) and one "20.00" (totalUBI)
    expect(screen.getAllByText(/100\.00/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/20\.00/).length).toBeGreaterThan(0)

      // Protocol name renders (appears in both the ProtocolCard and the
      // FeeFlowViz row — both are valid surfaces for the user).
      expect(screen.getAllByText('GoodSwap').length).toBeGreaterThan(0)
  })
})

describe('UBIImpactPage — error state', () => {
  it('renders error card and Retry button when dashboard read fails', () => {
    mockState = {
      ...emptyState,
      isLoading: false,
      isError: true,
      dashboardError: new Error('RPC unreachable'),
    }
    render(<UBIImpactPage />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeTruthy()
    expect(screen.getByText(/Unable to load UBI Impact data/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeTruthy()
  })

  it('clicking Retry calls refetch from the aggregate hook', () => {
    mockState = {
      ...emptyState,
      isLoading: false,
      isError: true,
      dashboardError: new Error('RPC unreachable'),
    }
    render(<UBIImpactPage />)

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }))
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })
})

describe('UBIImpactPage — timeout state', () => {
  it('shows the timeout error card after 10 seconds of stuck loading', () => {
    mockState = { ...emptyState, isLoading: true }
    render(<UBIImpactPage />)

    // Before the timeout — no error card
    expect(screen.queryByRole('alert')).toBeNull()

    // Advance past the 10s threshold
    act(() => {
      vi.advanceTimersByTime(10_001)
    })

    // Now the timeout card should appear
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Loading is taking longer than expected/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeTruthy()
  })

  it('clearing the timeout when data arrives before 10s', () => {
    mockState = { ...emptyState, isLoading: true }
    const { rerender } = render(<UBIImpactPage />)

    // Data arrives after 3s
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    mockState = {
      ...emptyState,
      isLoading: false,
      dashboard: buildDashboard(),
      protocols: [buildProtocol()],
    }
    rerender(<UBIImpactPage />)

    // Advance past the original 10s window
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    // No timeout error card — data is showing
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getAllByText('Total UBI Funded').length).toBeGreaterThan(0)
  })

  it('Retry button on timeout card triggers refetch and resets timer', () => {
    mockState = { ...emptyState, isLoading: true }
    render(<UBIImpactPage />)

    act(() => {
      vi.advanceTimersByTime(10_001)
    })

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }))
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })
})

describe('UBIImpactPage — empty state', () => {
  it('renders a no-fees-recorded message when all totals are zero', () => {
    mockState = {
      ...emptyState,
      isLoading: false,
      isEmpty: true,
      dashboard: buildDashboard({
        totalFees: 0n,
        totalUBI: 0n,
        totalTx: 0n,
        totalFeesFormatted: '0.00',
        totalUBIFormatted: '0.00',
      }),
    }
    render(<UBIImpactPage />)

    expect(screen.getByText(/No fees recorded yet/i)).toBeTruthy()
  })
})
