'use client'

import { useEffect, useState } from 'react'
import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import { resolvePriceSource, type PriceSource } from '@/lib/priceSource'

const ANALYTICS_SYMBOLS = ['ETH', 'USDC', 'G$', 'WBTC'] as const

/**
 * Top-of-page strip for /(app)/analytics. Renders the four protocol-critical
 * assets — ETH, USDC, G$, WBTC — with their source attribution.
 *
 * Failure-mode policy: a `/api/status/quotes` outage tells us the
 * per-symbol freshness feed is unavailable. It does NOT tell us that
 * CoinGecko or the on-chain oracle are down. We therefore keep each
 * card's source honest (whatever `usePriceFeeds.sources[sym]` reports)
 * and surface the status-feed outage as its own chip above the strip.
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

    if (sq) {
      const sessionSource = resolvePriceSource({
        chainOk: source === 'chain-oracle',
        coinGeckoLive: source === 'coingecko',
        hasFallback: true,
        statusQuote: { lastUpdateMs: sq.lastUpdateMs, sessionState: sq.sessionState, source: sq.source },
      })
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

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div
          data-testid="price-status-offline"
          role="status"
          className="self-start inline-flex items-center gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-xs text-amber-300"
        >
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Status feed offline — per-symbol freshness unavailable; values below come from CoinGecko / chain only.
        </div>
      )}
      <LivePriceStrip entries={entries} />
    </div>
  )
}
