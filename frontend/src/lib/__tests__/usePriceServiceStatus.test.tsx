import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  usePriceServiceStatus,
  __resetPriceServiceStatusStoreForTests,
} from '../usePriceServiceStatus'

const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')

function flushMicrotasks() {
  return Promise.resolve()
}

describe('usePriceServiceStatus backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
    __resetPriceServiceStatusStoreForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    if (originalHidden) {
      Object.defineProperty(Document.prototype, 'hidden', originalHidden)
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
})
