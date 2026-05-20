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
  /**
   * When the primary quotes-status endpoint is unreachable, also probe
   * `/api/status` and report "Live" if the stocks-keeper service is healthy.
   * Defaults to `true` so every consumer (compact listing badges and the
   * stock detail page) shares the same resilient behavior — opt out with
   * `useStocksFallback={false}` for legacy call sites that need the strict
   * primary-only path.
   */
  useStocksFallback?: boolean
}

export function OracleStatusBadge({ variant = 'compact', symbol, useStocksFallback = true }: OracleStatusBadgeProps) {
  const { status, error } = usePriceServiceStatus()
  const [fallbackState, setFallbackState] = useState<StocksOracleHealth>('offline')
  const [fallbackLoading, setFallbackLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!useStocksFallback || status || !error) return

    setFallbackLoading(true)
    fetch('/api/status', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        setFallbackState(deriveStocksOracleHealth(data))
      })
      .catch(() => {
        if (cancelled) return
        setFallbackState('offline')
      })
      .finally(() => {
        if (!cancelled) setFallbackLoading(false)
      })

    return () => { cancelled = true }
  }, [useStocksFallback, status, error])

  if (error || !status) {
    if (useStocksFallback) {
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
