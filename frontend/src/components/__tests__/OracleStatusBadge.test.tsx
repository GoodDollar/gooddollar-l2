import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { OracleStatusBadge, __resetOracleStatusFallbackForTests } from '../OracleStatusBadge'
import { __resetOracleProvenanceForTests } from '@/lib/useOracleProvenance'

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
  getSessionLabel: (state: string) => {
    switch (state) {
      case 'open': return 'Market Open'
      case 'pre-market': return 'Pre-Market'
      case 'after-hours': return 'After Hours'
      case 'closed': return 'Market Closed'
      case 'halted': return 'Halted'
      default: return 'Unknown'
    }
  },
  getDominantSession: vi.fn(() => 'open'),
}))

const { usePriceServiceStatus } = await import('@/lib/usePriceServiceStatus')

function resetAllBadgeState(): void {
  __resetOracleStatusFallbackForTests()
  __resetOracleProvenanceForTests()
}

// Default fetch mock so `useOracleProvenance` (called by the footer) does
// not fall through to an unmocked network call when a test only cares
// about the primary row. Individual tests override this with their own
// `vi.spyOn(globalThis, 'fetch')` calls — the override always wins.
function installEmptyProvenanceMock(): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({
      chain: { chainId: null, signerAddress: null, oracleAddresses: { stocks: null, crypto: null } },
      upstreams: { priceService: { status: 'ok' }, oracleSigner: { status: 'ok' } },
      proof: { stocks: [], crypto: [] },
    }), { status: 200 }),
  )
}

describe('OracleStatusBadge stocks fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllBadgeState()
  })

  it('shows Live with stocks fallback when quote status is unavailable but stocks-keeper is healthy', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
        }),
        { status: 200 },
      ),
    )

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.getByText('on-chain feed')).toBeInTheDocument()
    expect(screen.queryByText('stocks-keeper')).not.toBeInTheDocument()
  })

  it('shows Oracle offline when quote status is unavailable and fallback status fails', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Oracle offline')).toBeInTheDocument())
  })

  it('dedupes fallback status fetches while a request is in flight', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })

    const makeResponse = () => new Response(
      JSON.stringify({
        overall: 'healthy',
        services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
      }),
      { status: 200 },
    )
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()
      // `/api/oracle/status` is independent: it's the provenance footer's
      // own endpoint and has its own deduper. We only assert the
      // `useStocksFallback` health endpoint is deduped here.
      if (url.includes('/api/oracle/status')) {
        return new Response('{}', { status: 200 })
      }
      return makeResponse()
    })

    render(
      <>
        <OracleStatusBadge useStocksFallback />
        <OracleStatusBadge useStocksFallback />
      </>,
    )

    await waitFor(() => expect(screen.getAllByText('Live').length).toBeGreaterThan(0))
    const statusCalls = fetchSpy.mock.calls.filter(([input]) => {
      const url = typeof input === 'string' ? input : (input as URL | Request).toString()
      return url.includes('/api/status') && !url.includes('/api/oracle/status')
    })
    expect(statusCalls).toHaveLength(1)
  })

  it('shows animated skeleton pill instead of plain text while checking oracle', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    expect(screen.queryByText('Checking oracle...')).not.toBeInTheDocument()
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('OracleStatusBadge layout invariants', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllBadgeState()
  })

  it('compact-fallback live render uses whitespace-nowrap so the pill never breaks mid-text', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
        }),
        { status: 200 },
      ),
    )

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('whitespace-nowrap')
  })

  it('compact-fallback offline render uses whitespace-nowrap', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Oracle offline')).toBeInTheDocument())
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('whitespace-nowrap')
  })

  it('offline render (no fallback) also uses whitespace-nowrap', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })

    const { container } = render(<OracleStatusBadge />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('whitespace-nowrap')
  })
})

describe('OracleStatusBadge dot size invariant', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllBadgeState()
  })

  it('compact-fallback live render uses 10px (w-2.5 h-2.5) dot with halo ring', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
        }),
        { status: 200 },
      ),
    )

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    const dot = container.querySelector('span.rounded-full')
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass('w-2.5')
    expect(dot).toHaveClass('h-2.5')
    expect(dot).toHaveClass('ring-2')
  })

  it('compact-fallback offline render uses 10px dot', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Oracle offline')).toBeInTheDocument())
    const dot = container.querySelector('span.rounded-full')
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass('w-2.5')
    expect(dot).toHaveClass('h-2.5')
  })

  it('loading skeleton uses h-4 (16px) so the badge does not jump on load', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('h-4')
    expect(skeleton).not.toHaveClass('h-5')
  })
})

describe('OracleStatusBadge freshness age', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllBadgeState()
  })

  it('shows Updated <age> on compact happy-path when status quotes are fresh', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 4000, sessionState: 'open', confidence: 95 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })

    render(<OracleStatusBadge />)
    expect(screen.getByText(/4s/)).toBeInTheDocument()
    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('shows Updated <age> on compact fallback when stocks-keeper lastChecked is recent', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [
            { name: 'stocks-keeper', status: 'ok', lastChecked: new Date(Date.now() - 5000).toISOString() },
          ],
        }),
        { status: 200 },
      ),
    )

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.getByText(/5s/)).toBeInTheDocument()
    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('falls back gracefully when no age data is available — no NaN, undefined, or stray Updated', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok' }],
        }),
        { status: 200 },
      ),
    )

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument()
  })
})

describe('OracleStatusBadge sessionAsOfMs detail clause', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllBadgeState()
  })

  it('renders "At close · …" for the closed session when sessionAsOfMs is set', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{
          symbol: 'AAPL',
          lastUpdateMs: 4000,
          sessionState: 'closed',
          confidence: 82,
          sessionAsOfMs: Date.UTC(2026, 4, 22, 20, 0), // 16:00 EDT
        }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText(/At close ·/)).toBeInTheDocument())
    expect(screen.getByText(/May 22/)).toBeInTheDocument()
    expect(screen.getByText(/\bEDT\b/)).toBeInTheDocument()
  })

  it('renders bare "Market Closed" when sessionAsOfMs is absent (back-compat)', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 4000, sessionState: 'closed', confidence: 82 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText('Market Closed')).toBeInTheDocument())
  })

  it('renders "After hours since …" when sessionState is after-hours + asOf is set', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{
          symbol: 'AAPL',
          lastUpdateMs: 4000,
          sessionState: 'after-hours',
          confidence: 82,
          sessionAsOfMs: Date.UTC(2026, 4, 22, 20, 0),
        }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText(/After hours since/)).toBeInTheDocument())
  })

  it('keeps "Market Open" label when sessionState is open (no redundant as-of clause)', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{
          symbol: 'AAPL',
          lastUpdateMs: 1500,
          sessionState: 'open',
          confidence: 95,
          sessionAsOfMs: Date.now(), // should be ignored
        }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    expect(screen.getByText('Market Open')).toBeInTheDocument()
    expect(screen.queryByText(/At close/)).not.toBeInTheDocument()
    expect(screen.queryByText(/After hours/)).not.toBeInTheDocument()
  })
})

describe('OracleStatusBadge provenance footer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllBadgeState()
  })

  it('renders "Source: <upstream> → StockOracleV2 (<network>)" + explorer link on detail variant', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 2000, sessionState: 'open', confidence: 90 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        chain: {
          chainId: 42069,
          signerAddress: '0xSigner',
          oracleAddresses: { stocks: '0xStocks', crypto: '0xCrypto' },
        },
        upstreams: {
          priceService: { status: 'ok', label: 'eToro demo' },
          oracleSigner: { status: 'ok' },
        },
        proof: {
          stocks: [{ rail: 'stocks', txHash: '0xaaa', blockNumber: 999, symbols: ['AAPL'], submittedAtMs: 1 }],
          crypto: [],
        },
      }), { status: 200 }),
    )

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText(/Source: eToro demo/)).toBeInTheDocument())
    expect(screen.getByText(/StockOracleV2 \(devnet\)/)).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: /View stocks oracle update 0xaaa on explorer/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('/tx/0xaaa'))
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders SwapPriceOracle publisher label for a crypto-rail symbol on detail variant', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'BTC', lastUpdateMs: 1000, sessionState: 'open', confidence: 88 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        chain: {
          chainId: 42069,
          signerAddress: '0xSigner',
          oracleAddresses: { stocks: '0xStocks', crypto: '0xCrypto' },
        },
        upstreams: { priceService: { status: 'ok', label: 'eToro demo' }, oracleSigner: { status: 'ok' } },
        proof: {
          stocks: [],
          crypto: [{ rail: 'crypto', txHash: '0xbbb', blockNumber: 1234, symbols: ['BTC'], submittedAtMs: 1 }],
        },
      }), { status: 200 }),
    )

    render(<OracleStatusBadge variant="detail" symbol="BTC" />)
    const link = await screen.findByRole('link', { name: /View crypto oracle update 0xbbb on explorer/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('/tx/0xbbb'))
    expect(link.textContent).toContain('SwapPriceOracle')
  })

  it('renders "Not yet published on chain" when proof tail is absent for the rail', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 2000, sessionState: 'open', confidence: 90 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        chain: { chainId: 42069, signerAddress: null, oracleAddresses: { stocks: null, crypto: null } },
        upstreams: { priceService: { status: 'ok', label: 'eToro demo' }, oracleSigner: { status: 'ok' } },
        proof: { stocks: [], crypto: [] },
      }), { status: 200 }),
    )

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText(/Not yet published on chain/)).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: /on explorer/ })).not.toBeInTheDocument()
  })

  it('renders "(awaiting chain)" label when chainId is null', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [{ symbol: 'AAPL', lastUpdateMs: 2000, sessionState: 'open', confidence: 90 }],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        chain: { chainId: null, signerAddress: null, oracleAddresses: { stocks: null, crypto: null } },
        upstreams: { priceService: { status: 'ok', label: 'eToro demo' }, oracleSigner: { status: 'ok' } },
        proof: { stocks: [], crypto: [] },
      }), { status: 200 }),
    )

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText(/awaiting chain/)).toBeInTheDocument())
    // Even if a stocks proof exists, with chainId=null no EXPLORER link is
    // produced. The badge itself routes to /status (task 0059) — that's a
    // separate concern, asserted by the `aria-label` filter below.
    const explorerLinks = screen
      .queryAllByRole('link')
      .filter((el) => el.getAttribute('aria-label') !== 'Open oracle status page')
    expect(explorerLinks).toHaveLength(0)
  })

  it('renders both stocks + crypto block-N links on the listing variant', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: true,
        freshCount: 2,
        totalCount: 2,
        quotes: [
          { symbol: 'AAPL', lastUpdateMs: 1000, sessionState: 'open', confidence: 95 },
          { symbol: 'BTC', lastUpdateMs: 1000, sessionState: 'open', confidence: 95 },
        ],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        chain: { chainId: 42069, signerAddress: '0xSigner', oracleAddresses: { stocks: '0xs', crypto: '0xc' } },
        upstreams: { priceService: { status: 'ok', label: 'eToro demo' }, oracleSigner: { status: 'ok' } },
        proof: {
          stocks: [{ rail: 'stocks', txHash: '0xstocks', blockNumber: 111, symbols: [], submittedAtMs: 1 }],
          crypto: [{ rail: 'crypto', txHash: '0xcrypto', blockNumber: 222, symbols: [], submittedAtMs: 1 }],
        },
      }), { status: 200 }),
    )

    render(<OracleStatusBadge />)
    await waitFor(() => expect(screen.getByText(/stocks block 111/)).toBeInTheDocument())
    expect(screen.getByText(/crypto block 222/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View stocks oracle update 0xstocks on explorer/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View crypto oracle update 0xcrypto on explorer/ })).toBeInTheDocument()
  })

  it('renders "Source: cached snapshot" + no link in the stocks-fallback live path', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    let callCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()
      callCount++
      if (url.includes('/api/status')) {
        return new Response(JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
        }), { status: 200 })
      }
      // `/api/oracle/status` (used by useOracleProvenance) — return a populated
      // payload that we want the footer to ignore because `cached === true`.
      return new Response(JSON.stringify({
        chain: { chainId: 42069, signerAddress: null, oracleAddresses: { stocks: null, crypto: null } },
        upstreams: { priceService: { status: 'ok', label: 'eToro demo' }, oracleSigner: { status: 'ok' } },
        proof: {
          stocks: [{ rail: 'stocks', txHash: '0xshould-be-hidden', blockNumber: 7, symbols: [], submittedAtMs: 1 }],
          crypto: [],
        },
      }), { status: 200 })
    })

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Source: cached snapshot')).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: /on explorer/ })).not.toBeInTheDocument()
    expect(callCount).toBeGreaterThan(0)
  })
})
