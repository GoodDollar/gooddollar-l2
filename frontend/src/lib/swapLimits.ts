/**
 * swapLimits — per-symbol sanity caps for the SwapCard input.
 *
 * Lane 4 safety gate: the swap quote multiplies the user's input by the
 * current rate and renders the result. Without a per-symbol cap, a user
 * can type `99,999,999,999,999` ETH (≈ 800,000× the world's ETH supply)
 * and watch the UI quote them `19,950,459T G$` (~$2 quadrillion) with a
 * fully-enabled "Swap" CTA. Even in demo mode this is "pretending a
 * price is real" in a way the lane-4 spec explicitly forbids.
 *
 * The cap table here is the single source of truth. Anything above it
 * blocks the quote, dashes the output, hides the UBI breakdown, and
 * disables the swap CTA at the UI layer. The chain still has its own
 * balance check downstream — this just stops the UI from baiting the
 * user there.
 */

const DEFAULT_MAX_INPUT = 1_000_000

/**
 * Per-symbol max input for the SwapCard. Values are intentionally generous
 * — far above any realistic wallet balance, far below the
 * million-trillion-quadrillion range that produced the original report.
 */
export const PER_SYMBOL_MAX_INPUT: Record<string, number> = {
  ETH: 1_000_000,
  WETH: 1_000_000,
  WBTC: 100_000,
  USDC: 100_000_000,
  USDT: 100_000_000,
  DAI: 100_000_000,
  'G$': 1_000_000_000,
}

/** Resolve the cap for a symbol, falling back to `DEFAULT_MAX_INPUT`. */
export function getSwapInputCap(symbol: string): number {
  return PER_SYMBOL_MAX_INPUT[symbol] ?? DEFAULT_MAX_INPUT
}

/**
 * `true` when the amount is within the cap (or the amount is empty / zero
 * / not yet parseable — those are not cap violations, they're just
 * "no input yet"). `false` only when the user has typed a real number
 * that exceeds the per-symbol cap.
 */
export function isAmountWithinCap(symbol: string, amount: string | number): boolean {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (!Number.isFinite(n) || n <= 0) return true
  return n <= getSwapInputCap(symbol)
}
