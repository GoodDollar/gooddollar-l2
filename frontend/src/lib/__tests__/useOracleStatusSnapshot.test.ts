/**
 * Task 0059 — useOracleStatusSnapshot singleton.
 *
 * Locks down the same singleton invariants we hold for
 * `useCryptoRailHealth` (task 0051):
 *  - one fetch per N concurrent subscribers
 *  - in-flight guard prevents overlapping fetches
 *  - failure puts the store into a cooldown
 *  - page-visibility hides the poll
 *  - `refresh()` forces a re-fetch even when in cooldown
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

import {
  useOracleStatusSnapshot,
  parseOracleStatusPayload,
  __resetOracleStatusSnapshotForTests,
} from '@/lib/useOracleStatusSnapshot'
import { __resetPageVisibilityForTests } from '@/lib/usePageVisibility'

function liveResponse(): Response {
  const now = Date.now()
  const body = {
    healthy: true,
    degraded: false,
    service: { status: 'ok' },
    rails: {
      stocks: { enabled: true, lastSuccessAtMs: now - 5_000, lastSuccessAgeMs: 5_000, lastFailureAtMs: null, lastFailureAgeMs: null },
      crypto: { enabled: true, lastSuccessAtMs: now - 8_000, lastSuccessAgeMs: 8_000, lastFailureAtMs: null, lastFailureAgeMs: null },
    },
    proof: {
      stocks: [{ rail: 'stocks', txHash: '0xabc', blockNumber: 42, symbols: ['AAPL'], submittedAtMs: now - 4_000 }],
      crypto: [{ rail: 'crypto', txHash: '0xdef', blockNumber: 43, symbols: ['BTC-USD'], submittedAtMs: now - 9_000 }],
    },
    chain: {
      chainId: 1337,
      signerAddress: '0x1234567890abcdef1234567890abcdef12345678',
      oracleAddresses: {
        stocks: '0xaaaa567890abcdef1234567890abcdef1234aaaa',
        crypto: '0xbbbb567890abcdef1234567890abcdef1234bbbb',
      },
    },
    upstreams: {
      priceService: { status: 'ok', label: 'mock' },
      oracleSigner: { status: 'ok' },
    },
    ingest: { accepted: 100, droppedJsonParse: 0, droppedShape: 0, droppedInvalidMid: 0, droppedMissingSymbol: 0 },
    failures: { stocks: [], crypto: [] },
    freshCount: 5,
    totalCount: 5,
    timestamp: now,
  }
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('parseOracleStatusPayload', () => {
  it('parses a full live payload into a typed snapshot', () => {
    const data = {
      healthy: true,
      degraded: false,
      service: { status: 'ok' },
      rails: { stocks: { enabled: true, lastSuccessAtMs: 1, lastSuccessAgeMs: 100, lastFailureAtMs: null, lastFailureAgeMs: null } },
      proof: { stocks: [{ rail: 'stocks', txHash: '0xabc', blockNumber: 7, symbols: ['AAPL'], submittedAtMs: 9 }] },
      chain: { chainId: 1337, signerAddress: '0xsig', oracleAddresses: { stocks: '0xs', crypto: '0xc' } },
      upstreams: { priceService: { status: 'ok' }, oracleSigner: { status: 'down', reason: 'pipe blew up' } },
      ingest: { accepted: 5, droppedShape: 1 },
      failures: { stocks: [{ rail: 'stocks', reason: 'oh no', attemptedAtMs: 11, symbols: ['AAPL'] }] },
      freshCount: 1,
      totalCount: 1,
      timestamp: 100,
    }
    const parsed = parseOracleStatusPayload(data)
    expect(parsed?.service.status).toBe('ok')
    expect(parsed?.rails.stocks.enabled).toBe(true)
    expect(parsed?.proof.stocks).toHaveLength(1)
    expect(parsed?.chain.signerAddress).toBe('0xsig')
    expect(parsed?.upstreams.oracleSigner.status).toBe('down')
    expect(parsed?.upstreams.oracleSigner.reason).toBe('pipe blew up')
    expect(parsed?.ingest.droppedShape).toBe(1)
    expect(parsed?.failures.stocks).toHaveLength(1)
  })

  it('returns null when given a non-object', () => {
    expect(parseOracleStatusPayload(null)).toBeNull()
    expect(parseOracleStatusPayload(42)).toBeNull()
  })

  it('tolerates missing sections with safe defaults', () => {
    const parsed = parseOracleStatusPayload({})
    expect(parsed).not.toBeNull()
    expect(parsed?.rails.stocks.enabled).toBe(false)
    expect(parsed?.rails.crypto.enabled).toBe(false)
    expect(parsed?.proof.stocks).toEqual([])
    expect(parsed?.chain.chainId).toBeNull()
    expect(parsed?.upstreams.priceService.status).toBe('unknown')
    expect(parsed?.ingest.accepted).toBe(0)
  })

  it('drops proof rows missing required fields', () => {
    const parsed = parseOracleStatusPayload({
      proof: {
        stocks: [
          { rail: 'stocks', txHash: '0xok', blockNumber: 1, symbols: ['AAPL'], submittedAtMs: 1 },
          { rail: 'stocks', blockNumber: 2 },
          { rail: 'stocks', txHash: 'notHex', blockNumber: 3 },
        ],
      },
    })
    expect(parsed?.proof.stocks).toHaveLength(1)
    expect(parsed?.proof.stocks[0]?.txHash).toBe('0xok')
  })
})

describe('useOracleStatusSnapshot — singleton store', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    __resetOracleStatusSnapshotForTests()
    __resetPageVisibilityForTests()
  })

  afterEach(() => {
    __resetOracleStatusSnapshotForTests()
    __resetPageVisibilityForTests()
    vi.useRealTimers()
  })

  it('three concurrent subscribers fire ONE initial fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(liveResponse())

    const a = renderHook(() => useOracleStatusSnapshot())
    const b = renderHook(() => useOracleStatusSnapshot())
    const c = renderHook(() => useOracleStatusSnapshot())

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    expect(b.result.current.isLoading).toBe(false)
    expect(c.result.current.isLoading).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/oracle/status')
  })

  it('arms setInterval once and disarms once on last unmount', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(liveResponse())
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const a = renderHook(() => useOracleStatusSnapshot())
    const b = renderHook(() => useOracleStatusSnapshot())

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    const ours = (calls: typeof setIntervalSpy.mock.calls) =>
      calls.filter((c) => c[1] === 30_000)
    expect(ours(setIntervalSpy.mock.calls)).toHaveLength(1)

    const ids = setIntervalSpy.mock.results
      .filter((_, i) => setIntervalSpy.mock.calls[i]?.[1] === 30_000)
      .map((r) => r.value)
    expect(clearIntervalSpy.mock.calls.filter((c) => ids.includes(c[0]))).toHaveLength(0)
    a.unmount()
    expect(clearIntervalSpy.mock.calls.filter((c) => ids.includes(c[0]))).toHaveLength(0)
    b.unmount()
    expect(clearIntervalSpy.mock.calls.filter((c) => ids.includes(c[0]))).toHaveLength(1)
  })

  it('inFlight guard prevents overlapping fetches', async () => {
    let resolveFirst: (r: Response) => void = () => undefined
    const pending = new Promise<Response>((r) => { resolveFirst = r })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(pending)

    const a = renderHook(() => useOracleStatusSnapshot())
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const b = renderHook(() => useOracleStatusSnapshot())
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    resolveFirst(liveResponse())
    await waitFor(() => expect(b.result.current.isLoading).toBe(false))
    a.unmount()
    b.unmount()
  })

  it('maps a healthy response to a parsed payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(liveResponse())
    const { result, unmount } = renderHook(() => useOracleStatusSnapshot())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.payload).not.toBeNull()
    expect(result.current.payload?.rails.stocks.enabled).toBe(true)
    expect(result.current.payload?.proof.crypto).toHaveLength(1)
    expect(result.current.error).toBeNull()
    unmount()
  })

  it('maps a failure to error + isLoading:false', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    const { result, unmount } = renderHook(() => useOracleStatusSnapshot())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('network down')
    expect(result.current.payload).toBeNull()
    unmount()
  })

  it('refresh() forces a re-fetch even while in cooldown', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('boom'))
    const { result, unmount } = renderHook(() => useOracleStatusSnapshot())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    fetchSpy.mockResolvedValue(liveResponse())
    act(() => result.current.refresh())
    await waitFor(() => expect(result.current.payload).not.toBeNull())
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    unmount()
  })

  it('visibility hidden disarms the interval', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(liveResponse())
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { result, unmount } = renderHook(() => useOracleStatusSnapshot())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const ours = () => setIntervalSpy.mock.calls.filter((c) => c[1] === 30_000)
    expect(ours()).toHaveLength(1)
    const firstId = setIntervalSpy.mock.results[
      setIntervalSpy.mock.calls.findIndex((c) => c[1] === 30_000)
    ]?.value

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(clearIntervalSpy.mock.calls.some((c) => c[0] === firstId)).toBe(true)
    unmount()
  })
})
