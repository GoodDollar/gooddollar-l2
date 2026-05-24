'use client'

import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { useAttributedPrices } from '@/lib/useAttributedPrice'

const SYMBOLS = ['ETH', 'USDC', 'G$'] as const

/**
 * Landing-page price strip — small wrapper around `useAttributedPrice` so the
 * landing hero's ETH tile shows the same dollar value as `/perps`, `/activity`,
 * and `/analytics` at the same instant.
 */
export function LandingPriceStrip() {
  const attributed = useAttributedPrices([...SYMBOLS])

  const entries: LivePriceEntry[] = SYMBOLS.map(symbol => {
    const a = attributed[symbol]
    return {
      symbol,
      price: a.priceUsd,
      change24h: a.change24h,
      source: a.source,
      updatedAgoMs: a.ageMs,
      divergent: a.divergent,
    }
  })

  return <LivePriceStrip entries={entries} />
}
