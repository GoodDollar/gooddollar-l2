import { describe, it, expect } from 'vitest'
import { formatUnits, parseUnits } from 'viem'
import { toG$Wei } from '../gDollarAmount'

/**
 * The 4 perps + stocks call sites used to do:
 *
 *   BigInt(Math.round(x * 1e18))
 *
 * which silently corrupts every realistic on-chain value because
 * `x * 1e18` exceeds Number.MAX_SAFE_INTEGER (≈ 9e15) for any x ≥ 0.01.
 * These tests pin the corrected behavior — the new helper round-trips
 * through viem's `parseUnits` via toFixed(18), which preserves every
 * digit of the input float and avoids the float-multiplication drift
 * that the buggy formula introduces.
 *
 * Two distinct cases:
 *   (a) Inputs that ARE exactly representable as IEEE-754 floats
 *       (integers, multiples of 0.01 up to ~2^53 wei, etc.):
 *       toG$Wei(x) is byte-identical to parseUnits(String(x), 18).
 *   (b) Inputs that are NOT exactly representable (e.g. 0.789 in
 *       binary): toG$Wei(x) preserves the actual float value the
 *       caller passed in. It cannot recover the "intended" decimal —
 *       that information was lost the moment the number was parsed.
 *       But it is still strictly better than the buggy formula, which
 *       adds its own float-multiplication drift on top.
 */
describe('toG$Wei', () => {
  describe('drift table — corrects the BigInt(Math.round(x * 1e18)) bug', () => {
    // Each row pins the corrected wei value, and the comment records
    // what the buggy formula returned (captured via `node -e`).
    // This is both a regression guard and a historical record.

    it('400_000 G$ — was 399999999999999966445568n (-33,554,432 wei drift)', () => {
      expect(toG$Wei(400_000)).toBe(400_000_000_000_000_000_000_000n)
    })

    it('1_000_000 G$ — was 999999999999999983222784n (-16,777,216 wei drift)', () => {
      expect(toG$Wei(1_000_000)).toBe(1_000_000_000_000_000_000_000_000n)
    })

    it('5 G$ (devnet perps margin) — preserves exact 5e18 value', () => {
      expect(toG$Wei(5)).toBe(5_000_000_000_000_000_000n)
    })

    it('10 G$ (devnet vault deposit) — preserves exact 10e18 value', () => {
      expect(toG$Wei(10)).toBe(10_000_000_000_000_000_000n)
    })
  })

  describe('matches parseUnits exactly for floats that are precisely representable', () => {
    // For these inputs, `toFixed(18)` produces the same canonical
    // decimal that parseUnits would parse, so the result is bit-exact.
    it.each([0, 1, 10, 100, 1_000, 10_000, 100_000, 1_000_000])(
      'toG$Wei(%i) === parseUnits(String(%i), 18)',
      (x) => {
        expect(toG$Wei(x)).toBe(parseUnits(String(x), 18))
      },
    )

    it('toG$Wei(0.5) === parseUnits("0.5", 18)', () => {
      expect(toG$Wei(0.5)).toBe(parseUnits('0.5', 18))
    })
  })

  describe('preserves the input float bit-for-bit (round-trip invariant)', () => {
    // The defensible invariant for ANY input — representable or not —
    // is that wei → G$ → wei must round-trip exactly, and G$ → wei → G$
    // must return the same float. The buggy `Math.round(x * 1e18)`
    // breaks this because float multiplication by 1e18 quantizes to
    // ULPs much larger than 1 wei. The new helper preserves whatever
    // float bits the caller passed in, which is the most faithful
    // conversion possible.
    it.each([0, 1, 5, 10, 100, 0.5, 1.25, 123456.789, 56491.265, 9876.54321])(
      'toG$Wei(%f) round-trips through formatUnits',
      (x) => {
        const wei = toG$Wei(x)
        // Number(formatUnits(wei, 18)) must equal the original float.
        // This holds because toFixed(18) → parseUnits is an exact
        // base-10 round-trip of the float's decimal representation.
        expect(Number(formatUnits(wei, 18))).toBe(x)
      },
    )

    it('the buggy formula does NOT round-trip for large inputs (regression guard)', () => {
      // Pin the actual brokenness for 400_000 G$ so anyone tempted to
      // re-introduce the buggy pattern sees this test fail.
      const buggy = BigInt(Math.round(400_000 * 1e18))
      expect(buggy).toBe(399_999_999_999_999_966_445_568n)
      expect(Number(formatUnits(buggy, 18))).not.toBe(400_000)
      // Versus the new helper:
      expect(Number(formatUnits(toG$Wei(400_000), 18))).toBe(400_000)
    })
  })

  describe('edge values', () => {
    it('toG$Wei(0) === 0n', () => {
      expect(toG$Wei(0)).toBe(0n)
    })

    it('toG$Wei(1e-18) === 1n (smallest representable wei)', () => {
      expect(toG$Wei(1e-18)).toBe(1n)
    })

    it('toG$Wei(1e-19) === 0n (sub-wei input truncated by toFixed(18))', () => {
      // Documented behavior: anything finer-grained than 1 wei is
      // truncated. This matches every other parseUnits-based helper
      // in the codebase.
      expect(toG$Wei(1e-19)).toBe(0n)
    })
  })

  describe('rejects non-finite and negative inputs', () => {
    it('throws on NaN', () => {
      expect(() => toG$Wei(Number.NaN)).toThrow(/non-finite/)
    })

    it('throws on Infinity', () => {
      expect(() => toG$Wei(Number.POSITIVE_INFINITY)).toThrow(/non-finite/)
    })

    it('throws on -Infinity', () => {
      expect(() => toG$Wei(Number.NEGATIVE_INFINITY)).toThrow(/non-finite/)
    })

    it('throws on a negative amount', () => {
      expect(() => toG$Wei(-1)).toThrow(/negative/)
      expect(() => toG$Wei(-0.0000001)).toThrow(/negative/)
    })
  })
})
