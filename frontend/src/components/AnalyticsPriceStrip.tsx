'use client'

import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { useAttributedPrices } from '@/lib/useAttributedPrice'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'

const ANALYTICS_SYMBOLS = ['ETH', 'USDC', 'G$', 'WBTC'] as const

/**
 * Top-of-page strip for /(app)/analytics. Renders the four protocol-critical
 * assets — ETH, USDC, G$, WBTC — with their source attribution resolved
 * through the shared `useAttributedPrice` hook (task 0021). The numerator
 * behind every badge is the same one /perps and /activity see.
 *
 * Failure-mode policy preserved from task 0008: a `/api/status/quotes` outage
 * tells us the per-symbol freshness feed is unavailable, not that the prices
 * themselves are wrong — so each card stays on its truthful source and the
 * outage surfaces as its own chip above the strip.
 */
export function AnalyticsPriceStrip() {
  const attributed = useAttributedPrices([...ANALYTICS_SYMBOLS])
  const { error } = usePriceServiceStatus()

  const entries: LivePriceEntry[] = ANALYTICS_SYMBOLS.map(sym => {
    const a = attributed[sym]
    return {
      symbol: sym,
      price: a.priceUsd,
      change24h: a.change24h,
      source: a.source,
      updatedAgoMs: a.ageMs,
      divergent: a.divergent,
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
