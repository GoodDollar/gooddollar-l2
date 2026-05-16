import { describe, it, expect } from 'vitest'
import { CATEGORY_COLORS, CATEGORY_ICONS, computeUbiPercentage } from '@/lib/useUBIImpact'

// ── Category metadata tests ───────────────────────────────────────────────────

describe('CATEGORY_COLORS', () => {
  it('has colors for all 7 protocol categories', () => {
    const expected = ['swap', 'perps', 'predict', 'lend', 'stable', 'stocks', 'bridge']
    for (const cat of expected) {
      expect(CATEGORY_COLORS[cat]).toBeDefined()
      expect(CATEGORY_COLORS[cat]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('returns unique colors for each category', () => {
    const colors = Object.values(CATEGORY_COLORS)
    const unique = new Set(colors)
    expect(unique.size).toBe(colors.length)
  })
})

describe('CATEGORY_ICONS', () => {
  it('has icons for all 7 protocol categories', () => {
    const expected = ['swap', 'perps', 'predict', 'lend', 'stable', 'stocks', 'bridge']
    for (const cat of expected) {
      expect(CATEGORY_ICONS[cat]).toBeDefined()
      expect(CATEGORY_ICONS[cat].length).toBeGreaterThan(0)
    }
  })
})

// ── Formatting helper tests ───────────────────────────────────────────────────
// We test the formatting logic by importing the page module's formatGD indirectly.
// Since it's not exported, we replicate the logic here for unit tests.

function formatGD(wei: bigint): string {
  const num = Number(wei) / 1e18
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

describe('formatGD (UBI dashboard formatter)', () => {
  it('formats zero', () => {
    expect(formatGD(0n)).toBe('0.00')
  })

  it('formats small amounts', () => {
    // 500 G$ = 500e18 wei
    const val = BigInt('500000000000000000000')
    expect(formatGD(val)).toBe('500.00')
  })

  it('formats thousands with K suffix', () => {
    // 15,000 G$ = 15000e18
    const val = BigInt('15000000000000000000000')
    expect(formatGD(val)).toBe('15.00K')
  })

  it('formats millions with M suffix', () => {
    // 2,500,000 G$
    const val = BigInt('2500000000000000000000000')
    expect(formatGD(val)).toBe('2.50M')
  })

  it('formats exact boundary at 1000', () => {
    const val = BigInt('1000000000000000000000')
    expect(formatGD(val)).toBe('1.00K')
  })

  it('formats exact boundary at 1,000,000', () => {
    const val = BigInt('1000000000000000000000000')
    expect(formatGD(val)).toBe('1.00M')
  })

  it('formats fractional G$', () => {
    // 0.5 G$ = 5e17
    const val = BigInt('500000000000000000')
    expect(formatGD(val)).toBe('0.50')
  })
})

// ── Protocol stats calculation tests ──────────────────────────────────────────

describe('Protocol fee share calculation', () => {
  function calcFeeShare(protocolFees: bigint, totalFees: bigint): number {
    return totalFees > 0n ? Number((protocolFees * 10000n) / totalFees) / 100 : 0
  }

  it('calculates 100% for single protocol', () => {
    const share = calcFeeShare(1000n, 1000n)
    expect(share).toBe(100)
  })

  it('calculates 50% split', () => {
    const share = calcFeeShare(500n, 1000n)
    expect(share).toBe(50)
  })

  it('calculates 20% UBI share', () => {
    const share = calcFeeShare(200n, 1000n)
    expect(share).toBe(20)
  })

  it('returns 0 for zero total', () => {
    const share = calcFeeShare(100n, 0n)
    expect(share).toBe(0)
  })

  it('handles very small percentages', () => {
    const share = calcFeeShare(1n, 10000n)
    expect(share).toBe(0.01)
  })
})

// ── UBI percentage calculation ────────────────────────────────────────────────

describe('UBI percentage calculation', () => {
  function calcUBIPct(totalUBI: bigint, totalFees: bigint): number {
    return totalFees > 0n ? Number((totalUBI * 10000n) / totalFees) / 100 : 0
  }

  it('calculates 20% for standard UBI split', () => {
    // 20 UBI from 100 fees
    const pct = calcUBIPct(20n, 100n)
    expect(pct).toBe(20)
  })

  it('returns 0 when no fees', () => {
    expect(calcUBIPct(0n, 0n)).toBe(0)
  })

  it('handles exact 20% split', () => {
    // 200 out of 1000 = 20%
    const pct = calcUBIPct(200n, 1000n)
    expect(pct).toBe(20)
  })
})

// ── computeUbiPercentage (authoritative splitter source) ──────────────────────
//
// Task 0065 — reconcile the dashboard's headline "20%" claim with the
// percentage actually displayed on /ubi-impact. The UBIFeeSplitter contract
// is the on-chain source of truth (ubiBPS = 2000 = 20%). When its
// totalFeesCollected() > 0 we should derive the displayed % from those
// authoritative values, not from the aggregated tracker totals which can
// drift if a keeper reports `fees` as the non-dapp residue (yields 33.3%).

describe('computeUbiPercentage', () => {
  it('returns 20% when the splitter has collected exactly the 20/80 split', () => {
    // gross 1000 → 200 UBI, 400 protocol, 400 dapp; splitter.totalFeesCollected=1000, totalUBIFunded=200
    expect(computeUbiPercentage({
      totalUBI: 0n,
      totalFees: 0n,
      splitterUBI: 200n,
      splitterFees: 1000n,
    })).toBeCloseTo(20, 5)
  })

  it('prefers splitter values over tracker values when splitter has data', () => {
    // Tracker would say 33.3% (stale / wrong-definition reporter) — splitter says 20%.
    // The fix MUST use the splitter.
    expect(computeUbiPercentage({
      totalUBI: 100n,
      totalFees: 300n, // 33.3% (the buggy display)
      splitterUBI: 200n,
      splitterFees: 1000n, // 20% (authoritative)
    })).toBeCloseTo(20, 5)
  })

  it('falls back to tracker values when splitter has no data', () => {
    // Splitter is zeroed (e.g. fresh deploy, not yet hit) — fall back to tracker
    expect(computeUbiPercentage({
      totalUBI: 200n,
      totalFees: 1000n,
      splitterUBI: 0n,
      splitterFees: 0n,
    })).toBeCloseTo(20, 5)
  })

  it('returns 0 when neither source has any fees', () => {
    expect(computeUbiPercentage({
      totalUBI: 0n,
      totalFees: 0n,
      splitterUBI: 0n,
      splitterFees: 0n,
    })).toBe(0)
  })

  it('never returns NaN when splitter fees is 0 but UBI is nonzero (malformed state)', () => {
    // Should not divide by zero; should fall through to tracker, and from there to 0.
    const pct = computeUbiPercentage({
      totalUBI: 0n,
      totalFees: 0n,
      splitterUBI: 50n,
      splitterFees: 0n,
    })
    expect(Number.isFinite(pct)).toBe(true)
    expect(pct).toBe(0)
  })

  it('handles real wei-scale values (1000 G$ gross fees, 200 G$ UBI)', () => {
    const gross = 1000n * 10n ** 18n
    const ubi = 200n * 10n ** 18n
    expect(computeUbiPercentage({
      totalUBI: 0n,
      totalFees: 0n,
      splitterUBI: ubi,
      splitterFees: gross,
    })).toBeCloseTo(20, 5)
  })
})
