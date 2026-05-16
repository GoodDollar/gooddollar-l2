import { parseUnits } from 'viem'

/**
 * Convert a G$ amount expressed as a JS number into 18-decimal wei.
 *
 * The naive pattern `BigInt(Math.round(amount * 1e18))` silently
 * corrupts every realistic on-chain value because `amount * 1e18`
 * exceeds Number.MAX_SAFE_INTEGER (≈ 9e15) for any amount ≥ 0.01.
 * For example, `Math.round(400_000 * 1e18)` produces
 * `399999999999999966445568n` — drift of -33,554,432 wei.
 *
 * This helper routes through viem's `parseUnits`, which is exact for
 * any value representable in 18 fractional digits. It matches the
 * conversion path every other call site in the frontend already uses
 * (see `useOnChainSwap`, `lend/page.tsx`, etc.).
 *
 * Behavior:
 * - Lossless for any input with ≤ 18 fractional digits.
 * - Sub-wei input (< 1e-18 G$) rounds down to 0 wei (same as parseUnits).
 * - Throws on NaN / ±Infinity / negative input — the four call sites
 *   that consume this helper (perps + stocks margin / size / collateral
 *   / shares) have no meaningful interpretation for those values.
 */
export function toG$Wei(amountG$: number): bigint {
  if (!Number.isFinite(amountG$)) {
    throw new Error(`toG$Wei: non-finite input ${String(amountG$)}`)
  }
  if (amountG$ < 0) {
    throw new Error(`toG$Wei: negative amount ${amountG$}`)
  }
  // toFixed(18) preserves every wei-precise digit the IEEE-754 number
  // can encode, and parseUnits then treats it as an exact base-10 string.
  // No float multiplication ever touches the resulting BigInt.
  return parseUnits(amountG$.toFixed(18), 18)
}
