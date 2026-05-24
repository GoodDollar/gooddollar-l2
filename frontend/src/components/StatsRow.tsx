'use client'

import { useLandingImpact, type LandingImpact } from '@/lib/useLandingImpact'
import { formatCompactUsd, NO_DATA_DASH } from '@/lib/formatNoData'

interface StatTile {
  label: string
  value: string
  missing: boolean
}

function formatCompactCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return NO_DATA_DASH
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function buildStatTiles(impact: LandingImpact): StatTile[] {
  if (impact.status !== 'live') {
    return [
      { label: 'UBI Distributed', value: NO_DATA_DASH, missing: true },
      { label: 'Daily Claimers',  value: NO_DATA_DASH, missing: true },
      { label: 'Total Swaps',     value: NO_DATA_DASH, missing: true },
    ]
  }
  return [
    {
      label: 'UBI Distributed',
      value: impact.ubiDistributedUsd != null ? formatCompactUsd(impact.ubiDistributedUsd) : NO_DATA_DASH,
      missing: impact.ubiDistributedUsd == null,
    },
    {
      label: 'Daily Claimers',
      value: impact.claimers != null ? formatCompactCount(impact.claimers) : NO_DATA_DASH,
      missing: impact.claimers == null,
    },
    {
      label: 'Total Swaps',
      value: impact.totalSwaps != null ? formatCompactCount(impact.totalSwaps) : NO_DATA_DASH,
      missing: impact.totalSwaps == null,
    },
  ]
}

export function StatsRow() {
  const impact = useLandingImpact()
  const tiles = buildStatTiles(impact)
  const caption = impact.status === 'live' && impact.updatedAtMs
    ? `as of ${new Date(impact.updatedAtMs).toLocaleDateString()}`
    : 'Live counters coming soon — values populate when the impact feed is wired.'

  return (
    <section className="w-full max-w-2xl mx-auto mt-10 px-4">
      <div className="grid grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex flex-col items-center text-center py-4 px-2 rounded-xl bg-dark-100/40 border border-gray-700/15"
          >
            <span className={`text-lg sm:text-xl font-bold ${tile.missing ? 'text-gray-500' : 'text-goodgreen'}`}>
              {tile.value}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-400 mt-1">{tile.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-gray-500 text-center" data-testid="stats-row-caption">
        {caption}
      </p>
    </section>
  )
}
