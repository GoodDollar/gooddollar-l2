import { describe, it, expect } from 'vitest'
import { computeSwapDeadline, MIN_SWAP_DEADLINE_SECS, MAX_SWAP_DEADLINE_SECS } from '../useOnChainSwap'

const NOW_SECS = 1_700_000_000

describe('computeSwapDeadline', () => {
  it('uses the user-configured deadline (in minutes) by default', () => {
    expect(computeSwapDeadline(15, NOW_SECS)).toBe(BigInt(NOW_SECS + 15 * 60))
    expect(computeSwapDeadline(30, NOW_SECS)).toBe(BigInt(NOW_SECS + 30 * 60))
    expect(computeSwapDeadline(60, NOW_SECS)).toBe(BigInt(NOW_SECS + 60 * 60))
  })

  it('clamps deadlines below 1 minute up to the safe minimum (60s)', () => {
    expect(computeSwapDeadline(0, NOW_SECS)).toBe(BigInt(NOW_SECS + MIN_SWAP_DEADLINE_SECS))
    expect(computeSwapDeadline(-5, NOW_SECS)).toBe(BigInt(NOW_SECS + MIN_SWAP_DEADLINE_SECS))
  })

  it('clamps absurdly long deadlines down to the safe maximum (3 hours)', () => {
    expect(computeSwapDeadline(60 * 24, NOW_SECS)).toBe(BigInt(NOW_SECS + MAX_SWAP_DEADLINE_SECS))
    expect(computeSwapDeadline(99999, NOW_SECS)).toBe(BigInt(NOW_SECS + MAX_SWAP_DEADLINE_SECS))
  })

  it('treats NaN/undefined as a sensible 30-minute fallback', () => {
    expect(computeSwapDeadline(NaN, NOW_SECS)).toBe(BigInt(NOW_SECS + 30 * 60))
    expect(computeSwapDeadline(undefined as unknown as number, NOW_SECS)).toBe(BigInt(NOW_SECS + 30 * 60))
  })

  it('uses Date.now() when no nowSecs is provided', () => {
    const before = Math.floor(Date.now() / 1000)
    const deadline = Number(computeSwapDeadline(10))
    const after = Math.floor(Date.now() / 1000)
    expect(deadline).toBeGreaterThanOrEqual(before + 10 * 60)
    expect(deadline).toBeLessThanOrEqual(after + 10 * 60 + 1)
  })

  it('exposes safe min/max bounds matching MEV best-practice', () => {
    expect(MIN_SWAP_DEADLINE_SECS).toBe(60)
    expect(MAX_SWAP_DEADLINE_SECS).toBe(3 * 60 * 60)
  })
})
