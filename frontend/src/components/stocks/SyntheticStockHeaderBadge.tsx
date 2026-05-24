'use client'

import { useEffect, useState } from 'react'
import { getMarketSession, type MarketSession } from '@/lib/marketHours'
import {
  getSyntheticStockHeader,
  type SyntheticStockHeader,
} from '@/lib/getSyntheticStockHeader'

/**
 * Subscribes to `getMarketSession()` once a minute and returns the rendered
 * synthetic-stock hero copy. Shared between the `/stocks` index hero, the
 * `/stocks/[ticker]` hero, and the InfoBanner description so the three never
 * argue with each other (task 0022).
 */
export function useSyntheticStockHeader(): SyntheticStockHeader {
  const [session, setSession] = useState<MarketSession>(getMarketSession)
  useEffect(() => {
    const id = setInterval(() => setSession(getMarketSession()), 60_000)
    return () => clearInterval(id)
  }, [])
  return getSyntheticStockHeader(session)
}

interface SyntheticStockHeaderBadgeProps {
  className?: string
}

/**
 * Hero pill that always reflects the synthetic token's affordance (always
 * tradeable 24/7) AND the underlying session in a single, non-contradicting
 * label. Replaces `<MarketSessionBadge />` on synthetic-stock surfaces.
 */
export function SyntheticStockHeaderBadge({ className = '' }: SyntheticStockHeaderBadgeProps) {
  const header = useSyntheticStockHeader()
  const isLive = header.pillTone === 'live'

  const containerTone = isLive
    ? 'border-green-500/30 bg-green-500/10 text-green-400'
    : 'border-goodgreen/25 bg-goodgreen/10 text-goodgreen/90'

  const dotTone = isLive
    ? 'bg-green-400 animate-pulse'
    : 'bg-goodgreen/80'

  return (
    <span
      data-testid="synthetic-stock-header-badge"
      data-tone={header.pillTone}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${containerTone} ${className}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${dotTone}`} />
      {header.pillLabel}
    </span>
  )
}
