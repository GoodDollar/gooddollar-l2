import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { fetchWithRetry, MAX_RETRIES } from '../usePriceServiceStatus'

describe('fetchWithRetry', () => {
  const suppressedErrors: unknown[] = []
  let origOnUnhandledRejection: typeof process.listeners

  beforeEach(() => {
    vi.useFakeTimers()
    suppressedErrors.length = 0
    process.on('unhandledRejection', (e) => suppressedErrors.push(e))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    process.removeAllListeners('unhandledRejection')
  })

  it('returns data on first successful attempt', async () => {
    const mockData = { healthy: true, freshCount: 5, totalCount: 5, quotes: [], timestamp: Date.now() }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }))

    const result = await fetchWithRetry('/api/oracle/status')
    expect(result).toEqual(mockData)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on HTTP 500 and succeeds on second attempt', async () => {
    const mockData = { healthy: true, freshCount: 5, totalCount: 5, quotes: [], timestamp: Date.now() }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchWithRetry('/api/oracle/status')
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise
    expect(result).toEqual(mockData)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries on network error and succeeds on third attempt', async () => {
    const mockData = { healthy: true, freshCount: 5, totalCount: 5, quotes: [], timestamp: Date.now() }
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) })

    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchWithRetry('/api/oracle/status')
    await vi.advanceTimersByTimeAsync(2000)
    await vi.advanceTimersByTimeAsync(4000)
    const result = await promise
    expect(result).toEqual(mockData)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting all retries', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Persistent failure'))
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchWithRetry('/api/oracle/status')
    await vi.runAllTimersAsync()
    await expect(promise).rejects.toThrow('Persistent failure')
    expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES + 1)
  })

  it('throws on HTTP error after all retries exhausted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchWithRetry('/api/oracle/status')
    await vi.runAllTimersAsync()
    await expect(promise).rejects.toThrow('503')
    expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES + 1)
  })
})
