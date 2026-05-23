'use client'

import type { RebalanceInvariantResult } from '@/lib/stocksRebalanceInvariant'

interface StocksRebalanceDashboardProps {
  symbols: RebalanceInvariantResult[]
  isLoading?: boolean
  error?: string | null
}

const EM_DASH = '—'
const AWAITING_PILL_CLS = 'inline-flex rounded-md border px-2 py-1 text-gray-300 bg-gray-500/10 border-gray-500/25'

function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

function statusTone(entry: RebalanceInvariantResult): string {
  if (entry.riskIncreaseAllowed) return 'text-green-400 bg-green-500/10 border-green-500/25'
  return 'text-red-300 bg-red-500/10 border-red-500/25'
}

function isRowAwaiting(entry: RebalanceInvariantResult): boolean {
  return entry.oracleBlock === 0 && entry.lastSyncedBlock === 0
}

export function StocksRebalanceDashboard({ symbols, isLoading = false, error = null }: StocksRebalanceDashboardProps) {
  const allRowsAwaiting = !isLoading && !error && symbols.length > 0 && symbols.every(isRowAwaiting)
  return (
    <section className="rounded-2xl border border-gray-700/20 bg-dark-100/50 p-4 sm:p-5" aria-label="Stocks drift and rebalance dashboard">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white">Drift & Rebalance</h2>
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
        <p className="text-xs text-gray-400">No active symbols reported.</p>
      )}

      {!isLoading && !error && symbols.length > 0 && (
        <>
          {allRowsAwaiting && (
            <p className="text-xs text-gray-400 mb-2">
              Awaiting on-chain block data — values shown once the oracle aggregator reports a current block.
            </p>
          )}
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
                  const awaiting = isRowAwaiting(entry)
                  return (
                    <tr key={entry.symbol} className="border-b border-gray-700/10">
                      <td className="py-2 text-white font-medium">{entry.symbol}</td>
                      <td className={`py-2 text-right ${awaiting ? 'text-gray-500' : 'text-gray-300'}`}>
                        {awaiting ? EM_DASH : entry.oracleBlock}
                      </td>
                      <td className={`py-2 text-right ${awaiting ? 'text-gray-500' : 'text-gray-300'}`}>
                        {awaiting ? EM_DASH : entry.lastSyncedBlock}
                      </td>
                      <td className={`py-2 text-right ${awaiting ? 'text-gray-500' : 'text-gray-300'}`}>
                        {awaiting ? EM_DASH : entry.blockSkew}
                      </td>
                      <td className={`py-2 text-right ${awaiting ? 'text-gray-500' : 'text-gray-300'}`}>
                        {awaiting ? EM_DASH : formatBps(entry.divergenceBps)}
                      </td>
                      <td className="py-2 text-right">
                        {awaiting ? (
                          <span className={AWAITING_PILL_CLS} aria-label="Risk gate: awaiting on-chain data">
                            Awaiting
                          </span>
                        ) : (
                          <span className={`inline-flex rounded-md border px-2 py-1 ${statusTone(entry)}`}>
                            {entry.riskIncreaseAllowed ? 'Open' : 'Stopped'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
