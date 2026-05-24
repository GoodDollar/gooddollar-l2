'use client'

import type { PriceSource } from '@/lib/priceSource'
import { priceSourceLabel } from '@/lib/priceSource'

interface PriceSourceBadgeProps {
  source: PriceSource
  /** Compact rendering for inline use next to a price cell. Defaults to `md`. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * PriceSourceBadge — single canonical chip that tells the user where the
 * price they're looking at came from.
 *
 * Lane 4 (`0007d-app-integration`) wants every visible price across the
 * app — Swap, Perps, Portfolio, Analytics, Activity, Stocks — to carry one
 * of these. The colour palette mirrors `OracleStatusBadge` so users see a
 * consistent green/yellow/grey vocabulary regardless of which page they're on.
 */
export function PriceSourceBadge({ source, size = 'md', className = '' }: PriceSourceBadgeProps) {
  const label = priceSourceLabel(source)
  const variant = VARIANTS[source]
  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5'

  return (
    <span
      data-testid="price-source-badge"
      data-source={source}
      aria-label={`Price source: ${label}`}
      className={`inline-flex items-center ${gap} ${textSize} ${variant.textClass} ${className}`}
    >
      <span
        data-testid="price-source-dot"
        aria-hidden="true"
        className={`${dotSize} rounded-full ${variant.dotClass} ${variant.animateClass ?? ''}`}
      />
      <span>{label}</span>
    </span>
  )
}

interface Variant {
  dotClass: string
  textClass: string
  animateClass?: string
}

const VARIANTS: Record<PriceSource, Variant> = {
  'chain-oracle': {
    dotClass: 'bg-green-400',
    textClass: 'text-green-400',
    animateClass: 'animate-pulse',
  },
  'etoro-demo': {
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-400',
  },
  'coingecko': {
    dotClass: 'bg-gray-400',
    textClass: 'text-gray-400',
  },
  'fallback': {
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-400',
  },
  'stale': {
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
  },
  'closed': {
    dotClass: 'bg-gray-500',
    textClass: 'text-gray-400',
  },
  'unknown': {
    dotClass: 'bg-gray-600',
    textClass: 'text-gray-500',
  },
}
