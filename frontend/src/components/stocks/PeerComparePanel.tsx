'use client'

/**
 * PeerComparePanel — the Analysis-section panel that lists peer stocks
 * ranked by 24h%, Mkt Cap, or P/E.
 *
 * Extracted from `[ticker]/page.tsx` so the per-metric rendering and
 * honest-no-data treatment lives in one place. The headline + Key
 * Statistics + Daily Movers + Peer Compare surfaces all share the
 * `hasLiveOracle{Change,Fundamentals}` rule from `@/lib/oracleHonesty`
 * so they move together when the rule evolves.
 */

import Link from 'next/link'
import type { Stock } from '@/lib/stockData'
import { formatLargeNumber } from '@/lib/stockData'
import { hasLiveOracleChange, hasLiveOracleFundamentals } from '@/lib/oracleHonesty'

export type PeerMetric = 'change24h' | 'marketCap' | 'peRatio'

interface Props {
  peers: Stock[]
  metric: PeerMetric
  onMetricChange: (next: PeerMetric) => void
}

const METRIC_LABEL: Record<PeerMetric, string> = {
  change24h: '24h%',
  marketCap: 'Mkt Cap',
  peRatio: 'P/E',
}

const METRIC_UNAVAILABLE: Record<PeerMetric, string> = {
  change24h: '24h change unavailable — oracle feed degraded',
  marketCap: 'Market cap unavailable — oracle feed degraded',
  peRatio: 'P/E unavailable — oracle feed degraded',
}

const METRIC_ORDER: PeerMetric[] = ['change24h', 'marketCap', 'peRatio']

function isPeerMetricLive(peer: Stock, metric: PeerMetric): boolean {
  switch (metric) {
    case 'change24h':
      return hasLiveOracleChange(peer)
    case 'marketCap':
      return hasLiveOracleFundamentals(peer)
    case 'peRatio':
      return hasLiveOracleFundamentals(peer) && peer.peRatio > 0
  }
}

function PeerMetricCell({ peer, metric }: { peer: Stock; metric: PeerMetric }) {
  if (!isPeerMetricLive(peer, metric)) {
    return (
      <span
        className="text-gray-500"
        aria-label={`${peer.ticker} ${METRIC_LABEL[metric]} unavailable`}
      >
        —
      </span>
    )
  }
  switch (metric) {
    case 'change24h':
      return (
        <span className={peer.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
          {peer.change24h >= 0 ? '+' : ''}{peer.change24h.toFixed(2)}%
        </span>
      )
    case 'marketCap':
      return <span className="text-gray-200">{formatLargeNumber(peer.marketCap)}</span>
    case 'peRatio':
      return <span className="text-gray-200">{peer.peRatio.toFixed(1)}x</span>
  }
}

export function PeerComparePanel({ peers, metric, onMetricChange }: Props) {
  const allDegraded = peers.length > 0 && peers.every((peer) => !isPeerMetricLive(peer, metric))

  return (
    <div className="rounded-xl border border-gray-700/30 bg-dark-50/20 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300">Peer Compare</h3>
        <div className="flex flex-wrap gap-1">
          {METRIC_ORDER.map((m) => (
            <button
              key={m}
              type="button"
              className={`px-2 py-1 rounded-md text-[11px] ${metric === m ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}
              onClick={() => onMetricChange(m)}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      {peers.length === 0 ? (
        <p className="text-xs text-gray-500">Peer data unavailable right now.</p>
      ) : (
        <>
          {allDegraded && (
            <p data-testid="peer-compare-degraded" className="text-[11px] text-gray-500 mb-2">
              {METRIC_UNAVAILABLE[metric]}
            </p>
          )}
          <div className="space-y-1.5">
            {peers
              .toSorted((a, b) => (b[metric] - a[metric]))
              .map((peer) => (
                <div key={peer.ticker} className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2 text-xs">
                  <Link href={`/stocks/${peer.ticker}`} className="font-medium text-white hover:text-goodgreen transition-colors">{peer.ticker}</Link>
                  <PeerMetricCell peer={peer} metric={metric} />
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
