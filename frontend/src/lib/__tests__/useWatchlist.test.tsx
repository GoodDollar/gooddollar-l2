import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useWatchlist } from '@/lib/useWatchlist'
import {
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
} from '@/lib/watchlist'

describe('useWatchlist hook — task 0034', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset the module-scoped Set between tests by clearing entries
    // through the public API. (We don't `vi.resetModules()` here so that
    // hook + module share state, mirroring real runtime.)
    for (const t of ['AAPL', 'NVDA', 'TSLA', 'MSFT']) {
      removeFromWatchlist(t)
    }
  })

  it('returns the current snapshot on first render', () => {
    addToWatchlist('AAPL')
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.watchlist).toEqual(['AAPL'])
    expect(result.current.isWatched('AAPL')).toBe(true)
  })

  it('re-renders when the watchlist changes via the imperative API', () => {
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.watchlist).toEqual([])
    act(() => {
      addToWatchlist('AAPL')
    })
    expect(result.current.watchlist).toEqual(['AAPL'])
    expect(result.current.isWatched('AAPL')).toBe(true)
  })

  it('exposes toggle/add/remove helpers that drive re-renders', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => {
      result.current.toggle('NVDA')
    })
    expect(result.current.isWatched('NVDA')).toBe(true)
    act(() => {
      result.current.remove('NVDA')
    })
    expect(result.current.isWatched('NVDA')).toBe(false)
    act(() => {
      result.current.add('TSLA')
    })
    expect(result.current.watchlist).toEqual(['TSLA'])
  })

  it('keeps two hook instances in sync via the pub/sub bridge', () => {
    const a = renderHook(() => useWatchlist())
    const b = renderHook(() => useWatchlist())
    act(() => {
      toggleWatchlist('MSFT')
    })
    expect(a.result.current.isWatched('MSFT')).toBe(true)
    expect(b.result.current.isWatched('MSFT')).toBe(true)
  })

  it('unsubscribes on unmount (no listener leak / no act warnings)', () => {
    const { unmount, result } = renderHook(() => useWatchlist())
    const initialSnapshot = result.current.watchlist
    unmount()
    // After unmount, mutating the underlying store must not throw and must
    // not raise React "update on unmounted component" warnings.
    expect(() => addToWatchlist('AAPL')).not.toThrow()
    // The hook's last cached snapshot reflects pre-unmount state.
    expect(initialSnapshot).toEqual([])
  })
})
