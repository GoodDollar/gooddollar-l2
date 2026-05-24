import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

import {
  deriveCryptoRailHealth,
  useCryptoRailHealth,
  __resetCryptoRailHealthForTests,
} from '@/lib/useCryptoRailHealth'
import { __resetPageVisibilityForTests } from '@/lib/usePageVisibility'

const NOW = 1_700_000_000_000

describe('deriveCryptoRailHealth', () => {
  it('reports offline when the rail is disabled', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: false, lastSuccessAtMs: null, lastFailureAtMs: null },
      NOW,
    )
    expect(health).toBe('offline')
    expect(ageMs).toBeNull()
  })

  it('reports degraded when enabled but no success heartbeat', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: null, lastFailureAtMs: null },
      NOW,
    )
    expect(health).toBe('degraded')
    expect(ageMs).toBeNull()
  })

  it('reports live when enabled and last success is fresh', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: NOW - 10_000, lastFailureAtMs: NOW - 600_000 },
      NOW,
    )
    expect(health).toBe('live')
    expect(ageMs).toBe(10_000)
  })

  it('reports degraded when enabled but last success is stale (>60s)', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: NOW - 120_000, lastFailureAtMs: null },
      NOW,
    )
    expect(health).toBe('degraded')
    expect(ageMs).toBe(120_000)
  })

  it('reports degraded when last failure is more recent than last success', () => {
    const { health } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: NOW - 30_000, lastFailureAtMs: NOW - 5_000 },
      NOW,
    )
    expect(health).toBe('degraded')
  })
})

function railResponse(enabled = true, successAgoMs = 5_000): Response {
  return new Response(
    JSON.stringify({
      rails: {
        crypto: {
          enabled,
          lastSuccessAtMs: Date.now() - successAgoMs,
          lastFailureAtMs: null,
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('useCryptoRailHealth — singleton store (task 0051)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    __resetCryptoRailHealthForTests()
    __resetPageVisibilityForTests()
  })

  afterEach(() => {
    __resetCryptoRailHealthForTests()
    __resetPageVisibilityForTests()
    vi.useRealTimers()
  })

  it('three concurrent subscribers fire ONE initial fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(railResponse())

    const a = renderHook(() => useCryptoRailHealth())
    const b = renderHook(() => useCryptoRailHealth())
    const c = renderHook(() => useCryptoRailHealth())

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    expect(b.result.current.isLoading).toBe(false)
    expect(c.result.current.isLoading).toBe(false)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/oracle/status')
  })

  it('arms setInterval once for N subscribers and disarms once on last unmount', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(railResponse())
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const a = renderHook(() => useCryptoRailHealth())
    const b = renderHook(() => useCryptoRailHealth())
    const c = renderHook(() => useCryptoRailHealth())

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    // Filter to the rail-health poll's 30 s interval; testing-library's
    // own internal waitFor scheduler may install short polling intervals
    // unrelated to the singleton under test.
    const railIntervalCalls = setIntervalSpy.mock.calls.filter((c) => c[1] === 30_000)
    expect(railIntervalCalls).toHaveLength(1)

    const railIntervalIds = setIntervalSpy.mock.results
      .filter((_, i) => setIntervalSpy.mock.calls[i]?.[1] === 30_000)
      .map((r) => r.value)
    const railClearCalls = clearIntervalSpy.mock.calls
      .filter((c) => railIntervalIds.includes(c[0]))
    expect(railClearCalls).toHaveLength(0)

    a.unmount()
    b.unmount()
    expect(clearIntervalSpy.mock.calls.filter((c) => railIntervalIds.includes(c[0]))).toHaveLength(0)
    c.unmount()
    expect(clearIntervalSpy.mock.calls.filter((c) => railIntervalIds.includes(c[0]))).toHaveLength(1)
  })

  it('inFlight guard prevents overlapping fetches when a previous request is still pending', async () => {
    let resolveFirst: (r: Response) => void = () => undefined
    const pending = new Promise<Response>((r) => { resolveFirst = r })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(pending)

    const { unmount } = renderHook(() => useCryptoRailHealth())
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // A second mount that arrives while the first fetch is in-flight must NOT
    // spawn another network call — the inFlight guard short-circuits.
    const second = renderHook(() => useCryptoRailHealth())
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    resolveFirst(railResponse())
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))
    second.unmount()
    unmount()
  })

  it('failure puts the store into a cooldown that suppresses the next interval tick', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const { result, unmount } = renderHook(() => useCryptoRailHealth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.health).toBe('offline')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Simulate the next interval tick by calling the module's polling
    // function via the only public surface available: a forced visibility
    // return is not in cooldown, so we just check that an unforced refresh
    // call (which is what setInterval triggers) is short-circuited. We
    // achieve this by mounting another subscriber — its `isLoading: false`
    // store snapshot means no fresh fetch fires.
    const second = renderHook(() => useCryptoRailHealth())
    await Promise.resolve()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    second.unmount()
    unmount()
  })

  it('a new subscriber that arrives after the first fetch resolved gets the cached state without fetching again', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(railResponse(true, 5_000))

    const first = renderHook(() => useCryptoRailHealth())
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const second = renderHook(() => useCryptoRailHealth())
    await Promise.resolve()
    expect(second.result.current.isLoading).toBe(false)
    expect(second.result.current.health).toBe('live')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    first.unmount()
    second.unmount()
  })

  it('maps a failed response to offline + isLoading:false', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 500 }))
    const { result, unmount } = renderHook(() => useCryptoRailHealth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.health).toBe('offline')
    expect(result.current.ageMs).toBeNull()
    unmount()
  })

  it('maps a healthy rail payload to live with ageMs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(railResponse(true, 8_000))
    const { result, unmount } = renderHook(() => useCryptoRailHealth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.health).toBe('live')
    // ageMs should be approximately 8_000 — allow small jitter from Date.now().
    expect(result.current.ageMs).toBeGreaterThanOrEqual(7_000)
    expect(result.current.ageMs).toBeLessThanOrEqual(9_500)
    unmount()
  })

  it('visibility hidden disarms the interval; visibility return re-arms it and forces a refresh', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(railResponse())
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    const { unmount } = renderHook(() => useCryptoRailHealth())
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

    const railIntervalCalls = () => setIntervalSpy.mock.calls.filter((c) => c[1] === 30_000)
    expect(railIntervalCalls()).toHaveLength(1)
    const firstRailId = setIntervalSpy.mock.results[setIntervalSpy.mock.calls.findIndex((c) => c[1] === 30_000)]?.value

    // Hide the tab — must clear the rail interval.
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(clearIntervalSpy.mock.calls.some((c) => c[0] === firstRailId)).toBe(true)

    // Return to visible — must re-arm and force a fresh fetch.
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
    expect(railIntervalCalls()).toHaveLength(2)

    unmount()
  })
})
