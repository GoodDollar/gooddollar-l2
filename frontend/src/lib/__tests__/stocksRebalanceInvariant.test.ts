import { describe, it, expect } from 'vitest'

import {
  computeDivergenceBps,
  evaluateRebalanceInvariant,
  toInvariantInputFromStatus,
} from '@/lib/stocksRebalanceInvariant'

describe('stocksRebalanceInvariant', () => {
  it('proves two consecutive blocks remain coherent when all products sync to oracle block', () => {
    const blockN = evaluateRebalanceInvariant({
      symbol: 'AAPL',
      currentBlock: 120,
      oracleBlock: 120,
      normalizedPrice: 200,
      oraclePrice: 200.4,
      products: { amm: 120, perps: 120, prediction: 120, lend: 120, yield: 120 },
    })

    const blockN1 = evaluateRebalanceInvariant({
      symbol: 'AAPL',
      currentBlock: 121,
      oracleBlock: 121,
      normalizedPrice: 201,
      oraclePrice: 200.9,
      products: { amm: 121, perps: 121, prediction: 121, lend: 121, yield: 121 },
    })

    expect(blockN.riskIncreaseAllowed).toBe(true)
    expect(blockN1.riskIncreaseAllowed).toBe(true)
    expect(blockN.stopReasons).toEqual([])
    expect(blockN1.stopReasons).toEqual([])
  })

  it('halts risk increase when one product lags a block behind current block', () => {
    const result = evaluateRebalanceInvariant({
      symbol: 'TSLA',
      currentBlock: 300,
      oracleBlock: 300,
      products: { amm: 300, perps: 299, prediction: 300, lend: 300, yield: 300 },
    })

    expect(result.lastSyncedBlock).toBe(299)
    expect(result.riskIncreaseAllowed).toBe(false)
    expect(result.stopReasons).toContain('stale_propagation')
    expect(result.stopReasons).toContain('cross_product_block_mismatch')
  })

  it('triggers divergence stop when normalized/oracle price drift is above 0.5%', () => {
    const result = evaluateRebalanceInvariant({
      symbol: 'NVDA',
      currentBlock: 44,
      oracleBlock: 44,
      normalizedPrice: 100,
      oraclePrice: 100.7,
      products: { amm: 44, perps: 44, prediction: 44, lend: 44, yield: 44 },
    })

    expect(result.divergenceBps).toBeGreaterThan(50)
    expect(result.riskIncreaseAllowed).toBe(false)
    expect(result.stopReasons).toContain('divergence_gt_0_5pct')
  })

  it('triggers secret leakage stop when sentinel is raised', () => {
    const result = evaluateRebalanceInvariant({
      symbol: 'MSFT',
      currentBlock: 10,
      oracleBlock: 10,
      products: { amm: 10, perps: 10, prediction: 10, lend: 10, yield: 10 },
      secretLeakage: true,
    })

    expect(result.riskIncreaseAllowed).toBe(false)
    expect(result.stopReasons).toContain('secret_leakage')
  })

  it('normalizes missing product blocks from status payload to oracle block', () => {
    const input = toInvariantInputFromStatus('AAPL', 77, {
      oracleBlock: 77,
      products: { amm: 77, perps: 77 },
    })

    expect(input.products.prediction).toBe(77)
    expect(input.products.lend).toBe(77)
    expect(input.products.yield).toBe(77)
  })

  it('returns 0 divergence for invalid prices', () => {
    expect(computeDivergenceBps(null, 100)).toBe(0)
    expect(computeDivergenceBps(100, 0)).toBe(0)
  })
})
