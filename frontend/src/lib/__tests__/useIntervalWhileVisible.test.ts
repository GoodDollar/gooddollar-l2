import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIntervalWhileVisible } from '../useIntervalWhileVisible'

let visibilityState: DocumentVisibilityState = 'visible'

const originalDescriptor = Object.getOwnPropertyDescriptor(
  Document.prototype,
  'visibilityState',
)

function setVisibility(state: DocumentVisibilityState): void {
  visibilityState = state
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  visibilityState = 'visible'
  Object.defineProperty(Document.prototype, 'visibilityState', {
    configurable: true,
    get: () => visibilityState,
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  if (originalDescriptor) {
    Object.defineProperty(Document.prototype, 'visibilityState', originalDescriptor)
  }
})

describe('useIntervalWhileVisible', () => {
  it('does NOT run the callback on mount (interval-only contract)', () => {
    // Contrast with usePollWhileVisible: the relative-time labels that
    // own these intervals compute their displayed text from Date.now() at
    // render time, so a tick on mount is wasted work.
    const cb = vi.fn()
    renderHook(() => useIntervalWhileVisible(cb, 1_000))
    expect(cb).toHaveBeenCalledTimes(0)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('repeats on the interval while visible', () => {
    const cb = vi.fn()
    renderHook(() => useIntervalWhileVisible(cb, 1_000))
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(cb).toHaveBeenCalledTimes(3)
  })

  it('stops firing when the tab goes hidden', () => {
    const cb = vi.fn()
    renderHook(() => useIntervalWhileVisible(cb, 1_000))
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires once + restarts the interval when the tab returns to visible', () => {
    const cb = vi.fn()
    renderHook(() => useIntervalWhileVisible(cb, 1_000))
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(cb).toHaveBeenCalledTimes(0)
    act(() => {
      setVisibility('visible')
    })
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('does not fire on mount or interval when the tab is already hidden', () => {
    visibilityState = 'hidden'
    const cb = vi.fn()
    renderHook(() => useIntervalWhileVisible(cb, 1_000))
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('does nothing when enabled is false', () => {
    const cb = vi.fn()
    renderHook(() => useIntervalWhileVisible(cb, 1_000, { enabled: false }))
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      setVisibility('visible')
    })
    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('removes the interval and listener on unmount', () => {
    const cb = vi.fn()
    const { unmount } = renderHook(() =>
      useIntervalWhileVisible(cb, 1_000),
    )
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    unmount()
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      setVisibility('visible')
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('uses the latest callback identity without re-creating the interval', () => {
    const a = vi.fn()
    const b = vi.fn()
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useIntervalWhileVisible(cb, 1_000),
      { initialProps: { cb: a } },
    )
    rerender({ cb: b })
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(a).toHaveBeenCalledTimes(0)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('re-creates the interval when intervalMs changes', () => {
    const cb = vi.fn()
    const { rerender } = renderHook(
      ({ ms }: { ms: number }) => useIntervalWhileVisible(cb, ms),
      { initialProps: { ms: 1_000 } },
    )
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    rerender({ ms: 500 })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
