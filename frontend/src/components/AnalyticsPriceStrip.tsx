'use client'

import { useEffect, useState } from 'react'
import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import { resolvePriceSource, type PriceSource } from '@/lib/priceSource'

const ANALYTICS_SYMBOLS = ['ETH', 'USDC', 'G$', 'WBTC'] as const

/**
 * Top-of-page strip for /(app)/analytics. Renders the four protocol-critical
 * assets — ETH, USDC, G$, WBTC — with their source attribution. When the
 * price-service status reports an error we surface the strip with the
 * `fallback` source on every card so a viewer never sees a bare price.
 */
export function AnalyticsPriceStrip() {
  const { prices, sources, quotes, lastUpdated } = usePriceFeeds([...ANALYTICS_SYMBOLS])
  const { status, error } = usePriceServiceStatus()

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const updatedAgoMs = lastUpdated ? now - lastUpdated.getTime() : null

  const entries: LivePriceEntry[] = ANALYTICS_SYMBOLS.map(sym => {
    let source: PriceSource = sources[sym] ?? 'unknown'
    const sq = status?.quotes.find(q => q.symbol === sym)

    if (error && source !== 'chain-oracle') {
      // Price-service down → demote to fallback if we don't have a chain truth
      source = 'fallback'
    } else if (sq) {
      const sessionSource = resolvePriceSource({
        chainOk: source === 'chain-oracle',
        coinGeckoLive: source === 'coingecko',
        hasFallback: true,
        statusQuote: { lastUpdateMs: sq.lastUpdateMs, sessionState: sq.sessionState, source: sq.source },
      })
      // Only downgrade — never silently upgrade.
      if (sessionSource === 'stale' || sessionSource === 'closed') source = sessionSource
    }

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
