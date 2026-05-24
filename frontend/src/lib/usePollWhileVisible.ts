/**
 * Hook that polls while the page is visible.
 *
 * Uses visibilityState instead of document.hidden so tests and non-browser
 * environments that override the standards property behave correctly.
 */
import { useEffect, useRef } from 'react'

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

export function usePollWhileVisible(callback: () => void, intervalMs: number) {
  const callbackRef = useRef(callback)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  callbackRef.current = callback

  useEffect(() => {
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const startPolling = () => {
      if (!isDocumentVisible()) return
      callbackRef.current()
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        if (isDocumentVisible()) callbackRef.current()
      }, intervalMs)
    }

    const handleVisibilityChange = () => {
      if (isDocumentVisible()) {
        startPolling()
      } else {
        stopPolling()
      }
    }

    if (isDocumentVisible()) startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs])
}
