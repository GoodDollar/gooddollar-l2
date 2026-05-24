/**
 * Pure formatter for the per-panel "next poll in Ns" caption rendered
 * by `NextPollCountdown` in `PanelHeaderControls.tsx`. Pulled out of
 * the component so unit tests can pin the wording without mocking
 * timers, and so Fast Refresh stays clean (a component file may only
 * export components).
 *
 * See task lane6-degraded-panels-offer-no-retry-or-open-url-or-next-poll-
 * countdown (0060).
 */

export interface DescribeNextPollInputs {
  /** Wallclock ms when the most recent poll settled, or null if no poll has settled yet. */
  lastPollAt: number | null
  /** Polling cadence in ms — used to compute the countdown ceiling. */
  intervalMs: number
  /** Wallclock ms used as "now" for the calculation. Pass `Date.now()` from the renderer. */
  now: number
  /** True iff a manual retry is in flight; overrides the countdown with a "polling…" caption. */
  busy: boolean
}

export function describeNextPoll({
  lastPollAt,
  intervalMs,
  now,
  busy,
}: DescribeNextPollInputs): string {
  if (busy) return 'polling…'
  if (lastPollAt === null) return 'next poll soon'
  const elapsed = Math.max(0, now - lastPollAt)
  const remainingMs = Math.max(0, intervalMs - elapsed)
  if (remainingMs <= 0) return 'polling…'
  const seconds = Math.max(1, Math.ceil(remainingMs / 1_000))
  return `next poll in ${seconds}s`
}
