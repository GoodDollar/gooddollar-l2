import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock wagmi BEFORE importing the module under test so the hooks resolve
// to our stubs. Each test redefines the return values with mockReturnValue.
const useReadContractMock = vi.fn()
const useReadContractsMock = vi.fn()
vi.mock('wagmi', () => ({
  useReadContract: (...args: unknown[]) => useReadContractMock(...args),
  useReadContracts: (...args: unknown[]) => useReadContractsMock(...args),
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: { MarketFactory: '0x0000000000000000000000000000000000000001' },
}))

import {
  bpsToYesPrice,
  BPS_DENOMINATOR,
  MARKET_READ_CAP,
  marketReadWindow,
  useOnChainMarket,
  useAllOnChainMarkets,
} from '@/lib/useMarkets'

describe('marketReadWindow (GOO-3179 tail fetch)', () => {
  it('reads from zero when count <= cap', () => {
    expect(marketReadWindow(BigInt(5))).toEqual({ startId: 0, n: 5 })
    expect(marketReadWindow(BigInt(MARKET_READ_CAP))).toEqual({
      startId: 0,
      n: MARKET_READ_CAP,
    })
  })

  it('reads the latest cap markets when count exceeds cap', () => {
    expect(marketReadWindow(BigInt(122))).toEqual({ startId: 102, n: MARKET_READ_CAP })
  })
})

describe('bpsToYesPrice (MarketFactory BPS → 0-1 float)', () => {
  it('exports BPS_DENOMINATOR = 10_000', () => {
    expect(BPS_DENOMINATOR).toBe(10_000)
  })

  it('5000 BPS (zero-liquidity default) → 0.5 exactly', () => {
    // MarketFactory.sol line 312: `if (total == 0) return 5000;`
    expect(bpsToYesPrice(BigInt(5000))).toBe(0.5)
  })

  it('2500 BPS → 0.25', () => {
    expect(bpsToYesPrice(BigInt(2500))).toBeCloseTo(0.25, 9)
  })

  it('7500 BPS → 0.75', () => {
    expect(bpsToYesPrice(BigInt(7500))).toBeCloseTo(0.75, 9)
  })

  it('10000 BPS → 1.0 (100% YES)', () => {
    expect(bpsToYesPrice(BigInt(10_000))).toBe(1)
  })

  it('0 BPS → 0 (0% YES)', () => {
    expect(bpsToYesPrice(BigInt(0))).toBe(0)
  })

  it('undefined (loading / RPC failure) → 0.5 default', () => {
    // Same fallback behaviour both code paths must share, per acceptance #6.
    expect(bpsToYesPrice(undefined)).toBe(0.5)
  })

  it('does NOT divide by 1e18 (regression for the old bug)', () => {
    // The pre-fix code was `Number(probRaw) / 1e18`, which for 5000n
    // produced 5e-15 → rounded to 0% in the UI. Guard against the
    // regression by asserting the result is NOT astronomically small.
    const result = bpsToYesPrice(BigInt(5000))
    expect(result).toBeGreaterThan(1e-6)
    expect(result).toBeLessThanOrEqual(1)
  })
})

// ─── Integration: hooks plumb BPS through bpsToYesPrice ────────────────────
//
// The pure-function tests above prove the math. These hook-level tests are
// the regression guard against someone reverting the call site to an inline
// `Number(probRaw) / 1e18` without touching the helper. They mock wagmi at
// the module boundary so we exercise the real useOnChainMarket /
// useAllOnChainMarkets code paths.

// Non-zero liquidity so iter-18's hasLiveLiquidity gate keeps the on-chain
// markets visible — these tests exercise BPS → yesPrice plumbing, not the
// fallback gate (separate describe block below covers that).
const FAKE_MARKET_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
  'Will BTC hit 100K?',
  BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)),
  0,
  BigInt(1e18),  // totalYES
  BigInt(1e18),  // totalNO
  BigInt(2e18),  // collateral
]

describe('useOnChainMarket — yesPrice integration', () => {
  it('5000 BPS from contract → market.yesPrice === 0.5 (50¢ UI)', () => {
    useReadContractMock
      .mockReturnValueOnce({ data: FAKE_MARKET_TUPLE, isLoading: false, isError: false })
      .mockReturnValueOnce({ data: BigInt(5000), isLoading: false, isError: false })

    const { result } = renderHook(() => useOnChainMarket(BigInt(0)))
    expect(result.current.market?.yesPrice).toBe(0.5)
    expect(Math.round((result.current.market?.yesPrice ?? 0) * 100)).toBe(50)
  })

  it('7250 BPS from contract → market.yesPrice === 0.725 (73¢ UI)', () => {
    useReadContractMock
      .mockReturnValueOnce({ data: FAKE_MARKET_TUPLE, isLoading: false, isError: false })
      .mockReturnValueOnce({ data: BigInt(7250), isLoading: false, isError: false })

    const { result } = renderHook(() => useOnChainMarket(BigInt(0)))
    expect(result.current.market?.yesPrice).toBeCloseTo(0.725, 9)
    expect(Math.round((result.current.market?.yesPrice ?? 0) * 100)).toBe(73)
  })

  it('probability still loading → defaults to 0.5 (no NaN, no 0¢)', () => {
    useReadContractMock
      .mockReturnValueOnce({ data: FAKE_MARKET_TUPLE, isLoading: false, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false })

    const { result } = renderHook(() => useOnChainMarket(BigInt(0)))
    expect(result.current.market?.yesPrice).toBe(0.5)
  })
})

describe('useAllOnChainMarkets — listing yesPrice integration', () => {
  it('requests the latest MARKET_READ_CAP ids when marketCount exceeds the cap', () => {
    const marketBatch = Array.from({ length: MARKET_READ_CAP }, () => ({
      status: 'success' as const,
      result: FAKE_MARKET_TUPLE,
    }))
    const probBatch = Array.from({ length: MARKET_READ_CAP }, () => ({
      status: 'success' as const,
      result: BigInt(5000),
    }))
    useReadContractsMock
      .mockReturnValueOnce({ data: marketBatch, isLoading: false })
      .mockReturnValueOnce({ data: probBatch, isLoading: false })

    renderHook(() => useAllOnChainMarkets(BigInt(122)))

    const requested = useReadContractsMock.mock.calls[0]?.[0]?.contracts as
      | Array<{ args: [bigint] }>
      | undefined
    expect(requested).toHaveLength(MARKET_READ_CAP)
    expect(requested?.[0]?.args[0]).toBe(BigInt(102))
    expect(requested?.[MARKET_READ_CAP - 1]?.args[0]).toBe(BigInt(121))
  })

  it('multi-market BPS values map to correct yesPrice floats', () => {
    useReadContractsMock
      // first call: getMarket batch
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: FAKE_MARKET_TUPLE },
          { status: 'success', result: FAKE_MARKET_TUPLE },
          { status: 'success', result: FAKE_MARKET_TUPLE },
        ],
        isLoading: false,
      })
      // second call: impliedProbabilityYES batch
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: BigInt(2500) },  // 25%
          { status: 'success', result: BigInt(5000) },  // 50%
          { status: 'success', result: BigInt(9000) },  // 90%
        ],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(3)))
    expect(result.current.markets).toHaveLength(3)
    expect(result.current.markets[0].yesPrice).toBeCloseTo(0.25, 9)
    expect(result.current.markets[1].yesPrice).toBe(0.5)
    expect(result.current.markets[2].yesPrice).toBeCloseTo(0.9, 9)

    // None should round to 0 or 100, which was the symptom of the
    // /1e18 bug producing yesPrice ≈ 5e-15.
    for (const m of result.current.markets) {
      const pct = Math.round(m.yesPrice * 100)
      expect(pct).toBeGreaterThan(0)
      expect(pct).toBeLessThanOrEqual(100)
    }
  })

  it('one market with missing probability falls back to 0.5, neighbours unaffected', () => {
    useReadContractsMock
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: FAKE_MARKET_TUPLE },
          { status: 'success', result: FAKE_MARKET_TUPLE },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: BigInt(8000) },
          { status: 'failure', result: undefined },  // RPC blip
        ],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(2)))
    expect(result.current.markets).toHaveLength(2)
    expect(result.current.markets[0].yesPrice).toBeCloseTo(0.8, 9)
    expect(result.current.markets[1].yesPrice).toBe(0.5)
  })
})

// ─── Iter 18: fallback gating when all on-chain markets are zero-liquidity stubs ──
//
// Regression bug: MarketFactory had 4 placeholder markets with
// totalYES = totalNO = collateral = 0. The old gate
// `markets.length > 0 ? markets : FALLBACK_MARKETS` returned the stubs,
// and downstream `hasMeaningfulPrice` (volume > 0) filtered them all out,
// leaving an empty Predict grid and failing E2E. The fix is to fall back
// to demo markets only when NO on-chain market has any live liquidity.

const ZERO_LIQUIDITY_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
  'Will BTC hit $100K by 2026?',
  BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)),
  0,
  BigInt(0),  // totalYES
  BigInt(0),  // totalNO
  BigInt(0),  // collateral
]

const LIVE_LIQUIDITY_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
  'Will ETH flip BTC?',
  BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)),
  0,
  BigInt(5e18),   // totalYES — non-zero
  BigInt(3e18),   // totalNO  — non-zero
  BigInt(10e18),  // collateral — non-zero
]

describe('useAllOnChainMarkets — fallback gating (iter18)', () => {
  it('all on-chain markets are zero-liquidity stubs → returns demo FALLBACK_MARKETS', () => {
    // Exactly the production bug: count=4, every market has zero totals & collateral.
    useReadContractsMock
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: ZERO_LIQUIDITY_TUPLE },
          { status: 'success', result: ZERO_LIQUIDITY_TUPLE },
          { status: 'success', result: ZERO_LIQUIDITY_TUPLE },
          { status: 'success', result: ZERO_LIQUIDITY_TUPLE },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: BigInt(5000) },
          { status: 'success', result: BigInt(5000) },
          { status: 'success', result: BigInt(5000) },
          { status: 'success', result: BigInt(5000) },
        ],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(4)))

    // Should return the 6 hard-coded demo markets, not the 4 zero-liquidity stubs.
    expect(result.current.markets).toHaveLength(6)
    // Demo markets have known questions distinct from the stub.
    const questions = result.current.markets.map((m) => m.question)
    expect(questions).toContain('Will Bitcoin exceed $150,000 by end of 2026?')
    expect(questions).not.toContain('Will BTC hit $100K by 2026?')
    // Every returned market must have positive liquidity so hasMeaningfulPrice passes downstream.
    for (const m of result.current.markets) {
      expect(m.totalYES > BigInt(0) || m.totalNO > BigInt(0) || m.collateral > BigInt(0)).toBe(true)
    }
  })

  it('at least one on-chain market has totalYES > 0 → returns real on-chain markets', () => {
    useReadContractsMock
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: ZERO_LIQUIDITY_TUPLE },
          { status: 'success', result: LIVE_LIQUIDITY_TUPLE },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [
          { status: 'success', result: BigInt(5000) },
          { status: 'success', result: BigInt(6250) },
        ],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(2)))
    expect(result.current.markets).toHaveLength(2)
    // First on-chain market still present even though its totals are zero.
    expect(result.current.markets[0].question).toBe('Will BTC hit $100K by 2026?')
    expect(result.current.markets[1].question).toBe('Will ETH flip BTC?')
  })

  it('active but expired on-chain market with liquidity → returns demo FALLBACK_MARKETS (GOO-3179)', () => {
    const EXPIRED_ACTIVE_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
      'Will BTC hit $100K by 2026?',
      BigInt(Math.floor(new Date('2026-05-28').getTime() / 1000)),
      0,
      BigInt(5e18),
      BigInt(3e18),
      BigInt(10e18),
    ]

    useReadContractsMock
      .mockReturnValueOnce({
        data: [{ status: 'success', result: EXPIRED_ACTIVE_TUPLE }],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [{ status: 'success', result: BigInt(5000) }],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(1)))
    expect(result.current.markets).toHaveLength(6)
    expect(result.current.markets[0].question).toContain('Bitcoin exceed $150,000')
  })

  it('only resolved on-chain markets have liquidity → returns demo FALLBACK_MARKETS', () => {
    const RESOLVED_LIQUIDITY_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
      'Resolved historical market',
      BigInt(Math.floor(new Date('2026-01-01').getTime() / 1000)),
      1,
      BigInt(5e18),
      BigInt(3e18),
      BigInt(10e18),
    ]

    useReadContractsMock
      .mockReturnValueOnce({
        data: [{ status: 'success', result: RESOLVED_LIQUIDITY_TUPLE }],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [{ status: 'success', result: BigInt(6250) }],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(1)))
    expect(result.current.markets).toHaveLength(6)
    expect(result.current.markets.map((m) => m.question)).not.toContain('Resolved historical market')
  })

  it('only collateral is non-zero (no trades yet but market is funded) → real markets win', () => {
    const COLLATERAL_ONLY_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
      'Funded market with no trades',
      BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)),
      0,
      BigInt(0),
      BigInt(0),
      BigInt(100e18),  // collateral seeded
    ]

    useReadContractsMock
      .mockReturnValueOnce({
        data: [{ status: 'success', result: COLLATERAL_ONLY_TUPLE }],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: [{ status: 'success', result: BigInt(5000) }],
        isLoading: false,
      })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(1)))
    expect(result.current.markets).toHaveLength(1)
    expect(result.current.markets[0].question).toBe('Funded market with no trades')
  })

  it('count = 0 (no markets at all) → returns demo FALLBACK_MARKETS (existing behaviour)', () => {
    // With n=0, useReadContracts is disabled and returns undefined data.
    useReadContractsMock
      .mockReturnValueOnce({ data: undefined, isLoading: false })
      .mockReturnValueOnce({ data: undefined, isLoading: false })

    const { result } = renderHook(() => useAllOnChainMarkets(BigInt(0)))
    expect(result.current.markets).toHaveLength(6)
  })
})
