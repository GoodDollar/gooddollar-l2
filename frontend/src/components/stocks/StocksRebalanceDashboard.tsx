'use client'

import type { RebalanceInvariantResult } from '@/lib/stocksRebalanceInvariant'

interface StocksRebalanceDashboardProps {
  symbols: RebalanceInvariantResult[]
  isLoading?: boolean
  error?: string | null
}

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

function statusTone(entry: RebalanceInvariantResult): string {
  if (entry.riskIncreaseAllowed) return 'text-green-400 bg-green-500/10 border-green-500/25'
  return 'text-red-300 bg-red-500/10 border-red-500/25'
}

export function StocksRebalanceDashboard({ symbols, isLoading = false, error = null }: StocksRebalanceDashboardProps) {
  return (
    <section className="rounded-2xl border border-gray-700/20 bg-dark-100/50 p-4 sm:p-5" aria-label="Stocks drift and rebalance dashboard">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white">Drift & Rebalance</h2>
          <p className="text-xs text-gray-400">Per-symbol block coherence across AMM, perps, prediction, lend, and yield.</p>
        </div>
      </div>

      {isLoading && (
        <p className="text-xs text-gray-400">Loading symbol sync status...</p>
      )}

      {!isLoading && error && (
        <p className="text-xs text-red-300">Unable to load sync status: {error}</p>
      )}

      {!isLoading && !error && symbols.length === 0 && (
        <p className="text-xs text-gray-400">No active symbols reported.</p>
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
              {symbols.map((entry) => (
                <tr key={entry.symbol} className="border-b border-gray-700/10">
                  <td className="py-2 text-white font-medium">{entry.symbol}</td>
                  <td className="py-2 text-right text-gray-300">{entry.oracleBlock}</td>
                  <td className="py-2 text-right text-gray-300">{entry.lastSyncedBlock}</td>
                  <td className="py-2 text-right text-gray-300">{entry.blockSkew}</td>
                  <td className="py-2 text-right text-gray-300">{formatBps(entry.divergenceBps)}</td>
                  <td className="py-2 text-right">
                    <span className={`inline-flex rounded-md border px-2 py-1 ${statusTone(entry)}`}>
                      {entry.riskIncreaseAllowed ? 'Open' : 'Stopped'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
