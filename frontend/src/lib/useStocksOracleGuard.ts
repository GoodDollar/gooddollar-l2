'use client'

import { useEffect, useMemo, useState } from 'react'

import { usePriceServiceStatus, type PriceServiceStatus } from '@/lib/usePriceServiceStatus'
import { deriveStocksOracleHealth, type StocksOracleHealth } from '@/lib/stocksOracleHealth'

export type StocksTradeOracleHealth = 'live' | 'degraded' | 'offline'

export interface StocksOracleGuardState {
  health: StocksTradeOracleHealth
  reason: string | null
  isLoading: boolean
}

function mapFallbackToGuardState(fallback: StocksOracleHealth): StocksTradeOracleHealth {
  if (fallback === 'live') return 'degraded'
  return fallback
}

export function deriveStocksTradeOracleHealth(
  symbol: string | undefined,
  status: PriceServiceStatus | null,
): StocksOracleGuardState {
  if (!symbol || !status) {
    return {
      health: 'offline',
      reason: 'Oracle status is unavailable.',
      isLoading: false,
    }
  }

  const quote = status.quotes.find((q) => q.symbol === symbol)
  if (!quote) {
    return {
      health: 'degraded',
      reason: `No oracle quote available for ${symbol}.`,
      isLoading: false,
    }
  }

  if (quote.lastUpdateMs > 300_000) {
    return {
      health: 'offline',
      reason: `Quote is stale (${Math.floor(quote.lastUpdateMs / 1000)}s old).`,
      isLoading: false,
    }
  }

  if (!status.healthy || quote.lastUpdateMs > 60_000 || quote.confidence < 50) {
    return {
      health: 'degraded',
      reason: 'Quote feed is delayed or low confidence.',
      isLoading: false,
    }
  }

  return {
    health: 'live',
    reason: null,
    isLoading: false,
  }
}

export function useStocksOracleGuard(symbol?: string): StocksOracleGuardState {
  const { status, error } = usePriceServiceStatus()
  const [fallbackHealth, setFallbackHealth] = useState<StocksOracleHealth>('offline')
  const [fallbackLoading, setFallbackLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (status || !error) return

    setFallbackLoading(true)
    fetch('/api/status', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        setFallbackHealth(deriveStocksOracleHealth(data))
      })
      .catch(() => {
        if (cancelled) return
        setFallbackHealth('offline')
      })
      .finally(() => {
        if (!cancelled) setFallbackLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [status, error])

  return useMemo(() => {
    if (status) return deriveStocksTradeOracleHealth(symbol, status)
    if (fallbackLoading) {
      return {
        health: 'offline',
        reason: 'Checking oracle status…',
        isLoading: true,
      }
    }
    const mapped = mapFallbackToGuardState(fallbackHealth)
    return {
      health: mapped,
      reason:
        mapped === 'degraded'
          ? 'Quote feed is unavailable. Keeper health is partially available via status API.'
          : 'Oracle status is unavailable.',
      isLoading: false,
    }
  }, [symbol, status, fallbackHealth, fallbackLoading])
}
