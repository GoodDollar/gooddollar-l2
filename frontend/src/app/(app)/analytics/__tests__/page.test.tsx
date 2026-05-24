import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import AnalyticsPage from '../page'

const baseOverviewResponse = {
  ok: true,
  summary: {
    totalProtocols: 1,
    totalContracts: 1,
    addressBookVersion: 'v0',
    addressBookGeneratedAt: '2026-01-01T00:00:00Z',
    generatedAt: '2026-01-01T00:00:00Z',
  },
  status: { ok: true, overall: 'healthy', healthy: 14, total: 14 },
  indexer: {
    ok: true,
    lastBlock: 100,
    totalEvents: 1,
    protocols: [],
    topEvents: [],
    lagBlocks: 0,
    lagStatus: 'fresh',
  },
  chain: { ok: true, blockNumber: 100 },
  ubi: {
    totalRoutes: 0,
    routes: [],
    pendingCount: 0,
    pendingSplitters: [],
    feeSplitBps: { protocol: 7000, ubi: 3000 },
  },
  protocols: [],
}

function mockOverview(extra: Record<string, unknown>): void {
  const body = { ...baseOverviewResponse, ...extra }
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AnalyticsPage — lane-1 price-feed panel (task 0063)', () => {
  it('renders the panel with mode and freshQuotes when priceFeed.ok is true', async () => {
    mockOverview({
      priceFeed: {
        ok: true,
        mode: 'mock',
        freshQuotes: 8,
        totalSymbols: 8,
        medianDivergenceBps: 3,
      },
      oracleSubmitter: { ok: true, status: 'ok', mode: 'ok' },
    })

    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('lane1-price-feed-panel')).toBeInTheDocument()
    })
    const producer = screen.getByTestId('lane1-producer-card')
    expect(producer.textContent).toContain('8/8 fresh')
    expect(producer.textContent).toContain('mock')
    const fence = screen.getByTestId('lane1-fence-chip')
    expect(fence.textContent).toContain('FENCED')
  })

  it('renders the degraded submitter chip with reason when ORACLE_SIGNER_KEY missing', async () => {
    mockOverview({
      priceFeed: { ok: true, mode: 'mock', freshQuotes: 8, totalSymbols: 8 },
      oracleSubmitter: {
        ok: false,
        status: 'degraded',
        mode: 'disabled',
        reason: 'ORACLE_SIGNER_KEY is not set; signer loop disabled',
      },
    })

    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('lane1-submitter-card')).toBeInTheDocument()
    })
    const submitter = screen.getByTestId('lane1-submitter-card')
    expect(submitter.textContent).toContain('degraded')
    expect(submitter.textContent).toContain('ORACLE_SIGNER_KEY')
  })

  it('renders the unreachable failure card with runbook link when priceFeed.ok is false', async () => {
    mockOverview({
      priceFeed: { ok: false, error: 'ECONNREFUSED' },
      oracleSubmitter: { ok: false, status: 'unreachable' },
    })

    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('lane1-price-feed-panel')).toBeInTheDocument()
    })
    const panel = screen.getByTestId('lane1-price-feed-panel')
    expect(panel.textContent).toContain('ECONNREFUSED')
    const runbookLinks = panel.querySelectorAll('a')
    expect(
      Array.from(runbookLinks).some((a) =>
        a.getAttribute('href')?.includes('lane1-live-prices-on-chain'),
      ),
    ).toBe(true)
  })

  it('renders the deep-link to /lane1 in the panel header', async () => {
    mockOverview({
      priceFeed: { ok: true, mode: 'mock', freshQuotes: 8, totalSymbols: 8 },
      oracleSubmitter: { ok: true, status: 'ok' },
    })

    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByTestId('lane1-deep-link')).toBeInTheDocument()
    })
    expect(screen.getByTestId('lane1-deep-link').getAttribute('href')).toBe('/lane1')
  })
})
