'use client'

import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

/**
 * Page-scoped 1 s tick broadcaster for proof-page countdowns. One
 * `setInterval` drives every `NextPollCountdown` caption, so all three
 * panel headers tick in the same React commit and the proof page only
 * pays for one second-cadence timer. See task lane6-next-poll-countdown-
 * mounts-independent-1s-setintervals-per-panel (0066).
 */
const ProofNowContext = createContext<number | null>(null)

export function ProofNowProvider({ children }: PropsWithChildren) {
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])
  return (
    <ProofNowContext.Provider value={now}>{children}</ProofNowContext.Provider>
  )
}

/**
 * Read the page-scoped 1 s tick. When no `ProofNowProvider` is mounted
 * (isolated unit tests), captures `Date.now()` once on first call and
 * returns it stably across re-renders, so tests that don't care about
 * ticks see deterministic output and aren't forced to learn about the
 * provider (#0066).
 */
export function useProofNow(): number {
  const ctx = useContext(ProofNowContext)
  const fallbackRef = useRef<number | null>(null)
  if (ctx !== null) return ctx
  if (fallbackRef.current === null) fallbackRef.current = Date.now()
  return fallbackRef.current
}
