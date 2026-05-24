import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Profiler, type ReactNode } from 'react'
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
import { ProofNowProvider } from '../ProofNowProvider'
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

  // Task #0070 — per-event "Xs ago" caption ticks via ProofNowProvider so
  // each row's age string updates over time without waiting for a fresh
  // event. Only the per-row leaf re-renders per tick; the panel header
  // and subscription banner stay stable.
  describe('shared-tick migration (#0070)', () => {
    function renderWithProofNow(onChain: AxisHealth = 'healthy') {
      const value: ProofPipelineAxesState = {
        ...BASE_AXES_VALUE,
        axes: { ...BASE_AXES_VALUE.axes, onChain },
      }
      return render(
        <TestProofPipelineAxesProvider value={value}>
          <ProofNowProvider>
            <ProofPanelActionsProvider>
              <OracleUpdatesPanel />
            </ProofPanelActionsProvider>
          </ProofNowProvider>
        </TestProofPipelineAxesProvider>,
      )
    }

    it('caption steps from 3s ago to 8s ago after a 5s shared tick advance — without a new event', () => {
      vi.useFakeTimers()
      const t0 = new Date('2026-05-23T13:00:00.000Z').getTime()
      vi.setSystemTime(new Date(t0))

      renderWithProofNow('healthy')

      act(() => {
        vi.setSystemTime(new Date(t0 - 3_000))
        lastWatchOptions.onLogs?.([
          {
            transactionHash: '0x' + 'a'.repeat(64),
            blockNumber: 100n,
            args: { symbol: 'AAPL', price8: 19_000_000_000n, session: 0 },
          },
        ])
        vi.setSystemTime(new Date(t0))
      })

      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText(/3s ago/)).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5_000)
      })

      expect(screen.getByText(/8s ago/)).toBeInTheDocument()
      expect(screen.queryByText(/3s ago/)).not.toBeInTheDocument()

      vi.useRealTimers()
    })

    it('panel header / empty state do not re-render every shared tick — only the RelativeAge leaves do', () => {
      vi.useFakeTimers()
      const t0 = new Date('2026-05-23T13:00:00.000Z').getTime()
      vi.setSystemTime(new Date(t0))

      let panelCommits = 0
      const Probe = ({ children }: { children: ReactNode }) => (
        <Profiler id="oracle-updates" onRender={() => { panelCommits++ }}>
          {children}
        </Profiler>
      )

      const value: ProofPipelineAxesState = {
        ...BASE_AXES_VALUE,
        axes: { ...BASE_AXES_VALUE.axes, onChain: 'healthy' },
      }
      render(
        <TestProofPipelineAxesProvider value={value}>
          <ProofNowProvider>
            <ProofPanelActionsProvider>
              <Probe>
                <OracleUpdatesPanel />
              </Probe>
            </ProofPanelActionsProvider>
          </ProofNowProvider>
        </TestProofPipelineAxesProvider>,
      )

      act(() => {
        lastWatchOptions.onLogs?.([
          {
            transactionHash: '0x' + 'b'.repeat(64),
            blockNumber: 200n,
            args: { symbol: 'TSLA', price8: 25_000_000_000n, session: 0 },
          },
        ])
      })

      const baseline = panelCommits
      act(() => {
        vi.advanceTimersByTime(3_000)
      })
      // The Profiler subtree includes the leaves, so up to one commit
      // per tick is acceptable. The contract this test enforces is
      // that we have NOT regressed back to a per-panel timer that
      // would compound with the shared 1s tick — allow up to 4
      // commits across 3 seconds.
      expect(panelCommits - baseline).toBeLessThanOrEqual(4)

      vi.useRealTimers()
    })

    it('does not call Date.now() at render-time inside OracleUpdatesPanel.tsx', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('node:fs') as typeof import('node:fs')
      const src = fs.readFileSync(
        'src/components/proof/OracleUpdatesPanel.tsx',
        'utf8',
      )
      // Date.now() is allowed exactly once: when capturing the
      // wall-clock at the moment a `PriceUpdated` event arrives
      // (`capturedAt: Date.now()`). It must NOT be called from
      // render-time formatting any more.
      const matches = src.match(/Date\.now\(\)/g) ?? []
      expect(matches.length).toBeLessThanOrEqual(1)
      expect(src).not.toMatch(/function formatRelative\b/)
    })
  })
})
