import { renderHook, act } from '@testing-library/react'
import { useMarketHoursState } from '../useMarketHoursState'

describe('useMarketHoursState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns OPEN during regular trading hours', () => {
    vi.setSystemTime(new Date('2026-05-20T15:00:00Z')) // Wed 11 AM ET
    const { result } = renderHook(() => useMarketHoursState())
    expect(result.current).toBe('OPEN')
  })

  it('returns CLOSED on weekends', () => {
    vi.setSystemTime(new Date('2026-05-24T15:00:00Z')) // Sun
    const { result } = renderHook(() => useMarketHoursState())
    expect(result.current).toBe('CLOSED')
  })

  it('refreshes state after 60 seconds when market boundary crosses', () => {
    vi.setSystemTime(new Date('2026-05-20T19:59:30Z')) // Wed 3:59:30 PM ET — still OPEN
    const { result } = renderHook(() => useMarketHoursState())
    expect(result.current).toBe('OPEN')

    vi.setSystemTime(new Date('2026-05-20T20:00:30Z')) // Wed 4:00:30 PM ET — AFTER_HOURS
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current).toBe('AFTER_HOURS')
  })

  it('cleans up interval on unmount', () => {
    vi.setSystemTime(new Date('2026-05-20T15:00:00Z'))
    const clearSpy = vi.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useMarketHoursState())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})
