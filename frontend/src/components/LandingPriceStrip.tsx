'use client'

import { useEffect, useState } from 'react'
import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'

const SYMBOLS = ['ETH', 'USDC', 'G$'] as const

/**
 * Landing-page price strip — small wrapper that pulls ETH / USDC / G$ from
 * `usePriceFeeds` and renders a `LivePriceStrip` with their source attribution.
 *
 * Pulled out into its own component so the landing page's `LandingSwapCard`
 * doesn't have to inline the data wiring, and so the strip can be reused on
 * /(app) surfaces with different symbol sets.
 */
export function LandingPriceStrip() {
  const { prices, quotes, sources, lastUpdated } = usePriceFeeds([...SYMBOLS])
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const updatedAgo = lastUpdated ? now - lastUpdated.getTime() : null

  const entries: LivePriceEntry[] = SYMBOLS.map(symbol => ({
    symbol,
    price: prices[symbol] ?? 0,
    change24h: quotes[symbol]?.change24h ?? null,
    source: sources[symbol] ?? 'unknown',
    updatedAgoMs: updatedAgo,
  }))

  return <LivePriceStrip entries={entries} />
}
