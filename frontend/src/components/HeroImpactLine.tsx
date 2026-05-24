'use client'

import { useLandingImpact } from '@/lib/useLandingImpact'
import { formatCompactUsd } from '@/lib/formatNoData'

function formatPeopleCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

/**
 * Landing hero "live impact" line. Lane 4 (task 0040): until the
 * `useLandingImpact` hook is wired to a real indexer / on-chain counter
 * the line is suppressed entirely — we do not present hardcoded
 * `$2.4M / 640K+` literals as live impact metrics. Once the hook
 * returns `status: 'live'` the original sentence renders with the
 * attributed numbers.
 */
export function HeroImpactLine() {
  const impact = useLandingImpact()
  if (impact.status !== 'live' || impact.ubiDistributedUsd == null || impact.claimers == null) {
    return null
  }
  return (
    <p
      data-testid="hero-impact-line"
      className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1.5"
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse" />
      <span className="text-goodgreen/80 font-medium">{formatCompactUsd(impact.ubiDistributedUsd)}</span>
      already distributed to
      <span className="text-goodgreen/80 font-medium">{formatPeopleCount(impact.claimers)}</span>
      people worldwide
    </p>
  )
}
