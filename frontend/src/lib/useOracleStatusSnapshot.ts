'use client'

/**
 * useOracleStatusSnapshot — module-scoped singleton store that polls
 * `/api/oracle/status` once per 30 s and exposes the full snapshot
 * payload to /status (task 0059).
 *
 * Distinct from `useCryptoRailHealth` (rail-level health verdict) and
 * `useOracleProvenance` (provenance subset for the badge footer) by
 * surface area only — all three hooks deliberately read from the same
 * server-side TTL+single-flight cache (task 0048), so the upstream
 * pair (`/status/quotes` + `/proof`) is fetched at most ~once per
 * second regardless of how many surfaces are mounted.
 *
 * The /status page needs the entire payload (rails + proof tails +
 * chain + upstreams + ingest counters + recent failures + service
 * verdict) in one consistent snapshot, so we expose `payload` raw
 * instead of carving narrow types per consumer.
 */

import { useEffect, useState } from 'react'

import { isPageHidden, subscribePageVisibility } from './usePageVisibility'

export interface OracleProofRow {
  rail: 'stocks' | 'crypto'
  txHash: string
  blockNumber: number
  symbols: string[]
  submittedAtMs: number
  mids?: Record<string, number>
}

export interface OracleRailStatus {
  enabled: boolean
  lastSuccessAtMs: number | null
  lastSuccessAgeMs: number | null
  lastFailureAtMs: number | null
  lastFailureAgeMs: number | null
}

export interface OracleUpstreamStatus {
  status: 'ok' | 'down' | 'unknown'
  reason?: string
  label?: string
}

export interface OracleIngestStats {
  accepted: number
  droppedJsonParse: number
  droppedShape: number
  droppedInvalidMid: number
  droppedMissingSymbol: number
  lastDroppedAtMs?: number
  lastDroppedReason?: string
}

export interface OracleProofFailure {
  rail: 'stocks' | 'crypto'
  reason: string
  errorClass?: string
  symbols: string[]
  attemptedAtMs: number
}

export interface OracleChainInfo {
  chainId: number | null
  signerAddress: string | null
  oracleAddresses: { stocks: string | null; crypto: string | null }
}

export interface OracleStatusPayload {
  service: { status: 'ok' | 'degraded' | 'unknown'; reason?: string }
  rails: { stocks: OracleRailStatus; crypto: OracleRailStatus }
  proof: { stocks: OracleProofRow[]; crypto: OracleProofRow[] }
  chain: OracleChainInfo
  upstreams: {
    priceService: OracleUpstreamStatus
    oracleSigner: OracleUpstreamStatus
  }
  ingest: OracleIngestStats
  failures: { stocks: OracleProofFailure[]; crypto: OracleProofFailure[] }
  freshCount: number
  totalCount: number
  healthy: boolean
  degraded: boolean
  timestamp: number
}

export interface OracleStatusSnapshot {
  payload: OracleStatusPayload | null
  isLoading: boolean
  lastFetchedAtMs: number | null
  error: string | null
  refresh: () => void
}

const POLL_INTERVAL_MS = 30_000

const INITIAL: Omit<OracleStatusSnapshot, 'refresh'> = {
  payload: null,
  isLoading: true,
  lastFetchedAtMs: null,
  error: null,
}

type Subscriber = (state: Omit<OracleStatusSnapshot, 'refresh'>) => void

interface Store {
  state: Omit<OracleStatusSnapshot, 'refresh'>
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  inFlight: boolean
  cooldownUntil: number
  unsubscribeVisibility: (() => void) | null
}

const store: Store = {
  state: INITIAL,
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
  cooldownUntil: 0,
  unsubscribeVisibility: null,
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

function pickRail(raw: unknown): OracleRailStatus {
  const empty: OracleRailStatus = {
    enabled: false,
    lastSuccessAtMs: null,
    lastSuccessAgeMs: null,
    lastFailureAtMs: null,
    lastFailureAgeMs: null,
  }
  if (!raw || typeof raw !== 'object') return empty
  const r = raw as Record<string, unknown>
  const num = (k: string): number | null => {
    const v = r[k]
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  }
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : false,
    lastSuccessAtMs: num('lastSuccessAtMs'),
    lastSuccessAgeMs: num('lastSuccessAgeMs'),
    lastFailureAtMs: num('lastFailureAtMs'),
    lastFailureAgeMs: num('lastFailureAgeMs'),
  }
}

function pickProofRows(raw: unknown): OracleProofRow[] {
  if (!Array.isArray(raw)) return []
  const out: OracleProofRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    if (typeof r.txHash !== 'string' || !r.txHash.startsWith('0x')) continue
    if (typeof r.blockNumber !== 'number') continue
    const rail = r.rail === 'stocks' || r.rail === 'crypto' ? r.rail : null
    if (!rail) continue
    const mids = r.mids && typeof r.mids === 'object'
      ? Object.fromEntries(
          Object.entries(r.mids as Record<string, unknown>).filter(
            (entry): entry is [string, number] => typeof entry[1] === 'number',
          ),
        )
      : undefined
    out.push({
      rail,
      txHash: r.txHash,
      blockNumber: r.blockNumber,
      symbols: Array.isArray(r.symbols) ? r.symbols.filter((s): s is string => typeof s === 'string') : [],
      submittedAtMs: typeof r.submittedAtMs === 'number' ? r.submittedAtMs : 0,
      ...(mids ? { mids } : {}),
    })
  }
  return out
}

function pickUpstream(raw: unknown): OracleUpstreamStatus {
  if (!raw || typeof raw !== 'object') return { status: 'unknown' }
  const r = raw as Record<string, unknown>
  const status = r.status === 'ok' || r.status === 'down' ? r.status : 'unknown'
  const reason = typeof r.reason === 'string' ? r.reason : undefined
  const label = typeof r.label === 'string' ? r.label : undefined
  const out: OracleUpstreamStatus = { status }
  if (reason !== undefined) out.reason = reason
  if (label !== undefined) out.label = label
  return out
}

function pickFailures(raw: unknown): OracleProofFailure[] {
  if (!Array.isArray(raw)) return []
  const out: OracleProofFailure[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const rail = r.rail === 'stocks' || r.rail === 'crypto' ? r.rail : null
    if (!rail) continue
    if (typeof r.reason !== 'string') continue
    out.push({
      rail,
      reason: r.reason,
      errorClass: typeof r.errorClass === 'string' ? r.errorClass : undefined,
      symbols: Array.isArray(r.symbols) ? r.symbols.filter((s): s is string => typeof s === 'string') : [],
      attemptedAtMs: typeof r.attemptedAtMs === 'number' ? r.attemptedAtMs : 0,
    })
  }
  return out
}

export function parseOracleStatusPayload(data: unknown): OracleStatusPayload | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  const service = obj.service && typeof obj.service === 'object'
    ? obj.service as Record<string, unknown>
    : {}
  const serviceStatus = service.status === 'ok' || service.status === 'degraded'
    ? service.status
    : 'unknown'

  const rails = obj.rails && typeof obj.rails === 'object' ? obj.rails as Record<string, unknown> : {}
  const proof = obj.proof && typeof obj.proof === 'object' ? obj.proof as Record<string, unknown> : {}
  const chain = obj.chain && typeof obj.chain === 'object' ? obj.chain as Record<string, unknown> : {}
  const upstreams = obj.upstreams && typeof obj.upstreams === 'object' ? obj.upstreams as Record<string, unknown> : {}
  const ingest = obj.ingest && typeof obj.ingest === 'object' ? obj.ingest as Record<string, unknown> : {}
  const failures = obj.failures && typeof obj.failures === 'object' ? obj.failures as Record<string, unknown> : {}
  const addrs = chain.oracleAddresses && typeof chain.oracleAddresses === 'object'
    ? chain.oracleAddresses as Record<string, unknown>
    : {}

  const numOrZero = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

  return {
    service: {
      status: serviceStatus,
      ...(typeof service.reason === 'string' ? { reason: service.reason } : {}),
    },
    rails: {
      stocks: pickRail(rails.stocks),
      crypto: pickRail(rails.crypto),
    },
    proof: {
      stocks: pickProofRows(proof.stocks),
      crypto: pickProofRows(proof.crypto),
    },
    chain: {
      chainId: typeof chain.chainId === 'number' ? chain.chainId : null,
      signerAddress: typeof chain.signerAddress === 'string' ? chain.signerAddress : null,
      oracleAddresses: {
        stocks: typeof addrs.stocks === 'string' ? addrs.stocks : null,
        crypto: typeof addrs.crypto === 'string' ? addrs.crypto : null,
      },
    },
    upstreams: {
      priceService: pickUpstream(upstreams.priceService),
      oracleSigner: pickUpstream(upstreams.oracleSigner),
    },
    ingest: {
      accepted: numOrZero(ingest.accepted),
      droppedJsonParse: numOrZero(ingest.droppedJsonParse),
      droppedShape: numOrZero(ingest.droppedShape),
      droppedInvalidMid: numOrZero(ingest.droppedInvalidMid),
      droppedMissingSymbol: numOrZero(ingest.droppedMissingSymbol),
      ...(typeof ingest.lastDroppedAtMs === 'number' ? { lastDroppedAtMs: ingest.lastDroppedAtMs } : {}),
      ...(typeof ingest.lastDroppedReason === 'string' ? { lastDroppedReason: ingest.lastDroppedReason } : {}),
    },
    failures: {
      stocks: pickFailures(failures.stocks),
      crypto: pickFailures(failures.crypto),
    },
    freshCount: numOrZero(obj.freshCount),
    totalCount: numOrZero(obj.totalCount),
    healthy: obj.healthy === true,
    degraded: obj.degraded === true,
    timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
  }
}

async function fetchSnapshot(force = false): Promise<void> {
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
    const payload = parseOracleStatusPayload(await res.json())
    store.state = {
      payload,
      isLoading: false,
      lastFetchedAtMs: Date.now(),
      error: payload ? null : 'malformed payload',
    }
    store.cooldownUntil = 0
  } catch (err) {
    store.state = {
      payload: null,
      isLoading: false,
      lastFetchedAtMs: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    }
    store.cooldownUntil = Date.now() + POLL_INTERVAL_MS
  } finally {
    store.inFlight = false
    notify()
  }
}

function armInterval(): void {
  if (store.intervalId !== null) return
  store.intervalId = setInterval(fetchSnapshot, POLL_INTERVAL_MS)
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
      void fetchSnapshot(true)
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

export function useOracleStatusSnapshot(): OracleStatusSnapshot {
  const [snapshot, setSnapshot] = useState(store.state)

  useEffect(() => {
    const subscriber: Subscriber = (next) => setSnapshot(next)
    store.subscribers.add(subscriber)
    startPolling()

    if (store.state.isLoading && !store.inFlight) {
      void fetchSnapshot()
    } else {
      setSnapshot(store.state)
    }

    return () => {
      store.subscribers.delete(subscriber)
      stopPolling()
    }
  }, [])

  return { ...snapshot, refresh: () => void fetchSnapshot(true) }
}

export function __resetOracleStatusSnapshotForTests(): void {
  if (store.intervalId !== null) clearInterval(store.intervalId)
  if (store.unsubscribeVisibility) store.unsubscribeVisibility()
  store.state = INITIAL
  store.subscribers.clear()
  store.intervalId = null
  store.inFlight = false
  store.cooldownUntil = 0
  store.unsubscribeVisibility = null
}
