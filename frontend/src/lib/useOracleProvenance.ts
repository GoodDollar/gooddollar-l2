'use client'

/**
 * useOracleProvenance — small hook that exposes the on-chain provenance
 * fields the OracleStatusBadge needs to render its secondary "Source / Last
 * write" line:
 *
 *   - `chainId`       — to construct explorer URLs and the network label
 *   - `oracleAddresses` + `signerAddress` — for the hover tooltip
 *   - `upstreamLabel` — operator-visible name of the upstream feed
 *   - `proof.{stocks,crypto}` — most-recent submission per rail
 *
 * This hook polls `/api/oracle/status` itself on its own debounced cadence
 * so the badge can render real provenance regardless of whether the
 * primary status feed (`/status/quotes`) is live. The poll cooldown and
 * page-visibility gate mirror `usePriceServiceStatus` so the two hooks
 * never compete for QPS.
 */

import { useEffect, useState } from 'react'

import { isPageHidden, subscribePageVisibility } from './usePageVisibility'

export interface ProofTail {
  rail: 'stocks' | 'crypto'
  txHash: string
  blockNumber: number
  symbols: string[]
  submittedAtMs: number
}

export interface OracleProvenance {
  chainId: number | null
  oracleAddresses: { stocks: string | null; crypto: string | null }
  signerAddress: string | null
  upstreamLabel: string | null
  proof: { stocks: ProofTail | null; crypto: ProofTail | null }
  loaded: boolean
}

const EMPTY_PROVENANCE: OracleProvenance = {
  chainId: null,
  oracleAddresses: { stocks: null, crypto: null },
  signerAddress: null,
  upstreamLabel: null,
  proof: { stocks: null, crypto: null },
  loaded: false,
}

const POLL_INTERVAL_MS = 30_000

type Subscriber = (state: OracleProvenance) => void

interface Store {
  state: OracleProvenance
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  inFlight: boolean
  cooldownUntil: number
  unsubscribeVisibility: (() => void) | null
}

const store: Store = {
  state: EMPTY_PROVENANCE,
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
  cooldownUntil: 0,
  unsubscribeVisibility: null,
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

function pickProofTail(arr: unknown): ProofTail | null {
  if (!Array.isArray(arr) || arr.length === 0) return null
  const head = arr[0]
  if (!head || typeof head !== 'object') return null
  const r = head as Record<string, unknown>
  if (typeof r.txHash !== 'string' || !r.txHash.startsWith('0x')) return null
  if (typeof r.blockNumber !== 'number') return null
  const rail = r.rail === 'stocks' || r.rail === 'crypto' ? r.rail : null
  if (!rail) return null
  return {
    rail,
    txHash: r.txHash,
    blockNumber: r.blockNumber,
    symbols: Array.isArray(r.symbols) ? r.symbols.filter((s): s is string => typeof s === 'string') : [],
    submittedAtMs: typeof r.submittedAtMs === 'number' ? r.submittedAtMs : 0,
  }
}

function deriveProvenance(data: unknown): OracleProvenance {
  if (!data || typeof data !== 'object') return { ...EMPTY_PROVENANCE, loaded: true }
  const obj = data as Record<string, unknown>

  const chain = obj.chain && typeof obj.chain === 'object' ? obj.chain as Record<string, unknown> : {}
  const chainId = typeof chain.chainId === 'number' ? chain.chainId : null
  const addrs = chain.oracleAddresses && typeof chain.oracleAddresses === 'object'
    ? chain.oracleAddresses as Record<string, unknown>
    : {}
  const signerAddress = typeof chain.signerAddress === 'string' ? chain.signerAddress : null

  const upstreams = obj.upstreams && typeof obj.upstreams === 'object' ? obj.upstreams as Record<string, unknown> : {}
  const priceUpstream = upstreams.priceService && typeof upstreams.priceService === 'object'
    ? upstreams.priceService as Record<string, unknown>
    : {}
  const upstreamLabel = typeof priceUpstream.label === 'string' ? priceUpstream.label : null

  const proof = obj.proof && typeof obj.proof === 'object' ? obj.proof as Record<string, unknown> : {}

  return {
    chainId,
    oracleAddresses: {
      stocks: typeof addrs.stocks === 'string' ? addrs.stocks : null,
      crypto: typeof addrs.crypto === 'string' ? addrs.crypto : null,
    },
    signerAddress,
    upstreamLabel,
    proof: {
      stocks: pickProofTail(proof.stocks),
      crypto: pickProofTail(proof.crypto),
    },
    loaded: true,
  }
}

async function fetchProvenance(force = false): Promise<void> {
  if (store.inFlight) return
  if (!force && isPageHidden()) return
  if (!force && Date.now() < store.cooldownUntil) return

  store.inFlight = true
  try {
    const res = await fetch('/api/oracle/status', { cache: 'no-store' })
    // Tolerate 503 — its body still carries the same shape.
    if (!res.ok && res.status !== 503) throw new Error(`status ${res.status}`)
    const data = await res.json()
    store.state = deriveProvenance(data)
    store.cooldownUntil = 0
  } catch {
    store.state = { ...EMPTY_PROVENANCE, loaded: true }
    store.cooldownUntil = Date.now() + POLL_INTERVAL_MS
  } finally {
    store.inFlight = false
    notify()
  }
}

function armInterval(): void {
  if (store.intervalId !== null) return
  store.intervalId = setInterval(fetchProvenance, POLL_INTERVAL_MS)
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
      void fetchProvenance(true)
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

export function useOracleProvenance(): OracleProvenance {
  const [snapshot, setSnapshot] = useState<OracleProvenance>(store.state)

  useEffect(() => {
    const subscriber: Subscriber = (next) => setSnapshot(next)
    store.subscribers.add(subscriber)
    startPolling()

    if (!store.state.loaded && !store.inFlight) {
      void fetchProvenance()
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

export function __resetOracleProvenanceForTests(): void {
  if (store.intervalId !== null) clearInterval(store.intervalId)
  if (store.unsubscribeVisibility) store.unsubscribeVisibility()
  store.state = EMPTY_PROVENANCE
  store.subscribers.clear()
  store.intervalId = null
  store.inFlight = false
  store.cooldownUntil = 0
  store.unsubscribeVisibility = null
}
