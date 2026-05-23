/**
 * truncateQuery — display-side cap for echoed search input.
 *
 * The /stocks search field accepts up to `MAX_SEARCH_LEN` characters (128
 * today), and the empty-state copy `"No matches for "{q}"."` interpolates
 * the raw query. A 128-character `Z`-run renders as ~600px of unbroken
 * text and visually dominates the cell. This helper truncates anything
 * over `max` to `q.slice(0, max) + '…'` so the empty-state acknowledges
 * the query without letting it blow up the layout.
 *
 * The helper is purely visual; the full query stays in the input field
 * at the top of the page.
 */
export function truncateQuery(q: string, max = 24): string {
  if (typeof q !== 'string') return ''
  if (q.length <= max) return q
  return q.slice(0, max) + '…'
}
