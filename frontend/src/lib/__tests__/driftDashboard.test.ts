import { describe, expect, it } from 'vitest'

import { deriveDriftRow } from '@/lib/driftDashboard'

describe('drift dashboard rows', () => {
  const base = {
    symbol: 'AAPL',
    lastUpdateMs: 500,
    sessionState: 'open',
    confidence: 95,
  }

  it('shows synced on block N and block N+1 when all products sync consecutively', () => {
    const rowN = deriveDriftRow({
      ...base,
      oracleBlock: 300,
      productSync: {
        amm: { lastSyncedBlock: 300 },
        perps: { lastSyncedBlock: 300 },
        prediction: { lastSyncedBlock: 300 },
        lend: { lastSyncedBlock: 300 },
        yield: { lastSyncedBlock: 300 },
      },
    }, 300 * 12_000)

    const rowN1 = deriveDriftRow({
      ...base,
      oracleBlock: 301,
      productSync: {
        amm: { lastSyncedBlock: 301 },
        perps: { lastSyncedBlock: 301 },
        prediction: { lastSyncedBlock: 301 },
        lend: { lastSyncedBlock: 301 },
        yield: { lastSyncedBlock: 301 },
      },
    }, 301 * 12_000)

    expect(rowN.health).toBe('synced')
    expect(rowN1.health).toBe('synced')
  })

  it('shows lagging when at least one product is behind current block', () => {
    const row = deriveDriftRow({
      ...base,
      oracleBlock: 450,
      productSync: {
        amm: { lastSyncedBlock: 450 },
        perps: { lastSyncedBlock: 449 },
      },
    }, 450 * 12_000)

    expect(row.health).toBe('lagging')
    expect(row.products.perps.status).toBe('lagging')
    expect(row.stopReason).toContain('price data is updating')
  })

  it('shows stopped when divergence is above 0.5%', () => {
    const row = deriveDriftRow({
      ...base,
      oracleBlock: 800,
      divergenceBps: 55,
    }, 800 * 12_000)

    expect(row.health).toBe('stopped')
    expect(row.stopReason).toContain('price is out of range')
  })

  it('shows stopped when stale propagation is detected', () => {
    const row = deriveDriftRow({
      ...base,
      oracleBlock: 800,
      lastUpdateMs: 300_000,
    }, 800 * 12_000)

    expect(row.health).toBe('stopped')
    expect(row.stopReason).toContain('price data is too old')
  })
})
