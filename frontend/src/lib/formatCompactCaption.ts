/**
 * Compact number formatters for `AmountInput` auxiliary captions.
 *
 * `Intl.NumberFormat` (via `Number.prototype.toLocaleString`) silently
 * falls back to scientific notation when the integer part exceeds ~21
 * digits, and renders unreasonably wide grouped strings well before
 * that. The `AmountInput` caption row was designed for short labels
 * like `balance: 1,234.56 USDC`, not for `9.9999999999999e+21`. When a
 * user lands on a low-priced pair on `/perps` (SHIB-class assets) the
 * leverage-adjusted maximum position size easily exceeds
 * `Number.MAX_SAFE_INTEGER`, producing scientific notation that wraps,
 * overflows its container, and breaks the visual hierarchy of the
 * order summary panel.
 *
 * These helpers mirror the K/M/B/T/Q suffix vocabulary already used by
 * `formatPerpsPrice()` and `formatLargeValue()` in `perpsData.ts` so
 * the visual language stays consistent across the trading UI. They
 * differ in two ways:
 *
 *   1. `formatCompactCaption` is unit-less because the caption row
 *      already supplies its own `{symbol}` suffix.
 *   2. Non-finite inputs (`Infinity`, `NaN`) render as an em-dash
 *      placeholder instead of emitting the literal string `"Infinity"`
 *      or `"NaN"`.
 */

const TIERS: readonly [number, string][] = [
  [1e15, 'Q'],
  [1e12, 'T'],
  [1e9, 'B'],
] as const

function pickDecimals(v: number): number {
  return v >= 100 ? 0 : v >= 10 ? 1 : 2
}

/**
 * Unit-less compact caption. Below 1e9 the value renders with the same
 * en-US locale grouping the caption row previously used, so normal
 * balances are visually unchanged. From 1e9 upward the value collapses
 * to a K/M/B/T/Q suffix to prevent scientific-notation overflow.
 *
 * @param n               number to format
 * @param fractionDigits  maximum decimals to use for sub-1e9 values
 *                        (default 4, matching the prior `maxValueLabel`
 *                        formatter in `AmountInput`)
 */
export function formatCompactCaption(
  n: number,
  fractionDigits = 4,
): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  for (const [threshold, suffix] of TIERS) {
    if (abs >= threshold) {
      const v = abs / threshold
      return `${sign}${v.toFixed(pickDecimals(v))}${suffix}`
    }
  }
  return n.toLocaleString('en-US', {
    minimumFractionDigits: Math.min(2, fractionDigits),
    maximumFractionDigits: fractionDigits,
  })
}

/**
 * Dollar-prefixed compact caption. Used by the "≈ $..." label in
 * `AmountInput`. Sub-1e9 values keep the prior two-decimal en-US
 * format; 1e9+ collapses to a K/M/B/T/Q suffix to prevent overflow.
 */
export function formatCompactUsdCaption(n: number): string {
  if (!Number.isFinite(n)) return '$—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  for (const [threshold, suffix] of TIERS) {
    if (abs >= threshold) {
      const v = abs / threshold
      return `${sign}$${v.toFixed(pickDecimals(v))}${suffix}`
    }
  }
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
