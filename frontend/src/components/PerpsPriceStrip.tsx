'use client'

import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { usePerpsPriceSources } from '@/lib/usePerpsPriceSources'
import { useAttributedPrices } from '@/lib/useAttributedPrice'

interface PerpsPriceStripProps {
  /** The currently-selected pair symbol (e.g. "BTC-USD"). */
  activeSymbol: string
  className?: string
}

const ALWAYS_ON_PAIRS = ['BTC-USD', 'ETH-USD'] as const
type AlwaysOnPair = (typeof ALWAYS_ON_PAIRS)[number]

const PAIR_TO_BASE: Record<AlwaysOnPair, string> = {
  'BTC-USD': 'BTC',
  'ETH-USD': 'ETH',
}

const ALWAYS_ON_BASES = ALWAYS_ON_PAIRS.map(s => PAIR_TO_BASE[s])

function isAlwaysOn(symbol: string): symbol is AlwaysOnPair {
  return (ALWAYS_ON_PAIRS as readonly string[]).includes(symbol)
}

/**
 * Top-of-page strip for /perps. Always shows BTC + ETH; if the user is
 * looking at a third pair (e.g. SOL-USD), the active pair is appended so
 * they see their current focus alongside the headline assets.
 *
 * BTC and ETH are sourced from `useAttributedPrices`, the same hook every
 * other lane-4 surface (Activity, Analytics, Portfolio, landing) reads
 * from. That makes the headline dollar values agree across pages by
 * construction and, when the chain RPC is down, surfaces the honest
 * `Cached (CoinGecko)` / `Fallback` badge instead of lying about the
 * static `FALLBACK_PAIRS` constant being a chain read. Task 0033.
 */
export function PerpsPriceStrip({ activeSymbol, className = '' }: PerpsPriceStripProps) {
  const { sources: perpsSources, buildEntries } = usePerpsPriceSources()
  const attributed = useAttributedPrices(ALWAYS_ON_BASES)

  const headlineEntries: LivePriceEntry[] = ALWAYS_ON_PAIRS.map(pairSym => {
    const attr = attributed[PAIR_TO_BASE[pairSym]]
    if (!attr) {
      return { symbol: pairSym, price: 0, change24h: null, source: 'unknown', updatedAgoMs: null }
    }
    // /perps-specific session-state policy (closed/halted) wins over the
    // generic resolver — preserved from usePerpsPriceSources. Everything
    // else (chain-oracle / coingecko / fallback) takes the attributed
    // source so prices and badges match Activity/Analytics/Portfolio.
    const perpsSource = perpsSources[pairSym]
    const source = perpsSource === 'closed' ? 'closed' : attr.source
    return {
      symbol: pairSym,
      price: attr.priceUsd,
      change24h: attr.change24h,
      source,
      updatedAgoMs: attr.ageMs,
      divergent: attr.divergent,
    }
  })

  const entries = isAlwaysOn(activeSymbol)
    ? headlineEntries
    : [...headlineEntries, ...buildEntries([activeSymbol])]

  return <LivePriceStrip entries={entries} className={className} />
}
