'use client'

import { useState, useEffect } from 'react'
import { useLandingImpact } from '@/lib/useLandingImpact'
import { formatCompactUsd } from '@/lib/formatNoData'

const STORAGE_KEY = 'ubi-banner-dismissed'

/**
 * Compact people count for the banner copy: `5_300_000 → "5.3M"`,
 * `720_000 → "720K"`. Kept inline because no shared helper exists yet;
 * once `useLandingImpact` is wired to a real feed this can graduate to
 * `frontend/src/lib/formatPeople.ts`.
 */
function formatPeopleCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export function UBIBanner() {
  const [visible, setVisible] = useState(false)
  const impact = useLandingImpact()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== 'true') {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  return (
    <div role="region" aria-label="UBI Impact" className="w-full bg-goodgreen/[0.06] border-b border-goodgreen/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-1.5">
        {impact.status === 'live' && impact.ubiDistributedUsd != null && impact.claimers != null ? (
          <p className="text-xs text-gray-300 flex-1 text-center" data-testid="ubi-banner-copy">
            <span className="text-goodgreen mr-1.5">&#9829;</span>
            <span className="text-goodgreen font-medium">{formatCompactUsd(impact.ubiDistributedUsd)}</span>
            {' '}distributed to{' '}
            <span className="text-goodgreen font-medium">{formatPeopleCount(impact.claimers)}</span>
            {' '}people through UBI — funded by your trades
          </p>
        ) : (
          <p className="text-xs text-gray-300 flex-1 text-center" data-testid="ubi-banner-copy">
            <span className="text-goodgreen mr-1.5">&#9829;</span>
            Every swap funds UBI. Live impact metrics coming soon.
          </p>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss UBI banner"
          className="ml-3 shrink-0 p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
