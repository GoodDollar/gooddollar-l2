import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LastDemoHedgePanel } from '../LastDemoHedgePanel'

const PROOF_OK = {
  proof: {
    runId: '2026-05-23T13-30-22-900-2283a3',
    orderId: 'dry-run',
    symbol: 'AAPL',
    side: 'buy' as const,
    notionalUsd: 0,
    timestamp: 1779543022901,
    beforeExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
    afterExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
    dryRun: true,
    etoroMode: 'sandbox',
    realTradingEnabled: false,
  },
  source: '/repo/qa-proof/hedges/latest.json',
}

describe('LastDemoHedgePanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the happy-path proof card with order id, symbol, and dry-run badge', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(PROOF_OK),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
    expect(screen.getByText(/DRY-RUN/)).toBeInTheDocument()
    expect(screen.getByText(/real trading: false/i)).toBeInTheDocument()
    // orderId is rendered in mono in the field grid, and the panel header
    // also says "dry-run" — assert at least one match.
    expect(screen.getAllByText('dry-run').length).toBeGreaterThan(0)
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

  it('renders an inline error when the API fails with a 500', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'oops' }),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
  })
})
