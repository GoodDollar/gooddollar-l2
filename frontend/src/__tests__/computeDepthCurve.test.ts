import { describe, it, expect } from 'vitest'
import { computeDepthCurve } from '@/lib/computeDepthCurve'

describe('computeDepthCurve', () => {
  const oraclePrice = 200

  it('returns buy and sell point arrays with correct length', () => {
    const result = computeDepthCurve({ oraclePrice, steps: 10 })
    expect(result.buyPoints).toHaveLength(11)
    expect(result.sellPoints).toHaveLength(11)
  })

  it('first point has zero size and spread-only impact', () => {
    const result = computeDepthCurve({ oraclePrice, baseSpread: 0.001, skewFactor: 0.1 })
    const firstBuy = result.buyPoints[0]
    const firstSell = result.sellPoints[0]

    expect(firstBuy.size).toBe(0)
    expect(firstBuy.price).toBeCloseTo(oraclePrice * 1.001, 4)
    expect(firstSell.size).toBe(0)
    expect(firstSell.price).toBeCloseTo(oraclePrice * 0.999, 4)
  })

  it('last point has max size and full skew impact', () => {
    const result = computeDepthCurve({
      oraclePrice,
      baseSpread: 0.002,
      skewFactor: 0.05,
      maxPoolCapacity: 100_000,
      steps: 10,
    })
    const lastBuy = result.buyPoints[10]
    const lastSell = result.sellPoints[10]

    expect(lastBuy.size).toBe(100_000)
    expect(lastBuy.price).toBeCloseTo(oraclePrice * (1 + 0.002 + 0.05), 2)
    expect(lastSell.price).toBeCloseTo(oraclePrice * (1 - 0.002 - 0.05), 2)
  })

  it('buy prices increase monotonically', () => {
    const result = computeDepthCurve({ oraclePrice })
    for (let i = 1; i < result.buyPoints.length; i++) {
      expect(result.buyPoints[i].price).toBeGreaterThan(result.buyPoints[i - 1].price)
    }
  })

  it('sell prices decrease monotonically', () => {
    const result = computeDepthCurve({ oraclePrice })
    for (let i = 1; i < result.sellPoints.length; i++) {
      expect(result.sellPoints[i].price).toBeLessThan(result.sellPoints[i - 1].price)
    }
  })

  it('returns oraclePrice and maxSize in result', () => {
    const result = computeDepthCurve({ oraclePrice, maxPoolCapacity: 250_000 })
    expect(result.oraclePrice).toBe(200)
    expect(result.maxSize).toBe(250_000)
  })
})
