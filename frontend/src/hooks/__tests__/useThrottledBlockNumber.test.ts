import { describe, it, expect, vi } from 'vitest'

vi.mock('wagmi', () => ({
  useBlockNumber: vi.fn(() => ({ data: 12345n })),
}))

describe('useThrottledBlockNumber', () => {
  it('exports a hook that wraps useBlockNumber with a refetchInterval', async () => {
    const { useBlockNumber } = await import('wagmi')
    const { useThrottledBlockNumber } = await import('../useThrottledBlockNumber')

    expect(typeof useThrottledBlockNumber).toBe('function')

    const { renderHook } = await import('@testing-library/react')
    const { result } = renderHook(() => useThrottledBlockNumber())

    expect(useBlockNumber).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ refetchInterval: 10_000 }),
      }),
    )
    expect(result.current).toBe(12345)
  })

  it('returns null when block data is undefined', async () => {
    const { useBlockNumber } = await import('wagmi')
    ;(useBlockNumber as ReturnType<typeof vi.fn>).mockReturnValueOnce({ data: undefined })

    const { useThrottledBlockNumber } = await import('../useThrottledBlockNumber')
    const { renderHook } = await import('@testing-library/react')
    const { result } = renderHook(() => useThrottledBlockNumber())

    expect(result.current).toBeNull()
  })
})
