'use client'

import { useMemo } from 'react'

/**
 * useLandingImpact — canonical lane-4 hook for landing-page UBI-impact
 * counters surfaced by `UBIBanner`, the hero paragraph (`HeroImpactLine`),
 * and `StatsRow`.
 *
 * Distinct from `useUBIImpact` in this same folder, which fetches the
 * on-chain `UBIRevenueTracker` dashboard data for the `/ubi-impact`
 * page. The landing surfaces speak in USD totals + people counts,
 * which the tracker contract doesn't currently expose.
 *
 * Lane 4 contract (`spec.md`): "Show stale/closed-market state instead
 * of pretending prices are live." The same anti-fabrication rule
 * applies to impact metrics presented as live counters. Until a real
 * indexer / off-chain stats feed is wired the hook returns
 * `{ status: 'unknown' }` and consumers render an honest empty state
 * (em-dash tiles, "Live impact metrics coming soon", etc.).
 *
 * When a real source lands, the hook returns
 * `{ status: 'live', ubiDistributedUsd, claimers, totalSwaps, updatedAtMs }`
 * and the same three consumers re-render the attributed numbers with a
 * freshness indicator — no other UI plumbing changes.
 */
export interface LandingImpact {
  status: 'unknown' | 'live'
  ubiDistributedUsd?: number
  claimers?: number
  totalSwaps?: number
  /** Epoch milliseconds for the "as of" timestamp the UI surfaces. */
  updatedAtMs?: number
}

const UNKNOWN: LandingImpact = { status: 'unknown' }

export function useLandingImpact(): LandingImpact {
  return useMemo(() => UNKNOWN, [])
}
