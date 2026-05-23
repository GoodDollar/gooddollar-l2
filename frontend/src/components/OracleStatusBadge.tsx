'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePriceServiceStatus, getSessionLabel, getDominantSession, type QuoteStatus } from '@/lib/usePriceServiceStatus'
import { deriveStocksOracleHealth, type StocksOracleHealth } from '@/lib/stocksOracleHealth'

function formatAge(ms: number): string {
  if (ms < 1000) return 'just now'
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}

function renderDetailRow(quoteStatus: QuoteStatus) {
  const isStale = quoteStatus.lastUpdateMs > 60_000
  const dotColor = quoteStatus.lastUpdateMs < 15_000
    ? 'bg-green-400'
    : isStale
      ? 'bg-red-400'
      : 'bg-yellow-400'

  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="text-gray-400">
        Updated {formatAge(quoteStatus.lastUpdateMs)}
      </span>
      <span className="text-gray-600">·</span>
      <span className="text-gray-400">
        {getSessionLabel(quoteStatus.sessionState)}
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

// User-facing label for the listing-page badge. Keep short, plain English —
// this is what a trader reads next to the live price, not an internal
// service name. Internal `services[].name === 'stocks-keeper'` lookups in
// `deriveStocksOracleHealth` remain unchanged; that's a contract identifier.
const SOURCE_LABEL = 'on-chain feed'

interface OracleStatusBadgeProps {
  variant?: Variant
  symbol?: string
  useStocksFallback?: boolean
}

interface FallbackQuoteResult {
  health: StocksOracleHealth
  quotesBySymbol: Record<string, QuoteStatus>
}

const FALLBACK_STATUS_TTL_MS = 30_000

let fallbackCache: { value: StocksOracleHealth; expiresAt: number } | null = null
let fallbackInFlight: Promise<StocksOracleHealth> | null = null
let quoteFallbackCache: { value: FallbackQuoteResult; expiresAt: number } | null = null
let quoteFallbackInFlight: Promise<FallbackQuoteResult> | null = null

async function resolveStocksFallbackStatus({ force = false }: { force?: boolean } = {}): Promise<StocksOracleHealth> {
  const now = Date.now()
  if (!force && fallbackCache && fallbackCache.expiresAt > now) {
    return fallbackCache.value
  }
  if (!force && fallbackInFlight) {
    return fallbackInFlight
  }

  let request: Promise<StocksOracleHealth>
  request = fetch('/api/status', { cache: 'no-store' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      return deriveStocksOracleHealth(data)
    })
    .catch(() => 'offline' as const)
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
  return {
    symbol: r.symbol,
    lastUpdateMs: typeof r.lastUpdateMs === 'number' ? r.lastUpdateMs : 0,
    sessionState: typeof r.sessionState === 'string' ? r.sessionState : 'unknown',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0,
  }
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
  const [fallbackState, setFallbackState] = useState<StocksOracleHealth>('offline')
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
          setFallbackState(next.health)
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

  if (error || !status) {
    if (useStocksFallback) {
      if (fallbackLoading || !fallbackReady) {
        if (timeoutPhase === 'timed-out') {
          return (
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
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
            <div className="animate-pulse h-5 w-24 rounded-full bg-dark-50/30" />
          </div>
        )
      }
      if (fallbackState === 'live') {
        if (useQuoteFallback && symbol) {
          const quoteStatus = fallbackQuote.quotesBySymbol[symbol]
          if (quoteStatus) {
            return renderDetailRow(quoteStatus)
          }
          return (
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Live</span>
              <span className="text-gray-600">·</span>
              <span>no {symbol} feed yet</span>
            </div>
          )
        }
        return (
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Live</span>
            <span className="text-gray-600">·</span>
            <span>{SOURCE_LABEL}</span>
          </div>
        )
      }
      if (fallbackState === 'degraded') {
        return (
          <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Oracle degraded</span>
          </div>
        )
      }
    }
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
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
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span>No oracle data for {symbol}</span>
        </div>
      )
    }

    return renderDetailRow(quoteStatus)
  }

  const dominantSession = getDominantSession(quotes)
  const maxAge = quotes.length > 0 ? Math.max(...quotes.map(q => q.lastUpdateMs)) : 0
  const anyStale = maxAge > 60_000
  const dotColor = healthy && !anyStale
    ? 'bg-green-400'
    : healthy && anyStale
      ? 'bg-yellow-400'
      : 'bg-red-400'

  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-400">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${healthy && !anyStale ? 'animate-pulse' : ''}`} />
      <span>{freshCount}/{totalCount} feeds</span>
      <span className="text-gray-600">·</span>
      <span>{getSessionLabel(dominantSession)}</span>
      {anyStale && (
        <>
          <span className="text-gray-600">·</span>
          <span className="text-yellow-400">delayed</span>
        </>
      )}
    </div>
  )
}

export function __resetOracleStatusFallbackForTests(): void {
  fallbackCache = null
  fallbackInFlight = null
  quoteFallbackCache = null
  quoteFallbackInFlight = null
}
