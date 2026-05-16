/**
 * String utility helpers shared across the frontend.
 *
 * Kept tiny on purpose — anything that grows non-trivial logic should move
 * into a dedicated module rather than accumulating here.
 */

/**
 * Truncate `value` to at most `max` visible characters by keeping the head
 * and tail and inserting a single ellipsis (`…`) in the middle. Useful for
 * user-controlled identifiers (URL segments, tickers, addresses) that must
 * fit inside a bounded layout.
 *
 * - Empty / nullish input is returned as-is.
 * - Values already within `max` chars are returned unchanged.
 * - The resulting string never exceeds `max` chars (ellipsis counted).
 *
 * Example: `truncateMiddle('AAAA…AAAA', 24)` keeps roughly 12 leading and 11
 * trailing characters with `…` between them.
 */
export function truncateMiddle(value: string, max = 24): string {
  if (!value || value.length <= max) return value
  if (max <= 1) return '…'
  const head = Math.ceil((max - 1) / 2)
  const tail = Math.floor((max - 1) / 2)
  // Guard: `slice(-0)` returns the entire string (because -0 === 0), so we
  // must short-circuit when `tail` is zero.
  const tailStr = tail > 0 ? value.slice(-tail) : ''
  return `${value.slice(0, head)}…${tailStr}`
}
