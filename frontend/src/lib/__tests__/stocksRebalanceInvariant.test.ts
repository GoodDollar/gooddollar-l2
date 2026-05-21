import { describe, expect, it } from 'vitest'

import {
  buildSymbolRebalanceStatus,
  evaluateRebalanceGuard,
} from '../stocksRebalanceInvariant'

describe('stocksRebalanceInvariant', () => {
  it('blocks when any product is behind the current block', () => {
    const status = buildSymbolRebalanceStatus('AAPL', {
      rebalance: {
        symbols: {
          AAPL: {
            snapshotBlock: 120,
            blockProof: [120, 121],
            products: {
              amm: { lastSyncedBlock: 121, divergencePct: 0.1 },
              perps: { lastSyncedBlock: 120, divergencePct: 0.1 },
              predict: { lastSyncedBlock: 121, divergencePct: 0.1 },
              lend: { lastSyncedBlock: 121, divergencePct: 0.1 },
              yield: { lastSyncedBlock: 121, divergencePct: 0.1 },
            },
          },
        },
      },
    })

    const guard = evaluateRebalanceGuard(status, 121)
    expect(guard.blocked).toBe(true)
    expect(guard.reasons.join(' | ')).toContain('Awaiting same-block sync')
    expect(guard.staleProducts).toContain('perps')
  })

  it('blocks when divergence exceeds the 0.5% stop threshold', () => {
    const status = buildSymbolRebalanceStatus('AAPL', {
      rebalance: {
        symbols: {
          AAPL: {
            snapshotBlock: 300,
            blockProof: [300, 301],
            products: {
              amm: { lastSyncedBlock: 301, divergencePct: 0.51 },
              perps: { lastSyncedBlock: 301, divergencePct: 0.2 },
              predict: { lastSyncedBlock: 301, divergencePct: 0.2 },
              lend: { lastSyncedBlock: 301, divergencePct: 0.2 },
              yield: { lastSyncedBlock: 301, divergencePct: 0.2 },
            },
          },
        },
      },
    })

    const guard = evaluateRebalanceGuard(status, 301)
    expect(guard.blocked).toBe(true)
    expect(guard.maxDivergencePct).toBeCloseTo(0.51, 5)
    expect(guard.reasons.join(' | ')).toContain('exceeds 0.50% stop rule')
  })

  it('passes when synced for current block with valid two-block proof and safe divergence', () => {
    const status = buildSymbolRebalanceStatus('AAPL', {
      rebalance: {
        symbols: {
          AAPL: {
            snapshotBlock: 700,
            blockProof: [700, 701],
            products: {
              amm: { lastSyncedBlock: 701, divergencePct: 0.1 },
              perps: { lastSyncedBlock: 701, divergencePct: 0.3 },
              predict: { lastSyncedBlock: 701, divergencePct: 0.2 },
              lend: { lastSyncedBlock: 701, divergencePct: 0.2 },
              yield: { lastSyncedBlock: 701, divergencePct: 0.4 },
            },
            stalePropagation: false,
            secretLeak: false,
          },
        },
      },
    })

    const guard = evaluateRebalanceGuard(status, 701)
    expect(guard.blocked).toBe(false)
    expect(guard.hasTwoBlockProof).toBe(true)
    expect(guard.maxDivergencePct).toBeCloseTo(0.4, 5)
    expect(guard.reasons).toHaveLength(0)
  })

  it('fails safe when metadata is missing', () => {
    const status = buildSymbolRebalanceStatus('AAPL', {})
    const guard = evaluateRebalanceGuard(status, 900)
    expect(guard.blocked).toBe(true)
    expect(guard.reasons.join(' | ')).toContain('Two-block oracle sync proof missing')
  })

  it('fails safe when payload is null', () => {
    const status = buildSymbolRebalanceStatus('TSLA', null)
    const guard = evaluateRebalanceGuard(status, 100)
    expect(guard.blocked).toBe(true)
    expect(guard.staleProducts).toHaveLength(5)
  })

  it('fails safe when payload is undefined', () => {
    const status = buildSymbolRebalanceStatus('TSLA', undefined)
    const guard = evaluateRebalanceGuard(status, 100)
    expect(guard.blocked).toBe(true)
  })

  it('fails safe when rebalance field is missing but other fields exist', () => {
    const status = buildSymbolRebalanceStatus('META', { healthy: true, quotes: [] })
    const guard = evaluateRebalanceGuard(status, 200)
    expect(guard.blocked).toBe(true)
    expect(guard.reasons.join(' | ')).toContain('Two-block oracle sync proof missing')
    expect(guard.staleProducts).toHaveLength(5)
  })

  it('handles non-numeric divergencePct gracefully', () => {
    const status = buildSymbolRebalanceStatus('NVDA', {
      rebalance: {
        symbols: {
          NVDA: {
            snapshotBlock: 500,
            blockProof: [500, 501],
            products: {
              amm: { lastSyncedBlock: 501, divergencePct: 'bad' },
              perps: { lastSyncedBlock: 501, divergencePct: NaN },
              predict: { lastSyncedBlock: 501, divergencePct: null },
              lend: { lastSyncedBlock: 501, divergencePct: Infinity },
              yield: { lastSyncedBlock: 501, divergencePct: 0.1 },
            },
          },
        },
      },
    })

    const guard = evaluateRebalanceGuard(status, 501)
    expect(guard.maxDivergencePct).toBeCloseTo(0.1, 5)
  })

  it('handles blockProof with non-array values', () => {
    const status = buildSymbolRebalanceStatus('SPY', {
      rebalance: {
        symbols: {
          SPY: {
            snapshotBlock: 300,
            blockProof: 'not-an-array',
            products: {
              amm: { lastSyncedBlock: 300, divergencePct: 0 },
              perps: { lastSyncedBlock: 300, divergencePct: 0 },
              predict: { lastSyncedBlock: 300, divergencePct: 0 },
              lend: { lastSyncedBlock: 300, divergencePct: 0 },
              yield: { lastSyncedBlock: 300, divergencePct: 0 },
            },
          },
        },
      },
    })

    expect(status.blockProof).toHaveLength(0)
    const guard = evaluateRebalanceGuard(status, 300)
    expect(guard.hasTwoBlockProof).toBe(false)
    expect(guard.blocked).toBe(true)
  })

  it('blocks when currentBlock is null even if other data is valid', () => {
    const status = buildSymbolRebalanceStatus('AAPL', {
      rebalance: {
        symbols: {
          AAPL: {
            snapshotBlock: 100,
            blockProof: [100, 101],
            products: {
              amm: { lastSyncedBlock: 101, divergencePct: 0 },
              perps: { lastSyncedBlock: 101, divergencePct: 0 },
              predict: { lastSyncedBlock: 101, divergencePct: 0 },
              lend: { lastSyncedBlock: 101, divergencePct: 0 },
              yield: { lastSyncedBlock: 101, divergencePct: 0 },
            },
          },
        },
      },
    })

    const guard = evaluateRebalanceGuard(status, null)
    expect(guard.blocked).toBe(true)
    expect(guard.reasons.join(' | ')).toContain('Current block unavailable')
  })
})
