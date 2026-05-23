import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LastDemoHedgePanel } from '../LastDemoHedgePanel'
import { NO_OP_ORDER_ID, type HedgeProof } from '@/lib/hedgeProof'

const RELATIVE_SOURCE = 'qa-proof/hedges/latest.json'

function envelope(proof: HedgeProof) {
  return { proof, source: RELATIVE_SOURCE }
}

const PROOF_NO_OP: HedgeProof = {
  runId: '2026-05-23T13-30-22-900-2283a3',
  orderId: NO_OP_ORDER_ID,
  symbol: 'AAPL',
  side: 'buy',
  notionalUsd: 0,
  timestamp: 1779543022901,
  beforeExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
  afterExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
  dryRun: true,
  etoroMode: 'sandbox',
  realTradingEnabled: false,
}

const PROOF_DRY_RUN: HedgeProof = {
  runId: '2026-05-23T13-31-10-100-abc123',
  orderId: 'dry-run-abc',
  symbol: 'TSLA',
  side: 'buy',
  notionalUsd: 250,
  timestamp: 1779543070100,
  beforeExposure: { netDelta: 1000, absExposure: 1000, blockNumber: 41 },
  afterExposure: { netDelta: 750, absExposure: 750, blockNumber: 42 },
  dryRun: true,
  etoroMode: 'sandbox',
  realTradingEnabled: false,
}

const PROOF_LIVE: HedgeProof = {
  runId: '2026-05-23T13-32-00-100-def456',
  orderId: 'live-123',
  symbol: 'NVDA',
  side: 'sell',
  notionalUsd: 400,
  timestamp: 1779543120100,
  beforeExposure: { netDelta: -2000, absExposure: 2000, blockNumber: 50 },
  afterExposure: { netDelta: -1600, absExposure: 1600, blockNumber: 51 },
  dryRun: false,
  etoroMode: 'demo',
  realTradingEnabled: false,
}

function mockFetchOk(body: unknown) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response),
  )
}

describe('LastDemoHedgePanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the no-op sentinel as a "below-threshold tick" card without a BUY badge', async () => {
    mockFetchOk(envelope(PROOF_NO_OP))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Below-threshold tick/i)).toBeInTheDocument()
    })
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText(/No hedge needed/i)).toBeInTheDocument()
    expect(screen.getByText(/netDelta unchanged/i)).toBeInTheDocument()
    expect(screen.queryByText(/^BUY$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^SELL$/i)).not.toBeInTheDocument()
    // `$0.00` may legitimately appear inside the "netDelta unchanged" footer
    // when before/after are both zero. The PRD bans it only next to a side
    // badge — and there is no side badge on the no-op card.
    expect(screen.getByText(/DRY-RUN/)).toBeInTheDocument()
    expect(screen.getByText(/real trading: false/i)).toBeInTheDocument()
  })

  it('renders a dry-run demo hedge with the green BUY badge, notional and DRY-RUN chip', async () => {
    mockFetchOk(envelope(PROOF_DRY_RUN))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })
    expect(screen.getByText(/^buy$/i)).toBeInTheDocument()
    expect(screen.getByText('$250.00')).toBeInTheDocument()
    expect(screen.getByText(/DRY-RUN/)).toBeInTheDocument()
    expect(screen.queryByText(/Below-threshold tick/i)).not.toBeInTheDocument()
    expect(screen.getByText(/qa-proof\/hedges\/latest\.json/)).toBeInTheDocument()
  })

  it('renders a live demo hedge with the side badge but no DRY-RUN chip', async () => {
    mockFetchOk(envelope(PROOF_LIVE))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText('NVDA')).toBeInTheDocument()
    })
    expect(screen.getByText(/^sell$/i)).toBeInTheDocument()
    expect(screen.getByText('$400.00')).toBeInTheDocument()
    expect(screen.queryByText(/DRY-RUN/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Below-threshold tick/i)).not.toBeInTheDocument()
  })

  it('renders the missing-proof state on a 404', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'no_proof' }),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/No proof yet/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/hedge:demo/)).toBeInTheDocument()
  })

  it('renders the canned sanitised message from a 500 body without leaking debug strings', async () => {
    const cannedMessage = 'Hedge proof file is present but unreadable.'
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: 'read_failed',
            code: 'PROOF_UNREADABLE',
            message: cannedMessage,
          }),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(cannedMessage)).toBeInTheDocument()
    expect(screen.queryByText(/JSON/)).not.toBeInTheDocument()
    expect(screen.queryByText(/parse/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/home\//)).not.toBeInTheDocument()
  })

  it('falls back to a generic HTTP message when the 500 body is not JSON', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not json')),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/HTTP 502/)).toBeInTheDocument()
  })
})
