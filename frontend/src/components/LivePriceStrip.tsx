'use client'

import { LivePriceCard, type LivePriceCardProps } from './LivePriceCard'

export type LivePriceEntry = Omit<LivePriceCardProps, 'compact' | 'className'>

interface LivePriceStripProps {
  entries: LivePriceEntry[]
  compact?: boolean
  className?: string
  /** Heading rendered above the strip. Optional. */
  title?: string
}

/**
 * LivePriceStrip — horizontally scrollable strip of `LivePriceCard`s used at
 * the top of every lane-4 surface (Swap landing, Perps, Portfolio, Analytics,
 * Activity, Stocks). Renders a 3-card skeleton when entries is empty so a
 * page never collapses while prices are still being fetched.
 */
export function LivePriceStrip({ entries, compact = false, className = '', title }: LivePriceStripProps) {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 px-1">{title}</h3>
      )}
      <div
        data-testid="live-price-strip"
        className="flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
      >
        {entries.length === 0
          ? Array.from({ length: 3 }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                data-testid="live-price-skeleton"
                className="min-w-[120px] h-[78px] rounded-xl bg-dark-100/70 border border-gray-700/30 animate-pulse"
                aria-hidden="true"
              />
            ))
          : entries.map(e => (
              <LivePriceCard
                key={e.symbol}
                {...e}
                compact={compact}
              />
            ))}
      </div>
    </div>
  )
}
