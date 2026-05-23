'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { getAllTickers } from '@/lib/stockData'
import {
  AxisHealth,
  AxisState,
  Verdict,
  deriveVerdict,
  isFreshQuotes,
  isHealthyOnChain,
} from './proofAxes'

const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300'
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000
/**
 * Off-chain `/quotes` and `/api/hedge-proof/latest` poll cadence (5s).
 * Matches the LiveQuotesPanel's "refreshes every Ns" pill so the
 * rollup/flow tone and the panel's freshness chip can never disagree
 * on whether the service is reachable in the same render frame — see
 * task lane6-three-independent-quotes-pollers-at-conflicting-cadences (0051).
 */
const DEFAULT_OFF_CHAIN_INTERVAL_MS = 5_000
/**
 * Chain `useReadContract` cadence (15s). On-chain prices update on
 * block boundaries; polling faster is wasted RPC traffic.
 */
const DEFAULT_CHAIN_INTERVAL_MS = 15_000

export interface UseProofPipelineAxesOptions {
  /** Price-service base URL — defaults to `NEXT_PUBLIC_PRICE_SERVICE_URL`. */
  priceServiceUrl?: string
  /** Hedge proof endpoint — defaults to `/api/hedge-proof/latest`. */
  hedgeProofEndpoint?: string
  /** Off-chain poll cadence (quotes + hedge-proof) in ms — defaults to 5s. */
  offChainIntervalMs?: number
  /** Chain probe cadence (wagmi refetchInterval) in ms — defaults to 15s. */
  chainIntervalMs?: number
  /** Staleness threshold for the quotes axis — defaults to 30s. */
  stalenessThresholdMs?: number
}

export type QuotesFetchStatus = 'loading' | 'ok' | 'error'

export interface ProofPipelineAxesState {
  axes: AxisState
  verdict: Verdict
  /** Wallclock ms at the last poll where every axis was healthy, or null. */
  lastFullyAliveAt: number | null
  /** Raw JSON body of the most recent successful `/quotes` fetch, else null. */
  lastQuotesPayload: unknown | null
  /** Wallclock ms when the most recent `/quotes` response landed, else null. */
  lastQuotesAt: number | null
  /** Outcome of the most recent `/quotes` poll. */
  lastQuotesStatus: QuotesFetchStatus
  /** Off-chain poll cadence the hook is using — consumers echo this in copy. */
  cadenceMs: number
  /** Price-service URL the hook is polling — consumers echo this in pills. */
  priceServiceUrl: string
  /** Staleness threshold the hook is applying — consumers reuse for per-row stale chips. */
  stalenessThresholdMs: number
}

/**
 * Single source of truth for the proof page's pipeline-axis health and
 * the underlying `/quotes` payload. Replaces the byte-for-byte
 * duplicated fetch + useReadContract blocks that previously lived
 * inside `PipelineStatusBanner`, `PipelineFlowDiagram`, AND
 * `LiveQuotesPanel`. Mount this hook **once** per proof page (via
 * `ProofPipelineAxesProvider`) so every consumer reads the same
 * `axes` reference and the rollup chip, the flow node tones, and the
 * LiveQuotes freshness chip never contradict each other.
 *
 * See tasks lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050) and lane6-three-independent-quotes-pollers-at-conflicting-cadences
 * (0051) for the contradictions this hook is the root fix for.
 */
export function useProofPipelineAxes({
  priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL,
  hedgeProofEndpoint = '/api/hedge-proof/latest',
  offChainIntervalMs = DEFAULT_OFF_CHAIN_INTERVAL_MS,
  chainIntervalMs = DEFAULT_CHAIN_INTERVAL_MS,
  stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
}: UseProofPipelineAxesOptions = {}): ProofPipelineAxesState {
  const oracleAddress = CONTRACTS.StocksPriceOracle
  const probeTicker = useMemo(() => {
    const tickers = getAllTickers()
    return tickers.length > 0 ? tickers[0] : null
  }, [])

  const onChainReadEnabled = Boolean(oracleAddress) && probeTicker !== null
  const { data: onChainData, error: onChainError } = useReadContract({
    address: oracleAddress || undefined,
    abi: PriceOracleABI,
    functionName: 'getPriceData',
    args: probeTicker ? [probeTicker] : undefined,
    query: {
      enabled: onChainReadEnabled,
      refetchInterval: chainIntervalMs,
      staleTime: chainIntervalMs,
    },
  })

  interface QuotesResult {
    axis: AxisHealth
    status: QuotesFetchStatus
    payload: unknown | null
    at: number | null
  }

  const [offChain, setOffChain] = useState<{
    quotes: QuotesResult
    hedgeProof: AxisHealth
  }>({
    quotes: { axis: 'unknown', status: 'loading', payload: null, at: null },
    hedgeProof: 'unknown',
  })

  /**
   * Bumped on every off-chain poll so `lastFullyAliveAt` can re-fire even
   * when the axes haven't changed (e.g. consecutive all-healthy polls all
   * advance the timestamp, not just the first healthy transition).
   */
  const [pollSeq, setPollSeq] = useState(0)
  const [lastFullyAliveAt, setLastFullyAliveAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkQuotes = async (): Promise<QuotesResult> => {
      const at = Date.now()
      try {
        const res = await fetch(`${priceServiceUrl}/quotes`, { cache: 'no-store' })
        if (!res.ok) return { axis: 'degraded', status: 'error', payload: null, at }
        const body = (await res.json()) as unknown
        const axis: AxisHealth = isFreshQuotes(body, stalenessThresholdMs)
          ? 'healthy'
          : 'degraded'
        return { axis, status: 'ok', payload: body, at }
      } catch (err) {
        sanitiseClientError('price-service', err)
        return { axis: 'degraded', status: 'error', payload: null, at }
      }
    }

    const checkHedgeProof = async (): Promise<AxisHealth> => {
      try {
        const res = await fetch(hedgeProofEndpoint, { cache: 'no-store' })
        return res.ok ? 'healthy' : 'degraded'
      } catch (err) {
        sanitiseClientError('hedge-proof', err)
        return 'degraded'
      }
    }

    const tick = async () => {
      const [quotesResult, hedgeProofResult] = await Promise.allSettled([
        checkQuotes(),
        checkHedgeProof(),
      ])
      if (cancelled) return
      setOffChain({
        quotes:
          quotesResult.status === 'fulfilled'
            ? quotesResult.value
            : { axis: 'degraded', status: 'error', payload: null, at: Date.now() },
        hedgeProof: hedgeProofResult.status === 'fulfilled' ? hedgeProofResult.value : 'degraded',
      })
      setPollSeq((s) => s + 1)
    }

    void tick()
    const timer = setInterval(() => void tick(), offChainIntervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [priceServiceUrl, hedgeProofEndpoint, offChainIntervalMs, stalenessThresholdMs])

  const onChain: AxisHealth = useMemo(() => {
    if (!onChainReadEnabled) return 'degraded'
    if (onChainError) {
      sanitiseClientError('oracle-multicall', onChainError)
      return 'degraded'
    }
    if (onChainData === undefined) return 'unknown'
    return isHealthyOnChain(onChainData) ? 'healthy' : 'degraded'
  }, [onChainReadEnabled, onChainError, onChainData])

  const axes: AxisState = useMemo(
    () => ({ quotes: offChain.quotes.axis, onChain, hedgeProof: offChain.hedgeProof }),
    [offChain.quotes.axis, offChain.hedgeProof, onChain],
  )
  const verdict = useMemo(() => deriveVerdict(axes), [axes])

  useEffect(() => {
    if (
      axes.quotes === 'healthy' &&
      axes.onChain === 'healthy' &&
      axes.hedgeProof === 'healthy'
    ) {
      setLastFullyAliveAt(Date.now())
    }
  }, [pollSeq, axes.quotes, axes.onChain, axes.hedgeProof])

  return useMemo(
    () => ({
      axes,
      verdict,
      lastFullyAliveAt,
      lastQuotesPayload: offChain.quotes.payload,
      lastQuotesAt: offChain.quotes.at,
      lastQuotesStatus: offChain.quotes.status,
      cadenceMs: offChainIntervalMs,
      priceServiceUrl,
      stalenessThresholdMs,
    }),
    [
      axes,
      verdict,
      lastFullyAliveAt,
      offChain.quotes.payload,
      offChain.quotes.at,
      offChain.quotes.status,
      offChainIntervalMs,
      priceServiceUrl,
      stalenessThresholdMs,
    ],
  )
}
