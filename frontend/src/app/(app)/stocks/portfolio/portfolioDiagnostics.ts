import type { PortfolioHolding } from '@/lib/stockData'

export type BenchmarkId = 'SPY' | 'QQQ' | 'DIA'

export function parseBenchmarkId(value: string | null | undefined): BenchmarkId {
  if (value === 'QQQ' || value === 'DIA') return value
  return 'SPY'
}

export function buildBenchmarkSeries(base: number, points: number, benchmark: BenchmarkId): number[] {
  const drift = benchmark === 'QQQ' ? 0.011 : benchmark === 'DIA' ? 0.006 : 0.008
  const volatility = benchmark === 'QQQ' ? 0.012 : 0.009
  const out: number[] = []
  let current = Math.max(base, 1)
  for (let i = 0; i < points; i += 1) {
    const wave = Math.sin(i / 3) * volatility
    current = Math.max(1, current * (1 + drift / points + wave / points))
    out.push(current)
  }
  return out
}

export function calcVolatilityPct(values: number[]): number {
  if (values.length < 3) return 0
  const returns: number[] = []
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1] ?? 0
    const curr = values[i] ?? 0
    if (prev > 0) returns.push((curr - prev) / prev)
  }
  if (returns.length < 2) return 0
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * 100
}

export function calcMaxDrawdownPct(values: number[]): number {
  let peak = Number.NEGATIVE_INFINITY
  let worst = 0
  values.forEach((value) => {
    peak = Math.max(peak, value)
    if (peak <= 0) return
    const drawdown = ((peak - value) / peak) * 100
    worst = Math.max(worst, drawdown)
  })
  return worst
}

export interface ContributionRow {
  ticker: string
  weightPct: number
  pnl: number
}

export function buildContributionRows(holdings: PortfolioHolding[]): ContributionRow[] {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.shares * holding.currentPrice, 0)
  if (totalValue <= 0) return []
  return holdings
    .map((holding) => {
      const value = holding.shares * holding.currentPrice
      const pnl = (holding.currentPrice - holding.avgCost) * holding.shares
      return {
        ticker: holding.ticker,
        weightPct: (value / totalValue) * 100,
        pnl,
      }
    })
    .toSorted((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
}
