'use client'

import { useEffect, useState } from 'react'
import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'

const ACTIVITY_SYMBOLS = ['ETH', 'USDC', 'G$', 'WBTC'] as const

/**
 * Top-of-page strip for /activity. Fixed symbol set (ETH / USDC / G$ / WBTC)
 * for the initial deliverable; future iterations may derive symbols from
 * the most-recent on-chain transactions.
 *
 * Stale state is surfaced from `usePriceServiceStatus` so the explorer never
 * looks "live" while the upstream feed is delayed.
 */
export function ActivityPriceStrip() {
  const { prices, sources, quotes, lastUpdated } = usePriceFeeds([...ACTIVITY_SYMBOLS])
  const { status } = usePriceServiceStatus()

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const updatedAgoMs = lastUpdated ? now - lastUpdated.getTime() : null

  const entries: LivePriceEntry[] = ACTIVITY_SYMBOLS.map(sym => {
    let source = sources[sym] ?? 'unknown'
    const sq = status?.quotes.find(q => q.symbol === sym)
    if (sq && sq.lastUpdateMs > 60_000) source = 'stale'
    if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) source = 'closed'
    return {
      symbol: sym,
      price: prices[sym] ?? 0,
      change24h: quotes[sym]?.change24h ?? null,
      source,
      updatedAgoMs,
    }
  })

  return <LivePriceStrip entries={entries} />
}
