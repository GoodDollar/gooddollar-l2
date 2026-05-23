import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}))

vi.mock('@/lib/stockData', () => ({
  getAllTickers: () => ['AAPL'],
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    StocksPriceOracle: '0x1111111111111111111111111111111111111111',
  },
}))

vi.mock('@/lib/abi', () => ({
  PriceOracleABI: [],
}))

import { useReadContract } from 'wagmi'
import { LiveQuotesPanel } from '../LiveQuotesPanel'
import {
  ProofPipelineAxesProvider,
  type ProofPipelineAxesProviderProps,
} from '../ProofPipelineAxesProvider'

const useReadContractMock = vi.mocked(useReadContract)

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
      cacheAge: 2_400,
      filterAccepted: true,
    },
  },
  timestamp: 1700000005_000,
}

const QUOTES_FRESH_MULTI = {
  quotes: {
    AAPL: { ...QUOTES_FRESH.quotes.AAPL, symbol: 'AAPL', cacheAge: 2_400 },
    TSLA: { ...QUOTES_FRESH.quotes.AAPL, symbol: 'TSLA', cacheAge: 2_400 },
    NVDA: { ...QUOTES_FRESH.quotes.AAPL, symbol: 'NVDA', cacheAge: 2_400 },
  },
  timestamp: 1700000005_000,
}

const QUOTES_MIXED_STALE = {
  quotes: {
    AAPL: { ...QUOTES_FRESH.quotes.AAPL, symbol: 'AAPL', cacheAge: 2_400 },
    TSLA: { ...QUOTES_FRESH.quotes.AAPL, symbol: 'TSLA', cacheAge: 2_400 },
    MSFT: { ...QUOTES_FRESH.quotes.AAPL, symbol: 'MSFT', cacheAge: 60_000 },
  },
  timestamp: 1700000010_000,
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

/**
 * Render the panel inside the shared provider so the hook drives the
 * mocked fetch/wagmi paths. The provider props mirror the legacy
 * `LiveQuotesPanel` prop set (priceServiceUrl, offChainIntervalMs, ...)
 * which now lives one layer up — see task lane6-three-independent-quotes-pollers-at-conflicting-cadences
 * (0051).
 */
function renderPanel(opts: Omit<ProofPipelineAxesProviderProps, 'children'> = {}) {
  return render(
    <ProofPipelineAxesProvider offChainIntervalMs={60_000} {...opts}>
      <LiveQuotesPanel />
    </ProofPipelineAxesProvider>,
  )
}

describe('LiveQuotesPanel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useReadContractMock.mockReset()
    // The panel does not read on-chain state; default mock keeps the
    // hook quiet so off-chain fetches drive the rendered output.
    useReadContractMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useReadContract>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders happy-path quote row with no stale badge when cacheAge is fresh', async () => {
    mockFetchOnce(QUOTES_FRESH)

    renderPanel({ priceServiceUrl: 'http://mock', stalenessThresholdMs: 30_000 })

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('quote-stale-AAPL')).not.toBeInTheDocument()
    expect(screen.getByText(/0\.112%/)).toBeInTheDocument()
  })

  it('renders no per-row Age column header', async () => {
    mockFetchOnce(QUOTES_FRESH)

    renderPanel({ priceServiceUrl: 'http://mock' })

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    const thead = document.querySelector('thead')
    expect(thead).not.toBeNull()
    expect(within(thead as HTMLElement).queryByText(/^Age$/i)).toBeNull()
  })

  it('panel header shows freshness chip in all-current state', async () => {
    mockFetchOnce(QUOTES_FRESH_MULTI)

    renderPanel({ priceServiceUrl: 'http://mock', stalenessThresholdMs: 30_000 })

    const chip = await screen.findByTestId('quotes-freshness')
    expect(chip.textContent).toMatch(/all current/i)
    expect(chip.textContent).toMatch(/2\.4s/)
    expect(chip.className).not.toMatch(/yellow/)
  })

  it('panel header shows N stale of Y when at least one quote is stale', async () => {
    mockFetchOnce(QUOTES_MIXED_STALE)

    renderPanel({ priceServiceUrl: 'http://mock', stalenessThresholdMs: 30_000 })

    const chip = await screen.findByTestId('quotes-freshness')
    expect(chip.textContent).toMatch(/1 stale of 3/)
    expect(chip.textContent).toMatch(/2\.4s/)
    expect(chip.className).toMatch(/yellow/)
  })

  it('only the divergent row gets the stale row pill', async () => {
    mockFetchOnce(QUOTES_MIXED_STALE)

    renderPanel({ priceServiceUrl: 'http://mock', stalenessThresholdMs: 30_000 })

    await screen.findByText('AAPL')
    expect(screen.getByTestId('quote-stale-MSFT')).toBeInTheDocument()
    expect(screen.queryByTestId('quote-stale-AAPL')).toBeNull()
    expect(screen.queryByTestId('quote-stale-TSLA')).toBeNull()
  })

  it('colours the session pill green when sessionState is "open"', async () => {
    mockFetchOnce({
      quotes: { AAPL: { ...QUOTES_FRESH.quotes.AAPL, sessionState: 'open' } },
      timestamp: 1700000005_000,
    })

    renderPanel({ priceServiceUrl: 'http://mock' })

    const pill = await screen.findByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/bg-green/)
    expect(pill.textContent).toBe('open')
  })

  it('colours the session pill neutral gray when sessionState is "closed"', async () => {
    mockFetchOnce({
      quotes: { AAPL: { ...QUOTES_FRESH.quotes.AAPL, sessionState: 'closed' } },
      timestamp: 1700000005_000,
    })

    renderPanel({ priceServiceUrl: 'http://mock' })

    const pill = await screen.findByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/text-gray-400/)
    expect(pill.className).not.toMatch(/bg-green/)
  })

  it('renders the outer section with the stable jump-target id', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
    const { container } = renderPanel({ priceServiceUrl: 'http://mock' })
    expect(container.querySelector('section[id="panel-live-quotes"]')).not.toBeNull()
  })

  it('outer section uses flex flex-col h-full so it fills its grid cell row height', () => {
    // Lane6 #0039: a short error/empty branch must not leak a dark void
    // below the panel. The shell stretches to the grid row height and the
    // body content is wrapped in a flex-1 container.
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
    const { container } = renderPanel({ priceServiceUrl: 'http://mock' })
    const section = container.querySelector('section[id="panel-live-quotes"]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/\bh-full\b/)
    expect(section.className).toMatch(/\bflex\b/)
    expect(section.className).toMatch(/\bflex-col\b/)
    const body = section.querySelector(':scope > div.flex-1')
    expect(body, 'expected a flex-1 body wrapper inside the panel').not.toBeNull()
  })

  it('renders a stale row pill when cacheAge exceeds the threshold', async () => {
    mockFetchOnce(QUOTES_STALE)

    renderPanel({ priceServiceUrl: 'http://mock', stalenessThresholdMs: 30_000 })

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
    expect(screen.getByTestId('quote-stale-AAPL')).toBeInTheDocument()
  })

  it('renders sanitised degraded copy when the price-service is unreachable, leaking no raw error inside the alert region', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('ECONNREFUSED 127.0.0.1:9300')))

    renderPanel({ priceServiceUrl: 'http://mock-host:9300' })

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
    // Updated by lane6-live-quotes-error-panel-says-unreachable-twice: shape
    // mismatch now renders distinct "unexpected payload" copy and must NOT
    // print the "unreachable" header — the service answered, just with a
    // bad payload.
    mockFetchOnce(body)

    renderPanel({ priceServiceUrl: 'http://mock' })

    await waitFor(() => {
      expect(screen.getByText(/unexpected payload/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/price-service unreachable/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/SHAPE_MISMATCH/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Cannot read properties/)).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('fetch failure renders one unreachable sentence, not two', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))

    renderPanel({ priceServiceUrl: 'http://mock-host:9300' })

    await waitFor(() => {
      expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    })

    const alert = screen
      .getByText(/price-service unreachable/i)
      .closest('div[class*="border-yellow"]') as HTMLElement
    expect(alert).not.toBeNull()

    expect(within(alert).queryAllByText(/is unreachable/i)).toHaveLength(1)
  })

  it('shape mismatch renders a payload-mismatch sentence, not "unreachable"', async () => {
    mockFetchOnce({ timestamp: 0, quotes: { BAD: 42 } })

    renderPanel({ priceServiceUrl: 'http://mock-host:9300' })

    await waitFor(() => {
      expect(screen.getByText(/unexpected payload/i)).toBeInTheDocument()
    })

    const alert = screen
      .getByText(/unexpected payload/i)
      .closest('div[class*="border-yellow"]') as HTMLElement
    expect(alert).not.toBeNull()
    const inside = within(alert)

    expect(inside.queryByText(/unreachable/i)).not.toBeInTheDocument()
    expect(inside.getByTestId('price-service-url-inline')).toHaveTextContent('mock-host:9300')
  })

  it('degraded box still surfaces the configured URL exactly once', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('boom')))

    renderPanel({ priceServiceUrl: 'http://example.test:9400' })

    await waitFor(() => {
      expect(screen.getByText(/price-service unreachable/i)).toBeInTheDocument()
    })

    const alert = screen
      .getByText(/price-service unreachable/i)
      .closest('div[class*="border-yellow"]') as HTMLElement
    expect(within(alert).queryAllByText(/example\.test:9400/)).toHaveLength(1)
  })

  it('renders the configured price-service URL in the header', async () => {
    mockFetchOnce(QUOTES_FRESH)

    renderPanel({ priceServiceUrl: 'https://price.example.com/v1' })

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    const pill = screen.getByTestId('price-service-url')
    expect(pill).toHaveTextContent('price.example.com/v1')
    expect(pill.getAttribute('title')).toBe('price.example.com/v1')
  })

  it('renders the URL in the header even when the fetch is failing', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('boom')))

    renderPanel({ priceServiceUrl: 'http://mock-host:9300' })

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

    renderPanel({ priceServiceUrl: 'http://mock-host:9300' })

    expect(screen.getByTestId('price-service-url')).toHaveTextContent('mock-host:9300')
  })

  it.each([
    ['http://localhost:9300', 'localhost:9300'],
    ['https://example.com/', 'example.com'],
    ['https://example.com/v1', 'example.com/v1'],
    ['not a url', 'not a url'],
  ])('renders %s as %s in the header pill', async (input, expected) => {
    mockFetchOnce(QUOTES_FRESH)
    renderPanel({ priceServiceUrl: input })
    await waitFor(() => {
      expect(screen.getByTestId('price-service-url')).toHaveTextContent(expected)
    })
  })

  it('strips userinfo from the rendered URL and the title', async () => {
    mockFetchOnce(QUOTES_FRESH)

    renderPanel({ priceServiceUrl: 'https://user:pass@host.example.com/v1' })

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    const pill = screen.getByTestId('price-service-url')
    expect(pill.textContent).toBe('host.example.com/v1')
    expect(pill.getAttribute('title')).toBe('host.example.com/v1')
    expect(pill.textContent).not.toMatch(/user|pass/)
    expect(pill.getAttribute('title')).not.toMatch(/user|pass/)
  })

  it('LiveQuotes header pill cadence reflects the provider cadenceMs constant', () => {
    // Single source of truth for the off-chain cadence — the same
    // number the rollup/flow polls at. See task
    // lane6-three-independent-quotes-pollers-at-conflicting-cadences (0051).
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
    renderPanel({ priceServiceUrl: 'http://mock', offChainIntervalMs: 5_000 })
    expect(screen.getByText(/refreshes every 5s/i)).toBeInTheDocument()
  })
})
