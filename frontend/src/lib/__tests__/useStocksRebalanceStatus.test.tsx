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

describe('useStocksRebalanceStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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

    d.resolve({
      ok: true,
      json: async () => ({
        generatedAt: new Date().toISOString(),
        currentBlock: 1,
        symbols: [],
        stopActive: false,
      }),
    } as Response)
  })
})
