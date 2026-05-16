import { describe, it, expect } from 'vitest'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  computeUbiPercentage,
  parseAggregateResult,
  type AggregateContractResult,
} from '@/lib/useUBIImpact'

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

// ── parseAggregateResult — Multicall3 aggregate decoder (task 0068) ───────────
//
// The /ubi-impact page used to fire three independent batched `useReadContract`
// calls against `UBIRevenueTracker`. If one batched JSON-RPC request hung,
// the page's `isLoading` flag stayed `true` indefinitely and the user saw
// pulsing skeletons forever (no error, no data, no fallback).
//
// Task 0068 collapses the three reads into a single `useReadContracts`
// (Multicall3 aggregate) and exposes a pure helper, `parseAggregateResult`,
// that maps wagmi's per-call status array into the dashboard's typed
// `{ dashboard, protocols, snapshots }` shape — including the all-zero
// "empty" state and per-call failure modes that the old code collapsed
// into "stuck loading".

describe('parseAggregateResult', () => {
  const mkDashboardTuple = (overrides: Partial<{
    totalFees: bigint
    totalUBI: bigint
    totalTx: bigint
    protocolCount: bigint
    activeProtocols: bigint
    splitterFees: bigint
    splitterUBI: bigint
    snapshotCount: bigint
  }> = {}): readonly bigint[] => {
    const d = {
      totalFees: 1000n * 10n ** 18n,
      totalUBI: 200n * 10n ** 18n,
      totalTx: 42n,
      protocolCount: 7n,
      activeProtocols: 5n,
      splitterFees: 1000n * 10n ** 18n,
      splitterUBI: 200n * 10n ** 18n,
      snapshotCount: 3n,
      ...overrides,
    }
    return [
      d.totalFees,
      d.totalUBI,
      d.totalTx,
      d.protocolCount,
      d.activeProtocols,
      d.splitterFees,
      d.splitterUBI,
      d.snapshotCount,
    ] as const
  }

  const mkProtocol = (overrides: Partial<{
    name: string
    category: string
    feeSource: string
    totalFees: bigint
    ubiContribution: bigint
    txCount: bigint
    lastUpdateBlock: bigint
    active: boolean
  }> = {}) => ({
    name: 'GoodSwap',
    category: 'swap',
    feeSource: '0xabc',
    totalFees: 500n * 10n ** 18n,
    ubiContribution: 100n * 10n ** 18n,
    txCount: 25n,
    lastUpdateBlock: 1000n,
    active: true,
    ...overrides,
  })

  it('returns isEmpty=true (not isError) when all three reads succeed but the chain has recorded zero fees', () => {
    // Fresh deploy: contract is alive, returns valid tuples, but every metric
    // is 0n. The old code rendered skeleton-forever because `data.totalFees`
    // was technically a valid bigint, so `isLoading` stayed true via a
    // separate code path. The new mapping must surface this as an explicit
    // empty state.
    const data: AggregateContractResult[] = [
      { status: 'success', result: mkDashboardTuple({ totalFees: 0n, totalUBI: 0n, totalTx: 0n, protocolCount: 0n, activeProtocols: 0n, splitterFees: 0n, splitterUBI: 0n, snapshotCount: 0n }) },
      { status: 'success', result: [] },
      { status: 'success', result: [] },
    ]
    const out = parseAggregateResult(data)
    expect(out.isError).toBe(false)
    expect(out.isEmpty).toBe(true)
    expect(out.dashboard).not.toBeNull()
    expect(out.dashboard?.totalFees).toBe(0n)
    expect(out.protocols).toEqual([])
    expect(out.snapshots).toEqual([])
  })

  it('returns dashboard + protocols + snapshots when all three reads succeed with real data', () => {
    const data: AggregateContractResult[] = [
      { status: 'success', result: mkDashboardTuple() },
      { status: 'success', result: [mkProtocol(), mkProtocol({ name: 'GoodPerps', category: 'perps' })] },
      { status: 'success', result: [{ timestamp: 1700000000n, totalUBI: 100n, totalFees: 500n, protocolCount: 3n }] },
    ]
    const out = parseAggregateResult(data)
    expect(out.isError).toBe(false)
    expect(out.isEmpty).toBe(false)
    expect(out.dashboard).not.toBeNull()
    expect(out.dashboard?.totalFees).toBe(1000n * 10n ** 18n)
    expect(out.dashboard?.ubiPercentage).toBeCloseTo(20, 5)
    expect(out.protocols).toHaveLength(2)
    expect(out.protocols[0].name).toBe('GoodSwap')
    expect(out.protocols[0].feeShare).toBeCloseTo(50, 5) // 500 of 1000 = 50%
    expect(out.snapshots).toHaveLength(1)
    expect(out.snapshots[0].totalUBI).toBe(100n)
  })

  it('returns isError=true with dashboard=null when the dashboard read failed', () => {
    // If the headline tuple cannot be fetched, the whole page is unusable —
    // surface as a hard error so the UI shows the Retry card, not skeletons.
    const data: AggregateContractResult[] = [
      { status: 'failure', error: new Error('rpc 500') },
      { status: 'success', result: [mkProtocol()] },
      { status: 'success', result: [] },
    ]
    const out = parseAggregateResult(data)
    expect(out.isError).toBe(true)
    expect(out.dashboard).toBeNull()
    // Even though protocols decoded successfully, we suppress them because
    // the page can't render without the dashboard totals.
    expect(out.protocols).toEqual([])
    expect(out.snapshots).toEqual([])
  })

  it('gracefully degrades when only the snapshots read failed — dashboard + protocols still render', () => {
    // A partial failure on the secondary "Historical Snapshots" section
    // must NOT take down the rest of the page. The page should render the
    // hero stats and protocol breakdown, with a small per-section error.
    const data: AggregateContractResult[] = [
      { status: 'success', result: mkDashboardTuple() },
      { status: 'success', result: [mkProtocol()] },
      { status: 'failure', error: new Error('snapshots rpc 500') },
    ]
    const out = parseAggregateResult(data)
    expect(out.isError).toBe(false)
    expect(out.isEmpty).toBe(false)
    expect(out.dashboard).not.toBeNull()
    expect(out.protocols).toHaveLength(1)
    expect(out.snapshots).toEqual([])
    expect(out.snapshotsError).toBeInstanceOf(Error)
  })

  it('gracefully degrades when only the protocols read failed — dashboard still renders', () => {
    const data: AggregateContractResult[] = [
      { status: 'success', result: mkDashboardTuple() },
      { status: 'failure', error: new Error('protocols rpc 500') },
      { status: 'success', result: [] },
    ]
    const out = parseAggregateResult(data)
    expect(out.isError).toBe(false)
    expect(out.dashboard).not.toBeNull()
    expect(out.protocols).toEqual([])
    expect(out.protocolsError).toBeInstanceOf(Error)
  })

  it('returns all-null isError=true when data is undefined (initial pending state)', () => {
    const out = parseAggregateResult(undefined)
    expect(out.isError).toBe(false) // not an error yet — just no data
    expect(out.isEmpty).toBe(false)
    expect(out.dashboard).toBeNull()
    expect(out.protocols).toEqual([])
    expect(out.snapshots).toEqual([])
  })

  it('returns isError=true when data has fewer than 3 entries (malformed multicall response)', () => {
    // viem should always return 3 entries when we requested 3 contracts;
    // anything else is a malformed response we should surface as error
    // rather than render partial/wrong data.
    const data = [
      { status: 'success' as const, result: mkDashboardTuple() },
    ]
    const out = parseAggregateResult(data)
    expect(out.isError).toBe(true)
    expect(out.dashboard).toBeNull()
  })

  it('computes correct feeShare / ubiShare for each protocol relative to dashboard totals', () => {
    const data: AggregateContractResult[] = [
      { status: 'success', result: mkDashboardTuple({ totalFees: 1000n, totalUBI: 200n }) },
      { status: 'success', result: [
        mkProtocol({ totalFees: 600n, ubiContribution: 120n, name: 'A' }),
        mkProtocol({ totalFees: 400n, ubiContribution: 80n, name: 'B' }),
      ] },
      { status: 'success', result: [] },
    ]
    const out = parseAggregateResult(data)
    expect(out.protocols[0].feeShare).toBeCloseTo(60, 5)
    expect(out.protocols[1].feeShare).toBeCloseTo(40, 5)
    expect(out.protocols[0].ubiShare).toBeCloseTo(60, 5) // 120/200
    expect(out.protocols[1].ubiShare).toBeCloseTo(40, 5) // 80/200
  })
})
