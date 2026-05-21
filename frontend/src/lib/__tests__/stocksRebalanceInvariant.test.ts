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
})
