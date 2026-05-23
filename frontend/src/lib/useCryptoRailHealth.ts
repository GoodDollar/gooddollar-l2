'use client'

import { useEffect, useState } from 'react'

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
 * The hook polls every 30s so the perps page can react to backend
 * recovery without a full reload.
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

const POLL_MS = 30_000
const FRESH_WINDOW_MS = 60_000

function deriveHealth(rail: RailStatus, now: number): { health: CryptoRailHealth; ageMs: number | null } {
  if (!rail.enabled) return { health: 'offline', ageMs: null }
  const successAge = typeof rail.lastSuccessAtMs === 'number' ? now - rail.lastSuccessAtMs : null
  const failureAge = typeof rail.lastFailureAtMs === 'number' ? now - rail.lastFailureAtMs : null
  if (successAge === null) return { health: 'degraded', ageMs: null }
  if (successAge > FRESH_WINDOW_MS) return { health: 'degraded', ageMs: successAge }
  if (failureAge !== null && failureAge < successAge) return { health: 'degraded', ageMs: successAge }
  return { health: 'live', ageMs: successAge }
}

async function fetchRail(signal: AbortSignal): Promise<RailStatus | null> {
  try {
    const res = await fetch('/api/oracle/status', { signal, headers: { accept: 'application/json' } })
    if (!res.ok) return null
    const json = (await res.json()) as { rails?: { crypto?: RailStatus } }
    const crypto = json?.rails?.crypto
    if (!crypto || typeof crypto.enabled !== 'boolean') return null
    return {
      enabled: crypto.enabled,
      lastSuccessAtMs: typeof crypto.lastSuccessAtMs === 'number' ? crypto.lastSuccessAtMs : null,
      lastFailureAtMs: typeof crypto.lastFailureAtMs === 'number' ? crypto.lastFailureAtMs : null,
    }
  } catch {
    return null
  }
}

export function useCryptoRailHealth(): CryptoRailState {
  const [state, setState] = useState<CryptoRailState>({ health: 'offline', ageMs: null, isLoading: true })

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const poll = async () => {
      const rail = await fetchRail(controller.signal)
      if (cancelled) return
      if (!rail) {
        setState({ health: 'offline', ageMs: null, isLoading: false })
        return
      }
      const { health, ageMs } = deriveHealth(rail, Date.now())
      setState({ health, ageMs, isLoading: false })
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      controller.abort()
      clearInterval(timer)
    }
  }, [])

  return state
}

// Exported for unit tests so we can probe the verdict logic without
// mounting the polling hook.
export { deriveHealth as deriveCryptoRailHealth }
