'use client'

import type { PerformanceStats } from '@/lib/computePerformanceStats'
import { formatStockPrice } from '@/lib/stockData'

interface PerformanceStatsPanelProps {
  stats: PerformanceStats
}

export function PerformanceStatsPanel({ stats }: PerformanceStatsPanelProps) {
  return (
    <div data-testid="performance-stats-panel" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
      <StatCard label="Gain/Loss Ratio" value={stats.avgGainLossRatio.toFixed(2)} />
      <StatCard label="Best Trade" value={formatStockPrice(stats.bestTrade)} positive />
      <StatCard label="Worst Trade" value={stats.worstTrade < 0 ? `-${formatStockPrice(Math.abs(stats.worstTrade))}` : formatStockPrice(stats.worstTrade)} negative={stats.worstTrade < 0} />
      <StatCard label="Realized P&L" value={stats.totalRealizedPnl >= 0 ? `+${formatStockPrice(stats.totalRealizedPnl)}` : `-${formatStockPrice(Math.abs(stats.totalRealizedPnl))}`} positive={stats.totalRealizedPnl >= 0} negative={stats.totalRealizedPnl < 0} />
      <StatCard label="Total Trades" value={String(stats.tradeCount)} />
    </div>
  )
}

function StatCard({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  const valueColor = positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-dark-50/40 rounded-xl p-3 border border-gray-700/20">
      <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-semibold ${valueColor}`}>{value}</div>
    </div>
  )
}
