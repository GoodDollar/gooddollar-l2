import type { TradeRecord } from '@/lib/stockData'

export interface PerformanceStats {
  winRate: number
  avgGainLossRatio: number
  bestTrade: number
  worstTrade: number
  totalRealizedPnl: number
  tradeCount: number
}

export function computePerformanceStats(trades: TradeRecord[]): PerformanceStats {
  if (trades.length === 0) {
    return { winRate: 0, avgGainLossRatio: 0, bestTrade: 0, worstTrade: 0, totalRealizedPnl: 0, tradeCount: 0 }
  }

  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl < 0)
  const decisiveTrades = wins.length + losses.length

  const winRate = decisiveTrades > 0 ? (wins.length / decisiveTrades) * 100 : 0

  const avgGain = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0
  const avgGainLossRatio = avgLoss > 0 && avgGain > 0 ? avgGain / avgLoss : 0

  const bestTrade = Math.max(...trades.map(t => t.pnl))
  const worstTrade = Math.min(...trades.map(t => t.pnl))
  const totalRealizedPnl = trades.reduce((s, t) => s + t.pnl, 0)

  return { winRate, avgGainLossRatio, bestTrade, worstTrade, totalRealizedPnl, tradeCount: trades.length }
}
