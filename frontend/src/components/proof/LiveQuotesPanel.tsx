'use client'

import { useMemo } from 'react'
import { formatProofUsd } from '@/lib/proofFormat'
import { sessionPillClass } from './sessionPill'
import { MonoSourceAtom, PanelHeaderMeta } from './PanelHeaderMeta'
import { NextPollCountdown, RetryButton } from './PanelHeaderControls'
import { usePanelRetry } from './ProofPanelActionsProvider'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'

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

type ErrorCtx = 'price-service' | 'price-service-shape'

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; data: QuotesResponse }
  | { status: 'error'; ctx: ErrorCtx }

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

type FreshnessSummary =
  | { kind: 'empty' }
  | { kind: 'all-current'; minAgeMs: number; total: number }
  | { kind: 'has-stale'; minAgeMs: number; totalStale: number; total: number }

function computeFreshnessSummary(quotes: Quote[], thresholdMs: number): FreshnessSummary {
  if (quotes.length === 0) return { kind: 'empty' }
  let minAgeMs = Number.POSITIVE_INFINITY
  let totalStale = 0
  for (const q of quotes) {
    if (q.cacheAge < minAgeMs) minAgeMs = q.cacheAge
    if (q.cacheAge > thresholdMs) totalStale += 1
  }
  if (totalStale > 0) {
    return { kind: 'has-stale', minAgeMs, totalStale, total: quotes.length }
  }
  return { kind: 'all-current', minAgeMs, total: quotes.length }
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

/**
 * Render the live quotes table. Reads `{ lastQuotesPayload,
 * lastQuotesStatus, cadenceMs, priceServiceUrl, stalenessThresholdMs }`
 * from `ProofPipelineAxesProvider` so the panel and the AlivenessRollup
 * always agree on whether the price-service is reachable in the same
 * render frame — see task lane6-three-independent-quotes-pollers-at-conflicting-cadences
 * (0051).
 */
export function LiveQuotesPanel() {
  const {
    lastQuotesPayload,
    lastQuotesStatus,
    lastQuotesAt,
    cadenceMs,
    priceServiceUrl,
    stalenessThresholdMs,
    retryQuotes,
  } = useProofPipelineAxesContext()
  const { busy, fire: handleRetry } = usePanelRetry('quotes', retryQuotes)

  const state: FetchState = useMemo(() => {
    if (lastQuotesStatus === 'loading') return { status: 'loading' }
    if (lastQuotesStatus === 'error') return { status: 'error', ctx: 'price-service' }
    if (!isQuotesResponse(lastQuotesPayload)) {
      return { status: 'error', ctx: 'price-service-shape' }
    }
    return { status: 'ok', data: lastQuotesPayload }
  }, [lastQuotesPayload, lastQuotesStatus])

  const quotesUrl = `${priceServiceUrl.replace(/\/$/, '')}/quotes`

  return (
    <section
      id="panel-live-quotes"
      aria-labelledby="live-quotes-heading"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-y-1">
        <h2 id="live-quotes-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Live Quotes (price-service)
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <PanelHeaderMeta
            source={
              <MonoSourceAtom
                value={displayHost(priceServiceUrl)}
                data-testid="price-service-url"
              />
            }
            cadence={
              <NextPollCountdown
                lastPollAt={lastQuotesAt}
                intervalMs={cadenceMs}
                busy={busy}
                testId="live-quotes-countdown"
              />
            }
          />
          {state.status === 'ok' && <FreshnessChip
            summary={computeFreshnessSummary(Object.values(state.data.quotes), stalenessThresholdMs)}
          />}
          <RetryButton
            onRetry={handleRetry}
            busy={busy}
            testId="live-quotes-retry"
            ariaLabel="Re-run live-quotes fetch"
          />
        </div>
      </header>

      <div className="flex-1">
      {state.status === 'loading' && (
        <div className="space-y-2" role="status" aria-label="Loading live quotes">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <DegradedBox
          ctx={state.ctx}
          host={displayHost(priceServiceUrl)}
          quotesUrl={quotesUrl}
        />
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
              </tr>
            </thead>
            <tbody>
              {Object.values(state.data.quotes).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-xs text-gray-500">
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
                        <span
                          data-testid={`session-pill-${q.symbol}`}
                          className={`rounded-md px-2 py-0.5 text-xs ${sessionPillClass(q.sessionState)}`}
                        >
                          {q.sessionState}
                        </span>
                        {stale && (
                          <span
                            data-testid={`quote-stale-${q.symbol}`}
                            className="ml-2 inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
                            stale {formatAge(q.cacheAge)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </section>
  )
}

/**
 * Render the yellow degraded box with copy that depends on whether the
 * fetch failed at the network layer (price-service unreachable) or at
 * the payload layer (service answered but the shape was wrong). Both
 * branches surface the configured host so reviewers can see which
 * endpoint was attempted without opening devtools.
 *
 * The canned sanitised string is still produced and console-logged by
 * `sanitiseClientError` upstream — we just don't paint it twice into
 * the DOM (see lane6-live-quotes-error-panel-says-unreachable-twice).
 */
function DegradedBox({
  ctx,
  host,
  quotesUrl,
}: {
  ctx: ErrorCtx
  host: string
  quotesUrl: string
}) {
  const HostPill = (
    <a
      href={quotesUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono underline-offset-2 hover:text-yellow-100 hover:underline transition-colors"
      data-testid="price-service-url-link"
      aria-label={`Open ${host} in a new tab`}
    >
      <span data-testid="price-service-url-inline">{host}</span>
      <span aria-hidden> ↗</span>
    </a>
  )
  switch (ctx) {
    case 'price-service-shape':
      return (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">price-service returned an unexpected payload</div>
          <div className="mt-1 text-yellow-300/80">
            The feed at {HostPill} is up but the response shape did not match the schema this panel expects. Re-run the price-service or check its build version.
          </div>
        </div>
      )
    case 'price-service':
      return (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">price-service unreachable</div>
          <div className="mt-1 text-yellow-300/80">
            Live quotes feed at {HostPill} is unreachable. The price-service may be offline or restarting.
          </div>
        </div>
      )
  }
}

function FreshnessChip({ summary }: { summary: FreshnessSummary }) {
  if (summary.kind === 'empty') return null
  const fresh = summary.kind === 'all-current'
  const dotClass = fresh ? 'bg-green-400' : 'bg-yellow-400'
  const toneClass = fresh
    ? 'inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300'
    : 'inline-flex items-center gap-1.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200'
  const summaryText =
    summary.kind === 'all-current'
      ? 'all current'
      : `${summary.totalStale} stale of ${summary.total}`
  return (
    <span data-testid="quotes-freshness" className={toneClass}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
      <span>{formatAge(summary.minAgeMs)} · {summaryText}</span>
    </span>
  )
}
