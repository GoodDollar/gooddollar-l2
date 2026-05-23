import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePollWhileVisible } from '../usePollWhileVisible'

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

describe('usePollWhileVisible', () => {
  it('calls the callback once immediately on mount when visible', () => {
    const cb = vi.fn()
    renderHook(() => usePollWhileVisible(cb, 1_000))
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('repeats on the interval while visible', () => {
    const cb = vi.fn()
    renderHook(() => usePollWhileVisible(cb, 1_000))
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(2)
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(cb).toHaveBeenCalledTimes(4)
  })

  it('stops firing when the tab goes hidden', () => {
    const cb = vi.fn()
    renderHook(() => usePollWhileVisible(cb, 1_000))
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires immediately + restarts the interval when the tab returns to visible', () => {
    const cb = vi.fn()
    renderHook(() => usePollWhileVisible(cb, 1_000))
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      setVisibility('visible')
    })
    expect(cb).toHaveBeenCalledTimes(2)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(cb).toHaveBeenCalledTimes(3)
  })

  it('does not fire on mount when the tab is already hidden', () => {
    visibilityState = 'hidden'
    const cb = vi.fn()
    renderHook(() => usePollWhileVisible(cb, 1_000))
    expect(cb).toHaveBeenCalledTimes(0)
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('does nothing when enabled is false', () => {
    const cb = vi.fn()
    renderHook(() => usePollWhileVisible(cb, 1_000, { enabled: false }))
    expect(cb).toHaveBeenCalledTimes(0)
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
    const { unmount } = renderHook(() => usePollWhileVisible(cb, 1_000))
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
      ({ cb }: { cb: () => void }) => usePollWhileVisible(cb, 1_000),
      { initialProps: { cb: a } },
    )
    expect(a).toHaveBeenCalledTimes(1)
    rerender({ cb: b })
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })
})
