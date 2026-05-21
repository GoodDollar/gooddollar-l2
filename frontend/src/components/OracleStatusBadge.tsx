'use client'

import { useEffect, useState } from 'react'
import { usePriceServiceStatus, getSessionLabel, getDominantSession } from '@/lib/usePriceServiceStatus'
import { deriveStocksOracleHealth, type StocksOracleHealth } from '@/lib/stocksOracleHealth'

function formatAge(ms: number): string {
  if (ms < 1000) return 'just now'
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}

type Variant = 'compact' | 'detail'

interface OracleStatusBadgeProps {
  variant?: Variant
  symbol?: string
  useStocksFallback?: boolean
  /**
   * When provided alongside `useStocksFallback`, indicates whether the
   * on-chain stocks oracle is actually returning data. When `false`, the
   * badge surfaces a "Demo data" state instead of misleading "Live", even
   * if the off-chain `stocks-keeper` service reports healthy.
   */
  onChainReachable?: boolean
}

export function OracleStatusBadge({
  variant = 'compact',
  symbol,
  useStocksFallback = false,
  onChainReachable,
}: OracleStatusBadgeProps) {
  const { status, error } = usePriceServiceStatus()
  const hasAuthError = /\b(401|403)\b/.test(error ?? '')
  const [fallbackState, setFallbackState] = useState<StocksOracleHealth>('offline')
  const [fallbackLoading, setFallbackLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!useStocksFallback || status || !error) return

    setFallbackLoading(true)
    fetch('/api/status', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            if (!cancelled) setFallbackState('auth')
            return
          }
          throw new Error(`status ${res.status}`)
        }
        const data = await res.json()
        if (cancelled) return
        setFallbackState(deriveStocksOracleHealth(data, Date.now(), onChainReachable))
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof Error && /\b(401|403)\b/.test(err.message)) {
          setFallbackState('auth')
          return
        }
        setFallbackState('offline')
      })
      .finally(() => {
        if (!cancelled) setFallbackLoading(false)
      })

    return () => { cancelled = true }
  }, [useStocksFallback, status, error, onChainReachable])

  if (error || !status) {
    if (useStocksFallback) {
      if (hasAuthError || fallbackState === 'auth') {
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-red-300" title="Upstream stock status endpoint returned unauthorized (401/403). Check credentials/session configuration.">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Auth required</span>
            <span className="text-red-500/60">·</span>
            <span>stocks status 401</span>
          </div>
        )
      }
      if (fallbackLoading) {
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span>Checking oracle...</span>
          </div>
        )
      }
      if (fallbackState === 'live') {
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Live</span>
            <span className="text-gray-600">·</span>
            <span>stocks-keeper</span>
          </div>
        )
      }
      if (fallbackState === 'fallback') {
        return (
          <div
            className="inline-flex items-center gap-1.5 text-xs text-amber-300"
            title="Off-chain stocks-keeper is healthy, but the on-chain StocksPriceOracle is unreachable. UI is showing demo data."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Demo data</span>
            <span className="text-amber-500/60">·</span>
            <span>oracle unreachable</span>
          </div>
        )
      }
      if (fallbackState === 'degraded') {
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Oracle degraded</span>
          </div>
        )
      }
    }
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
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
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span>No oracle data for {symbol}</span>
        </div>
      )
    }

    const isStale = quoteStatus.lastUpdateMs > 60_000
    const dotColor = quoteStatus.lastUpdateMs < 15_000
      ? 'bg-green-400'
      : isStale
        ? 'bg-red-400'
        : 'bg-yellow-400'

    return (
      <div className="inline-flex items-center gap-1.5 text-xs">
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

  const dominantSession = getDominantSession(quotes)
  const maxAge = quotes.length > 0 ? Math.max(...quotes.map(q => q.lastUpdateMs)) : 0
  const anyStale = maxAge > 60_000
  const dotColor = healthy && !anyStale
    ? 'bg-green-400'
    : healthy && anyStale
      ? 'bg-yellow-400'
      : 'bg-red-400'

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
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
