/**
 * Block Timeline rendering helpers.
 *
 * Extracted from `activity/page.tsx` so the height/empty-state math can be
 * unit-tested in isolation. The original inline implementation had a
 * division-by-zero bug: when every block in the recent window had
 * `txCount === 0`, `Math.max(...counts)` became `0`, and `count / max`
 * produced `NaN`, which then collapsed the bar to zero height in the DOM —
 * making the entire Block Timeline card look like a blank rectangle.
 *
 * The fix is twofold:
 *  - Guard the divisor with `Math.max(1, ...)` so we always have a non-zero
 *    denominator.
 *  - Floor every bar at a small minimum (default 4px) so empty blocks remain
 *    visible as ticks.
 *
 * The caller is responsible for showing an explicit "no activity" empty-state
 * copy when `blocks.length === 0` or when no block has any transactions —
 * this helper just makes the math safe.
 */
export interface BlockTimelineInput {
  number: number
  txCount: number
  timestamp: number
}

export interface BarHeight {
  height: number
  hasTxs: boolean
}

export function computeBarHeights(
  blocks: BlockTimelineInput[],
  chartHeightPx = 64,
  minBarPx = 4,
): BarHeight[] {
  if (blocks.length === 0) return []
  const counts = blocks.map((b) => b.txCount)
  const max = Math.max(1, ...counts)
  return blocks.map((b) => ({
    height: Math.max(minBarPx, (b.txCount / max) * chartHeightPx),
    hasTxs: b.txCount > 0,
  }))
}
