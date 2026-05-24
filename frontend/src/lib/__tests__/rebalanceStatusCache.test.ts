import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __resetRebalanceStatusCacheForTests,
  getOrFetchUpstreamStatus,
} from '@/lib/rebalanceStatusCache'

describe('rebalanceStatusCache', () => {
  afterEach(() => {
    __resetRebalanceStatusCacheForTests()
    vi.useRealTimers()
  })

  it('serves cached value within TTL for the same key', async () => {
    const fetcher = vi.fn().mockResolvedValue({ blockNumber: 1 })
    await getOrFetchUpstreamStatus('AAPL', fetcher, 1000)
    await getOrFetchUpstreamStatus('AAPL', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('coalesces concurrent calls into a single upstream fetch (single-flight)', async () => {
    const fetcher = vi.fn().mockImplementation(
      () => new Promise((res) => setTimeout(() => res({ blockNumber: 2 }), 25)),
    )
    const results = await Promise.all([
      getOrFetchUpstreamStatus('AAPL', fetcher, 1000),
      getOrFetchUpstreamStatus('AAPL', fetcher, 1000),
      getOrFetchUpstreamStatus('AAPL', fetcher, 1000),
    ])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(results[0]).toEqual({ blockNumber: 2 })
    expect(results[1]).toEqual({ blockNumber: 2 })
    expect(results[2]).toEqual({ blockNumber: 2 })
  })

  it('different keys do not share cache', async () => {
    const fetcher = vi.fn().mockResolvedValue({ blockNumber: 3 })
    await getOrFetchUpstreamStatus('AAPL', fetcher, 1000)
    await getOrFetchUpstreamStatus('AAPL,MSFT', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not cache rejected upstream calls (next call retries)', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ blockNumber: 4 })
    await expect(getOrFetchUpstreamStatus('AAPL', fetcher, 1000))
      .rejects.toThrow('timeout')
    const ok = await getOrFetchUpstreamStatus('AAPL', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(ok).toEqual({ blockNumber: 4 })
  })

  it('expires cached values after TTL', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue({ blockNumber: 5 })
    await getOrFetchUpstreamStatus('AAPL', fetcher, 100)
    vi.setSystemTime(Date.now() + 150)
    await getOrFetchUpstreamStatus('AAPL', fetcher, 100)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('with TTL=0, every call hits upstream (cache disabled)', async () => {
    const fetcher = vi.fn().mockResolvedValue({ blockNumber: 6 })
    await getOrFetchUpstreamStatus('AAPL', fetcher, 0)
    await getOrFetchUpstreamStatus('AAPL', fetcher, 0)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
