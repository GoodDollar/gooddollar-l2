import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __resetPageVisibilityForTests } from '../usePageVisibility'
import {
  usePriceServiceStatus,
  __resetPriceServiceStatusStoreForTests,
} from '../usePriceServiceStatus'

const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
const originalVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')

function flushMicrotasks() {
  return Promise.resolve()
}

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

describe('usePriceServiceStatus backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setVisibility('visible')
    __resetPageVisibilityForTests()
    __resetPriceServiceStatusStoreForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    __resetPageVisibilityForTests()
    if (originalHidden) {
      Object.defineProperty(Document.prototype, 'hidden', originalHidden)
    }
    if (originalVisibility) {
      Object.defineProperty(Document.prototype, 'visibilityState', originalVisibility)
    }
  })

  it('backs off retries after a failed status request', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderHook(() => usePriceServiceStatus())
    await act(async () => {
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('applies exponential cooldown and resets cadence after a success', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline-1'))
      .mockRejectedValueOnce(new Error('offline-2'))
      .mockResolvedValue({ ok: true, json: async () => ({ healthy: true, freshCount: 1, totalCount: 1, quotes: [], timestamp: Date.now() }) })
      .mockResolvedValue({ ok: true, json: async () => ({ healthy: true, freshCount: 1, totalCount: 1, quotes: [], timestamp: Date.now() }) })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderHook(() => usePriceServiceStatus())
    await act(async () => {
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(4)

    unmount()
  })

  it('stops polling while hidden and fires an immediate poll on resume', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        healthy: true,
        freshCount: 1,
        totalCount: 1,
        quotes: [],
        timestamp: Date.now(),
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = renderHook(() => usePriceServiceStatus())
    await act(async () => {
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      setVisibility('hidden')
      await vi.advanceTimersByTimeAsync(60_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      setVisibility('visible')
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      await flushMicrotasks()
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    unmount()
  })
})
