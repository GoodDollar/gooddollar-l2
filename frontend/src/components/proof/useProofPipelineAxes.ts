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
const DEFAULT_POLL_INTERVAL_MS = 15_000

export interface UseProofPipelineAxesOptions {
  /** Price-service base URL — defaults to `NEXT_PUBLIC_PRICE_SERVICE_URL`. */
  priceServiceUrl?: string
  /** Hedge proof endpoint — defaults to `/api/hedge-proof/latest`. */
  hedgeProofEndpoint?: string
  /** Polling cadence in ms — defaults to 15s. Test override. */
  intervalMs?: number
  /** Staleness threshold for the quotes axis — defaults to 30s. */
  stalenessThresholdMs?: number
}

export interface ProofPipelineAxesState {
  axes: AxisState
  verdict: Verdict
  /** Wallclock ms at the last poll where every axis was healthy, or null. */
  lastFullyAliveAt: number | null
}

/**
 * Single source of truth for the proof page's pipeline-axis health.
 * Replaces the byte-for-byte duplicated fetch + useReadContract +
 * useMemo blocks that previously lived inside `PipelineStatusBanner`
 * and `PipelineFlowDiagram` and could disagree on the same render
 * frame because their `useMemo` over `useReadContract` settled on
 * different React commit cycles.
 *
 * Mount this hook **once** per proof page (via
 * `ProofPipelineAxesProvider`) so every consumer reads the same
 * `axes` reference and the rollup chip, the flow node tones, and any
 * future axis-aware consumer never contradict each other.
 *
 * See task lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050) for the contradiction this hook is the root fix for.
 */
export function useProofPipelineAxes({
  priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL,
  hedgeProofEndpoint = '/api/hedge-proof/latest',
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
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
      refetchInterval: intervalMs,
      staleTime: intervalMs,
    },
  })

  const [offChain, setOffChain] = useState<{ quotes: AxisHealth; hedgeProof: AxisHealth }>({
    quotes: 'unknown',
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

    const checkQuotes = async (): Promise<AxisHealth> => {
      try {
        const res = await fetch(`${priceServiceUrl}/quotes`, { cache: 'no-store' })
        if (!res.ok) return 'degraded'
        const body = (await res.json()) as unknown
        return isFreshQuotes(body, stalenessThresholdMs) ? 'healthy' : 'degraded'
      } catch (err) {
        sanitiseClientError('price-service', err)
        return 'degraded'
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
        quotes: quotesResult.status === 'fulfilled' ? quotesResult.value : 'degraded',
        hedgeProof: hedgeProofResult.status === 'fulfilled' ? hedgeProofResult.value : 'degraded',
      })
      setPollSeq((s) => s + 1)
    }

    void tick()
    const timer = setInterval(() => void tick(), intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [priceServiceUrl, hedgeProofEndpoint, intervalMs, stalenessThresholdMs])

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
    () => ({ quotes: offChain.quotes, onChain, hedgeProof: offChain.hedgeProof }),
    [offChain.quotes, offChain.hedgeProof, onChain],
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
    () => ({ axes, verdict, lastFullyAliveAt }),
    [axes, verdict, lastFullyAliveAt],
  )
}
