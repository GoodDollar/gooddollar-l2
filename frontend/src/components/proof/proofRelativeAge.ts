/**
 * Format an age in milliseconds into the proof-page family of relative-
 * time captions ("just now", "Ns ago", "Nm ago", "Nh ago"). Pure helper
 * — takes pre-computed age so callers own the "now" source (typically
 * `useProofNow()` from `ProofNowProvider`). Shared by
 * `LastDemoHedgePanel.RelativeTimestamp` and
 * `OracleUpdatesPanel`'s per-event caption — see tasks
 * lane6-last-demo-hedge-relative-timestamp-mounts-its-own-30s-setinterval-per-instance
 * (#0069) and lane6-oracle-updates-panel-formatrelative-never-ticks-stale-event-captions-and-no-shared-now
 * (#0070).
 *
 * Defensive against negative input (clock skew between server-side
 * timestamps and the page-scoped `useProofNow()` tick): clamps `ageMs`
 * to zero before bucketing.
 */
export function formatRelativeAge(ageMs: number): string {
  const a = Math.max(0, ageMs)
  if (a < 1_000) return 'just now'
  if (a < 60_000) return `${Math.floor(a / 1_000)}s ago`
  if (a < 3_600_000) return `${Math.floor(a / 60_000)}m ago`
  return `${Math.floor(a / 3_600_000)}h ago`
}
