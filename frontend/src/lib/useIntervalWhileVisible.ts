/**
 * Hook that runs an interval while the page is visible.
 */
import { useEffect, useRef } from 'react'

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

export function useIntervalWhileVisible(callback: () => void, intervalMs: number) {
  const callbackRef = useRef(callback)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  callbackRef.current = callback

  useEffect(() => {
    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const startInterval = () => {
      if (!isDocumentVisible() || intervalRef.current) return
      intervalRef.current = setInterval(() => {
        if (isDocumentVisible()) callbackRef.current()
      }, intervalMs)
    }

    const handleVisibilityChange = () => {
      if (isDocumentVisible()) {
        startInterval()
      } else {
        stopInterval()
      }
    }

    if (isDocumentVisible()) startInterval()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs])
}
