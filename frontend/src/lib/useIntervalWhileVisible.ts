'use client'

import { useEffect, useRef } from 'react'

/**
 * Visibility-aware interval primitive for cosmetic relative-time tickers.
 *
 * Repeats `callback` every `intervalMs` while
 * `document.visibilityState === 'visible'`. Pauses the timer when the
 * tab goes hidden; on return to visible runs `callback` once
 * synchronously (so the rendered text refreshes against the current
 * `Date.now()`) and restarts the interval. SSR-safe.
 *
 * **Contrast with `usePollWhileVisible`**: this helper does NOT run on
 * mount. Call sites are sub-components that already compute their
 * displayed text from `Date.now()` at render time, so the initial mount
 * already shows the correct value — a tick on mount is pure waste.
 *
 * Used by `FreshnessLabel`, `ThrottleCountdown`, and `StaleChip` inside
 * `HedgeStatusCard` so background tabs do not fan out re-renders for
 * labels nobody is reading. See task 0041.
 */
interface Options {
  enabled?: boolean
}

export function useIntervalWhileVisible(
  callback: () => void,
  intervalMs: number,
  options: Options = {},
): void {
  const { enabled = true } = options
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return
    if (typeof document === 'undefined') return

    let timer: ReturnType<typeof setInterval> | null = null
    let mounted = true

    const run = (): void => {
      if (!mounted) return
      cbRef.current()
    }

    const startInterval = (): void => {
      if (timer !== null) return
      timer = setInterval(run, intervalMs)
    }

    const stopInterval = (): void => {
      if (timer === null) return
      clearInterval(timer)
      timer = null
    }

    const onVisibility = (): void => {
      if (!mounted) return
      if (document.visibilityState === 'visible') {
        run()
        stopInterval()
        startInterval()
      } else {
        stopInterval()
      }
    }

    if (document.visibilityState === 'visible') {
      startInterval()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mounted = false
      stopInterval()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs])
}
