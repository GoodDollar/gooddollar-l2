import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { __resetPageVisibilityForTests } from '@/lib/usePageVisibility'
import { useStocksRebalanceStatus } from '@/lib/useStocksRebalanceStatus'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function makeRebalanceResponse(): Response {
  return {
    ok: true,
    json: async () => ({
      generatedAt: new Date().toISOString(),
      currentBlock: 1,
      symbols: [],
      stopActive: false,
    }),
  } as Response
}

const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
const originalVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => state === 'hidden',
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useStocksRebalanceStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    __resetPageVisibilityForTests()
    if (originalHidden) {
      Object.defineProperty(Document.prototype, 'hidden', originalHidden)
    }
    if (originalVisibility) {
      Object.defineProperty(Document.prototype, 'visibilityState', originalVisibility)
    }
  })

  it('dedupes in-flight initial request during strict-mode remount for the same symbols URL', async () => {
    const d = deferred<Response>()
    const fetchMock = vi.fn(() => d.promise)
    vi.stubGlobal('fetch', fetchMock)

    renderHook(
      () => useStocksRebalanceStatus(['AAPL', 'MSFT', 'AAPL']),
      { wrapper: StrictMode },
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    d.resolve(makeRebalanceResponse())
  })

  it('does not re-fetch when caller passes a new array literal with the same content', async () => {
    const fetchMock = vi.fn(async () => makeRebalanceResponse())
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderHook(
      ({ s }: { s: string[] }) => useStocksRebalanceStatus(s),
      { initialProps: { s: ['AAPL'] } },
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    rerender({ s: ['AAPL'] })
    rerender({ s: ['AAPL'] })
    rerender({ s: ['aapl'] })
    rerender({ s: [' AAPL '] })

    await Promise.resolve()
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-fetches exactly once when the symbol content changes', async () => {
    const fetchMock = vi.fn(async () => makeRebalanceResponse())
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderHook(
      ({ s }: { s: string[] }) => useStocksRebalanceStatus(s),
      { initialProps: { s: ['AAPL'] } },
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    rerender({ s: ['MSFT'] })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  it('pauses polling while hidden and fires an immediate fetch on resume', async () => {
    setVisibility('visible')
    const fetchMock = vi.fn(async () => makeRebalanceResponse())
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()

    renderHook(() => useStocksRebalanceStatus(['AAPL']))

    await act(async () => {
      await Promise.resolve()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      setVisibility('hidden')
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      setVisibility('visible')
      await Promise.resolve()
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
