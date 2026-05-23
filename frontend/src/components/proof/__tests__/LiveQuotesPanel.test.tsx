import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LiveQuotesPanel } from '../LiveQuotesPanel'

const QUOTES_FRESH = {
  quotes: {
    AAPL: {
      symbol: 'AAPL',
      bid: 178.5,
      ask: 178.7,
      mid: 178.6,
      last: 178.65,
      timestamp: 1700000000_000,
      sessionState: 'Open',
      confidence: 95,
      cacheAge: 2_000,
      filterAccepted: true,
    },
  },
  timestamp: 1700000005_000,
}

const QUOTES_STALE = {
  quotes: {
    AAPL: {
      ...QUOTES_FRESH.quotes.AAPL,
      cacheAge: 120_000,
    },
  },
  timestamp: 1700000010_000,
}

function mockFetchOnce(body: unknown, ok = true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 503,
      json: () => Promise.resolve(body),
    } as Response),
  )
}

describe('LiveQuotesPanel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders happy-path quote row with no stale badge when cacheAge is fresh', async () => {
    mockFetchOnce(QUOTES_FRESH)

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} stalenessThresholdMs={30_000} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
    expect(screen.queryByText(/stale/i)).not.toBeInTheDocument()
    expect(screen.getByText(/0\.112%/)).toBeInTheDocument()
  })

  it('renders a stale badge when cacheAge exceeds the threshold', async () => {
    mockFetchOnce(QUOTES_STALE)

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} stalenessThresholdMs={30_000} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
    expect(screen.getByText(/stale/i)).toBeInTheDocument()
  })

  it('renders sanitised degraded copy when the price-service is unreachable, leaking no raw error / URL / port', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('ECONNREFUSED 127.0.0.1:9300')))

    render(<LiveQuotesPanel priceServiceUrl="http://mock-host:9300" intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Live quotes feed is unreachable/i)).toBeInTheDocument()
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
    expect(screen.queryByText(/http:\/\//)).not.toBeInTheDocument()
    expect(screen.queryByText(/mock-host/)).not.toBeInTheDocument()
    expect(screen.queryByText(/9300/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Endpoint:/i)).not.toBeInTheDocument()
  })

  it.each([
    ['null body', null],
    ['empty object', {}],
    ['quotes as array', { timestamp: 1, quotes: [] }],
    ['quote entry is null', { timestamp: 1, quotes: { AAPL: null } }],
    ['quote entry missing fields', { timestamp: 1, quotes: { AAPL: { symbol: 'AAPL' } } }],
    ['top-level array', [1, 2, 3]],
    ['quote with wrong numeric type', { timestamp: 1, quotes: { AAPL: { symbol: 'AAPL', bid: '178', ask: 179, mid: 178.5, cacheAge: 1000, sessionState: 'Open' } } }],
  ])('renders shape-mismatch degraded copy without crashing when body is %s', async (_label, body) => {
    mockFetchOnce(body)

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/unexpected payload shape/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    expect(screen.queryByText(/SHAPE_MISMATCH/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Cannot read properties/)).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
