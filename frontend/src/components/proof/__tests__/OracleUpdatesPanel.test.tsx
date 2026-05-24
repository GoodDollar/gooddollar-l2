import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

interface WatchOptions {
  onLogs?: (logs: readonly unknown[]) => void
  onError?: (err: Error) => void
  enabled?: boolean
  pollingInterval?: number
}

let lastWatchOptions: WatchOptions = {}

vi.mock('wagmi', () => ({
  useWatchContractEvent: (opts: WatchOptions) => {
    lastWatchOptions = opts
  },
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    StocksPriceOracle: '0x1111111111111111111111111111111111111111',
  },
}))

vi.mock('@/lib/abi', () => ({
  PriceOracleABI: [],
}))

import { OracleUpdatesPanel } from '../OracleUpdatesPanel'
import {
  TestProofPipelineAxesProvider,
} from '../ProofPipelineAxesProvider'
import { ProofPanelActionsProvider } from '../ProofPanelActionsProvider'
import {
  type AxisHealth,
} from '../proofAxes'
import {
  DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS,
  type ProofPipelineAxesState,
} from '../useProofPipelineAxes'

/** Stable baseline; only `axes.onChain` is varied per test. */
const BASE_AXES_VALUE: ProofPipelineAxesState = {
  axes: { quotes: 'healthy', onChain: 'healthy', hedgeProof: 'healthy' },
  verdict: 'green',
  partialVerdict: 'green',
  resolvedAxisCount: 3,
  lastFullyAliveAt: null,
  lastQuotesPayload: null,
  lastQuotesAt: null,
  lastQuotesStatus: 'ok',
  lastHedgeProofPayload: null,
  lastHedgeProofAt: null,
  lastHedgeProofStatus: 'ok',
  onChainRows: [],
  onChainStatus: 'ok',
  onChainAt: null,
  cadenceMs: 5_000,
  onChainCadenceMs: 30_000,
  priceServiceUrl: 'http://localhost:9300',
  hedgeProofEndpoint: '/api/hedge-proof/latest',
  stalenessThresholdMs: 30_000,
  retryQuotes: () => Promise.resolve(),
  retryHedgeProof: () => Promise.resolve(),
  retryOnChain: () => Promise.resolve(),
}

function renderPanel(onChain: AxisHealth = 'healthy') {
  const value: ProofPipelineAxesState = {
    ...BASE_AXES_VALUE,
    axes: { ...BASE_AXES_VALUE.axes, onChain },
  }
  return render(
    <TestProofPipelineAxesProvider value={value}>
      <ProofPanelActionsProvider>
        <OracleUpdatesPanel />
      </ProofPanelActionsProvider>
    </TestProofPipelineAxesProvider>,
  )
}

describe('OracleUpdatesPanel', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    lastWatchOptions = {}
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the listening-for-events empty state on a healthy mount', () => {
    renderPanel('healthy')

    expect(screen.getByText(/Listening for/i)).toBeInTheDocument()
    expect(screen.getByText(/None observed yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/Oracle event subscription degraded/i)).not.toBeInTheDocument()
  })

  it('renders the outer section with the stable jump-target id', () => {
    const { container } = renderPanel('healthy')
    expect(container.querySelector('section[id="panel-oracle-updates"]')).not.toBeNull()
  })

  it('outer section uses flex flex-col h-full so it fills its grid cell row height (#0039)', () => {
    const { container } = renderPanel('healthy')
    const section = container.querySelector('section[id="panel-oracle-updates"]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/\bh-full\b/)
    expect(section.className).toMatch(/\bflex\b/)
    expect(section.className).toMatch(/\bflex-col\b/)
    const body = section.querySelector(':scope > div.flex-1')
    expect(body, 'expected a flex-1 body wrapper inside the panel').not.toBeNull()
  })

  it('renders the canned degraded card when wagmi invokes onError, without leaking the raw error', () => {
    renderPanel('healthy')

    act(() => {
      lastWatchOptions.onError?.(new Error('filter not found'))
    })

    expect(screen.getByText(/Oracle event subscription degraded/i)).toBeInTheDocument()
    expect(screen.getByText(/PriceUpdated subscription is in an error state/i)).toBeInTheDocument()
    expect(screen.queryByText(/filter not found/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Listening for/i)).not.toBeInTheDocument()

    const tagged = consoleErrorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === '[proof-panel]' && c[1] === 'oracle-subscription',
    )
    expect(tagged).toBeDefined()
  })

  it('clears the degraded card when a subsequent onLogs batch arrives', () => {
    renderPanel('healthy')

    act(() => {
      lastWatchOptions.onError?.(new Error('filter not found'))
    })
    expect(screen.getByText(/Oracle event subscription degraded/i)).toBeInTheDocument()

    act(() => {
      lastWatchOptions.onLogs?.([
        {
          transactionHash: '0x' + 'a'.repeat(64),
          blockNumber: 42n,
          args: { symbol: 'AAPL', price8: 19_000_000_000n, session: 0 },
        },
      ])
    })

    expect(screen.queryByText(/Oracle event subscription degraded/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Listening for/i)).not.toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('keeps cached events visible when onError fires after a successful batch', () => {
    renderPanel('healthy')

    act(() => {
      lastWatchOptions.onLogs?.([
        {
          transactionHash: '0x' + 'b'.repeat(64),
          blockNumber: 99n,
          args: { symbol: 'TSLA', price8: 25_000_000_000n, session: 0 },
        },
      ])
    })
    expect(screen.getByText('TSLA')).toBeInTheDocument()

    act(() => {
      lastWatchOptions.onError?.(new Error('websocket closed'))
    })

    expect(screen.getByText(/Oracle event subscription degraded/i)).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  // Task lane6-watch-contract-event-block-poll-rate-uncapped (#0064):
  // The watcher must (a) be capped to the canonical 5s proof-page poll
  // cadence so its `eth_blockNumber` traffic is predictable, and (b)
  // unmount when the on-chain axis cannot supply events anyway —
  // saving the RPC budget for the panels that can actually use it.
  describe('axis gating + polling interval (#0064)', () => {
    it('when on-chain axis is healthy: enabled=true and pollingInterval is the 5s default', () => {
      renderPanel('healthy')
      expect(lastWatchOptions.enabled).toBe(true)
      expect(lastWatchOptions.pollingInterval).toBe(DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS)
      expect(lastWatchOptions.pollingInterval).toBe(5_000)
    })

    it('when on-chain axis is degraded: enabled=false (no polling)', () => {
      renderPanel('degraded')
      expect(lastWatchOptions.enabled).toBe(false)
      // The cap is still forwarded so wagmi has it ready if the axis
      // recovers and the panel re-mounts the subscription.
      expect(lastWatchOptions.pollingInterval).toBe(DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS)
    })

    it('when on-chain axis is unknown (first paint): enabled=false (no polling until resolved)', () => {
      renderPanel('unknown')
      expect(lastWatchOptions.enabled).toBe(false)
    })

    it('cadence-slot caption announces "subscription paused · on-chain axis degraded" when degraded', () => {
      renderPanel('degraded')
      const status = screen.getByTestId('oracle-updates-status')
      expect(status.textContent).toMatch(/subscription paused/i)
      expect(status.textContent).toMatch(/on-chain axis degraded/i)
    })

    it('cadence-slot caption announces "subscription paused · awaiting on-chain axis" when unknown', () => {
      renderPanel('unknown')
      const status = screen.getByTestId('oracle-updates-status')
      expect(status.textContent).toMatch(/subscription paused/i)
      expect(status.textContent).toMatch(/awaiting on-chain axis/i)
    })

    it('cadence-slot caption returns to the live caption when the axis recovers to healthy', () => {
      renderPanel('healthy')
      const status = screen.getByTestId('oracle-updates-status')
      expect(status.textContent).toMatch(/live/i)
      expect(status.textContent).toMatch(/PriceUpdated events/i)
    })
  })
})
