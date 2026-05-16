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
  useOnChainMarket,
  useAllOnChainMarkets,
} from '@/lib/useMarkets'

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

const FAKE_MARKET_TUPLE: [string, bigint, number, bigint, bigint, bigint] = [
  'Will BTC hit 100K?',
  BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)),
  0,
  BigInt(0),
  BigInt(0),
  BigInt(0),
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
