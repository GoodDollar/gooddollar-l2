import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  __resetOracleStatusCacheForTests,
  getOrFetchOracleStatus,
} from '@/lib/oracleStatusCache'

describe('oracleStatusCache', () => {
  afterEach(() => {
    __resetOracleStatusCacheForTests()
    vi.useRealTimers()
  })

  it('serves cached value within TTL for the same key', async () => {
    const fetcher = vi.fn().mockResolvedValue({ generatedAt: 1 })
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 1000)
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('coalesces concurrent calls into a single upstream fetch (single-flight)', async () => {
    const fetcher = vi.fn().mockImplementation(
      () => new Promise((res) => setTimeout(() => res({ generatedAt: 2 }), 25)),
    )
    const results = await Promise.all([
      getOrFetchOracleStatus('oracle-status:default', fetcher, 1000),
      getOrFetchOracleStatus('oracle-status:default', fetcher, 1000),
      getOrFetchOracleStatus('oracle-status:default', fetcher, 1000),
    ])
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(results[0]).toEqual({ generatedAt: 2 })
    expect(results[1]).toEqual({ generatedAt: 2 })
    expect(results[2]).toEqual({ generatedAt: 2 })
  })

  it('different keys do not share cache', async () => {
    const fetcher = vi.fn().mockResolvedValue({ generatedAt: 3 })
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 1000)
    await getOrFetchOracleStatus('oracle-status:other', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not cache rejected upstream calls (next call retries)', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('both-down'))
      .mockResolvedValueOnce({ generatedAt: 4 })
    await expect(
      getOrFetchOracleStatus('oracle-status:default', fetcher, 1000),
    ).rejects.toThrow('both-down')
    const ok = await getOrFetchOracleStatus('oracle-status:default', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(ok).toEqual({ generatedAt: 4 })
  })

  it('expires cached values after TTL', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue({ generatedAt: 5 })
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 100)
    vi.setSystemTime(Date.now() + 150)
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 100)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('with TTL=0, every call hits upstream (cache disabled)', async () => {
    const fetcher = vi.fn().mockResolvedValue({ generatedAt: 6 })
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 0)
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 0)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('__resetOracleStatusCacheForTests clears both maps', async () => {
    const fetcher = vi.fn().mockResolvedValue({ generatedAt: 7 })
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 1000)
    __resetOracleStatusCacheForTests()
    await getOrFetchOracleStatus('oracle-status:default', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
