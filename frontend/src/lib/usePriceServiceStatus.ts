'use client'

import { useState, useEffect } from 'react'

export interface QuoteStatus {
  symbol: string
  lastUpdateMs: number
  sessionState: string
  confidence: number
}

export interface PriceServiceStatus {
  healthy: boolean
  freshCount: number
  totalCount: number
  quotes: QuoteStatus[]
  timestamp: number
}

export interface OracleStatusState {
  status: PriceServiceStatus | null
  isLoading: boolean
  error: string | null
}

const ORACLE_STATUS_URL =
  process.env.NEXT_PUBLIC_ORACLE_STATUS_URL || '/api/oracle/status'

const POLL_INTERVAL_MS = 10_000

export const MAX_RETRIES = 3

type Subscriber = (state: OracleStatusState) => void

interface StatusStore {
  state: OracleStatusState
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  inFlight: boolean
  consecutiveFailures: number
}

const store: StatusStore = {
  state: { status: null, isLoading: true, error: null },
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
  consecutiveFailures: 0,
}

export function getConsecutiveFailures(): number {
  return store.consecutiveFailures
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
): Promise<PriceServiceStatus> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error(`Status endpoint returned ${res.status}`)
      return (await res.json()) as PriceServiceStatus
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        await delay(2 ** (attempt + 1) * 1000)
      }
    }
  }
  throw lastError!
}

async function fetchStatus(): Promise<void> {
  if (store.inFlight) return
  if (typeof document !== 'undefined' && document.hidden) return

  store.inFlight = true
  try {
    const data = await fetchWithRetry(ORACLE_STATUS_URL)
    store.consecutiveFailures = 0
    store.state = { status: data, isLoading: false, error: null }
  } catch (err) {
    store.consecutiveFailures++
    store.state = {
      ...store.state,
      isLoading: false,
      error: err instanceof Error ? err.message : 'Oracle status unavailable',
    }
  } finally {
    store.inFlight = false
    notify()
  }
}

function startPolling(): void {
  if (store.intervalId !== null) return
  if (typeof window === 'undefined') return
  store.intervalId = setInterval(fetchStatus, POLL_INTERVAL_MS)
}

function stopPolling(): void {
  if (store.subscribers.size > 0) return
  if (store.intervalId !== null) {
    clearInterval(store.intervalId)
    store.intervalId = null
  }
}

export function usePriceServiceStatus(): OracleStatusState & { refresh: () => void } {
  const [snapshot, setSnapshot] = useState<OracleStatusState>(store.state)

  useEffect(() => {
    const subscriber: Subscriber = (next) => setSnapshot(next)
    store.subscribers.add(subscriber)
    startPolling()

    if (!store.state.status && !store.inFlight) {
      void fetchStatus()
    } else {
      setSnapshot(store.state)
    }

    return () => {
      store.subscribers.delete(subscriber)
      stopPolling()
    }
  }, [])

  return { ...snapshot, refresh: () => void fetchStatus() }
}

export function getSessionLabel(state: string): string {
  switch (state) {
    case 'open': return 'Market Open'
    case 'pre-market': return 'Pre-Market'
    case 'after-hours': return 'After Hours'
    case 'closed': return 'Market Closed'
    case 'halted': return 'Halted'
    default: return 'Unknown'
  }
}

export function getDominantSession(quotes: QuoteStatus[]): string {
  if (quotes.length === 0) return 'unknown'
  const counts = new Map<string, number>()
  for (const q of quotes) {
    counts.set(q.sessionState, (counts.get(q.sessionState) ?? 0) + 1)
  }
  let max = 0
  let dominant = 'unknown'
  for (const [state, count] of counts) {
    if (count > max) {
      max = count
      dominant = state
    }
  }
  return dominant
}
