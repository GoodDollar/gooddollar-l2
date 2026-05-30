'use client'

import { LivePriceCard, type LivePriceCardProps } from './LivePriceCard'

export type LivePriceEntry = Omit<LivePriceCardProps, 'compact' | 'className'>

interface LivePriceStripProps {
  entries: LivePriceEntry[]
  compact?: boolean
  className?: string
  /** Heading rendered above the strip. Optional. */
  title?: string
  /**
   * When `true` and `entries` is empty, render 3 pulsing skeleton boxes
   * (the legacy "first tick still loading" affordance). When `false` (default)
   * and `entries` is empty, render a static empty-state card instead — so
   * legitimately-empty strips (e.g. Portfolio with no holdings) do not
   * pretend prices are still loading.
   */
  loading?: boolean
  /** Override the static empty-state copy. */
  emptyMessage?: string
}

const DEFAULT_EMPTY_MESSAGE =
  'No positions yet — connect a wallet to track live prices for the stocks and crypto you hold.'

/**
 * LivePriceStrip — horizontally scrollable strip of `LivePriceCard`s used at
 * the top of every lane-4 surface (Swap landing, Perps, Portfolio, Analytics,
 * Activity, Stocks).
 *
 * Empty-state policy:
 *   - `entries.length > 0` → render one `LivePriceCard` per entry.
 *   - `entries.length === 0 && loading` → render 3 pulsing skeleton boxes.
 *   - `entries.length === 0 && !loading` → render a single static empty-state
 *     card. Surfaces with no work in flight (e.g. disconnected portfolio) get
 *     a clear "nothing to show" signal instead of a forever-shimmer.
 */
export function LivePriceStrip({
  entries,
  compact = false,
  className = '',
  title,
  loading = false,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: LivePriceStripProps) {
  const isEmpty = entries.length === 0

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 px-1">{title}</h3>
      )}
      <div
        data-testid="live-price-strip"
        className="flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
        tabIndex={0}
        role="region"
        aria-label="Live token prices"
      >
        {isEmpty && loading && (
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              data-testid="live-price-skeleton"
              className="min-w-[120px] h-[78px] rounded-xl bg-dark-100/70 border border-gray-700/30 animate-pulse"
              aria-hidden="true"
            />
          ))
        )}
        {isEmpty && !loading && (
          <div
            data-testid="live-price-empty"
            role="status"
            className="flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-dark-100/70 border border-gray-700/30 p-3 text-xs text-gray-400"
          >
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"
            />
            <span className="leading-snug">{emptyMessage}</span>
          </div>
        )}
        {!isEmpty && entries.map(e => (
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
