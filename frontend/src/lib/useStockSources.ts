'use client'

import { useMemo } from 'react'
import { useStockPrices } from './useStockPrices'
import { usePriceServiceStatus } from './usePriceServiceStatus'
import { type PriceSource } from './priceSource'

/**
 * Resolves the canonical lane-4 source for every stock ticker we care about.
 *
 * Combines:
 *  - `useStockPrices` — chain oracle / static fallback per ticker.
 *  - `usePriceServiceStatus` — session state + freshness from price-service.
 *
 * Stocks-specific overrides (in priority order):
 *   1. sessionState in {closed, halted}  → 'closed'
 *   2. lastUpdateMs > 60s & base=chain   → 'stale'
 *   3. base from useStockPrices          → unchanged
 *
 * Returns a plain `Record<ticker, PriceSource>`.
 */
export function useStockSources(): Record<string, PriceSource> {
  const { sources: baseSources } = useStockPrices()
  const { status } = usePriceServiceStatus()

  return useMemo(() => {
    const out: Record<string, PriceSource> = {}
    for (const ticker of Object.keys(baseSources)) {
      const base = baseSources[ticker] ?? 'fallback'
      const sq = status?.quotes.find(q => q.symbol === ticker)
      if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) {
        out[ticker] = 'closed'
      } else if (sq && sq.lastUpdateMs > 60_000 && base === 'chain-oracle') {
        out[ticker] = 'stale'
      } else {
        out[ticker] = base
      }
    }
    return out
  }, [baseSources, status])
}
