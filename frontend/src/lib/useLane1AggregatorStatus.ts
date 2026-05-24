'use client'

import { useEffect, useState } from 'react'

/**
 * Project the three lane-1 services (price-service, oracle-signer,
 * hedge-engine) out of the status-aggregator rollup at `/api/status`.
 *
 * Polls on the same 10s cadence as `usePriceServiceStatus`. The hook is
 * consumed by exactly one page (`/lane1`) so an inline `setInterval` is
 * fine — no singleton store needed yet. If a second consumer appears,
 * lift this to a shared store mirroring `usePriceServiceStatus`.
 *
 * Error semantics: never throws. On fetch failure, all three service
 * statuses flip to `unreachable` and the `error` field carries the
 * reason string so the page can render the failure-mode card.
 */

export type LaneServiceStatus = 'ok' | 'degraded' | 'unreachable' | 'unknown'

export interface LaneAggregatorService {
  status: LaneServiceStatus
  latencyMs?: number
  error?: string
  lastChecked?: string
}

export interface Lane1AggregatorState {
  priceService: LaneAggregatorService
  oracleSigner: LaneAggregatorService
  hedgeEngine: LaneAggregatorService
  isLoading: boolean
  error: string | null
}

interface RawService {
  name?: string
  status?: string
  latencyMs?: number
  error?: string
  lastChecked?: string
}

const POLL_INTERVAL_MS = 10_000
const REQUEST_TIMEOUT_MS = 5_000

const UNKNOWN: LaneAggregatorService = { status: 'unknown' }
const UNREACHABLE: LaneAggregatorService = { status: 'unreachable' }

function projectService(services: RawService[], name: string): LaneAggregatorService {
  const match = services.find((s) => s?.name === name)
  if (!match) return UNKNOWN
  const status = normalizeStatus(match.status)
  return {
    status,
    latencyMs: match.latencyMs,
    error: match.error,
    lastChecked: match.lastChecked,
  }
}

function normalizeStatus(raw: string | undefined): LaneServiceStatus {
  switch (raw) {
    case 'ok':
    case 'healthy':
      return 'ok'
    case 'degraded':
    case 'starting':
    case 'health-only':
      return 'degraded'
    case 'error':
    case 'unreachable':
    case 'down':
      return 'unreachable'
    default:
      return 'unknown'
  }
}

const INITIAL_STATE: Lane1AggregatorState = {
  priceService: UNKNOWN,
  oracleSigner: UNKNOWN,
  hedgeEngine: UNKNOWN,
  isLoading: true,
  error: null,
}

function buildUnreachableState(error: string): Lane1AggregatorState {
  return {
    priceService: UNREACHABLE,
    oracleSigner: UNREACHABLE,
    hedgeEngine: UNREACHABLE,
    isLoading: false,
    error,
  }
}

export function useLane1AggregatorStatus(): Lane1AggregatorState {
  const [state, setState] = useState<Lane1AggregatorState>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      try {
        const res = await fetch('/api/status', {
          cache: 'no-store',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        if (!res.ok) {
          if (!cancelled) setState(buildUnreachableState(`Status endpoint returned ${res.status}`))
          return
        }
        const data = (await res.json()) as { services?: RawService[] }
        const services = Array.isArray(data?.services) ? data.services : []
        if (cancelled) return
        setState({
          priceService: projectService(services, 'price-service'),
          oracleSigner: projectService(services, 'oracle-signer'),
          hedgeEngine: projectService(services, 'hedge-engine'),
          isLoading: false,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'status unavailable'
        setState(buildUnreachableState(message))
      }
    }

    void load()
    const interval = setInterval(() => {
      void load()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return state
}
