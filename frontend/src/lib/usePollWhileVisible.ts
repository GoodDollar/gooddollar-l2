/**
 * Hook that polls while the page is visible
 */
import { useEffect, useRef } from 'react'

export function usePollWhileVisible(callback: () => void, intervalMs: number) {
  const callbackRef = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Keep callback ref current
  callbackRef.current = callback
  
  useEffect(() => {
    const startPolling = () => {
      // Call immediately
      callbackRef.current()
      
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        callbackRef.current()
      }, intervalMs)
    }
    
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }
    
    // Start initially if visible
    if (!document.hidden) {
      startPolling()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs])
}