import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

  it('colours the session pill green when sessionState is "open"', async () => {
    mockFetchOnce({
      quotes: { AAPL: { ...QUOTES_FRESH.quotes.AAPL, sessionState: 'open' } },
      timestamp: 1700000005_000,
    })

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} />)

    const pill = await screen.findByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/bg-green/)
    expect(pill.textContent).toBe('open')
  })

  it('colours the session pill neutral gray when sessionState is "closed"', async () => {
    mockFetchOnce({
      quotes: { AAPL: { ...QUOTES_FRESH.quotes.AAPL, sessionState: 'closed' } },
      timestamp: 1700000005_000,
    })

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} />)

    const pill = await screen.findByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/text-gray-400/)
    expect(pill.className).not.toMatch(/bg-green/)
  })

  it('renders the outer section with the stable jump-target id', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
    const { container } = render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} />)
    expect(container.querySelector('section[id="panel-live-quotes"]')).not.toBeNull()
  })

  it('renders a stale badge when cacheAge exceeds the threshold', async () => {
    mockFetchOnce(QUOTES_STALE)

    render(<LiveQuotesPanel priceServiceUrl="http://mock" intervalMs={60_000} stalenessThresholdMs={30_000} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
    expect(screen.getByText(/stale/i)).toBeInTheDocument()
  })

  it('renders sanitised degraded copy when the price-service is unreachable, leaking no raw error inside the alert region', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('ECONNREFUSED 127.0.0.1:9300')))

    render(<LiveQuotesPanel priceServiceUrl="http://mock-host:9300" intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    })

    const alert = screen
      .getByText(/price-service unreachable/i)
      .closest('div[class*="border-yellow"]') as HTMLElement
    expect(alert).not.toBeNull()
    const inside = within(alert)

    expect(inside.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
    expect(inside.queryByText(/Endpoint:/i)).not.toBeInTheDocument()
    expect(alert.textContent).toMatch(/is unreachable/)

    // The configured host IS intentionally surfaced — in the header pill
    // and again inline in the alert body — so reviewers can tell which
    // endpoint was attempted without devtools.
    expect(screen.getByTestId('price-service-url')).toHaveTextContent('mock-host:9300')
    expect(inside.getByTestId('price-service-url-inline')).toHaveTextContent('mock-host:9300')
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

  it('renders the configured price-service URL in the header', async () => {
    mockFetchOnce(QUOTES_FRESH)

    render(<LiveQuotesPanel priceServiceUrl="https://price.example.com/v1" intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    const pill = screen.getByTestId('price-service-url')
    expect(pill).toHaveTextContent('price.example.com/v1')
    expect(pill.getAttribute('title')).toBe('price.example.com/v1')
  })

  it('renders the URL in the header even when the fetch is failing', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('boom')))

    render(<LiveQuotesPanel priceServiceUrl="http://mock-host:9300" intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    })

    expect(screen.getByTestId('price-service-url')).toHaveTextContent('mock-host:9300')
    expect(screen.getByTestId('price-service-url-inline')).toHaveTextContent('mock-host:9300')
    const alert = screen
      .getByText(/price-service unreachable/i)
      .closest('div[class*="border-yellow"]') as HTMLElement
    expect(alert.textContent).toMatch(/Live quotes feed at/i)
  })

  it('renders the URL in the header during the loading state', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch

    render(<LiveQuotesPanel priceServiceUrl="http://mock-host:9300" intervalMs={60_000} />)

    expect(screen.getByTestId('price-service-url')).toHaveTextContent('mock-host:9300')
  })

  it.each([
    ['http://localhost:9300', 'localhost:9300'],
    ['https://example.com/', 'example.com'],
    ['https://example.com/v1', 'example.com/v1'],
    ['not a url', 'not a url'],
  ])('renders %s as %s in the header pill', async (input, expected) => {
    mockFetchOnce(QUOTES_FRESH)
    render(<LiveQuotesPanel priceServiceUrl={input} intervalMs={60_000} />)
    await waitFor(() => {
      expect(screen.getByTestId('price-service-url')).toHaveTextContent(expected)
    })
  })

  it('strips userinfo from the rendered URL and the title', async () => {
    mockFetchOnce(QUOTES_FRESH)

    render(
      <LiveQuotesPanel
        priceServiceUrl="https://user:pass@host.example.com/v1"
        intervalMs={60_000}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    const pill = screen.getByTestId('price-service-url')
    expect(pill.textContent).toBe('host.example.com/v1')
    expect(pill.getAttribute('title')).toBe('host.example.com/v1')
    expect(pill.textContent).not.toMatch(/user|pass/)
    expect(pill.getAttribute('title')).not.toMatch(/user|pass/)
  })
})
