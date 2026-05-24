'use client'

import { useEffect, useRef } from 'react'

/**
 * Run `callback` immediately on mount and every `intervalMs` while
 * `document.visibilityState === 'visible'`. Pause the timer when the
 * tab goes hidden; on return to visible run `callback` once and
 * restart the interval. SSR-safe.
 *
 * The callback identity may change between renders without
 * re-creating the timer — the latest function is captured via a ref.
 *
 * Used to stop background tabs from fanning out hedge-engine and
 * analytics requests for nobody. See task 0033.
 */
interface Options {
  enabled?: boolean
}

export function usePollWhileVisible(
  callback: () => void | Promise<void>,
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
      void cbRef.current()
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
      run()
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
