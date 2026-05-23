'use client'

import type { RebalanceInvariantResult } from '@/lib/stocksRebalanceInvariant'
import { NO_DATA_DASH } from '@/lib/formatNoData'

interface StocksRebalanceDashboardProps {
  symbols: RebalanceInvariantResult[]
  /**
   * Unfiltered symbol count for the heading "Showing N of M (filtered)" hint.
   * When the parent narrows `symbols` via the page filters, surface the
   * total here so users can see how many rows the filter hid.
   */
  totalCount?: number
  /** Hint that the parent's filter is currently narrowing `symbols`. */
  isFiltered?: boolean
  isLoading?: boolean
  error?: string | null
}

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

/** Row has never been synced — every numeric field reads as no-data. */
function isUnsynced(entry: RebalanceInvariantResult): boolean {
  return entry.lastSyncedBlock === 0
}

function statusTone(entry: RebalanceInvariantResult): string {
  if (isUnsynced(entry)) return 'text-gray-300 bg-gray-500/10 border-gray-500/25'
  if (entry.riskIncreaseAllowed) return 'text-green-400 bg-green-500/10 border-green-500/25'
  return 'text-red-300 bg-red-500/10 border-red-500/25'
}

function statusLabel(entry: RebalanceInvariantResult): string {
  if (isUnsynced(entry)) return 'Unknown'
  return entry.riskIncreaseAllowed ? 'Open' : 'Stopped'
}

export function StocksRebalanceDashboard({
  symbols,
  totalCount,
  isFiltered = false,
  isLoading = false,
  error = null,
}: StocksRebalanceDashboardProps) {
  const showFilteredHeading = isFiltered && typeof totalCount === 'number'
  return (
    <section className="rounded-2xl border border-gray-700/20 bg-dark-100/50 p-4 sm:p-5" aria-label="Stocks drift and rebalance dashboard">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white" data-testid="rebalance-heading">
            Drift &amp; Rebalance
            {showFilteredHeading && (
              <span className="text-gray-400 font-normal">
                {` · Showing ${symbols.length} of ${totalCount} (filtered)`}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400">Per-symbol block coherence across AMM, perps, prediction, lend, and yield.</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-6 rounded bg-dark-50/30" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <p className="text-xs text-red-300">Unable to load sync status: {error}</p>
      )}

      {!isLoading && !error && symbols.length === 0 && (
        <p className="text-xs text-gray-400" data-testid="rebalance-empty">
          {isFiltered ? 'No symbols match the current filters.' : 'No active symbols reported.'}
        </p>
      )}

      {!isLoading && !error && symbols.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700/30">
                <th className="py-2 text-left font-medium">Symbol</th>
                <th className="py-2 text-right font-medium">Oracle block</th>
                <th className="py-2 text-right font-medium">Last synced</th>
                <th className="py-2 text-right font-medium">Skew</th>
                <th className="py-2 text-right font-medium">Divergence</th>
                <th className="py-2 text-right font-medium">Risk gate</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((entry) => {
                const unsynced = isUnsynced(entry)
                return (
                  <tr key={entry.symbol} className="border-b border-gray-700/10" data-testid={unsynced ? 'rebalance-row-unsynced' : 'rebalance-row'}>
                    <td className="py-2 text-white font-medium">{entry.symbol}</td>
                    <td className="py-2 text-right text-gray-300">{unsynced ? NO_DATA_DASH : entry.oracleBlock}</td>
                    <td className="py-2 text-right text-gray-300">{unsynced ? NO_DATA_DASH : entry.lastSyncedBlock}</td>
                    <td className="py-2 text-right text-gray-300">{unsynced ? NO_DATA_DASH : entry.blockSkew}</td>
                    <td className="py-2 text-right text-gray-300">{unsynced ? NO_DATA_DASH : formatBps(entry.divergenceBps)}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-flex rounded-md border px-2 py-1 ${statusTone(entry)}`}>
                        {statusLabel(entry)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
