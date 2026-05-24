/**
 * Lane 5 — per-receipt time formatters for the receipts table.
 *
 * The TIME column used to render only the relative form (`51s ago`,
 * `3m ago`) with the ISO timestamp on a hover-only `title`. eToro's
 * order-history audit trail (and every comparable trading UI) shows
 * BOTH the relative form AND the absolute clock time inline so an
 * operator can cross-reference any receipt to engine logs / charts
 * without hovering each row (task 0054).
 *
 * Three pure helpers, each defensive against missing or non-finite
 * timestamps:
 *
 *   - `formatRelativeTime(ms)`: `"51s ago"` / `"12m ago"` / `"5h ago"`
 *     / `"3d ago"`. Returns `'—'` for falsy / non-finite input,
 *     matching the legacy `timeAgo` contract that ReceiptRow has
 *     leaned on since task 0040.
 *   - `formatClockTimeUtc(ms)`: `"HH:MM:SS UTC"` for finite positive
 *     ms, `''` for missing / invalid (so the secondary line in the
 *     two-line cell collapses cleanly without leaving an
 *     `00:00:00 UTC` placeholder).
 *   - `formatIsoTitle(ms)`: full ISO with date + ms for the cell's
 *     `title` attribute, or `undefined` so React omits the attribute
 *     entirely when no timestamp is available.
 *
 * Deterministic UTC formatting via `new Date(ms).toISOString().slice(11, 19)`
 * — no `Intl.DateTimeFormat` locale ambiguity, no timezone surprises,
 * zero dependencies.
 */

export function formatRelativeTime(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms)) return '—'
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function formatClockTimeUtc(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return ''
  return `${new Date(ms).toISOString().slice(11, 19)} UTC`
}

export function formatIsoTitle(ms: number | undefined): string | undefined {
  if (!ms || !Number.isFinite(ms)) return undefined
  return new Date(ms).toISOString()
}
