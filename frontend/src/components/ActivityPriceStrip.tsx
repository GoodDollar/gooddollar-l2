'use client'

import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { useAttributedPrices } from '@/lib/useAttributedPrice'

const ACTIVITY_SYMBOLS = ['ETH', 'USDC', 'G$', 'WBTC'] as const

/**
 * Top-of-page strip for /activity. Resolves all four tiles through the shared
 * `useAttributedPrice` hook so the BTC tile here can never disagree with the
 * BTC tile rendered on /perps or /analytics — the chain-oracle reading wins
 * whenever present, with an explicit "Source disagrees" chip when chain and
 * CoinGecko diverge by more than 0.5%.
 */
export function ActivityPriceStrip() {
  const attributed = useAttributedPrices([...ACTIVITY_SYMBOLS])

  const entries: LivePriceEntry[] = ACTIVITY_SYMBOLS.map(sym => {
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

  return <LivePriceStrip entries={entries} />
}
