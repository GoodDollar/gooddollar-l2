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
  nextRetryAt: number | null
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
const FAILURE_BACKOFF_BASE_MS = 15_000
const FAILURE_BACKOFF_MAX_MS = 120_000

type Subscriber = (state: OracleStatusState) => void

interface StatusStore {
  state: OracleStatusState
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  inFlight: boolean
  failureCount: number
  cooldownUntil: number
}

const store: StatusStore = {
  state: { status: null, isLoading: true, error: null, nextRetryAt: null },
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
  failureCount: 0,
  cooldownUntil: 0,
}

/**
 * Per-symbol "when did the on-chain oracle last republish?" tracker
 * (task 0023). The status feed refreshes independently of the oracle,
 * so `quoteStatus.lastUpdateMs` only tells us when the price-service
 * last polled — it does NOT tell us when a new oracle block landed.
 *
 * We update the tracker only when `quote.oracleBlock` strictly increases,
 * so badges can render an honest "Oracle last published Xs ago (last
 * close)" line instead of the misleading "Updated 1s ago" that used to
 * lie about freshness on every status poll.
 */
interface OracleBlockTracker {
  block: number
  lastChangedAt: number
}
const oracleBlockTrackers = new Map<string, OracleBlockTracker>()

function ingestOracleBlocks(quotes: QuoteStatus[], now: number): void {
  for (const q of quotes) {
    const block = q.oracleBlock
    if (block == null || !Number.isFinite(block) || block <= 0) continue
    const prev = oracleBlockTrackers.get(q.symbol)
    if (!prev || block > prev.block) {
      oracleBlockTrackers.set(q.symbol, { block, lastChangedAt: now })
    }
  }
}

/**
 * Milliseconds since this symbol's on-chain oracle block last advanced.
 * Returns `null` when we have no observation yet (i.e. the price-service
 * has never reported an `oracleBlock` for this symbol).
 *
 * `now` is injectable so tests can advance the clock deterministically.
 */
export function getOracleAgeMs(symbol: string, now: number = Date.now()): number | null {
  const tracker = oracleBlockTrackers.get(symbol)
  if (!tracker) return null
  return Math.max(0, now - tracker.lastChangedAt)
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

async function fetchStatus(force = false): Promise<void> {
  if (store.inFlight) return
  if (typeof document !== 'undefined' && document.hidden) return
  if (!force && Date.now() < store.cooldownUntil) return

  store.inFlight = true
  try {
    const res = await fetch(PRICE_STATUS_ENDPOINT, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`Status endpoint returned ${res.status}`)
    const data: PriceServiceStatus = await res.json()
    store.failureCount = 0
    store.cooldownUntil = 0
    ingestOracleBlocks(data.quotes, Date.now())
    store.state = { status: data, isLoading: false, error: null, nextRetryAt: null }
  } catch (err) {
    store.failureCount += 1
    const backoffMs = Math.min(
      FAILURE_BACKOFF_MAX_MS,
      FAILURE_BACKOFF_BASE_MS * (2 ** Math.max(0, store.failureCount - 1)),
    )
    store.cooldownUntil = Date.now() + backoffMs
    store.state = {
      ...store.state,
      isLoading: false,
      error: err instanceof Error ? err.message : 'Oracle status unavailable',
      nextRetryAt: store.cooldownUntil,
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

export async function refreshPriceServiceStatus(force = true): Promise<void> {
  await fetchStatus(force)
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

export function __resetPriceServiceStatusStoreForTests(): void {
  if (store.intervalId !== null) {
    clearInterval(store.intervalId)
  }
  store.state = { status: null, isLoading: true, error: null, nextRetryAt: null }
  store.subscribers.clear()
  store.intervalId = null
  store.inFlight = false
  store.failureCount = 0
  store.cooldownUntil = 0
  oracleBlockTrackers.clear()
}

/**
 * Test-only seed for the oracle-block-age tracker. Sets the
 * "last advanced" timestamp for a given symbol so badge tests can
 * deterministically assert "Oracle last published X ago" copy.
 */
export function __seedOracleBlockTrackerForTests(
  symbol: string,
  block: number,
  lastChangedAt: number,
): void {
  oracleBlockTrackers.set(symbol, { block, lastChangedAt })
}
