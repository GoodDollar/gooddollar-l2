import { describe, expect, it } from 'vitest'
import {
  type ProductExposure,
  aggregateExposure,
  classifyResidual,
  computePortfolioDelta,
} from '../exposureNetting'

describe('aggregateExposure', () => {
  it('returns zero net when long === short', () => {
    const exposures: ProductExposure[] = [
      { product: 'amm', sizeUsd: 1000, direction: 'long' },
      { product: 'perps', sizeUsd: 1000, direction: 'short' },
    ]
    const result = aggregateExposure(exposures)
    expect(result.netExposureUsd).toBe(0)
    expect(result.grossLongUsd).toBe(1000)
    expect(result.grossShortUsd).toBe(1000)
  })

  it('computes positive net for net-long position', () => {
    const exposures: ProductExposure[] = [
      { product: 'amm', sizeUsd: 5000, direction: 'long' },
      { product: 'perps', sizeUsd: 2000, direction: 'short' },
    ]
    const result = aggregateExposure(exposures)
    expect(result.netExposureUsd).toBe(3000)
    expect(result.grossLongUsd).toBe(5000)
    expect(result.grossShortUsd).toBe(2000)
  })

  it('computes negative net for net-short position', () => {
    const exposures: ProductExposure[] = [
      { product: 'amm', sizeUsd: 1000, direction: 'long' },
      { product: 'perps', sizeUsd: 4000, direction: 'short' },
    ]
    const result = aggregateExposure(exposures)
    expect(result.netExposureUsd).toBe(-3000)
  })

  it('handles empty exposures', () => {
    const result = aggregateExposure([])
    expect(result.netExposureUsd).toBe(0)
    expect(result.grossLongUsd).toBe(0)
    expect(result.grossShortUsd).toBe(0)
  })

  it('aggregates multiple products in same direction', () => {
    const exposures: ProductExposure[] = [
      { product: 'amm', sizeUsd: 1000, direction: 'long' },
      { product: 'lend', sizeUsd: 2000, direction: 'long' },
      { product: 'yield', sizeUsd: 500, direction: 'long' },
      { product: 'perps', sizeUsd: 1500, direction: 'short' },
    ]
    const result = aggregateExposure(exposures)
    expect(result.grossLongUsd).toBe(3500)
    expect(result.grossShortUsd).toBe(1500)
    expect(result.netExposureUsd).toBe(2000)
  })
})

describe('classifyResidual', () => {
  it('returns "hedged" for 0% residual', () => {
    expect(classifyResidual(0, 10000)).toBe('hedged')
  })

  it('returns "hedged" when residual < 10% of gross', () => {
    expect(classifyResidual(900, 10000)).toBe('hedged')
  })

  it('returns "partial" when residual is 10-50% of gross', () => {
    expect(classifyResidual(2500, 10000)).toBe('partial')
  })

  it('returns "unhedged" when residual > 50% of gross', () => {
    expect(classifyResidual(6000, 10000)).toBe('unhedged')
  })

  it('returns "hedged" for zero gross (no positions)', () => {
    expect(classifyResidual(0, 0)).toBe('hedged')
  })

  it('uses absolute residual value', () => {
    expect(classifyResidual(-2500, 10000)).toBe('partial')
  })
})

describe('computePortfolioDelta', () => {
  it('sums net exposure across symbols', () => {
    const symbolNets = [
      { symbol: 'AAPL', netExposureUsd: 1000 },
      { symbol: 'TSLA', netExposureUsd: -500 },
      { symbol: 'NVDA', netExposureUsd: 2000 },
    ]
    expect(computePortfolioDelta(symbolNets)).toBe(2500)
  })

  it('returns 0 for empty array', () => {
    expect(computePortfolioDelta([])).toBe(0)
  })
})
