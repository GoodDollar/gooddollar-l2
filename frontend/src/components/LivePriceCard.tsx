'use client'

import { AlertTriangle } from 'lucide-react'
import { PriceSourceBadge } from './PriceSourceBadge'
import type { PriceSource } from '@/lib/priceSource'

export interface LivePriceCardProps {
  symbol: string
  /** USD price as a plain number. Renders dimmed when `source === 'fallback'`. */
  price: number
  /** 24h change in percent (e.g. 1.42 → +1.42%). null hides the row. */
  change24h: number | null
  source: PriceSource
  /** Age of the underlying price in ms, or null when unknown. */
  updatedAgoMs: number | null
  /**
   * Cross-page divergence flag. When true the card renders a "Source disagrees"
   * chip next to the source badge — used by the `useAttributedPrice` hook to
   * call out chain-vs-cache splits without removing the source attribution.
   */
  divergent?: boolean
  /** Compact mode drops the 24h change row and uses smaller padding. */
  compact?: boolean
  className?: string
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '$–'
  if (Math.abs(value) >= 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (Math.abs(value) >= 1)    return `$${value.toFixed(2)}`
  if (Math.abs(value) >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(6)}`
}

function formatAge(ms: number | null): string {
  if (ms == null) return 'just now'
  if (ms < 1000)        return 'just now'
  if (ms < 60_000)      return `${Math.floor(ms / 1000)}s ago`
  if (ms < 3_600_000)   return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}

interface FreshnessLine {
  text: string
  tone: 'normal' | 'warning'
}

/**
 * Source-aware freshness line. Honest about whether the displayed value is
 * actually fresh: `fallback` / `closed` / `unknown` carry no age (because the
 * underlying number isn't the result of a refresh tick), `stale` reads
 * "Last seen" not "Updated", and only the live sources show "Updated …".
 */
function freshnessText(source: PriceSource, ms: number | null): FreshnessLine {
  switch (source) {
    case 'chain-oracle':
    case 'etoro-demo':
    case 'coingecko':
      return { text: `Updated ${formatAge(ms)}`, tone: 'normal' }
    case 'stale':
      return { text: `Last seen ${formatAge(ms)}`, tone: 'warning' }
    case 'closed':
      return { text: 'Market closed', tone: 'normal' }
    case 'fallback':
      return { text: 'No live data', tone: 'normal' }
    case 'unknown':
      return { text: 'No data', tone: 'normal' }
  }
}

const WARNING_SOURCES = new Set<PriceSource>(['closed', 'stale'])

/**
 * LivePriceCard — single self-contained card showing a symbol's price, 24h
 * change, source attribution, and freshness. Used by `LivePriceStrip` on every
 * lane-4 surface (Swap, Perps, Portfolio, Analytics, Activity, Stocks).
 */
export function LivePriceCard(props: LivePriceCardProps) {
  const {
    symbol, price, change24h, source, updatedAgoMs,
    divergent = false, compact = false, className = '',
  } = props

  const isFallback = source === 'fallback'
  const showWarning = WARNING_SOURCES.has(source)

  const changeColor =
    change24h == null
      ? 'text-gray-500'
      : change24h > 0
        ? 'text-green-400'
        : change24h < 0
          ? 'text-red-400'
          : 'text-gray-400'

  const changeText =
    change24h == null
      ? ''
      : `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`

  return (
    <div
      data-testid="live-price-card"
      className={`flex flex-col ${compact ? 'p-2.5' : 'p-3'} min-w-[120px] rounded-xl bg-dark-100/70 border border-gray-700/30 ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-300">{symbol}</span>
        {showWarning && (
          <AlertTriangle
            data-testid="live-price-warning"
            aria-label={source === 'closed' ? 'Market closed' : 'Stale price'}
            className="size-3.5 text-amber-400 shrink-0"
          />
        )}
      </div>

      <div
        data-testid="live-price"
        className={`font-semibold ${compact ? 'text-sm' : 'text-base'} ${isFallback ? 'text-gray-500 opacity-70' : 'text-white'}`}
        {...(isFallback ? { 'data-testid-fallback': '' } : {})}
      >
        <span data-testid={isFallback ? 'fallback-price' : undefined}>{formatPrice(price)}</span>
      </div>

      {!compact && change24h != null && (
        <div
          data-testid="live-price-change"
          className={`text-[11px] mt-0.5 ${changeColor}`}
        >
          {changeText}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <PriceSourceBadge source={source} size="sm" />
          {divergent && (
            <span
              data-testid="live-price-divergent"
              title="Chain oracle and cached feed disagree by more than 0.5%"
              className="text-[10px] text-amber-400 shrink-0"
            >
              Source disagrees
            </span>
          )}
        </div>
        {(() => {
          const { text, tone } = freshnessText(source, updatedAgoMs)
          return (
            <span
              data-testid="live-price-freshness"
              className={`text-[10px] shrink-0 ${tone === 'warning' ? 'text-amber-400' : 'text-gray-500'}`}
            >
              {text}
            </span>
          )
        })()}
      </div>
    </div>
  )
}
