import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import ActivityPage from '../page'

// Focused regression tests for task 0069. They lock in three properties:
//   1. The first paint (before any RPC response) does NOT render "Block #0".
//   2. When RPC fails, the page shows a visible error banner with a Retry
//      button — not a silent "Live" pulse beside a zero counter.
//   3. The Retry button re-issues the fetch and recovers the live counter.

// Build a fresh Response per call — Response bodies can only be read once,
// so a single mockResolvedValue instance would lock after the first .json().
function jsonRpcOk(result: unknown) {
  return new Response(JSON.stringify({ jsonrpc: '2.0', result, id: 1 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ActivityPage — connecting / error / recovery states (task 0069)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.useRealTimers()
  })

  it('shows a "Connecting…" subtitle on first paint, never "Block #0"', () => {
    // Never resolve — we are asserting the synchronous initial render.
    fetchSpy.mockImplementation(() => new Promise(() => {}))
    render(<ActivityPage />)
    const subtitle = screen.getByTestId('activity-subtitle')
    expect(subtitle.textContent).toMatch(/Connecting/i)
    expect(subtitle.textContent).not.toMatch(/Block #0/)
  })

  it('shows a visible RPC error banner with a Retry button when the chain is unreachable', async () => {
    fetchSpy.mockImplementation(() => Promise.resolve(new Response('boom', { status: 502 })))
    render(<ActivityPage />)

    const banner = await screen.findByTestId('activity-rpc-error', {}, { timeout: 3000 })
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toMatch(/couldn’t reach the chain rpc/i)
    expect(screen.getByRole('button', { name: /retry chain rpc fetch/i })).toBeInTheDocument()
    // Status indicator should NOT lie about being live when RPC is down.
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
    // Subtitle must still be the Connecting line, not "Block #0".
    const subtitle = screen.getByTestId('activity-subtitle')
    expect(subtitle.textContent).not.toMatch(/Block #0/)
  })

  it('clicking Retry re-issues the fetch and recovers the live counter', async () => {
    // First batch of calls fail; after retry, return healthy data.
    let healthy = false
    fetchSpy.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      if (!healthy) {
        return Promise.resolve(new Response('boom', { status: 502 }))
      }
      // Parse the request body to figure out which RPC method is being called
      // so we can return shape-appropriate responses.
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      if (body.method === 'eth_blockNumber') {
        return Promise.resolve(jsonRpcOk('0x1a6ce')) // 108_238
      }
      if (body.method === 'eth_getBlockByNumber') {
        return Promise.resolve(
          jsonRpcOk({
            number: '0x1a6ce',
            hash: '0xabc',
            timestamp: '0x66000000',
            gasUsed: '0x0',
            gasLimit: '0x1c9c380',
            transactions: [],
          }),
        )
      }
      // Default for getBalance / getTransactionCount / getBlockTransactionCountByNumber etc.
      return Promise.resolve(jsonRpcOk('0x0'))
    })

    render(<ActivityPage />)
    const retry = await screen.findByRole('button', { name: /retry chain rpc fetch/i })

    healthy = true
    await act(async () => {
      fireEvent.click(retry)
    })

    await waitFor(
      () => {
        expect(screen.queryByTestId('activity-rpc-error')).not.toBeInTheDocument()
      },
      { timeout: 4000 },
    )
    expect(screen.getByTestId('activity-subtitle').textContent).toMatch(/Block #108,238/)
  })
})

// Performance regression tests for task 0096. They lock in three properties
// of the activity page's polling and fetch behaviour:
//   1. All `eth_getTransactionReceipt` calls are dispatched in PARALLEL —
//      the page must not nest an `await rpcCall(...)` inside a `for (tx)`
//      loop, because that serializes N receipt fetches and dominates TTI.
//   2. The 10s polling `setInterval` tick is a NO-OP while the tab is
//      hidden (`document.visibilityState === 'hidden'`). Forgotten tabs
//      must not keep beating the RPC.
//   3. When `eth_blockNumber` returns the SAME value as the prior tick,
//      the 20-block sweep + receipt fanout + tester-stats refetch are
//      SKIPPED. Half of all polls on a quiet chain were wasted work.
describe('ActivityPage — performance (task 0096)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  // Track the original descriptor so we can restore it cleanly.
  const originalVisibility = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'visibilityState',
  )

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.useRealTimers()
    // Restore visibilityState to the default jsdom behaviour for the next test.
    try {
      if (originalVisibility) {
        Object.defineProperty(Document.prototype, 'visibilityState', originalVisibility)
      } else {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          configurable: true,
        })
      }
    } catch {
      /* ignore */
    }
  })

  it('dispatches all eth_getTransactionReceipt calls in parallel (no nested await)', async () => {
    // 20 blocks × 2 txs = 40 receipt calls expected.
    // Receipt mock delays each response by 50ms — if receipts are
    // serialised, the test will only see ~10 calls within 500ms; if they
    // are parallel, all 40 fire immediately.
    let receiptCallCount = 0
    const RECEIPT_DELAY_MS = 50

    fetchSpy.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      const method = body.method as string
      const params = (body.params as unknown[]) || []

      if (method === 'eth_blockNumber') {
        return Promise.resolve(jsonRpcOk('0x14')) // 20
      }
      if (method === 'eth_getBlockByNumber') {
        const blockHex = params[0] as string
        return Promise.resolve(
          jsonRpcOk({
            number: blockHex,
            hash: '0xabc',
            timestamp: '0x66000000',
            gasUsed: '0x0',
            gasLimit: '0x1c9c380',
            transactions: [
              { hash: `${blockHex}_a`, from: '0x1', to: '0x2', value: '0x0' },
              { hash: `${blockHex}_b`, from: '0x1', to: '0x2', value: '0x0' },
            ],
          }),
        )
      }
      if (method === 'eth_getTransactionReceipt') {
        receiptCallCount++
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(jsonRpcOk({ status: '0x1', gasUsed: '0x5208' }))
          }, RECEIPT_DELAY_MS)
        })
      }
      return Promise.resolve(jsonRpcOk('0x0'))
    })

    render(<ActivityPage />)

    // Wait until all 40 receipt calls have been DISPATCHED.
    // Parallel: completes within ~50ms (microtasks + Promise.all flush).
    // Serial: by 500ms only ~10 calls would be in flight.
    await waitFor(
      () => {
        expect(receiptCallCount).toBe(40)
      },
      { timeout: 500, interval: 25 },
    )
  })

  it('skips polling tick when document.visibilityState === "hidden"', async () => {
    vi.useFakeTimers()

    fetchSpy.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      const method = body.method as string
      if (method === 'eth_blockNumber') return Promise.resolve(jsonRpcOk('0x14'))
      if (method === 'eth_getBlockByNumber')
        return Promise.resolve(
          jsonRpcOk({
            number: '0x14',
            hash: '0xabc',
            timestamp: '0x66000000',
            gasUsed: '0x0',
            gasLimit: '0x1c9c380',
            transactions: [],
          }),
        )
      return Promise.resolve(jsonRpcOk('0x0'))
    })

    render(<ActivityPage />)

    // Drain microtasks for the initial fetch chain.
    // advanceTimersByTimeAsync(0) flushes pending microtasks; we call it a
    // few times to let multiple `await` rungs of the rpcCall chain settle.
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    fetchSpy.mockClear()

    // Hide the tab.
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    // Fire the 10s polling tick.
    await vi.advanceTimersByTimeAsync(10_000)

    // No new fetches should have been issued while the tab was hidden.
    expect(fetchSpy).not.toHaveBeenCalled()

    // Now bring the tab back. fetchData() should fire immediately,
    // not wait another 10s.
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // A fresh eth_blockNumber should have fired in response to the
    // visibilitychange → visible transition.
    const blockNumberCalls = fetchSpy.mock.calls.filter((call: Parameters<typeof fetch>) => {
      const init = call[1] as RequestInit | undefined
      if (!init?.body) return false
      try {
        const body = JSON.parse(String(init.body))
        return body.method === 'eth_blockNumber'
      } catch {
        return false
      }
    })
    expect(blockNumberCalls.length).toBeGreaterThan(0)
  })

  it('skips 20-block sweep + tester stats when eth_blockNumber is unchanged', async () => {
    vi.useFakeTimers()

    let blockNumberCalls = 0
    let blockByNumberCalls = 0
    let balanceCalls = 0
    let nonceCalls = 0

    fetchSpy.mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      const method = body.method as string
      if (method === 'eth_blockNumber') {
        blockNumberCalls++
        return Promise.resolve(jsonRpcOk('0x14')) // always 20 — never advances
      }
      if (method === 'eth_getBlockByNumber') {
        blockByNumberCalls++
        return Promise.resolve(
          jsonRpcOk({
            number: '0x14',
            hash: '0xabc',
            timestamp: '0x66000000',
            gasUsed: '0x0',
            gasLimit: '0x1c9c380',
            transactions: [],
          }),
        )
      }
      if (method === 'eth_getBalance') {
        balanceCalls++
        return Promise.resolve(jsonRpcOk('0x0'))
      }
      if (method === 'eth_getTransactionCount') {
        nonceCalls++
        return Promise.resolve(jsonRpcOk('0x0'))
      }
      return Promise.resolve(jsonRpcOk('0x0'))
    })

    render(<ActivityPage />)

    // Drain microtasks for the initial full fetch.
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    // Snapshot post-initial counts.
    const initialBlockNumber = blockNumberCalls
    const initialBlockByNumber = blockByNumberCalls
    const initialBalance = balanceCalls
    const initialNonce = nonceCalls

    // The initial fetch must have done a full sweep — otherwise the test
    // setup is wrong.
    expect(initialBlockByNumber).toBeGreaterThan(0)

    // Fire the 10s polling tick.
    await vi.advanceTimersByTimeAsync(10_000)
    await vi.advanceTimersByTimeAsync(0)

    // Only one extra eth_blockNumber probe should have fired. The 20-block
    // sweep + tester-stats refetch must be SKIPPED because the block hasn't
    // advanced.
    expect(blockNumberCalls).toBe(initialBlockNumber + 1)
    expect(blockByNumberCalls).toBe(initialBlockByNumber)
    expect(balanceCalls).toBe(initialBalance)
    expect(nonceCalls).toBe(initialNonce)
  })
})
