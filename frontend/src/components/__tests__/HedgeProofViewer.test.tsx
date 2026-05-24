import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest'

import HedgeProofViewer from '../HedgeProofViewer'

/**
 * Task 0065 — race-condition guards on the proof viewer's loader.
 *
 * The viewer must:
 *   1. Abort its in-flight `fetch` when its `endpoint` prop changes.
 *   2. Drop late responses from prior fetches (generation guard).
 *   3. Apply only the newest Retry's response when the user clicks
 *      Retry repeatedly with out-of-order resolution.
 *   4. Keep a loading skeleton visible during endpoint transitions —
 *      no flash of stale content.
 *   5. Abort on unmount.
 */

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void
  let reject!: (r?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HedgeProofViewer race protection (#0065)', () => {
  it('shows the latest endpoint result even when the previous endpoint fetch resolves last', async () => {
    const a = deferred<Response>()
    const b = deferred<Response>()
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/proof/A') return a.promise
      if (url === '/api/proof/B') return b.promise
      throw new Error(`unexpected url: ${url}`)
    })

    const { rerender } = render(
      <HedgeProofViewer endpoint="/api/proof/A" />,
    )
    expect(screen.getByTestId('hedge-proof-loading')).toBeInTheDocument()

    rerender(<HedgeProofViewer endpoint="/api/proof/B" />)

    b.resolve(
      jsonResponse({
        status: 'ok',
        markdown: '# B body',
        pointer: { path: 'b', timestamp: 1700000000000, summary: 'B' },
      }),
    )

    await screen.findByTestId('hedge-proof-body')
    expect(screen.getByTestId('hedge-proof-body').textContent).toContain(
      'B body',
    )

    a.resolve(
      jsonResponse({
        status: 'ok',
        markdown: '# A body',
        pointer: { path: 'a', timestamp: 1700000000000, summary: 'A' },
      }),
    )
    // Allow microtasks to flush — the late A response must NOT
    // overwrite the B view.
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.getByTestId('hedge-proof-body').textContent).toContain(
      'B body',
    )
    expect(screen.getByTestId('hedge-proof-body').textContent).not.toContain(
      'A body',
    )
  })

  it('aborts the in-flight fetch when the endpoint prop changes', () => {
    const a = deferred<Response>()
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockImplementation(() => a.promise)

    const { rerender } = render(
      <HedgeProofViewer endpoint="/api/proof/A" />,
    )
    const initOptions = fetchSpy.mock.calls[0]![1] as RequestInit | undefined
    const signal = initOptions?.signal as AbortSignal | undefined
    expect(signal).toBeDefined()
    expect(signal!.aborted).toBe(false)

    rerender(<HedgeProofViewer endpoint="/api/proof/B" />)
    expect(signal!.aborted).toBe(true)
  })

  it('aborts the in-flight fetch on unmount', () => {
    const a = deferred<Response>()
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockImplementation(() => a.promise)

    const { unmount } = render(<HedgeProofViewer endpoint="/api/proof/A" />)
    const initOptions = fetchSpy.mock.calls[0]![1] as RequestInit | undefined
    const signal = initOptions?.signal as AbortSignal | undefined
    expect(signal).toBeDefined()

    unmount()
    expect(signal!.aborted).toBe(true)
  })

  it('keeps the loading skeleton visible during an endpoint transition before the new response arrives', async () => {
    const a = deferred<Response>()
    const b = deferred<Response>()
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/proof/A') return a.promise
      if (url === '/api/proof/B') return b.promise
      throw new Error(`unexpected url: ${url}`)
    })

    const { rerender } = render(
      <HedgeProofViewer endpoint="/api/proof/A" />,
    )

    a.resolve(
      jsonResponse({
        status: 'ok',
        markdown: '# A body',
        pointer: { path: 'a', timestamp: 1700000000000, summary: 'A' },
      }),
    )
    await screen.findByTestId('hedge-proof-body')

    rerender(<HedgeProofViewer endpoint="/api/proof/B" />)
    // Loading skeleton must reappear during the transition, hiding
    // A's body so the operator never reads stale content.
    expect(screen.getByTestId('hedge-proof-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('hedge-proof-body')).toBeNull()
  })

  it('Retry triggers a fresh fetch with a new AbortSignal (regression guard for retry wiring)', async () => {
    const responses: Array<Deferred<Response>> = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockImplementation(() => {
      const d = deferred<Response>()
      responses.push(d)
      return d.promise
    })

    render(<HedgeProofViewer endpoint="/api/proof/X" />)
    responses[0]!.resolve(
      jsonResponse(
        { status: 'engine_down', reason: 'unreachable' },
        { status: 502 },
      ),
    )
    const retry = await screen.findByTestId('hedge-proof-retry')

    fireEvent.click(retry)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
    const firstSignal = (fetchSpy.mock.calls[0]![1] as RequestInit).signal
    const secondSignal = (fetchSpy.mock.calls[1]![1] as RequestInit).signal
    expect(firstSignal).toBeDefined()
    expect(secondSignal).toBeDefined()
    expect(firstSignal).not.toBe(secondSignal)

    responses[1]!.resolve(
      jsonResponse({
        status: 'ok',
        markdown: '# retried body',
        pointer: { path: 'p', timestamp: 1700000000000, summary: 's' },
      }),
    )
    await screen.findByTestId('hedge-proof-body')
    expect(screen.getByTestId('hedge-proof-body').textContent).toContain(
      'retried body',
    )
  })

  it('renders the auto-retry sub-line on engine_down (#0080)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { status: 'engine_down', reason: 'Hedge engine unreachable' },
        { status: 502 },
      ),
    )
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    const note = await screen.findByTestId('hedge-proof-error-auto-retry')
    expect(note.textContent).toBe('Auto-retrying every 10s.')
  })

  it('omits the auto-retry sub-line on invalid_id (#0080 / #0072 — deterministic verdict)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { status: 'invalid_id', reason: 'Receipt id is too long' },
        { status: 400 },
      ),
    )
    render(<HedgeProofViewer endpoint="/api/hedge/proof/x" />)
    await screen.findByTestId('hedge-proof-error')
    expect(screen.queryByTestId('hedge-proof-error-auto-retry')).toBeNull()
  })

  it('drops a late response from a stale fetch even when the prop change happens before the first fetch resolves', async () => {
    // This is the canonical race: the seq guard must drop ANY response
    // whose `mySeq !== seqRef.current` regardless of whether the fetch
    // actually saw the abort signal (some engines / proxies may finish
    // a request even after we abort).
    const a = deferred<Response>()
    const b = deferred<Response>()
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/proof/A') return a.promise
      if (url === '/api/proof/B') return b.promise
      throw new Error(`unexpected url: ${url}`)
    })

    const { rerender } = render(
      <HedgeProofViewer endpoint="/api/proof/A" />,
    )
    rerender(<HedgeProofViewer endpoint="/api/proof/B" />)

    // Resolve A FIRST (simulating a slow upstream that ignores the
    // abort). The seq guard must still drop A's body.
    a.resolve(
      jsonResponse({
        status: 'ok',
        markdown: '# A late body',
        pointer: { path: 'a', timestamp: 1700000000000, summary: 'A' },
      }),
    )
    await new Promise((r) => setTimeout(r, 0))
    // Still loading because B hasn't resolved.
    expect(screen.getByTestId('hedge-proof-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('hedge-proof-body')).toBeNull()

    b.resolve(
      jsonResponse({
        status: 'ok',
        markdown: '# B body',
        pointer: { path: 'b', timestamp: 1700000000000, summary: 'B' },
      }),
    )
    await screen.findByTestId('hedge-proof-body')
    expect(screen.getByTestId('hedge-proof-body').textContent).toContain(
      'B body',
    )
    expect(screen.getByTestId('hedge-proof-body').textContent).not.toContain(
      'A late body',
    )
  })
})

describe('HedgeProofViewer auto-retry (#0080)', () => {
  let visibilityState: DocumentVisibilityState = 'visible'
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'visibilityState',
  )

  function setVisibility(state: DocumentVisibilityState): void {
    visibilityState = state
    document.dispatchEvent(new Event('visibilitychange'))
  }

  beforeEach(() => {
    visibilityState = 'visible'
    Object.defineProperty(Document.prototype, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalDescriptor) {
      Object.defineProperty(
        Document.prototype,
        'visibilityState',
        originalDescriptor,
      )
    }
  })

  function engineDownResponse() {
    return jsonResponse(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
  }

  function okResponse() {
    return jsonResponse({
      status: 'ok',
      markdown: '# recovered\n',
      pointer: { path: 'p', timestamp: 1700000000000, summary: 'demo' },
    })
  }

  // Flush every pending microtask (and queue any new ones that the
  // resolved chains create) while fake timers are installed. The
  // viewer's `load()` does `await fetch(...)`, `await res.json()`,
  // and then `setView(...)` — three microtask hops. We loop a few
  // times to settle the chain without relying on `findBy*` which
  // would use `setTimeout` and hang under fake timers.
  async function flushMicrotasks() {
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await Promise.resolve()
      })
    }
  }

  it('schedules a fetch every 10s while sitting on engine_down', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockResolvedValue(engineDownResponse())

    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('hedge-proof-error')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('stops auto-retrying once the engine recovers to ok', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy
      .mockResolvedValueOnce(engineDownResponse())
      .mockResolvedValueOnce(okResponse())
      .mockResolvedValue(okResponse())

    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    await flushMicrotasks()
    expect(screen.getByTestId('hedge-proof-error')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('hedge-proof-body')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('does NOT auto-retry on invalid_id (deterministic verdict, regression of #0072)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockResolvedValue(
      jsonResponse(
        { status: 'invalid_id', reason: 'Receipt id is too long' },
        { status: 400 },
      ),
    )

    render(<HedgeProofViewer endpoint="/api/hedge/proof/bad" />)
    await flushMicrotasks()
    expect(screen.getByTestId('hedge-proof-error')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('pauses auto-retry while the tab is hidden and resumes on visible', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockResolvedValue(engineDownResponse())

    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    await flushMicrotasks()
    expect(screen.getByTestId('hedge-proof-error')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      setVisibility('hidden')
    })
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      setVisibility('visible')
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('clears the interval on unmount (no leaked timers)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockResolvedValue(engineDownResponse())

    const { unmount } = render(
      <HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />,
    )
    await flushMicrotasks()
    expect(screen.getByTestId('hedge-proof-error')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    unmount()
    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('manual Retry resets the auto-retry phase to +10s from the click', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch') as unknown as Mock
    fetchSpy.mockResolvedValue(engineDownResponse())

    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    await flushMicrotasks()
    expect(screen.getByTestId('hedge-proof-error')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(4_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('hedge-proof-retry'))
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    // 6s later — total elapsed = 10s since mount — the original
    // interval phase would have fired a 3rd fetch. Since Retry
    // reset the phase, no fetch should fire yet.
    await act(async () => {
      vi.advanceTimersByTime(6_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    // 4s further (total 10s since the Retry click) — the next
    // scheduled auto-retry fires.
    await act(async () => {
      vi.advanceTimersByTime(4_000)
    })
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })
})
