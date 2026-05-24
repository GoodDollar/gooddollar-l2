import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import Lane1Page from '../page'
import type { OracleStatusState, PriceServiceStatus } from '@/lib/usePriceServiceStatus'
import type { Lane1AggregatorState } from '@/lib/useLane1AggregatorStatus'

vi.mock('@/lib/usePriceServiceStatus', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceServiceStatus')>(
    '@/lib/usePriceServiceStatus',
  )
  return {
    ...actual,
    usePriceServiceStatus: vi.fn(),
  }
})

vi.mock('@/lib/useLane1AggregatorStatus', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useLane1AggregatorStatus')>(
    '@/lib/useLane1AggregatorStatus',
  )
  return {
    ...actual,
    useLane1AggregatorStatus: vi.fn(),
  }
})

const { usePriceServiceStatus } = await import('@/lib/usePriceServiceStatus')
const { useLane1AggregatorStatus } = await import('@/lib/useLane1AggregatorStatus')

const LIVE_STATUS: PriceServiceStatus = {
  healthy: true,
  freshCount: 8,
  totalCount: 8,
  timestamp: Date.now(),
  quotes: [
    { symbol: 'BTC', lastUpdateMs: 4_000, sessionState: 'open', confidence: 95, oracleBlock: 1_234_500, divergenceBps: 2 },
    { symbol: 'ETH', lastUpdateMs: 4_000, sessionState: 'open', confidence: 95, oracleBlock: 1_234_500, divergenceBps: 4 },
    { symbol: 'SOL', lastUpdateMs: 6_000, sessionState: 'open', confidence: 90, oracleBlock: 1_234_500, divergenceBps: 3 },
    { symbol: 'AAPL', lastUpdateMs: 8_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
    { symbol: 'TSLA', lastUpdateMs: 8_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
    { symbol: 'NVDA', lastUpdateMs: 8_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
    { symbol: 'META', lastUpdateMs: 8_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
    { symbol: 'SPY', lastUpdateMs: 8_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 0 },
  ],
}

const DEGRADED_STATUS: PriceServiceStatus = {
  healthy: false,
  freshCount: 5,
  totalCount: 8,
  timestamp: Date.now(),
  quotes: [
    { symbol: 'BTC', lastUpdateMs: 4_000, sessionState: 'open', confidence: 95, oracleBlock: 1_234_500, divergenceBps: 2 },
    { symbol: 'ETH', lastUpdateMs: 90_000, sessionState: 'open', confidence: 95, oracleBlock: 1_234_500, divergenceBps: 4 },
    { symbol: 'AAPL', lastUpdateMs: 8_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
    { symbol: 'TSLA', lastUpdateMs: 120_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
    { symbol: 'NVDA', lastUpdateMs: 200_000, sessionState: 'closed', confidence: 85, oracleBlock: 1_234_500, divergenceBps: 1 },
  ],
}

const AGG_HEALTHY: Lane1AggregatorState = {
  priceService: { status: 'ok' },
  oracleSigner: { status: 'ok' },
  hedgeEngine: { status: 'ok' },
  isLoading: false,
  error: null,
}

const AGG_DEGRADED: Lane1AggregatorState = {
  priceService: { status: 'ok' },
  oracleSigner: { status: 'degraded' },
  hedgeEngine: { status: 'unreachable' },
  isLoading: false,
  error: null,
}

const AGG_UNREACHABLE: Lane1AggregatorState = {
  priceService: { status: 'unreachable' },
  oracleSigner: { status: 'unreachable' },
  hedgeEngine: { status: 'unreachable' },
  isLoading: false,
  error: 'fetch failed',
}

function ok(state: OracleStatusState): OracleStatusState {
  return state
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('Lane1Page', () => {
  it('renders the header strip with source mode and fenced badge when live', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue(
      ok({ status: LIVE_STATUS, isLoading: false, error: null, nextRetryAt: null }),
    )
    vi.mocked(useLane1AggregatorStatus).mockReturnValue(AGG_HEALTHY)

    render(<Lane1Page />)

    expect(screen.getByTestId('lane1-header')).toBeInTheDocument()
    expect(screen.getByText(/Source:/)).toBeInTheDocument()
    expect(screen.getByText('FENCED')).toBeInTheDocument()
  })

  it('renders all 8 default symbol rows even when producer returns a subset', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue(
      ok({ status: DEGRADED_STATUS, isLoading: false, error: null, nextRetryAt: null }),
    )
    vi.mocked(useLane1AggregatorStatus).mockReturnValue(AGG_DEGRADED)

    render(<Lane1Page />)

    for (const sym of ['BTC', 'ETH', 'SOL', 'AAPL', 'TSLA', 'NVDA', 'META', 'SPY']) {
      expect(
        screen.getByTestId(`lane1-symbol-row-${sym}`),
        `expected row for ${sym}`,
      ).toBeInTheDocument()
    }
  })

  it('flags stale symbols (>=60s) with the STL chip', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue(
      ok({ status: DEGRADED_STATUS, isLoading: false, error: null, nextRetryAt: null }),
    )
    vi.mocked(useLane1AggregatorStatus).mockReturnValue(AGG_DEGRADED)

    render(<Lane1Page />)
    const stlChips = screen.getAllByText(/STL/)
    expect(stlChips.length).toBeGreaterThanOrEqual(2)
  })

  it('shows the failure-mode card with runbook link when quotes proxy errors', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue(
      ok({
        status: null,
        isLoading: false,
        error: 'Status endpoint returned 503',
        nextRetryAt: null,
      }),
    )
    vi.mocked(useLane1AggregatorStatus).mockReturnValue(AGG_UNREACHABLE)

    render(<Lane1Page />)

    const card = screen.getByTestId('lane1-failure-card')
    expect(card).toBeInTheDocument()
    expect(card.textContent).toContain('Status endpoint returned 503')
    expect(card.textContent).toContain('install:lane1')
    expect(card.textContent).toContain('ETORO_MODE=mock')
    const runbookLinks = card.querySelectorAll('a')
    expect(
      Array.from(runbookLinks).some((a) =>
        a.getAttribute('href')?.includes('lane1-live-prices-on-chain'),
      ),
    ).toBe(true)
  })

  it('hides the pipeline card when in the failure state', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue(
      ok({
        status: null,
        isLoading: false,
        error: 'fetch failed',
        nextRetryAt: null,
      }),
    )
    vi.mocked(useLane1AggregatorStatus).mockReturnValue(AGG_UNREACHABLE)

    render(<Lane1Page />)

    expect(screen.queryByTestId('pipeline-node-price-service')).not.toBeInTheDocument()
    expect(screen.queryByTestId('lane1-symbol-table')).not.toBeInTheDocument()
  })

  it('renders the pipeline card with three nodes when status is live', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue(
      ok({ status: LIVE_STATUS, isLoading: false, error: null, nextRetryAt: null }),
    )
    vi.mocked(useLane1AggregatorStatus).mockReturnValue(AGG_HEALTHY)

    render(<Lane1Page />)

    expect(screen.getByTestId('pipeline-node-price-service')).toBeInTheDocument()
    expect(screen.getByTestId('pipeline-node-oracle-signer')).toBeInTheDocument()
    expect(screen.getByTestId('pipeline-node-stockoraclev2')).toBeInTheDocument()
  })
})
