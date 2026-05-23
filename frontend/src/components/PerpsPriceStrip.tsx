'use client'

import { LivePriceStrip } from './LivePriceStrip'
import { usePerpsPriceSources } from '@/lib/usePerpsPriceSources'

interface PerpsPriceStripProps {
  /** The currently-selected pair symbol (e.g. "BTC-USD"). */
  activeSymbol: string
  className?: string
}

const ALWAYS_ON_PAIRS = ['BTC-USD', 'ETH-USD'] as const

/**
 * Top-of-page strip for /perps. Always shows BTC + ETH; if the user is
 * looking at a third pair (e.g. SOL-USD), the active pair is appended so
 * they see their current focus alongside the headline assets.
 */
export function PerpsPriceStrip({ activeSymbol, className = '' }: PerpsPriceStripProps) {
  const { buildEntries } = usePerpsPriceSources()
  const symbols = ALWAYS_ON_PAIRS.includes(activeSymbol as typeof ALWAYS_ON_PAIRS[number])
    ? [...ALWAYS_ON_PAIRS]
    : [...ALWAYS_ON_PAIRS, activeSymbol]

  const entries = buildEntries(symbols)
  return <LivePriceStrip entries={entries} className={className} />
}
