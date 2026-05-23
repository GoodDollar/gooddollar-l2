import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

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

describe('useStocksRebalanceStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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
})
