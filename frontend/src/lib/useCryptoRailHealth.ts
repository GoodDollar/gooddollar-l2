'use client'

import { useEffect, useState } from 'react'

import { isPageHidden, subscribePageVisibility } from './usePageVisibility'

/**
 * useCryptoRailHealth — derives crypto-rail health from
 * `/api/oracle/status.rails.crypto`. Mirrors the lane's existing
 * stocks-rail surfacing (see `OracleStatusBadge` + `StalePriceBanner`)
 * but stays small because the crypto rail does not (yet) publish
 * per-quote freshness or session state — only rail-level enabled /
 * lastSuccessAtMs / lastFailureAtMs.
 *
 * Health verdict:
 *   - 'live'     — rail.enabled === true and lastSuccess within window
 *   - 'degraded' — rail.enabled === true but lastSuccess is stale or
 *                  lastFailureAtMs is more recent than lastSuccessAtMs
 *   - 'offline'  — rail.enabled === false (or status fetch failed)
 *
 * Implementation is a module-scoped singleton store — every consumer of
 * `useCryptoRailHealth()` subscribes to the same poll cycle. Mirrors
 * `useOracleProvenance` so /perps (3 call sites) issues one
 * /api/oracle/status request per 30 s instead of three. See task 0051.
 */

export type CryptoRailHealth = 'live' | 'degraded' | 'offline'

interface RailStatus {
  enabled: boolean
  lastSuccessAtMs: number | null
  lastFailureAtMs: number | null
}

interface CryptoRailState {
  health: CryptoRailHealth
  ageMs: number | null
  isLoading: boolean
}

const POLL_INTERVAL_MS = 30_000
const FRESH_WINDOW_MS = 60_000

const EMPTY_CRYPTO_RAIL: CryptoRailState = { health: 'offline', ageMs: null, isLoading: true }
const OFFLINE_AFTER_FAILURE: CryptoRailState = { health: 'offline', ageMs: null, isLoading: false }

function deriveHealth(rail: RailStatus, now: number): { health: CryptoRailHealth; ageMs: number | null } {
  if (!rail.enabled) return { health: 'offline', ageMs: null }
  const successAge = typeof rail.lastSuccessAtMs === 'number' ? now - rail.lastSuccessAtMs : null
  const failureAge = typeof rail.lastFailureAtMs === 'number' ? now - rail.lastFailureAtMs : null
  if (successAge === null) return { health: 'degraded', ageMs: null }
  if (successAge > FRESH_WINDOW_MS) return { health: 'degraded', ageMs: successAge }
  if (failureAge !== null && failureAge < successAge) return { health: 'degraded', ageMs: successAge }
  return { health: 'live', ageMs: successAge }
}

function parseRail(data: unknown): RailStatus | null {
  if (!data || typeof data !== 'object') return null
  const rails = (data as Record<string, unknown>).rails
  if (!rails || typeof rails !== 'object') return null
  const crypto = (rails as Record<string, unknown>).crypto
  if (!crypto || typeof crypto !== 'object') return null
  const c = crypto as Record<string, unknown>
  if (typeof c.enabled !== 'boolean') return null
  return {
    enabled: c.enabled,
    lastSuccessAtMs: typeof c.lastSuccessAtMs === 'number' ? c.lastSuccessAtMs : null,
    lastFailureAtMs: typeof c.lastFailureAtMs === 'number' ? c.lastFailureAtMs : null,
  }
}

type Subscriber = (state: CryptoRailState) => void

interface Store {
  state: CryptoRailState
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  inFlight: boolean
  cooldownUntil: number
  unsubscribeVisibility: (() => void) | null
}

const store: Store = {
  state: EMPTY_CRYPTO_RAIL,
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
  cooldownUntil: 0,
  unsubscribeVisibility: null,
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

async function fetchCryptoRail(force = false): Promise<void> {
  if (store.inFlight) return
  if (!force && isPageHidden()) return
  if (!force && Date.now() < store.cooldownUntil) return

  store.inFlight = true
  try {
    const res = await fetch('/api/oracle/status', {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
    if (!res.ok && res.status !== 503) throw new Error(`status ${res.status}`)
    const rail = parseRail(await res.json())
    if (!rail) {
      store.state = OFFLINE_AFTER_FAILURE
    } else {
      const { health, ageMs } = deriveHealth(rail, Date.now())
      store.state = { health, ageMs, isLoading: false }
    }
    store.cooldownUntil = 0
  } catch {
    store.state = OFFLINE_AFTER_FAILURE
    store.cooldownUntil = Date.now() + POLL_INTERVAL_MS
  } finally {
    store.inFlight = false
    notify()
  }
}

function armInterval(): void {
  if (store.intervalId !== null) return
  store.intervalId = setInterval(fetchCryptoRail, POLL_INTERVAL_MS)
}

function disarmInterval(): void {
  if (store.intervalId === null) return
  clearInterval(store.intervalId)
  store.intervalId = null
}

function startPolling(): void {
  if (typeof window === 'undefined') return
  if (store.unsubscribeVisibility === null) {
    store.unsubscribeVisibility = subscribePageVisibility((hidden) => {
      if (hidden) {
        disarmInterval()
        return
      }
      armInterval()
      void fetchCryptoRail(true)
    })
  }
  if (!isPageHidden()) armInterval()
}

function stopPolling(): void {
  if (store.subscribers.size > 0) return
  disarmInterval()
  if (store.unsubscribeVisibility) {
    store.unsubscribeVisibility()
    store.unsubscribeVisibility = null
  }
}

export function useCryptoRailHealth(): CryptoRailState {
  const [snapshot, setSnapshot] = useState<CryptoRailState>(store.state)

  useEffect(() => {
    const subscriber: Subscriber = (next) => setSnapshot(next)
    store.subscribers.add(subscriber)
    startPolling()

    if (store.state.isLoading && !store.inFlight) {
      void fetchCryptoRail()
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

export function __resetCryptoRailHealthForTests(): void {
  if (store.intervalId !== null) clearInterval(store.intervalId)
  if (store.unsubscribeVisibility) store.unsubscribeVisibility()
  store.state = EMPTY_CRYPTO_RAIL
  store.subscribers.clear()
  store.intervalId = null
  store.inFlight = false
  store.cooldownUntil = 0
  store.unsubscribeVisibility = null
}

export { deriveHealth as deriveCryptoRailHealth }
