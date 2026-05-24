'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReadContracts } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { getAllTickers } from '@/lib/stockData'
import {
  AxisHealth,
  AxisState,
  Verdict,
  countResolvedAxes,
  deriveOnChainAxisFromRows,
  derivePartialVerdict,
  deriveVerdict,
  isFreshQuotes,
} from './proofAxes'

/**
 * One decoded row of `StocksPriceOracle.getPriceData(symbol)`. Lifted
 * out of `OnChainOraclePanel` so the hook can hand panel renderers a
 * pre-decoded array and remain the single source of truth for the
 * on-chain axis — see task lane6-onchain-probe-ticker-duplicates-
 * onchainoraclepanel-read (0063).
 */
export interface DecodedPriceData {
  symbol: string
  price8: bigint
  timestamp: bigint
  session: number
  confidence: number
  signerCount: number
}

const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300'
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000
/**
 * Off-chain `/quotes` and `/api/hedge-proof/latest` poll cadence (5s).
 * Matches the LiveQuotesPanel's "next poll" caption so the
 * rollup/flow tone and the panel's freshness chip can never disagree
 * on whether the service is reachable in the same render frame — see
 * task lane6-three-independent-quotes-pollers-at-conflicting-cadences (0051).
 */
const DEFAULT_OFF_CHAIN_INTERVAL_MS = 5_000
/**
 * Chain `useReadContracts` cadence (30s). On-chain prices update on
 * block boundaries; polling the full 12-ticker multicall faster is
 * wasted RPC traffic. The hook owns the single timer; the axis-health
 * value is derived state, recomputed each render from the most recent
 * multicall snapshot — no second timer is needed for the rollup
 * (#0063 collapsed the previous 15s AAPL probe onto this poll).
 */
const DEFAULT_CHAIN_PANEL_INTERVAL_MS = 30_000

export interface UseProofPipelineAxesOptions {
  /** Price-service base URL — defaults to `NEXT_PUBLIC_PRICE_SERVICE_URL`. */
  priceServiceUrl?: string
  /** Hedge proof endpoint — defaults to `/api/hedge-proof/latest`. */
  hedgeProofEndpoint?: string
  /** Off-chain poll cadence (quotes + hedge-proof) in ms — defaults to 5s. */
  offChainIntervalMs?: number
  /**
   * @deprecated since #0063. The hook no longer mounts a separate
   * single-ticker probe at this cadence; the on-chain axis is derived
   * from the same multicall result that drives `OnChainOraclePanel`.
   * Set {@link UseProofPipelineAxesOptions.chainPanelIntervalMs} to
   * change the on-chain cadence. Kept for source-compatibility with
   * callers that pass it; setting it has no effect.
   */
  chainIntervalMs?: number
  /**
   * On-chain multicall cadence in ms — defaults to 30s. The hook mounts
   * ONE `useReadContracts` over every ticker at this cadence;
   * `OnChainOraclePanel` reads back the decoded rows via context (#0063).
   */
  chainPanelIntervalMs?: number
  /** Staleness threshold for the quotes axis — defaults to 30s. */
  stalenessThresholdMs?: number
}

export type QuotesFetchStatus = 'loading' | 'ok' | 'error'
export type HedgeProofFetchStatus = 'loading' | 'ok' | 'missing' | 'error'
export type OnChainFetchStatus = 'loading' | 'ok' | 'error'

interface QuotesResult {
  axis: AxisHealth
  status: QuotesFetchStatus
  payload: unknown | null
  at: number | null
}

interface HedgeProofResult {
  axis: AxisHealth
  status: HedgeProofFetchStatus
  payload: unknown | null
  at: number | null
}

const INITIAL_QUOTES_RESULT: QuotesResult = {
  axis: 'unknown',
  status: 'loading',
  payload: null,
  at: null,
}

const INITIAL_HEDGE_PROOF_RESULT: HedgeProofResult = {
  axis: 'unknown',
  status: 'loading',
  payload: null,
  at: null,
}

export interface ProofPipelineAxesState {
  axes: AxisState
  /**
   * Strict verdict — `'loading'` until every axis has reported. Kept for
   * consumers that want the "all axes settled" semantics (e.g. the
   * `LastAliveLine` "just now" branch).
   */
  verdict: Verdict
  /**
   * Partial verdict — degrades to amber/red/green as axes report,
   * never blocks on a single `'unknown'`. The `PipelineStatusBanner`
   * reads this so its first non-skeleton render lands in the same
   * frame as `PipelineFlowDiagram`'s first coloured pill — see
   * task lane6-pipeline-status-rollup-blank-during-panel-first-paint
   * (0059).
   */
  partialVerdict: Verdict
  /** Number of axes (0–3) that have reported `healthy` or `degraded`. */
  resolvedAxisCount: number
  /** Wallclock ms at the last poll where every axis was healthy, or null. */
  lastFullyAliveAt: number | null
  /** Raw JSON body of the most recent successful `/quotes` fetch, else null. */
  lastQuotesPayload: unknown | null
  /** Wallclock ms when the most recent `/quotes` response landed, else null. */
  lastQuotesAt: number | null
  /** Outcome of the most recent `/quotes` poll. */
  lastQuotesStatus: QuotesFetchStatus
  /** Raw JSON body of the most recent successful hedge-proof fetch, else null. */
  lastHedgeProofPayload: unknown | null
  /** Wallclock ms when the most recent hedge-proof response landed, else null. */
  lastHedgeProofAt: number | null
  /** Outcome of the most recent hedge-proof poll. */
  lastHedgeProofStatus: HedgeProofFetchStatus
  /**
   * Decoded rows from the most recent `getPriceData` multicall, one per
   * ticker whose result returned `status: 'success'`. Empty array on
   * first paint or when the multicall errored. Drives both the on-chain
   * axis health AND the `OnChainOraclePanel` table — single source of
   * truth (#0063).
   */
  onChainRows: readonly DecodedPriceData[]
  /** Outcome of the most recent on-chain multicall. */
  onChainStatus: OnChainFetchStatus
  /** Wallclock ms when the most recent on-chain multicall response landed, else null. */
  onChainAt: number | null
  /** Off-chain poll cadence the hook is using — consumers echo this in copy. */
  cadenceMs: number
  /** On-chain multicall cadence the hook is using — consumers echo this in their countdown (#0063). */
  onChainCadenceMs: number
  /** Price-service URL the hook is polling — consumers echo this in pills. */
  priceServiceUrl: string
  /** Hedge-proof endpoint the hook is polling — consumers link to it. */
  hedgeProofEndpoint: string
  /** Staleness threshold the hook is applying — consumers reuse for per-row stale chips. */
  stalenessThresholdMs: number
  /**
   * Re-run the `/quotes` fetch immediately. Resets the quotes interval so the
   * next scheduled poll fires `cadenceMs` after this manual retry, NOT after
   * the previous scheduled poll. Does not affect the hedge-proof clock.
   */
  retryQuotes: () => Promise<void>
  /**
   * Re-run the hedge-proof fetch immediately. Same isolation guarantees
   * as {@link retryQuotes} — the quotes clock is untouched.
   */
  retryHedgeProof: () => Promise<void>
  /**
   * Re-run the on-chain multicall immediately. Forwards to wagmi's
   * `refetch()` so the next scheduled poll fires `onChainCadenceMs`
   * after this manual retry (wagmi schedules from refetch time).
   * Used by the on-chain panel's `Retry now` button (#0063).
   */
  retryOnChain: () => Promise<void>
}

interface UsePollerOptions<T> {
  initial: T
  intervalMs: number
  fetchOnce: () => Promise<T>
}

interface UsePollerResult<T> {
  result: T
  retry: () => Promise<void>
}

/**
 * Generic interval-with-manual-retry hook. Keeps the latest `fetchOnce`
 * closure in a ref so a manual retry always fires the most up-to-date
 * fetch, and so a `setInterval` callback never closes over a stale
 * dependency snapshot. The retry resets the interval so the next
 * scheduled poll fires `intervalMs` after the manual click rather than
 * immediately after.
 *
 * Pulled out of `useProofPipelineAxes` so the quotes and hedge-proof
 * pollers can run on independent timers, satisfying the per-panel
 * retry-isolation contract — see task lane6-degraded-panels-offer-no-
 * retry-or-open-url-or-next-poll-countdown (0060).
 */
function useIndependentPoller<T>({
  initial,
  intervalMs,
  fetchOnce,
}: UsePollerOptions<T>): UsePollerResult<T> {
  const [result, setResult] = useState<T>(initial)
  const fetchOnceRef = useRef(fetchOnce)
  fetchOnceRef.current = fetchOnce
  const cancelledRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(async () => {
    const next = await fetchOnceRef.current()
    if (cancelledRef.current) return
    setResult(next)
  }, [])

  const arm = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => void tick(), intervalMs)
  }, [intervalMs, tick])

  useEffect(() => {
    cancelledRef.current = false
    void tick()
    arm()
    return () => {
      cancelledRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [arm, tick])

  const retry = useCallback(async () => {
    await tick()
    arm()
  }, [arm, tick])

  return { result, retry }
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
  chainPanelIntervalMs = DEFAULT_CHAIN_PANEL_INTERVAL_MS,
  stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
}: UseProofPipelineAxesOptions = {}): ProofPipelineAxesState {
  const oracleAddress = CONTRACTS.StocksPriceOracle
  const tickers = useMemo(() => getAllTickers(), [])

  // The contracts array is what wagmi keys the multicall on — make it
  // a stable reference so we don't re-arm every render. Empty array
  // when we can't read (no address / no tickers) keeps the type
  // inference happy and disables the underlying query.
  const onChainContracts = useMemo(() => {
    if (!oracleAddress || tickers.length === 0) return []
    return tickers.map((ticker) => ({
      address: oracleAddress,
      abi: PriceOracleABI,
      functionName: 'getPriceData' as const,
      args: [ticker] as const,
    }))
  }, [oracleAddress, tickers])

  const {
    data: onChainData,
    error: onChainError,
    isLoading: onChainIsLoading,
    refetch: refetchOnChain,
  } = useReadContracts({
    contracts: onChainContracts,
    query: {
      enabled: onChainContracts.length > 0,
      refetchInterval: chainPanelIntervalMs,
      staleTime: chainPanelIntervalMs,
    },
  })

  const checkQuotes = useCallback(async (): Promise<QuotesResult> => {
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
  }, [priceServiceUrl, stalenessThresholdMs])

  const checkHedgeProof = useCallback(async (): Promise<HedgeProofResult> => {
    const at = Date.now()
    try {
      const res = await fetch(hedgeProofEndpoint, { cache: 'no-store' })
      if (res.status === 404) {
        return { axis: 'degraded', status: 'missing', payload: null, at }
      }
      if (!res.ok) return { axis: 'degraded', status: 'error', payload: null, at }
      const body = (await res.json()) as unknown
      return { axis: 'healthy', status: 'ok', payload: body, at }
    } catch (err) {
      sanitiseClientError('hedge-proof', err)
      return { axis: 'degraded', status: 'error', payload: null, at }
    }
  }, [hedgeProofEndpoint])

  const { result: quotes, retry: retryQuotes } = useIndependentPoller({
    initial: INITIAL_QUOTES_RESULT,
    intervalMs: offChainIntervalMs,
    fetchOnce: checkQuotes,
  })
  const { result: hedgeProof, retry: retryHedgeProof } = useIndependentPoller({
    initial: INITIAL_HEDGE_PROOF_RESULT,
    intervalMs: offChainIntervalMs,
    fetchOnce: checkHedgeProof,
  })

  // Decode the wagmi multicall into one tidy row per success. Skips
  // tickers whose slot reverted so callers don't have to thread error
  // branches through their render. Same decode shape the panel used
  // before #0063 — moved here so the panel can be a pure renderer.
  const onChainRows = useMemo<readonly DecodedPriceData[]>(() => {
    if (!onChainData) return []
    const out: DecodedPriceData[] = []
    for (let i = 0; i < tickers.length; i++) {
      const r = onChainData[i]
      if (r?.status !== 'success' || !r.result) continue
      const tuple = r.result as {
        price8: bigint
        timestamp: bigint
        session: number
        confidence: number
        signerCount: number
      }
      out.push({
        symbol: tickers[i],
        price8: tuple.price8 ?? 0n,
        timestamp: tuple.timestamp ?? 0n,
        session: tuple.session ?? 3,
        confidence: tuple.confidence ?? 0,
        signerCount: tuple.signerCount ?? 0,
      })
    }
    return out
  }, [onChainData, tickers])

  // Log once per failed multicall — the panel renders a hardcoded copy
  // string so we keep the single sanitise + console.error pair here at
  // the data boundary (#0063).
  useEffect(() => {
    if (!onChainError) return
    sanitiseClientError('oracle-multicall', onChainError)
  }, [onChainError])

  const onChainStatus: OnChainFetchStatus = onChainError
    ? 'error'
    : onChainIsLoading
      ? 'loading'
      : 'ok'

  const [onChainAt, setOnChainAt] = useState<number | null>(null)
  useEffect(() => {
    if (onChainData !== undefined || onChainError) setOnChainAt(Date.now())
  }, [onChainData, onChainError])

  const onChain = deriveOnChainAxisFromRows(
    onChainRows,
    Boolean(onChainError),
    onChainData === undefined && !onChainError,
  )

  const retryOnChain = useCallback(async () => {
    await refetchOnChain()
  }, [refetchOnChain])

  const axes: AxisState = useMemo(
    () => ({ quotes: quotes.axis, onChain, hedgeProof: hedgeProof.axis }),
    [quotes.axis, hedgeProof.axis, onChain],
  )
  const verdict = useMemo(() => deriveVerdict(axes), [axes])
  const partialVerdict = useMemo(() => derivePartialVerdict(axes), [axes])
  const resolvedAxisCount = useMemo(() => countResolvedAxes(axes), [axes])

  const [lastFullyAliveAt, setLastFullyAliveAt] = useState<number | null>(null)
  const lastFullyAliveBumpKey = `${quotes.axis}|${onChain}|${hedgeProof.axis}|${quotes.at ?? 0}|${hedgeProof.at ?? 0}`
  useEffect(() => {
    if (
      axes.quotes === 'healthy' &&
      axes.onChain === 'healthy' &&
      axes.hedgeProof === 'healthy'
    ) {
      setLastFullyAliveAt(Date.now())
    }
    // The `lastFullyAliveBumpKey` literal in the dep array is what makes
    // each successive all-healthy poll bump the timestamp — even when
    // axis values themselves haven't changed across polls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFullyAliveBumpKey])

  return useMemo(
    () => ({
      axes,
      verdict,
      partialVerdict,
      resolvedAxisCount,
      lastFullyAliveAt,
      lastQuotesPayload: quotes.payload,
      lastQuotesAt: quotes.at,
      lastQuotesStatus: quotes.status,
      lastHedgeProofPayload: hedgeProof.payload,
      lastHedgeProofAt: hedgeProof.at,
      lastHedgeProofStatus: hedgeProof.status,
      onChainRows,
      onChainStatus,
      onChainAt,
      cadenceMs: offChainIntervalMs,
      onChainCadenceMs: chainPanelIntervalMs,
      priceServiceUrl,
      hedgeProofEndpoint,
      stalenessThresholdMs,
      retryQuotes,
      retryHedgeProof,
      retryOnChain,
    }),
    [
      axes,
      verdict,
      partialVerdict,
      resolvedAxisCount,
      lastFullyAliveAt,
      quotes.payload,
      quotes.at,
      quotes.status,
      hedgeProof.payload,
      hedgeProof.at,
      hedgeProof.status,
      onChainRows,
      onChainStatus,
      onChainAt,
      offChainIntervalMs,
      chainPanelIntervalMs,
      priceServiceUrl,
      hedgeProofEndpoint,
      stalenessThresholdMs,
      retryQuotes,
      retryHedgeProof,
      retryOnChain,
    ],
  )
}
