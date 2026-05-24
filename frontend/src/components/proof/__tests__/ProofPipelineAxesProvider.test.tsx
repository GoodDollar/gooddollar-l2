import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, screen, cleanup } from '@testing-library/react'
import type { PropsWithChildren } from 'react'

vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(),
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

import { useReadContracts } from 'wagmi'
import { PipelineFlowDiagram } from '../PipelineFlowDiagram'
import { PipelineStatusBanner } from '../PipelineStatusBanner'
import {
  ProofPipelineAxesProvider,
  TestProofPipelineAxesProvider,
  useProofPipelineAxesContext,
} from '../ProofPipelineAxesProvider'

const useReadContractsMock = vi.mocked(useReadContracts)

type FetchMockEntry = { ok: boolean; status: number; body: unknown }

function installFetchMock(handler: (input: string) => FetchMockEntry | Promise<FetchMockEntry>) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const r = await handler(String(input))
    return {
      ok: r.ok,
      status: r.status,
      json: () => Promise.resolve(r.body),
    } as Response
  }) as typeof globalThis.fetch
}

function mockOnChainDegraded() {
  useReadContractsMock.mockReturnValue({
    data: [
      {
        status: 'success',
        result: { price8: 0n, timestamp: 0n, session: 3, confidence: 0, signerCount: 0 },
      },
    ],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve({ data: undefined } as never),
  } as unknown as ReturnType<typeof useReadContracts>)
}

describe('ProofPipelineAxesProvider', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useReadContractsMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    cleanup()
  })

  it('throws a useful error when the context is consumed outside the provider', () => {
    expect(() => renderHook(() => useProofPipelineAxesContext())).toThrow(
      /must be used inside <ProofPipelineAxesProvider>/i,
    )
  })

  it('rollup verdict and flow nodes agree on the on-chain axis in the same render frame', async () => {
    // Same-frame agreement is the whole reason this provider exists.
    // Hand both consumers a known-degraded onChain axis directly via
    // TestProofPipelineAxesProvider and assert that:
    //   - the rollup chip renders "no on-chain prices"
    //   - the three onChain flow nodes (oracle-signer, chain, frontend)
    //     paint the `degraded` tone, NOT the `unknown` gray-pulse tone.
    function Wrap({ children }: PropsWithChildren) {
      return (
        <TestProofPipelineAxesProvider
          value={{
            axes: { quotes: 'degraded', onChain: 'degraded', hedgeProof: 'degraded' },
            verdict: 'red',
            partialVerdict: 'red',
            resolvedAxisCount: 3,
            lastFullyAliveAt: null,
            lastQuotesPayload: null,
            lastQuotesAt: null,
            lastQuotesStatus: 'error',
            lastHedgeProofPayload: null,
            lastHedgeProofAt: null,
            lastHedgeProofStatus: 'error',
            onChainRows: [],
            onChainStatus: 'error',
            onChainAt: null,
            cadenceMs: 5_000,
            onChainCadenceMs: 30_000,
            priceServiceUrl: 'http://localhost:9300',
            hedgeProofEndpoint: '/api/hedge-proof/latest',
            stalenessThresholdMs: 30_000,
            retryQuotes: () => Promise.resolve(),
            retryHedgeProof: () => Promise.resolve(),
            retryOnChain: () => Promise.resolve(),
          }}
        >
          {children}
        </TestProofPipelineAxesProvider>
      )
    }

    render(
      <Wrap>
        <PipelineStatusBanner />
        <PipelineFlowDiagram />
      </Wrap>,
    )

    const chip = screen.getByTestId('reason-chip-panel-onchain-oracle')
    expect(chip.textContent).toMatch(/no on-chain prices/i)

    for (const id of ['oracle-signer', 'chain', 'frontend']) {
      const node = screen.getByTestId(`pipeline-node-${id}`)
      expect(node.getAttribute('data-tone')).toBe('degraded')
      // The pill element is the LI's first child. Axis-bound nodes wrap
      // it in an <a> jump-link (per #0054); eToro remains a <span>.
      // Either way the per-tone border class lives on this element.
      const pill = node.firstElementChild as HTMLElement
      expect(pill.className).toMatch(/border-yellow-500\/40/)
      expect(pill.className).not.toMatch(/animate-pulse/)
    }
  })

  // Task #0067 — wagmi's TanStack Query defaults (refetchOnMount,
  // refetchOnWindowFocus, refetchOnReconnect) re-fire the multicall
  // 3-4 extra times per refresh window. Pin them off so the on-chain
  // axis fires once per `chainPanelIntervalMs` plus a manual retry.
  it('pins wagmi auto-refetch triggers off so multicall fires on schedule only (#0067)', () => {
    mockOnChainDegraded()
    installFetchMock(() => ({ ok: false, status: 503, body: {} }))

    render(
      <ProofPipelineAxesProvider
        offChainIntervalMs={60_000}
        chainPanelIntervalMs={30_000}
      >
        <PipelineFlowDiagram />
      </ProofPipelineAxesProvider>,
    )

    expect(useReadContractsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          refetchInterval: 30_000,
          staleTime: 30_000,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        }),
      }),
    )
  })

  it('integrated provider drives both consumers through the same hook', async () => {
    mockOnChainDegraded()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest')) return { ok: false, status: 500, body: {} }
      return { ok: false, status: 404, body: {} }
    })

    render(
      <ProofPipelineAxesProvider offChainIntervalMs={60_000}>
        <PipelineStatusBanner />
        <PipelineFlowDiagram />
      </ProofPipelineAxesProvider>,
    )

    // The banner and flow both resolve to the same red verdict in the
    // same render cycle — no skew between "rollup says degraded" and
    // "flow nodes still pulsing gray unknown".
    const banner = await vi.waitFor(() => {
      const el = screen.getByTestId('pipeline-status-banner')
      expect(el.getAttribute('data-status')).toBe('red')
      return el
    })
    expect(banner).toBeInTheDocument()
    for (const id of ['etoro', 'price-service', 'oracle-signer', 'chain', 'frontend']) {
      expect(screen.getByTestId(`pipeline-node-${id}`).getAttribute('data-tone')).toBe('degraded')
    }
  })
})
