import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'

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
import { PipelineFlowDiagram } from '../PipelineFlowDiagram'

const useReadContractMock = vi.mocked(useReadContract)

const QUOTES_OK = {
  quotes: {
    AAPL: {
      symbol: 'AAPL',
      bid: 178.5,
      ask: 178.7,
      mid: 178.6,
      cacheAge: 1_000,
      sessionState: 'Open',
    },
  },
  timestamp: Date.now(),
}

const PROOF_ENVELOPE_OK = {
  source: 'qa-proof/evidence/latest.json',
  proof: { dryRun: true, orderId: 'noop', symbol: 'AAPL' },
}

type FetchMockEntry = { ok: boolean; status: number; body: unknown }
type FetchMockHandler = (input: string) => Promise<FetchMockEntry> | FetchMockEntry

function installFetchMock(handler: FetchMockHandler) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input)
    const r = await handler(url)
    return {
      ok: r.ok,
      status: r.status,
      json: () => Promise.resolve(r.body),
    } as Response
  }) as typeof globalThis.fetch
}

function mockOnChainHealthy() {
  useReadContractMock.mockReturnValue({
    data: {
      price8: 17_860_000_000n,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      session: 0,
      confidence: 95,
      signerCount: 1,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useReadContract>)
}

function mockOnChainDegraded() {
  useReadContractMock.mockReturnValue({
    data: {
      price8: 0n,
      timestamp: 0n,
      session: 3,
      confidence: 0,
      signerCount: 0,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useReadContract>)
}

function mockOnChainUnknown() {
  useReadContractMock.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
  } as unknown as ReturnType<typeof useReadContract>)
}

const ALL_NODE_IDS = [
  'etoro',
  'price-service',
  'oracle-signer',
  'chain',
  'frontend',
  'demo-hedge',
] as const

describe('PipelineFlowDiagram', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useReadContractMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    cleanup()
  })

  it('renders six nodes labelled eToro, price-service, oracle-signer, chain, frontend, demo hedge', () => {
    mockOnChainUnknown()
    installFetchMock(() => new Promise<FetchMockEntry>(() => {}) as Promise<FetchMockEntry>)

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    const section = screen.getByTestId('pipeline-flow-diagram')
    expect(section).toBeInTheDocument()
    expect(section.getAttribute('aria-label')).toBe('Pipeline flow')

    // Scope to the desktop flow container — the strict `getByTestId`
    // would otherwise see both desktop + mobile (#0074).
    const desktop = within(screen.getByTestId('pipeline-flow-desktop'))
    for (const id of ALL_NODE_IDS) {
      const node = desktop.getByTestId(`pipeline-node-${id}`)
      expect(node).toBeInTheDocument()
    }
    expect(desktop.getByText(/eToro/i)).toBeInTheDocument()
    expect(desktop.getByText(/price-service/i)).toBeInTheDocument()
    expect(desktop.getByText(/oracle-signer/i)).toBeInTheDocument()
    expect(desktop.getByText('chain')).toBeInTheDocument()
    expect(desktop.getByText('frontend')).toBeInTheDocument()
    expect(desktop.getByText(/demo hedge/i)).toBeInTheDocument()
  })

  it('tone="unknown" on first render before any fetch resolves', () => {
    mockOnChainUnknown()
    installFetchMock(() => new Promise<FetchMockEntry>(() => {}) as Promise<FetchMockEntry>)

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    // Scope to the desktop flow container — the strict `getByTestId`
    // would otherwise see both desktop + mobile (#0074).
    const desktop = within(screen.getByTestId('pipeline-flow-desktop'))
    for (const id of ALL_NODE_IDS) {
      const node = desktop.getByTestId(`pipeline-node-${id}`)
      expect(node.getAttribute('data-tone')).toBe('unknown')
    }
  })

  it('colours nodes/edges as healthy when all axes are healthy', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    await vi.waitFor(() => {
      for (const id of ALL_NODE_IDS) {
        const node = screen.getByTestId(`pipeline-node-${id}`)
        expect(node.getAttribute('data-tone')).toBe('healthy')
      }
    })

    const edges = document.querySelectorAll('[data-testid^="pipeline-edge-"]')
    expect(edges.length).toBeGreaterThanOrEqual(5)
    edges.forEach((edge) => {
      expect(edge.getAttribute('data-tone')).toBe('healthy')
    })

    expect(screen.queryByTestId('pipeline-flow-degradation')).not.toBeInTheDocument()
  })

  it('tone="degraded" on the on-chain segment when getPriceData returns zeros', async () => {
    mockOnChainDegraded()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    await vi.waitFor(() => {
      expect(screen.getByTestId('pipeline-node-oracle-signer').getAttribute('data-tone')).toBe(
        'degraded',
      )
      expect(screen.getByTestId('pipeline-node-etoro').getAttribute('data-tone')).toBe('healthy')
    })
    expect(screen.getByTestId('pipeline-node-chain').getAttribute('data-tone')).toBe('degraded')
    expect(screen.getByTestId('pipeline-node-frontend').getAttribute('data-tone')).toBe('degraded')
    expect(screen.getByTestId('pipeline-node-price-service').getAttribute('data-tone')).toBe(
      'healthy',
    )

    const onChainEdge = screen.getByTestId('pipeline-edge-oracle-signer-chain')
    expect(onChainEdge.getAttribute('data-tone')).toBe('degraded')
  })

  it('tone="degraded" on the quotes segment when /quotes is unreachable', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('ECONNREFUSED 127.0.0.1:9300')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    await vi.waitFor(() => {
      expect(screen.getByTestId('pipeline-node-etoro').getAttribute('data-tone')).toBe('degraded')
    })
    expect(screen.getByTestId('pipeline-node-price-service').getAttribute('data-tone')).toBe(
      'degraded',
    )

    const upstreamEdge = screen.getByTestId('pipeline-edge-etoro-price-service')
    expect(upstreamEdge.getAttribute('data-tone')).toBe('degraded')
  })

  it('surfaces REASON_BY_AXIS strings below the diagram when any axis is degraded', async () => {
    mockOnChainDegraded()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: false, status: 500, body: {} }
      return { ok: false, status: 404, body: {} }
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    await vi.waitFor(() => {
      const el = screen.getByTestId('pipeline-flow-degradation')
      const text = el.textContent ?? ''
      expect(text).toContain('price-service unreachable')
      expect(text).toContain('no on-chain prices')
      expect(text).toContain('hedge-proof missing')
    })
  })

  it('renders no standalone edge `<li>` past the last node — every edge sits inside a node `<li>`', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    // Scope to the desktop flow container — the strict `getByTestId`
    // would otherwise see both desktop + mobile (#0074).
    const desktop = within(screen.getByTestId('pipeline-flow-desktop'))

    await vi.waitFor(() => {
      expect(desktop.getByTestId('pipeline-node-demo-hedge').getAttribute('data-tone')).toBe(
        'healthy',
      )
    })

    // The last node has no trailing arrow — it terminates the chain.
    const lastNode = desktop.getByTestId('pipeline-node-demo-hedge')
    expect(lastNode.querySelector('[data-testid^="pipeline-edge-"]')).toBeNull()

    // Every rendered edge lives inside the LI of the node that precedes it,
    // so flex-wrap can never strand an edge in empty space at the end of a
    // wrapped row.
    const desktopContainer = screen.getByTestId('pipeline-flow-desktop')
    const edges = desktopContainer.querySelectorAll('[data-testid^="pipeline-edge-"]')
    expect(edges).toHaveLength(5)
    edges.forEach((edge) => {
      const parentLi = edge.closest('li[data-testid^="pipeline-node-"]')
      expect(parentLi).not.toBeNull()
    })
  })

  it('the inline edge arrow inherits the same tone as its axis health', async () => {
    mockOnChainDegraded()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    await vi.waitFor(() => {
      const onChainEdge = screen.getByTestId('pipeline-edge-oracle-signer-chain')
      expect(onChainEdge.getAttribute('data-tone')).toBe('degraded')
      expect(onChainEdge.className).toMatch(/text-yellow/)
    })
  })

  it('does not leak raw transport errors into the rendered DOM', async () => {
    mockOnChainDegraded()
    installFetchMock(() => {
      throw new Error('ECONNREFUSED 10.0.0.42 super-secret-host')
    })

    render(<PipelineFlowDiagram intervalMs={60_000} />)

    const section = await vi.waitFor(() => {
      const el = screen.getByTestId('pipeline-flow-diagram')
      expect(
        screen.getByTestId('pipeline-node-etoro').getAttribute('data-tone'),
      ).toBe('degraded')
      return el
    })
    expect(section.textContent).not.toMatch(/ECONNREFUSED/)
    expect(section.textContent).not.toMatch(/10\.0\.0\.42/)
    expect(section.textContent).not.toMatch(/super-secret-host/)
  })
})
