import { describe, it, expect } from 'vitest'
import {
  type HedgeProof,
  NO_OP_ORDER_ID,
  isNoOpProof,
} from '@/lib/hedgeProof'

function makeProof(overrides: Partial<HedgeProof> = {}): HedgeProof {
  return {
    runId: 'test-run',
    orderId: NO_OP_ORDER_ID,
    symbol: 'AAPL',
    side: 'buy',
    notionalUsd: 0,
    timestamp: 1_750_000_000_000,
    beforeExposure: { netDelta: 100, absExposure: 100, blockNumber: 5 },
    afterExposure: { netDelta: 100, absExposure: 100, blockNumber: 5 },
    dryRun: true,
    etoroMode: 'sandbox',
    realTradingEnabled: false,
    ...overrides,
  }
}

describe('NO_OP_ORDER_ID', () => {
  it('matches the backend constant exactly', () => {
    expect(NO_OP_ORDER_ID).toBe('no-op')
  })
})

describe('isNoOpProof', () => {
  it('returns true on the canonical sentinel shape', () => {
    expect(isNoOpProof(makeProof())).toBe(true)
  })

  it('returns false when orderId is not the sentinel', () => {
    expect(isNoOpProof(makeProof({ orderId: 'real-order-1' }))).toBe(false)
  })

  it('returns false when notionalUsd is non-zero', () => {
    expect(isNoOpProof(makeProof({ notionalUsd: 12.5 }))).toBe(false)
  })

  it('returns false when before/after blockNumber differ', () => {
    expect(
      isNoOpProof(
        makeProof({
          afterExposure: { netDelta: 100, absExposure: 100, blockNumber: 6 },
        }),
      ),
    ).toBe(false)
  })

  it('returns false when before/after netDelta differ', () => {
    expect(
      isNoOpProof(
        makeProof({
          afterExposure: { netDelta: 110, absExposure: 110, blockNumber: 5 },
        }),
      ),
    ).toBe(false)
  })
})
