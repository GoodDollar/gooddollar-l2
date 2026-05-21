/**
 * Pure-function model of the Limit Price input's validation states.
 *
 * Extracted from `OrderForm` in `app/(app)/stocks/[ticker]/page.tsx` so it
 * can be unit-tested without mounting React, and so the three derived
 * booleans (missing / invalid / hasValidPrice) cannot drift apart over
 * time. See task 0031.
 *
 * Distinctions:
 * - `limitPriceMissing` — user is in limit mode, has typed an amount, but
 *   has not yet typed any limit price. This is a "needs input" state, not
 *   an "invalid input" state. Surface a soft gray hint, not a red error.
 * - `limitPriceInvalid` — user typed something into the limit price field
 *   that parses to ≤ 0 or NaN. Surface a red error.
 * - `hasValidPrice` — the submission gate. True for market orders or for
 *   limit orders with a strictly positive parsed price.
 *
 * Invariants:
 * - `limitPriceMissing` and `limitPriceInvalid` are mutually exclusive by
 *   construction (missing requires `limitPrice === ''`, invalid requires
 *   `limitPrice !== ''`).
 * - In market mode all three booleans are deterministic and ignore the
 *   limit price input entirely.
 */

export interface LimitPriceFieldState {
  /** True when limit mode is selected, user typed an amount, and limit price is empty. */
  limitPriceMissing: boolean
  /** True when limit mode is selected and the typed limit price parses to ≤ 0 or NaN. */
  limitPriceInvalid: boolean
  /** Submission gate. True for market orders or limit orders with a strictly positive price. */
  hasValidPrice: boolean
}

export interface LimitPriceFieldInput {
  orderType: 'market' | 'limit'
  limitPrice: string
  amount: string
}

export function computeLimitPriceFieldState(
  input: LimitPriceFieldInput,
): LimitPriceFieldState {
  if (input.orderType === 'market') {
    return {
      limitPriceMissing: false,
      limitPriceInvalid: false,
      hasValidPrice: true,
    }
  }

  const parsed = parseFloat(input.limitPrice)
  const isEmpty = input.limitPrice === ''
  const hasAmount = input.amount !== ''

  const limitPriceMissing = isEmpty && hasAmount
  const limitPriceInvalid = !isEmpty && (Number.isNaN(parsed) || parsed <= 0)
  const hasValidPrice = parsed > 0

  return { limitPriceMissing, limitPriceInvalid, hasValidPrice }
}
