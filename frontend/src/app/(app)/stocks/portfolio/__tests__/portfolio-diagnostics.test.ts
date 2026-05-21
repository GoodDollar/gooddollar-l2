import { describe, expect, it } from 'vitest'
import {
  buildBenchmarkSeries,
  buildContributionRows,
  calcMaxDrawdownPct,
  calcVolatilityPct,
  parseBenchmarkId,
} from '../portfolioDiagnostics'

describe('portfolio diagnostics utils', () => {
  it('parses benchmark ids with SPY fallback', () => {
    expect(parseBenchmarkId('QQQ')).toBe('QQQ')
    expect(parseBenchmarkId('DIA')).toBe('DIA')
    expect(parseBenchmarkId('unknown')).toBe('SPY')
    expect(parseBenchmarkId(undefined)).toBe('SPY')
  })

  it('builds benchmark series and risk stats', () => {
    const series = buildBenchmarkSeries(100, 20, 'SPY')
    expect(series).toHaveLength(20)
    expect(calcVolatilityPct(series)).toBeGreaterThanOrEqual(0)
    expect(calcMaxDrawdownPct(series)).toBeGreaterThanOrEqual(0)
  })

  it('computes contribution rows with weight percentages', () => {
    const rows = buildContributionRows([
      { ticker: 'AAPL', shares: 2, avgCost: 180, currentPrice: 210, collateralDeposited: 0, collateralRequired: 0 },
      { ticker: 'MSFT', shares: 1, avgCost: 360, currentPrice: 330, collateralDeposited: 0, collateralRequired: 0 },
    ])
    expect(rows).toHaveLength(2)
    const totalWeight = rows.reduce((sum, row) => sum + row.weightPct, 0)
    expect(totalWeight).toBeCloseTo(100, 4)
  })
})
