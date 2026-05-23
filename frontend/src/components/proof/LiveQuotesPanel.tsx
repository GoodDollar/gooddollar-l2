'use client'

import { useEffect, useState } from 'react'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { formatProofUsd } from '@/lib/proofFormat'

interface Quote {
  source?: string
  symbol: string
  bid: number
  ask: number
  mid: number
  last: number
  timestamp: number
  sessionState: string
  confidence: number
  cacheAge: number
  filterAccepted: boolean
  filterReason?: string
}

interface QuotesResponse {
  quotes: Record<string, Quote>
  timestamp: number
}

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; data: QuotesResponse }
  | { status: 'error'; message: string }

const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300'
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000
const POLL_INTERVAL_MS = 5_000

/**
 * Render a compact host form of the configured price-service URL.
 * Drops the scheme, drops a bare trailing slash, and (critically) drops
 * any userinfo (URL.host excludes it by construction) so neither the
 * visible pill nor the tooltip leaks credentials. Malformed strings fall
 * back to their raw form so the pill remains informative even when
 * NEXT_PUBLIC_PRICE_SERVICE_URL is set to something unusual.
 */
function displayHost(url: string): string {
  try {
    const u = new URL(url)
    const pathSuffix = u.pathname === '/' ? '' : u.pathname
    return `${u.host}${pathSuffix}`
  } catch {
    return url
  }
}

function spreadPct(bid: number, ask: number): number {
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0) return 0
  return ((ask - bid) / ((ask + bid) / 2)) * 100
}

function formatAge(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1_000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60_000)}m`
}

/**
 * Structural guard for a single quote row. Only validates the fields the
 * renderer actually reads; extending the price-service response with new
 * optional fields stays a non-breaking change for this panel.
 */
function isQuote(v: unknown): v is Quote {
  if (typeof v !== 'object' || v === null) return false
  const q = v as Record<string, unknown>
  return (
    typeof q.symbol === 'string' &&
    typeof q.bid === 'number' &&
    typeof q.ask === 'number' &&
    typeof q.mid === 'number' &&
    typeof q.cacheAge === 'number' &&
    typeof q.sessionState === 'string'
  )
}

function isQuotesResponse(x: unknown): x is QuotesResponse {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  if (typeof r.timestamp !== 'number') return false
  const quotes = r.quotes
  if (typeof quotes !== 'object' || quotes === null) return false
  if (Array.isArray(quotes)) return false
  for (const v of Object.values(quotes as Record<string, unknown>)) {
    if (!isQuote(v)) return false
  }
  return true
}

const SHAPE_MISMATCH = 'SHAPE_MISMATCH'

interface LiveQuotesPanelProps {
  priceServiceUrl?: string
  stalenessThresholdMs?: number
  intervalMs?: number
}

export function LiveQuotesPanel({
  priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL,
  stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
  intervalMs = POLL_INTERVAL_MS,
}: LiveQuotesPanelProps) {
  const [state, setState] = useState<FetchState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const fetchQuotes = async () => {
      try {
        const res = await fetch(`${priceServiceUrl}/quotes`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = (await res.json()) as unknown
        if (!isQuotesResponse(raw)) throw new Error(SHAPE_MISMATCH)
        if (!cancelled) setState({ status: 'ok', data: raw })
      } catch (err) {
        if (!cancelled) {
          const ctx =
            err instanceof Error && err.message === SHAPE_MISMATCH
              ? 'price-service-shape'
              : 'price-service'
          setState({ status: 'error', message: sanitiseClientError(ctx, err) })
        }
      }
    }

    void fetchQuotes()
    timer = setInterval(() => void fetchQuotes(), intervalMs)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [priceServiceUrl, intervalMs])

  return (
    <section
      id="panel-live-quotes"
      aria-labelledby="live-quotes-heading"
      className="rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 id="live-quotes-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Live Quotes (price-service)
        </h2>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span
            className="font-mono truncate max-w-[55%]"
            title={displayHost(priceServiceUrl)}
            data-testid="price-service-url"
          >
            {displayHost(priceServiceUrl)}
          </span>
          <span aria-hidden>·</span>
          <span>refreshes every {intervalMs / 1000}s</span>
        </div>
      </header>

      {state.status === 'loading' && (
        <div className="space-y-2" role="status" aria-label="Loading live quotes">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">price-service unreachable</div>
          <div className="mt-1 text-yellow-300/80">
            Live quotes feed at{' '}
            <span
              className="font-mono"
              data-testid="price-service-url-inline"
            >
              {displayHost(priceServiceUrl)}
            </span>{' '}
            is unreachable. The price-service may be offline or restarting.
          </div>
          <div className="mt-1 text-yellow-200/60">{state.message}</div>
        </div>
      )}

      {state.status === 'ok' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-3 font-medium">Symbol</th>
                <th className="py-2 pr-3 font-medium text-right">Mid</th>
                <th className="py-2 pr-3 font-medium text-right">Bid / Ask</th>
                <th className="py-2 pr-3 font-medium text-right">Spread</th>
                <th className="py-2 pr-3 font-medium">Session</th>
                <th className="py-2 pr-3 font-medium text-right">Age</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(state.data.quotes).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-gray-500">
                    No quotes returned. price-service may be running but not yet seeded.
                  </td>
                </tr>
              ) : (
                Object.values(state.data.quotes).map((q) => {
                  const stale = q.cacheAge > stalenessThresholdMs
                  return (
                    <tr key={q.symbol} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 font-medium text-white">{q.symbol}</td>
                      <td className="py-2 pr-3 text-right font-mono text-gray-100">{formatProofUsd(q.symbol, q.mid)}</td>
                      <td className="py-2 pr-3 text-right font-mono text-gray-400">
                        {formatProofUsd(q.symbol, q.bid)} / {formatProofUsd(q.symbol, q.ask)}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-gray-300">
                        {spreadPct(q.bid, q.ask).toFixed(3)}%
                      </td>
                      <td className="py-2 pr-3">
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                          {q.sessionState}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span
                          className={
                            stale
                              ? 'inline-flex items-center gap-1.5 text-xs font-medium text-yellow-300'
                              : 'inline-flex items-center gap-1.5 text-xs text-gray-400'
                          }
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-yellow-400' : 'bg-green-400'}`}
                            aria-hidden
                          />
                          {formatAge(q.cacheAge)}
                          {stale && <span className="text-yellow-200/90">stale</span>}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
