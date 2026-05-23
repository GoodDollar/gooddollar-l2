import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

interface WatchOptions {
  onLogs?: (logs: readonly unknown[]) => void
  onError?: (err: Error) => void
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
    render(<OracleUpdatesPanel />)

    expect(screen.getByText(/Listening for/i)).toBeInTheDocument()
    expect(screen.getByText(/None observed yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/Oracle event subscription degraded/i)).not.toBeInTheDocument()
  })

  it('renders the outer section with the stable jump-target id', () => {
    const { container } = render(<OracleUpdatesPanel />)
    expect(container.querySelector('section[id="panel-oracle-updates"]')).not.toBeNull()
  })

  it('renders the canned degraded card when wagmi invokes onError, without leaking the raw error', () => {
    render(<OracleUpdatesPanel />)

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
    render(<OracleUpdatesPanel />)

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
    render(<OracleUpdatesPanel />)

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
})
