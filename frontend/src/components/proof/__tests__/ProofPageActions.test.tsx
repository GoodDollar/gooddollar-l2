import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
  useReadContracts: vi.fn(),
  useWatchContractEvent: vi.fn(),
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

import { useReadContract, useReadContracts, useWatchContractEvent } from 'wagmi'
import { LastDemoHedgePanel } from '../LastDemoHedgePanel'
import { LiveQuotesPanel } from '../LiveQuotesPanel'
import { OnChainOraclePanel } from '../OnChainOraclePanel'
import { OracleUpdatesPanel } from '../OracleUpdatesPanel'
import { ProofPageActions } from '../ProofPageActions'
import { ProofPanelActionsProvider } from '../ProofPanelActionsProvider'
import { ProofPipelineAxesProvider } from '../ProofPipelineAxesProvider'

const useReadContractMock = vi.mocked(useReadContract)
const useReadContractsMock = vi.mocked(useReadContracts)
const useWatchContractEventMock = vi.mocked(useWatchContractEvent)

interface FetchCounts {
  quotes: number
  hedgeProof: number
}

function installCountingFetch(): FetchCounts {
  const counts: FetchCounts = { quotes: 0, hedgeProof: 0 }
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input)
    if (url.includes('/quotes')) counts.quotes += 1
    else if (url.includes('/hedge-proof')) counts.hedgeProof += 1
    return {
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    } as Response
  }) as typeof globalThis.fetch
  return counts
}

const PROOF_PAGE_PROVIDERS = ({ children }: { children: React.ReactNode }) => (
  <ProofPipelineAxesProvider offChainIntervalMs={60_000}>
    <ProofPanelActionsProvider>{children}</ProofPanelActionsProvider>
  </ProofPipelineAxesProvider>
)

function renderProofPanels() {
  return render(
    <PROOF_PAGE_PROVIDERS>
      <ProofPageActions />
      <LiveQuotesPanel />
      <OnChainOraclePanel />
      <OracleUpdatesPanel />
      <LastDemoHedgePanel intervalMs={60_000} />
    </PROOF_PAGE_PROVIDERS>,
  )
}

describe('ProofPageActions — Refresh all panels (#0060)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useReadContractMock.mockReset()
    useReadContractsMock.mockReset()
    useWatchContractEventMock.mockReset()
    useReadContractMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useReadContract>)
    const refetch = vi.fn(() => Promise.resolve({ data: [] }))
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch,
    } as unknown as ReturnType<typeof useReadContracts>)
    useWatchContractEventMock.mockReturnValue(undefined as unknown as ReturnType<typeof useWatchContractEvent>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('renders the Refresh all panels button', () => {
    installCountingFetch()
    renderProofPanels()
    const button = screen.getByTestId('refresh-all-panels')
    expect(button.tagName).toBe('BUTTON')
    expect(button.textContent).toMatch(/refresh all panels/i)
  })

  it('clicking Refresh all panels triggers fetches across multiple panels in parallel', async () => {
    const counts = installCountingFetch()
    renderProofPanels()

    await waitFor(() => {
      expect(counts.quotes).toBeGreaterThanOrEqual(1)
      expect(counts.hedgeProof).toBeGreaterThanOrEqual(1)
    })
    const initialQuotes = counts.quotes
    const initialHedge = counts.hedgeProof

    fireEvent.click(screen.getByTestId('refresh-all-panels'))

    await waitFor(() => {
      expect(counts.quotes).toBeGreaterThan(initialQuotes)
      expect(counts.hedgeProof).toBeGreaterThan(initialHedge)
    })
  })

  it('clicking the live-quotes Retry button does NOT trigger the hedge-proof fetch (per-panel isolation)', async () => {
    const counts = installCountingFetch()
    renderProofPanels()

    await waitFor(() => {
      expect(counts.quotes).toBeGreaterThanOrEqual(1)
      expect(counts.hedgeProof).toBeGreaterThanOrEqual(1)
    })
    const initialQuotes = counts.quotes
    const initialHedge = counts.hedgeProof

    fireEvent.click(screen.getByTestId('live-quotes-retry'))

    await waitFor(() => {
      expect(counts.quotes).toBeGreaterThan(initialQuotes)
    })
    expect(counts.hedgeProof).toBe(initialHedge)
  })

  it('clicking the hedge-proof Retry button does NOT trigger the quotes fetch (per-panel isolation)', async () => {
    const counts = installCountingFetch()
    renderProofPanels()

    await waitFor(() => {
      expect(counts.quotes).toBeGreaterThanOrEqual(1)
      expect(counts.hedgeProof).toBeGreaterThanOrEqual(1)
    })
    const initialQuotes = counts.quotes
    const initialHedge = counts.hedgeProof

    fireEvent.click(screen.getByTestId('last-hedge-retry'))

    await waitFor(() => {
      expect(counts.hedgeProof).toBeGreaterThan(initialHedge)
    })
    expect(counts.quotes).toBe(initialQuotes)
  })
})
