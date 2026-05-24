/**
 * Hook that runs an interval while the page is visible
 */
import { useEffect, useRef } from 'react'

export function useIntervalWhileVisible(callback: () => void, intervalMs: number) {
  const callbackRef = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keep callback ref current
  callbackRef.current = callback
  
  useEffect(() => {
    const startInterval = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        callbackRef.current()
      }, intervalMs)
    }
    
    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval()
      } else {
        startInterval()
      }
    }
    
    // Start initially if visible
    if (!document.hidden) {
      startInterval()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs])
}