import { describe, it, expect, vi, afterEach } from 'vitest'
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

  it('renders inline degraded state when the price-service is unreachable', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('ECONNREFUSED')))

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument()
  })
})
