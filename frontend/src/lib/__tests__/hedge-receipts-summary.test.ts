import { describe, it, expect } from 'vitest'

import { summarizeReceipts } from '../hedge-receipts-summary'
import type { HedgeReceipt } from '@/components/HedgeStatusCard/ReceiptRow'

function makeReceipt(overrides: Partial<HedgeReceipt> = {}): HedgeReceipt {
  return {
    v: 1,
    id: 'r-' + Math.random().toString(36).slice(2, 8),
    timestamp: 1700000000000,
    symbol: 'AAPL',
    side: 'buy',
    notionalUsd: 50,
    success: true,
    etoroOrderId: 'etoro-1',
    beforeExposure: 100,
    afterExposure: 150,
    dryRun: false,
    mode: 'demo',
    ...overrides,
  }
}

describe('summarizeReceipts', () => {
  it('returns null for an empty input so the footer never renders', () => {
    expect(summarizeReceipts([])).toBeNull()
  })

  it('aggregates a 5-receipt mixed fixture (3 buy / 2 sell, 4 ok / 1 failed)', () => {
    const receipts: HedgeReceipt[] = [
      makeReceipt({ side: 'sell', notionalUsd: 42.18, beforeExposure: 1480.22, afterExposure: 1438.04 }),
      makeReceipt({ side: 'buy', notionalUsd: 18.92, beforeExposure: 223.1, afterExposure: 242.02 }),
      makeReceipt({ side: 'sell', notionalUsd: 9.04, beforeExposure: 104.5, afterExposure: 95.46 }),
      makeReceipt({ side: 'buy', notionalUsd: 7.33, beforeExposure: 55.1, afterExposure: 55.1, success: false, error: 'INSUFFICIENT_LIQUIDITY' }),
      makeReceipt({ side: 'buy', notionalUsd: 25.51, beforeExposure: 1454.71, afterExposure: 1480.22 }),
    ]
    const r = summarizeReceipts(receipts)!
    expect(r.count).toBe(5)
    expect(r.notionalTotalUsd).toBeCloseTo(102.98, 2)
    expect(r.buyCount).toBe(3)
    expect(r.sellCount).toBe(2)
    expect(r.noopCount).toBe(0)
    expect(r.okCount).toBe(4)
    expect(r.failedCount).toBe(1)
    expect(r.exposureNetDelta).toBeCloseTo(-6.79, 2)
    expect(r.sideCaption).toBe('3 buy · 2 sell')
    expect(r.statusCaption).toBe('4 ok · 1 failed')
  })

  it('omits zero classes from sideCaption when only buys are present', () => {
    const receipts = [
      makeReceipt({ side: 'buy' }),
      makeReceipt({ side: 'buy' }),
      makeReceipt({ side: 'buy' }),
      makeReceipt({ side: 'buy' }),
      makeReceipt({ side: 'buy' }),
    ]
    expect(summarizeReceipts(receipts)!.sideCaption).toBe('5 buy')
  })

  it('returns "all noop" when every receipt is a no-op', () => {
    const receipts = [
      makeReceipt({ side: 'noop' }),
      makeReceipt({ side: 'noop' }),
    ]
    expect(summarizeReceipts(receipts)!.sideCaption).toBe('all noop')
  })

  it('returns "all ok" when every receipt succeeded', () => {
    const r = summarizeReceipts([
      makeReceipt({ success: true }),
      makeReceipt({ success: true }),
    ])!
    expect(r.statusCaption).toBe('all ok')
  })

  it('returns "all failed" when every receipt failed', () => {
    const r = summarizeReceipts([
      makeReceipt({ success: false, error: 'A' }),
      makeReceipt({ success: false, error: 'B' }),
    ])!
    expect(r.statusCaption).toBe('all failed')
  })

  it('skips a receipt with non-finite exposure from the net delta but still counts it', () => {
    const r = summarizeReceipts([
      makeReceipt({ beforeExposure: 100, afterExposure: 150 }),
      makeReceipt({ beforeExposure: Number.NaN as unknown as number, afterExposure: 999 }),
    ])!
    expect(r.count).toBe(2)
    expect(r.exposureNetDelta).toBeCloseTo(50, 6)
  })

  it('skips a receipt with non-finite notional from the notional total but still counts it', () => {
    const r = summarizeReceipts([
      makeReceipt({ notionalUsd: 25 }),
      makeReceipt({ notionalUsd: Number.POSITIVE_INFINITY }),
    ])!
    expect(r.count).toBe(2)
    expect(r.notionalTotalUsd).toBeCloseTo(25, 6)
  })
})
