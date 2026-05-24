/**
 * Parse the hedge engine's runId composite (filesystem-safe form
 * `YYYY-MM-DDTHH-MM-SS-mmm-<6-12 hex>`) into a human-readable ISO timestamp
 * plus the short hex disambiguator. Returns `null` for any input that does
 * not match the canonical pattern so renderers can fall back to the raw
 * string for older or hand-crafted run ids.
 *
 * Lives outside `LastDemoHedgePanel.tsx` so the panel file only exports
 * React components (Fast Refresh requirement) and so the pure parser is
 * unit-testable without involving the rendering layer.
 */

const RUNID_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})-([0-9a-f]{6,12})$/i

export interface ParsedRunId {
  iso: string
  tag: string
}

export function parseRunId(raw: string): ParsedRunId | null {
  const m = RUNID_PATTERN.exec(raw)
  if (!m) return null
  const [, date, hh, mm, ss, ms, tag] = m
  return { iso: `${date}T${hh}:${mm}:${ss}.${ms}Z`, tag }
}
