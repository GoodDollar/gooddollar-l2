import { describe, expect, it } from 'vitest'

import {
  buildSymbolSyncSnapshot,
  evaluateRiskIncrease,
} from '@/lib/symbolSyncInvariant'

describe('symbol sync invariant', () => {
  it('allows risk increase when product is synced to oracle block', () => {
    const snapshot = buildSymbolSyncSnapshot({
      symbol: 'AAPL',
      lastUpdateMs: 500,
      confidence: 90,
      oracleBlock: 100,
      productSync: {
        amm: { lastSyncedBlock: 100 },
        perps: { lastSyncedBlock: 100 },
        prediction: { lastSyncedBlock: 100 },
        lend: { lastSyncedBlock: 100 },
        yield: { lastSyncedBlock: 100 },
      },
    })

    expect(evaluateRiskIncrease(snapshot, 'amm')).toMatchObject({
      allowRiskIncrease: true,
      stopCode: 'none',
    })
  })

  it('blocks risk increase when a product lags current oracle block', () => {
    const snapshot = buildSymbolSyncSnapshot({
      symbol: 'AAPL',
      lastUpdateMs: 500,
      confidence: 90,
      oracleBlock: 101,
      productSync: {
        amm: { lastSyncedBlock: 100 },
      },
    })

    expect(evaluateRiskIncrease(snapshot, 'amm')).toMatchObject({
      allowRiskIncrease: false,
      stopCode: 'lagging-sync',
    })
  })

  it('blocks when divergence exceeds 0.5%', () => {
    const snapshot = buildSymbolSyncSnapshot({
      symbol: 'AAPL',
      lastUpdateMs: 500,
      confidence: 90,
      oracleBlock: 101,
      divergenceBps: 51,
    })

    expect(evaluateRiskIncrease(snapshot, 'amm')).toMatchObject({
      allowRiskIncrease: false,
      stopCode: 'divergence',
    })
  })

  it('blocks when quote is stale', () => {
    const snapshot = buildSymbolSyncSnapshot({
      symbol: 'AAPL',
      lastUpdateMs: 120_001,
      confidence: 90,
      oracleBlock: 101,
    })

    expect(evaluateRiskIncrease(snapshot, 'amm')).toMatchObject({
      allowRiskIncrease: false,
      stopCode: 'stale-propagation',
    })
  })
})

