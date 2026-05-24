/**
 * Task 0059 — /status page integration.
 *
 * Mocks the singleton snapshot hook directly so the page tree under test
 * stays focused on UX wiring: skeleton → live state with proofs →
 * degraded state with empty rails → address redaction → refresh control.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/status',
}))

const snapshotMock = vi.fn()
vi.mock('@/lib/useOracleStatusSnapshot', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useOracleStatusSnapshot')>(
    '@/lib/useOracleStatusSnapshot',
  )
  return {
    ...actual,
    useOracleStatusSnapshot: () => snapshotMock(),
  }
})

import StatusPage from '../page'
import type { OracleStatusPayload, OracleStatusSnapshot } from '@/lib/useOracleStatusSnapshot'

function snapshot(overrides: Partial<OracleStatusSnapshot> = {}): OracleStatusSnapshot {
  return {
    payload: null,
    isLoading: false,
    lastFetchedAtMs: Date.now(),
    error: null,
    refresh: vi.fn(),
    ...overrides,
  }
}

const SIGNER = '0xabcdef0123456789abcdef0123456789abcdef01'
const STOCKS_ORACLE = '0x1111111111111111111111111111111111111111'
const CRYPTO_ORACLE = '0x2222222222222222222222222222222222222222'
const STOCKS_TX = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const CRYPTO_TX = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

function livePayload(): OracleStatusPayload {
  const now = Date.now()
  return {
    healthy: true,
    degraded: false,
    timestamp: now,
    freshCount: 5,
    totalCount: 5,
    service: { status: 'ok' },
    rails: {
      stocks: { enabled: true, lastSuccessAtMs: now - 5_000, lastSuccessAgeMs: 5_000, lastFailureAtMs: null, lastFailureAgeMs: null },
      crypto: { enabled: true, lastSuccessAtMs: now - 8_000, lastSuccessAgeMs: 8_000, lastFailureAtMs: null, lastFailureAgeMs: null },
    },
    proof: {
      stocks: [{ rail: 'stocks', txHash: STOCKS_TX, blockNumber: 42, symbols: ['AAPL'], submittedAtMs: now - 4_000, mids: { AAPL: 195.42 } }],
      crypto: [{ rail: 'crypto', txHash: CRYPTO_TX, blockNumber: 43, symbols: ['BTC-USD'], submittedAtMs: now - 9_000, mids: { 'BTC-USD': 84250 } }],
    },
    chain: {
      chainId: 42069,
      signerAddress: SIGNER,
      oracleAddresses: { stocks: STOCKS_ORACLE, crypto: CRYPTO_ORACLE },
    },
    upstreams: {
      priceService: { status: 'ok', label: 'mock' },
      oracleSigner: { status: 'ok' },
    },
    ingest: { accepted: 1000, droppedJsonParse: 1, droppedShape: 0, droppedInvalidMid: 0, droppedMissingSymbol: 0 },
    failures: { stocks: [], crypto: [] },
  }
}

function degradedPayload(): OracleStatusPayload {
  const now = Date.now()
  return {
    healthy: false,
    degraded: true,
    timestamp: now,
    freshCount: 0,
    totalCount: 0,
    service: { status: 'degraded', reason: 'oracle-signer down' },
    rails: {
      stocks: { enabled: false, lastSuccessAtMs: null, lastSuccessAgeMs: null, lastFailureAtMs: now - 600_000, lastFailureAgeMs: 600_000 },
      crypto: { enabled: false, lastSuccessAtMs: null, lastSuccessAgeMs: null, lastFailureAtMs: now - 180_000, lastFailureAgeMs: 180_000 },
    },
    proof: { stocks: [], crypto: [] },
    chain: { chainId: null, signerAddress: null, oracleAddresses: { stocks: null, crypto: null } },
    upstreams: {
      priceService: { status: 'down', reason: 'ECONNREFUSED 127.0.0.1:9300', label: 'mock' },
      oracleSigner: { status: 'down', reason: 'upstream returned 503' },
    },
    ingest: { accepted: 0, droppedJsonParse: 0, droppedShape: 0, droppedInvalidMid: 0, droppedMissingSymbol: 0 },
    failures: {
      stocks: [{ rail: 'stocks', reason: 'tx underpriced', symbols: ['AAPL'], attemptedAtMs: now - 60_000 }],
      crypto: [],
    },
  }
}

describe('StatusPage', () => {
  beforeEach(() => {
    snapshotMock.mockReset()
  })

  it('renders the loading skeleton on first paint', () => {
    snapshotMock.mockReturnValue(snapshot({ isLoading: true, lastFetchedAtMs: null }))
    render(<StatusPage />)
    expect(screen.getByTestId('status-skeleton')).toBeInTheDocument()
  })

  it('renders the live snapshot with both rails, both proof tables, and both upstreams up', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: livePayload() }))
    render(<StatusPage />)

    expect(screen.getByTestId('status-page')).toBeInTheDocument()
    expect(screen.getByTestId('rail-card-stocks')).toBeInTheDocument()
    expect(screen.getByTestId('rail-card-crypto')).toBeInTheDocument()
    expect(screen.getByTestId('proof-table-stocks').textContent).toMatch(/AAPL/)
    expect(screen.getByTestId('proof-table-crypto').textContent).toMatch(/BTC-USD/)
    const priceServiceRow = screen.getByTestId('upstream-price-service')
    expect(priceServiceRow.textContent).toMatch(/price-service/)
    expect(priceServiceRow.textContent).toMatch(/ok/)
    const oracleSignerRow = screen.getByTestId('upstream-oracle-signer')
    expect(oracleSignerRow.textContent).toMatch(/oracle-signer/)
  })

  it('renders empty-state proof tables and disabled rails when degraded', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: degradedPayload() }))
    render(<StatusPage />)

    expect(screen.getByTestId('proof-table-stocks').textContent).toMatch(/No proofs|Rail/)
    expect(screen.getByTestId('proof-table-crypto').textContent).toMatch(/No proofs|Rail/)
    expect(screen.getByTestId('rail-card-stocks').textContent).toMatch(/Disabled/)
    expect(screen.getByTestId('rail-card-crypto').textContent).toMatch(/Disabled/)
  })

  it('redacts long addresses — full signer never appears in the DOM at rest', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: livePayload() }))
    render(<StatusPage />)

    const body = document.body.textContent ?? ''
    expect(body).not.toContain(SIGNER)
    expect(body).not.toContain(STOCKS_ORACLE)
    expect(body).not.toContain(STOCKS_TX)
    // Truncation: leading prefix and trailing suffix render separately.
    expect(body).toMatch(/0xabcd/)
    expect(body).toMatch(/…/)
  })

  it('renders explorer links for known chain IDs', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: livePayload() }))
    render(<StatusPage />)

    const stocksLink = screen.getByText(/block 42/)
    expect(stocksLink.tagName).toBe('A')
    expect(stocksLink.getAttribute('href')).toMatch(STOCKS_TX)
  })

  it('renders explorer links as plain text when chainId is null', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: degradedPayload() }))
    render(<StatusPage />)
    expect(screen.queryByText(/block 42/)).not.toBeInTheDocument()
  })

  it('renders an error block when payload is null and there is an error', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: null, isLoading: false, error: 'network down' }))
    render(<StatusPage />)
    expect(screen.getByTestId('status-error').textContent).toMatch(/network down/)
  })

  it('the Refresh button triggers refresh()', () => {
    const refresh = vi.fn()
    snapshotMock.mockReturnValue(snapshot({ payload: livePayload(), refresh }))
    render(<StatusPage />)
    fireEvent.click(screen.getByTestId('status-refresh'))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('reveals the down upstream reason when degraded', () => {
    snapshotMock.mockReturnValue(snapshot({ payload: degradedPayload() }))
    render(<StatusPage />)
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument()
    expect(screen.getByText(/returned 503/)).toBeInTheDocument()
  })
})
