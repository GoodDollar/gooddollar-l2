'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePriceServiceStatus, getSessionLabel, getDominantSession, type QuoteStatus } from '@/lib/usePriceServiceStatus'
import { deriveStocksOracleHealth, getStocksKeeperAgeMs, type StocksOracleHealth } from '@/lib/stocksOracleHealth'
import { formatSessionAsOf } from '@/lib/sessionAnchor'
import { OracleBadgeFooter } from './OracleBadgeFooter'

function formatAge(ms: number): string {
  if (ms < 1000) return 'just now'
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}

// User-facing label for the listing-page badge. Keep short, plain English —
// this is what a trader reads next to the live price, not an internal
// service name. Internal `services[].name === 'stocks-keeper'` lookups in
// `deriveStocksOracleHealth` remain unchanged; that's a contract identifier.
const SOURCE_LABEL = 'on-chain feed'

// Status dot tokens — sized to read at a glance from typical viewing distance.
// Live state uses a halo ring so the green dot reads as a status pill rather
// than a stray pixel.
const STATUS_DOT = 'w-2.5 h-2.5 rounded-full'
const STATUS_DOT_LIVE = `${STATUS_DOT} bg-green-400 animate-pulse ring-2 ring-green-400/20`
const STATUS_DOT_STALE = `${STATUS_DOT} bg-yellow-400`
const STATUS_DOT_RED = `${STATUS_DOT} bg-red-400`
const STATUS_DOT_GRAY = `${STATUS_DOT} bg-gray-500`
const STATUS_SKELETON = 'animate-pulse h-4 w-28 rounded-full bg-dark-50/30'

/**
 * Build the "session" clause for the detail row. When the upstream carries
 * a `sessionAsOfMs` AND the session is not 'open', we render an explicit
 * as-of clause ("At close · May 22, 20:00 EDT" / "Halted since 14:32 EDT")
 * so the user can tell *when* the displayed print was published. Otherwise
 * we fall back to today's bare label ("Market Closed", "Halted", …).
 */
function sessionClauseFor(quoteStatus: QuoteStatus): string {
  if (quoteStatus.sessionState !== 'open' && typeof quoteStatus.sessionAsOfMs === 'number') {
    const formatted = formatSessionAsOf(quoteStatus.sessionState, quoteStatus.sessionAsOfMs)
    if (formatted) return formatted
  }
  return getSessionLabel(quoteStatus.sessionState)
}

function renderDetailRow(quoteStatus: QuoteStatus) {
  const isStale = quoteStatus.lastUpdateMs > 60_000
  const dotClass = quoteStatus.lastUpdateMs < 15_000
    ? STATUS_DOT_LIVE
    : isStale
      ? STATUS_DOT_RED
      : STATUS_DOT_STALE

  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className={dotClass} />
      <span className="text-gray-400">
        Updated {formatAge(quoteStatus.lastUpdateMs)}
      </span>
      <span className="text-gray-600">·</span>
      <span className="text-gray-400">
        {sessionClauseFor(quoteStatus)}
      </span>
      {quoteStatus.confidence > 0 && (
        <>
          <span className="text-gray-600">·</span>
          <span className={quoteStatus.confidence >= 70 ? 'text-gray-400' : 'text-yellow-400'}>
            {quoteStatus.confidence}% conf
          </span>
        </>
      )}
    </div>
  )
}

type Variant = 'compact' | 'detail'
type TimeoutPhase = 'loading' | 'slow' | 'timed-out'

interface OracleStatusBadgeProps {
  variant?: Variant
  symbol?: string
  useStocksFallback?: boolean
}

interface FallbackQuoteResult {
  health: StocksOracleHealth
  quotesBySymbol: Record<string, QuoteStatus>
}

interface FallbackHealthResult {
  health: StocksOracleHealth
  ageMs: number | null
}

const FALLBACK_STATUS_TTL_MS = 30_000
const FALLBACK_OFFLINE: FallbackHealthResult = { health: 'offline', ageMs: null }

let fallbackCache: { value: FallbackHealthResult; expiresAt: number } | null = null
let fallbackInFlight: Promise<FallbackHealthResult> | null = null
let quoteFallbackCache: { value: FallbackQuoteResult; expiresAt: number } | null = null
let quoteFallbackInFlight: Promise<FallbackQuoteResult> | null = null

async function resolveStocksFallbackStatus({ force = false }: { force?: boolean } = {}): Promise<FallbackHealthResult> {
  const now = Date.now()
  if (!force && fallbackCache && fallbackCache.expiresAt > now) {
    return fallbackCache.value
  }
  if (!force && fallbackInFlight) {
    return fallbackInFlight
  }

  let request: Promise<FallbackHealthResult>
  request = fetch('/api/status', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      return { health: deriveStocksOracleHealth(data), ageMs: getStocksKeeperAgeMs(data) }
    })
    .catch(() => FALLBACK_OFFLINE)
    .then((value) => {
      fallbackCache = { value, expiresAt: Date.now() + FALLBACK_STATUS_TTL_MS }
      return value
    })
    .finally(() => {
      if (fallbackInFlight === request) fallbackInFlight = null
    })

  fallbackInFlight = request
  return fallbackInFlight
}

function pickQuoteRow(raw: unknown): QuoteStatus | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.symbol !== 'string') return null
  const out: QuoteStatus = {
    symbol: r.symbol,
    lastUpdateMs: typeof r.lastUpdateMs === 'number' ? r.lastUpdateMs : 0,
    sessionState: typeof r.sessionState === 'string' ? r.sessionState : 'unknown',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0,
  }
  if (typeof r.sessionAsOfMs === 'number' && Number.isFinite(r.sessionAsOfMs)) {
    out.sessionAsOfMs = r.sessionAsOfMs
  }
  return out
}

function deriveQuoteFallback(data: unknown): FallbackQuoteResult {
  const obj = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const quotes = Array.isArray(obj.quotes) ? obj.quotes : []
  const quotesBySymbol: Record<string, QuoteStatus> = {}
  for (const q of quotes) {
    const row = pickQuoteRow(q)
    if (row) quotesBySymbol[row.symbol] = row
  }

  let health: StocksOracleHealth
  if (typeof obj.healthy === 'boolean') {
    if (obj.healthy) health = 'live'
    else if (obj.degraded === true) health = 'degraded'
    else health = 'offline'
  } else {
    // Tolerate the legacy `/api/status` shape so the resolver degrades
    // gracefully when only the service-level aggregator is reachable.
    health = deriveStocksOracleHealth(data)
  }
  return { health, quotesBySymbol }
}

async function resolveStocksFallbackQuoteAndHealth({ force = false }: { force?: boolean } = {}): Promise<FallbackQuoteResult> {
  const now = Date.now()
  if (!force && quoteFallbackCache && quoteFallbackCache.expiresAt > now) {
    return quoteFallbackCache.value
  }
  if (!force && quoteFallbackInFlight) {
    return quoteFallbackInFlight
  }

  let request: Promise<FallbackQuoteResult>
  request = fetch('/api/oracle/status', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok && res.status !== 503) throw new Error(`oracle status ${res.status}`)
      const data = await res.json()
      return deriveQuoteFallback(data)
    })
    .catch((): FallbackQuoteResult => ({ health: 'offline', quotesBySymbol: {} }))
    .then((value) => {
      quoteFallbackCache = { value, expiresAt: Date.now() + FALLBACK_STATUS_TTL_MS }
      return value
    })
    .finally(() => {
      if (quoteFallbackInFlight === request) quoteFallbackInFlight = null
    })

  quoteFallbackInFlight = request
  return quoteFallbackInFlight
}

export function OracleStatusBadge({ variant = 'compact', symbol, useStocksFallback = false }: OracleStatusBadgeProps) {
  const { status, error } = usePriceServiceStatus()
  const [fallbackState, setFallbackState] = useState<FallbackHealthResult>(FALLBACK_OFFLINE)
  const [fallbackQuote, setFallbackQuote] = useState<FallbackQuoteResult>({ health: 'offline', quotesBySymbol: {} })
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const [fallbackReady, setFallbackReady] = useState(false)
  const [timeoutPhase, setTimeoutPhase] = useState<TimeoutPhase>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timedOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const useQuoteFallback = variant === 'detail' && Boolean(symbol)

  const clearTimers = useCallback(() => {
    if (slowTimer.current) {
      clearTimeout(slowTimer.current)
      slowTimer.current = null
    }
    if (timedOutTimer.current) {
      clearTimeout(timedOutTimer.current)
      timedOutTimer.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!useStocksFallback || status || !error) return

    setFallbackReady(false)
    setFallbackLoading(true)
    setTimeoutPhase('loading')

    slowTimer.current = setTimeout(() => {
      if (!cancelled) setTimeoutPhase('slow')
    }, 5000)

    timedOutTimer.current = setTimeout(() => {
      if (!cancelled) setTimeoutPhase('timed-out')
    }, 15000)

    const force = retryCount > 0
    const work = useQuoteFallback
      ? resolveStocksFallbackQuoteAndHealth({ force }).then((next) => {
          if (cancelled) return
          clearTimers()
          setFallbackQuote(next)
          setFallbackState({ health: next.health, ageMs: null })
        })
      : resolveStocksFallbackStatus({ force }).then((next) => {
          if (cancelled) return
          clearTimers()
          setFallbackState(next)
        })

    work.finally(() => {
      if (!cancelled) {
        setFallbackLoading(false)
        setFallbackReady(true)
      }
    })

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [useStocksFallback, useQuoteFallback, status, error, retryCount, clearTimers])

  // Detail variant is symbol-scoped (per-quote rail), listing variant is
  // not. The footer reads chain/proof from `useOracleProvenance` directly.
  const footerNode = symbol
    ? <OracleBadgeFooter mode="detail" symbol={symbol} cached={false} />
    : <OracleBadgeFooter mode="listing" cached={false} />
  const cachedFooterNode = symbol
    ? <OracleBadgeFooter mode="detail" symbol={symbol} cached={true} />
    : <OracleBadgeFooter mode="listing" cached={true} />

  if (error || !status) {
    if (useStocksFallback) {
      if (fallbackLoading || !fallbackReady) {
        if (timeoutPhase === 'timed-out') {
          return (
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-yellow-400">
              <span className={STATUS_DOT_STALE} />
              <span>Price feed unavailable</span>
              <button
                type="button"
                onClick={() => setRetryCount(c => c + 1)}
                className="underline hover:text-yellow-300 transition-colors"
              >
                Retry
              </button>
            </div>
          )
        }
        return (
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap" aria-label={timeoutPhase === 'slow' ? 'Price feed connecting' : 'Checking price feed'}>
            <div className={STATUS_SKELETON} />
          </div>
        )
      }
      if (fallbackState.health === 'live') {
        if (useQuoteFallback && symbol) {
          const quoteStatus = fallbackQuote.quotesBySymbol[symbol]
          if (quoteStatus) {
            return (
              <>
                {renderDetailRow(quoteStatus)}
                {cachedFooterNode}
              </>
            )
          }
          return (
            <>
              <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
                <span className={STATUS_DOT_LIVE} />
                <span>Live</span>
                <span className="text-gray-600">·</span>
                <span>no {symbol} feed yet</span>
              </div>
              {cachedFooterNode}
            </>
          )
        }
        return (
          <>
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
              <span className={STATUS_DOT_LIVE} />
              <span>Live</span>
              {fallbackState.ageMs !== null && Number.isFinite(fallbackState.ageMs) && (
                <>
                  <span className="text-gray-600">·</span>
                  <span>Updated {formatAge(fallbackState.ageMs)}</span>
                </>
              )}
              <span className="text-gray-600">·</span>
              <span>{SOURCE_LABEL}</span>
            </div>
            {cachedFooterNode}
          </>
        )
      }
      if (fallbackState.health === 'degraded') {
        return (
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
            <span className={STATUS_DOT_STALE} />
            <span>Oracle degraded</span>
          </div>
        )
      }
    }
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
        <span className={STATUS_DOT_GRAY} />
        <span>Oracle offline</span>
      </div>
    )
  }

  const { healthy, freshCount, totalCount, quotes } = status

  if (variant === 'detail' && symbol) {
    const quoteStatus = quotes.find(q => q.symbol === symbol)
    if (!quoteStatus) {
      return (
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
          <span className={STATUS_DOT_GRAY} />
          <span>No oracle data for {symbol}</span>
        </div>
      )
    }

    return (
      <>
        {renderDetailRow(quoteStatus)}
        {footerNode}
      </>
    )
  }

  const dominantSession = getDominantSession(quotes)
  const maxAge = quotes.length > 0 ? Math.max(...quotes.map(q => q.lastUpdateMs)) : 0
  const anyStale = maxAge > 60_000
  const dotClass = healthy && !anyStale
    ? STATUS_DOT_LIVE
    : healthy && anyStale
      ? STATUS_DOT_STALE
      : STATUS_DOT_RED

  return (
    <>
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
      <span className={dotClass} />
      <span>{freshCount}/{totalCount} feeds</span>
      {Number.isFinite(maxAge) && maxAge > 0 && quotes.length > 0 && (
        <>
          <span className="text-gray-600">·</span>
          <span>Updated {formatAge(maxAge)}</span>
        </>
      )}
      <span className="text-gray-600">·</span>
      <span>{getSessionLabel(dominantSession)}</span>
      {anyStale && (
        <>
          <span className="text-gray-600">·</span>
          <span className="text-yellow-400">delayed</span>
        </>
      )}
    </div>
    {footerNode}
    </>
  )
}

export function __resetOracleStatusFallbackForTests(): void {
  fallbackCache = null
  fallbackInFlight = null
  quoteFallbackCache = null
  quoteFallbackInFlight = null
}
