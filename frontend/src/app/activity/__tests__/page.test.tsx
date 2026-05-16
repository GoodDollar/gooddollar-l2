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
    fetchSpy.mockImplementation((_input, init) => {
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
