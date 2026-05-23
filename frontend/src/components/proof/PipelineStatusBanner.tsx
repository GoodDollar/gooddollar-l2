'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { getAllTickers } from '@/lib/stockData'

type AxisHealth = 'unknown' | 'healthy' | 'degraded'

interface AxisState {
  quotes: AxisHealth
  onChain: AxisHealth
  hedgeProof: AxisHealth
}

type Verdict = 'loading' | 'green' | 'amber' | 'red'

const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300'
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000
const DEFAULT_POLL_INTERVAL_MS = 15_000

interface PanelLink {
  reason: string
  anchor: string
}

const PANEL_BY_AXIS: Record<keyof AxisState, PanelLink> = {
  quotes: { reason: 'price-service unreachable', anchor: 'panel-live-quotes' },
  onChain: { reason: 'no on-chain prices', anchor: 'panel-onchain-oracle' },
  hedgeProof: { reason: 'hedge-proof missing', anchor: 'panel-last-hedge' },
}

function isFreshQuotes(payload: unknown, stalenessMs: number): boolean {
  if (typeof payload !== 'object' || payload === null) return false
  const r = payload as Record<string, unknown>
  const quotes = r.quotes
  if (typeof quotes !== 'object' || quotes === null || Array.isArray(quotes)) return false
  const values = Object.values(quotes as Record<string, unknown>)
  if (values.length === 0) return false
  let freshestAge = Number.POSITIVE_INFINITY
  for (const v of values) {
    if (typeof v !== 'object' || v === null) continue
    const q = v as Record<string, unknown>
    if (typeof q.cacheAge !== 'number') continue
    if (q.cacheAge < freshestAge) freshestAge = q.cacheAge
  }
  if (!Number.isFinite(freshestAge)) return false
  return freshestAge <= stalenessMs
}

function isHealthyOnChain(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  const r = data as Record<string, unknown>
  const price8 = r.price8
  const timestamp = r.timestamp
  if (typeof price8 !== 'bigint' || typeof timestamp !== 'bigint') return false
  return price8 > 0n && timestamp > 0n
}

function deriveVerdict(axes: AxisState): Verdict {
  const values: AxisHealth[] = [axes.quotes, axes.onChain, axes.hedgeProof]
  if (values.some((v) => v === 'unknown')) return 'loading'
  const healthy = values.filter((v) => v === 'healthy').length
  const degraded = values.filter((v) => v === 'degraded').length
  if (healthy === 3) return 'green'
  if (degraded === 3) return 'red'
  return 'amber'
}

interface PipelineStatusBannerProps {
  /** Price-service base URL — defaults to `NEXT_PUBLIC_PRICE_SERVICE_URL`. */
  priceServiceUrl?: string
  /** Hedge proof endpoint — defaults to `/api/hedge-proof/latest`. */
  hedgeProofEndpoint?: string
  /** Polling cadence in ms — defaults to 15s. Test override. */
  intervalMs?: number
  /** Optional staleness threshold for the quotes axis — defaults to 30s. */
  stalenessThresholdMs?: number
}

export function PipelineStatusBanner({
  priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL,
  hedgeProofEndpoint = '/api/hedge-proof/latest',
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
  stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
}: PipelineStatusBannerProps) {
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
  const [pollSeq, setPollSeq] = useState(0)
  const [lastFullyAliveAt, setLastFullyAliveAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())

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

  const axes: AxisState = {
    quotes: offChain.quotes,
    onChain,
    hedgeProof: offChain.hedgeProof,
  }
  const verdict = deriveVerdict(axes)

  useEffect(() => {
    if (
      axes.quotes === 'healthy' &&
      axes.onChain === 'healthy' &&
      axes.hedgeProof === 'healthy'
    ) {
      const t = Date.now()
      setLastFullyAliveAt(t)
      setNow(t)
    }
  }, [pollSeq, axes.quotes, axes.onChain, axes.hedgeProof])

  useEffect(() => {
    if (lastFullyAliveAt === null) return
    if (verdict === 'green' || verdict === 'loading') return
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [lastFullyAliveAt, verdict])

  return (
    <PipelineStatusView
      axes={axes}
      verdict={verdict}
      lastFullyAliveAt={lastFullyAliveAt}
      now={now}
    />
  )
}

interface PipelineStatusViewProps {
  axes: AxisState
  verdict: Verdict
  lastFullyAliveAt: number | null
  now: number
}

function PipelineStatusView({ axes, verdict, lastFullyAliveAt, now }: PipelineStatusViewProps) {
  if (verdict === 'loading') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="loading"
        className="rounded-2xl border border-white/10 bg-dark-100/60 px-4 py-3"
      >
        <div
          role="status"
          aria-label="Loading pipeline status"
          className="h-5 w-56 animate-pulse rounded bg-white/10"
        />
      </section>
    )
  }

  if (verdict === 'green') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="green"
        className="rounded-2xl border border-green-500/30 bg-green-500/5 px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden />
            Alive
          </span>
          <span className="text-xs text-gray-300">
            Live quotes fresh · on-chain oracle returning data · hedge-proof artifact present
          </span>
        </div>
        <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} now={now} />
      </section>
    )
  }

  const degradedEntries = (Object.keys(axes) as (keyof AxisState)[])
    .filter((axis) => axes[axis] === 'degraded')
    .map((axis) => PANEL_BY_AXIS[axis])

  if (verdict === 'red') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="red"
        className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3"
      >
        <div role="alert" key="red">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden />
              Cold
            </span>
            <span className="text-xs text-red-200">
              All upstreams unreachable; this release is not verifiable.
            </span>
          </div>
          <ReasonChips entries={degradedEntries} tone="red" />
          <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} now={now} />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Pipeline status"
      data-testid="pipeline-status-banner"
      data-status="amber"
      className="rounded-2xl border border-yellow-500/40 bg-yellow-500/5 px-4 py-3"
    >
      <div role="alert" key="amber">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
            Degraded
          </span>
          <span className="text-xs text-yellow-100/80">
            Pipeline partially alive — investigate the listed axes before shipping.
          </span>
        </div>
        <ReasonChips entries={degradedEntries} tone="amber" />
        <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} now={now} />
      </div>
    </section>
  )
}

const LAST_ALIVE_TONE_CLASS: Record<'amber' | 'red', string> = {
  amber: 'mt-1 text-[11px] text-yellow-100/70',
  red: 'mt-1 text-[11px] text-red-200/70',
}

function LastAliveLine({
  verdict,
  lastFullyAliveAt,
  now,
}: {
  verdict: Verdict
  lastFullyAliveAt: number | null
  now: number
}) {
  switch (verdict) {
    case 'loading':
      return null
    case 'green':
      return (
        <p data-testid="last-fully-alive" className="mt-1 text-[11px] text-green-200/80">
          Last fully alive: just now
        </p>
      )
    case 'amber':
    case 'red': {
      if (lastFullyAliveAt === null) {
        const stateWord = verdict === 'red' ? 'cold' : 'degraded'
        return (
          <p data-testid="last-fully-alive" className={LAST_ALIVE_TONE_CLASS[verdict]}>
            No all-green observation yet this session — the page has been in a {stateWord} state since it loaded.
          </p>
        )
      }
      const ago = Math.max(0, Math.round((now - lastFullyAliveAt) / 1000))
      const wallclock = new Date(lastFullyAliveAt).toISOString().slice(11, 19)
      return (
        <p data-testid="last-fully-alive" className={LAST_ALIVE_TONE_CLASS[verdict]}>
          Last fully alive: {wallclock} UTC · {ago}s ago
        </p>
      )
    }
  }
}

const CHIP_BASE_CLASS =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100'

const CHIP_TONE_CLASS: Record<'amber' | 'red', string> = {
  amber: 'bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20 focus:ring-yellow-400/50',
  red: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 focus:ring-red-400/50',
}

function ReasonChips({ entries, tone }: { entries: PanelLink[]; tone: 'amber' | 'red' }) {
  if (entries.length === 0) return null
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {entries.map((e) => (
        <li key={e.anchor}>
          <a
            href={`#${e.anchor}`}
            data-testid={`reason-chip-${e.anchor}`}
            className={`${CHIP_BASE_CLASS} ${CHIP_TONE_CLASS[tone]}`}
            aria-label={`Jump to ${e.reason}, opens the corresponding panel`}
          >
            <span>{e.reason}</span>
            <span aria-hidden>↓</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
