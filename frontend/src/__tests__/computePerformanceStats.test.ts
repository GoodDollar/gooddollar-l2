import { describe, it, expect } from 'vitest'
import { computePerformanceStats } from '@/lib/computePerformanceStats'
import type { TradeRecord } from '@/lib/stockData'

function makeTrade(overrides: Partial<TradeRecord> & { pnl: number }): TradeRecord {
  return {
    id: Math.random().toString(36),
    ticker: 'gAAPL',
    side: 'sell',
    shares: 1,
    price: 150,
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('computePerformanceStats', () => {
  it('returns zeroed stats for empty trades', () => {
    const stats = computePerformanceStats([])
    expect(stats.winRate).toBe(0)
    expect(stats.avgGainLossRatio).toBe(0)
    expect(stats.bestTrade).toBe(0)
    expect(stats.worstTrade).toBe(0)
    expect(stats.totalRealizedPnl).toBe(0)
    expect(stats.tradeCount).toBe(0)
  })

  it('computes win rate from trades with non-zero pnl', () => {
    const trades = [
      makeTrade({ pnl: 100 }),
      makeTrade({ pnl: -50 }),
      makeTrade({ pnl: 200 }),
      makeTrade({ pnl: 0 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.winRate).toBeCloseTo(66.67, 1)
  })

  it('computes avg gain/loss ratio', () => {
    const trades = [
      makeTrade({ pnl: 100 }),
      makeTrade({ pnl: 200 }),
      makeTrade({ pnl: -50 }),
      makeTrade({ pnl: -100 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.avgGainLossRatio).toBeCloseTo(2.0, 1)
  })

  it('identifies best and worst trades', () => {
    const trades = [
      makeTrade({ pnl: 500 }),
      makeTrade({ pnl: -300 }),
      makeTrade({ pnl: 50 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.bestTrade).toBe(500)
    expect(stats.worstTrade).toBe(-300)
  })

  it('sums total realized pnl', () => {
    const trades = [
      makeTrade({ pnl: 100 }),
      makeTrade({ pnl: -40 }),
      makeTrade({ pnl: 60 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.totalRealizedPnl).toBe(120)
  })

  it('handles all-winning trades', () => {
    const trades = [
      makeTrade({ pnl: 100 }),
      makeTrade({ pnl: 50 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.winRate).toBe(100)
    expect(stats.avgGainLossRatio).toBe(0)
  })

  it('handles all-losing trades', () => {
    const trades = [
      makeTrade({ pnl: -100 }),
      makeTrade({ pnl: -50 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.winRate).toBe(0)
    expect(stats.avgGainLossRatio).toBe(0)
  })

  it('reports correct tradeCount', () => {
    const trades = [
      makeTrade({ pnl: 10 }),
      makeTrade({ pnl: -5 }),
      makeTrade({ pnl: 0 }),
    ]
    const stats = computePerformanceStats(trades)
    expect(stats.tradeCount).toBe(3)
  })
})
