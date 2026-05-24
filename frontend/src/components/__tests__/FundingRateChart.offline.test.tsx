/**
 * Task 0042 — the /perps Funding Rate History chart must render an honest
 * empty state when the chain RPC is unreachable, not a 168-hour seeded
 * ladder. The chart consumes `useFundingRateHistory`, which today returns
 * `{ status: 'chain-offline' | 'unknown', snapshots: [], refetch }`. Once
 * an events indexer is wired this same hook returns `'live'` snapshots
 * and the chart renders bars again.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// jsdom doesn't ship a ResizeObserver — the chart's BarChart hook needs
// one. A no-op shim is enough; the chart simply keeps its default 600×200
// dimensions, which is all this test needs to verify "bars render".
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
})

const refetchMock = vi.fn()

vi.mock('@/lib/perpsHistoryData', async (orig) => {
  const actual = await orig<typeof import('@/lib/perpsHistoryData')>()
  return {
    ...actual,
    useFundingRateHistory: vi.fn(),
  }
})

import { useFundingRateHistory } from '@/lib/perpsHistoryData'
import { FundingRateChart } from '@/components/FundingRateChart'

const mockedUseFundingRateHistory = vi.mocked(useFundingRateHistory)

describe('FundingRateChart — chain-offline empty state (task 0042)', () => {
  it('renders the empty body with a Retry button when status is chain-offline', () => {
    refetchMock.mockReset()
    mockedUseFundingRateHistory.mockReturnValue({
      status: 'chain-offline',
      snapshots: [],
      refetch: refetchMock,
    })

    render(<TestWrapper><FundingRateChart symbol="BTC-USD" /></TestWrapper>)

    const empty = screen.getByTestId('funding-rate-empty')
    expect(empty.getAttribute('data-status')).toBe('chain-offline')
    expect(empty.textContent).toContain('chain unreachable')
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows em-dash for Avg / Annualized when chain is offline', () => {
    mockedUseFundingRateHistory.mockReturnValue({
      status: 'chain-offline',
      snapshots: [],
      refetch: refetchMock,
    })
    render(<TestWrapper><FundingRateChart symbol="BTC-USD" /></TestWrapper>)
    expect(screen.getByTestId('funding-rate-avg').textContent).toBe('—')
    expect(screen.getByTestId('funding-rate-annualized').textContent).toMatch(/^—/)
  })

  it('does not render the chain-oracle source badge when not live', () => {
    mockedUseFundingRateHistory.mockReturnValue({
      status: 'chain-offline',
      snapshots: [],
      refetch: refetchMock,
    })
    render(<TestWrapper><FundingRateChart symbol="BTC-USD" /></TestWrapper>)
    expect(screen.queryByTestId('price-source-badge')).toBeNull()
  })

  it('clicking Retry calls the hook refetch', () => {
    refetchMock.mockReset()
    mockedUseFundingRateHistory.mockReturnValue({
      status: 'chain-offline',
      snapshots: [],
      refetch: refetchMock,
    })
    render(<TestWrapper><FundingRateChart symbol="BTC-USD" /></TestWrapper>)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders "No funding data yet" without a Retry button when status is unknown', () => {
    mockedUseFundingRateHistory.mockReturnValue({
      status: 'unknown',
      snapshots: [],
      refetch: refetchMock,
    })
    render(<TestWrapper><FundingRateChart symbol="BTC-USD" /></TestWrapper>)
    const empty = screen.getByTestId('funding-rate-empty')
    expect(empty.getAttribute('data-status')).toBe('unknown')
    expect(empty.textContent).toContain('No funding data yet')
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })

  it('renders the bar chart and a chain-oracle source badge when status is live', () => {
    const now = Date.now()
    mockedUseFundingRateHistory.mockReturnValue({
      status: 'live',
      snapshots: [
        { timestamp: now - 3_600_000, rate: 0.0001, annualized: 0.876 },
        { timestamp: now,             rate: 0.0002, annualized: 1.752 },
      ],
      refetch: refetchMock,
    })
    const { container } = render(<TestWrapper><FundingRateChart symbol="BTC-USD" /></TestWrapper>)
    expect(screen.queryByTestId('funding-rate-empty')).toBeNull()
    const rects = container.querySelectorAll('svg rect')
    expect(rects.length).toBeGreaterThan(0)
    const badge = screen.queryByTestId('price-source-badge')
    expect(badge).not.toBeNull()
    expect(badge?.getAttribute('data-source')).toBe('chain-oracle')
  })
})

describe('FundingRateChart — no demo-hook regressions (task 0042)', () => {
  it('does not export the legacy generator/hook names from perpsHistoryData', async () => {
    // Sanity that the legacy named exports are no longer reachable from the
    // chart's import path. Both renames must hold for this assertion to pass.
    const lib = await vi.importActual<Record<string, unknown>>(
      '@/lib/perpsHistoryData',
    )
    expect(lib['useFundingRateChart']).toBeUndefined()
    expect(lib['generateFundingRateHistory']).toBeUndefined()
    expect(typeof lib['useDemoFundingRateChart']).toBe('function')
    expect(typeof lib['generateDemoFundingRateHistory']).toBe('function')
    expect(typeof lib['useFundingRateHistory']).toBe('function')
  })
})
