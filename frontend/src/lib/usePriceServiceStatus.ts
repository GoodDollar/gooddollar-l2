'use client'

import { useState, useEffect } from 'react'

export interface QuoteStatus {
  symbol: string
  lastUpdateMs: number
  sessionState: string
  confidence: number
  oracleBlock?: number
  divergenceBps?: number
  productSync?: Partial<Record<'amm' | 'perps' | 'prediction' | 'lend' | 'yield', { lastSyncedBlock: number; value?: number }>>
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

function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function resolvePriceStatusEndpoint(explicitBaseUrl?: string): string {
  const baseUrl = (explicitBaseUrl ?? process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? '').trim()
  if (!baseUrl) return '/api/status/quotes'
  return `${sanitizeBaseUrl(baseUrl)}/status/quotes`
}

const PRICE_STATUS_ENDPOINT = resolvePriceStatusEndpoint()

const POLL_INTERVAL_MS = 10_000

type Subscriber = (state: OracleStatusState) => void

interface StatusStore {
  state: OracleStatusState
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  inFlight: boolean
}

const store: StatusStore = {
  state: { status: null, isLoading: true, error: null },
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

async function fetchStatus(): Promise<void> {
  if (store.inFlight) return
  if (typeof document !== 'undefined' && document.hidden) return

  store.inFlight = true
  try {
    const res = await fetch(PRICE_STATUS_ENDPOINT, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`Status endpoint returned ${res.status}`)
    const data: PriceServiceStatus = await res.json()
    store.state = { status: data, isLoading: false, error: null }
  } catch (err) {
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

export function usePriceServiceStatus(): OracleStatusState {
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

  return snapshot
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
