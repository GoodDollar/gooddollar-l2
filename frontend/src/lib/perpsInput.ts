/**
 * Defensive input bounding helpers for the /perps order form.
 *
 * The Size <AmountInput> on /perps had no upper bound on either typed
 * string length or numeric magnitude. Pasting a 21-digit value caused
 * (a) the digits to visually overlap the unit-symbol label inside the
 * input and (b) the Notional / Margin / Fee / → UBI summary rows to
 * render as compact-notation `$104.97Q` (quintillion), which reads as
 * a broken number rather than "this trade is impossibly large".
 *
 * `boundPerpsSize` is the pure normalizer used by the Size input's
 * onChange handler. `MAX_PERPS_SIZE_INT_DIGITS` and
 * `MAX_PERPS_SIZE_DEC_DIGITS` are deliberately exposed so the
 * acceptance criteria in task 0055 can be unit-tested directly without
 * mounting the full /perps page.
 *
 * Filed under Phase 1 Security Hardening as a defensive input fix
 * (task 0055).
 */

export const MAX_PERPS_SIZE_INT_DIGITS = 18
export const MAX_PERPS_SIZE_DEC_DIGITS = 8

/**
 * Normalize a raw Size input string to:
 *   - only digits and a single decimal point,
 *   - integer part capped at MAX_PERPS_SIZE_INT_DIGITS,
 *   - decimal part capped at MAX_PERPS_SIZE_DEC_DIGITS.
 *
 * Examples:
 *   boundPerpsSize('1,000abc')      → '1000'
 *   boundPerpsSize('1.2.3')         → '1.23'
 *   boundPerpsSize('9'.repeat(50))  → '9'.repeat(18)
 *   boundPerpsSize('0.123456789012')→ '0.12345678'
 *   boundPerpsSize('')              → ''
 *   boundPerpsSize('.')             → '.'
 */
export function boundPerpsSize(next: string): string {
  const cleaned = next.replace(/[^0-9.]/g, '')
  const dot = cleaned.indexOf('.')
  if (dot === -1) {
    return cleaned.slice(0, MAX_PERPS_SIZE_INT_DIGITS)
  }
  const intPart = cleaned.slice(0, dot)
  // Everything after the FIRST dot, with any subsequent dots stripped so
  // accidental `1.2.3` collapses to `1.23` rather than throwing.
  const tail = cleaned.slice(dot + 1).replace(/\./g, '')
  const boundedInt = intPart.slice(0, MAX_PERPS_SIZE_INT_DIGITS)
  const boundedDec = tail.slice(0, MAX_PERPS_SIZE_DEC_DIGITS)
  return `${boundedInt}.${boundedDec}`
}
