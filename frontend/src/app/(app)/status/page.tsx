'use client'

/**
 * /status — public read-only dashboard for the oracle's full health
 * picture (task 0059). Sources its data from `useOracleStatusSnapshot`,
 * which polls `/api/oracle/status` on a singleton 30 s cycle.
 *
 * The page is the canonical answer to "are prices flowing on testnet?
 * what's the last proof tx for AAPL? what's the oracle contract?"
 * The lane spec's "Required evidence" #4 lists this surface
 * explicitly — without it the lane cannot ship.
 */

import { useState } from 'react'

import { useOracleStatusSnapshot } from '@/lib/useOracleStatusSnapshot'

import {
  StatusHeader,
  StatusRails,
  StatusProofs,
  StatusUpstreams,
  StatusIngest,
} from './sections'

function StatusSkeleton() {
  return (
    <div className="space-y-3" data-testid="status-skeleton">
      <div className="h-24 rounded-2xl bg-dark-100 border border-gray-700/20 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="h-32 rounded-2xl bg-dark-100 border border-gray-700/20 animate-pulse" />
        <div className="h-32 rounded-2xl bg-dark-100 border border-gray-700/20 animate-pulse" />
      </div>
      <div className="h-40 rounded-2xl bg-dark-100 border border-gray-700/20 animate-pulse" />
    </div>
  )
}

function StatusError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      className="bg-dark-100 rounded-2xl border border-red-500/30 p-4 text-sm text-red-200"
      data-testid="status-error"
    >
      <h2 className="font-semibold text-white mb-1">Status unavailable</h2>
      <p className="text-xs text-gray-400 mb-2">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs text-goodgreen hover:text-goodgreen/80 underline underline-offset-2"
      >
        Retry
      </button>
    </div>
  )
}

export default function StatusPage() {
  const snap = useOracleStatusSnapshot()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    snap.refresh()
    setTimeout(() => setIsRefreshing(false), 1200)
  }

  if (snap.isLoading && !snap.payload) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <StatusSkeleton />
      </div>
    )
  }

  if (!snap.payload) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <StatusError error={snap.error ?? 'no data'} onRetry={handleRefresh} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3" data-testid="status-page">
      <StatusHeader
        payload={snap.payload}
        lastFetchedAtMs={snap.lastFetchedAtMs}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      <StatusRails payload={snap.payload} />
      <StatusProofs payload={snap.payload} />
      <StatusUpstreams payload={snap.payload} />
      <StatusIngest payload={snap.payload} />
    </div>
  )
}
