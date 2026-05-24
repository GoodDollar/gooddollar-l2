/**
 * perpLimits — per-symbol absurdity caps for the Perps order form.
 *
 * Sister module to `swapLimits.ts` (task 0010). Without a per-symbol cap on
 * the Size input, the Perps order form happily multiplies a 14-digit size by
 * the current mark price and renders a `$8425Q` notional / `$2.78Q` UBI
 * quote alongside a green "Connect Wallet to Trade" CTA — exactly the
 * "pretending a price is real" pattern lane 4 explicitly forbids.
 *
 * Cap units here are **base-asset units** (e.g. BTC, ETH, SOL), not USD.
 * The whole point of the gate is to be independent of the mark price: the
 * pathology is mark × size = 1e18 USD notional, and a USD-denominated cap
 * would have to chase the mark to stay useful. A flat per-symbol cap on the
 * size sits far above any realistic position and far below the
 * trillion/quadrillion range that produced the original report.
 */

/** Fallback cap for unknown symbols (very generous — only the absurdly huge
 * inputs trip this). */
const DEFAULT_MAX_PERP_SIZE = 1_000

/**
 * Per-symbol max size for the Perps order form. Values are intentionally
 * generous — far above any realistic margin-aware order, far below the
 * 1e14 BTC range that produced the trillion-dollar fantasy notional report.
 */
export const PER_SYMBOL_MAX_PERP_SIZE: Record<string, number> = {
  BTC: 1_000,
  ETH: 50_000,
  SOL: 5_000_000,
  BNB: 1_000_000,
  ARB: 50_000_000,
}

/** Resolve the cap for a symbol, falling back to `DEFAULT_MAX_PERP_SIZE`. */
export function getPerpSizeCap(symbol: string): number {
  return PER_SYMBOL_MAX_PERP_SIZE[symbol] ?? DEFAULT_MAX_PERP_SIZE
}

/**
 * `true` when the size is within the per-symbol cap (or the size is empty
 * / zero / not yet parseable — those are not cap violations, they're just
 * "no input yet"). `false` only when the user has typed a real positive
 * number that exceeds the per-symbol cap.
 */
export function isPerpSizeWithinCap(symbol: string, size: string | number): boolean {
  const n = typeof size === 'string' ? parseFloat(size) : size
  if (!Number.isFinite(n) || n <= 0) return true
  return n <= getPerpSizeCap(symbol)
}
