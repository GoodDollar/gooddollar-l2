'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Shared "Retry now" button used in every proof data panel header. Pulled
 * out of the four panels into one place so the busy chrome (spinner,
 * disabled state, focus ring) stays identical across the family. Keep
 * this dependency-free and ARIA-correct — both the panel button and
 * the page-level "Refresh all" button consume the same chip CSS.
 *
 * See task lane6-degraded-panels-offer-no-retry-or-open-url-or-next-poll-
 * countdown (0060).
 */

const RETRY_BUTTON_BASE_CLASS =
  'inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-progress'

interface RetryButtonProps {
  onRetry: () => Promise<void> | void
  busy: boolean
  testId: string
  /** Visible text. Default: `Retry now`. */
  label?: string
  /** Override aria-label (e.g. for screen-reader specificity). */
  ariaLabel?: string
}

export function RetryButton({
  onRetry,
  busy,
  testId,
  label = 'Retry now',
  ariaLabel,
}: RetryButtonProps) {
  const handleClick = () => {
    if (busy) return
    void onRetry()
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      data-testid={testId}
      aria-label={ariaLabel ?? (busy ? `${label} — in flight` : label)}
      className={RETRY_BUTTON_BASE_CLASS}
    >
      <RetryIcon spinning={busy} />
      <span>{busy ? 'Retrying…' : label}</span>
    </button>
  )
}

function RetryIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width={11}
      height={11}
      className={`text-gray-300 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6" />
      <path d="M13 3v3h-3" />
      <path d="M13 8a5 5 0 0 1-8.5 3.5L3 10" />
      <path d="M3 13v-3h3" />
    </svg>
  )
}

interface NextPollCountdownProps {
  /** Wallclock ms when the most recent poll settled, or null if no poll has settled yet. */
  lastPollAt: number | null
  /** Polling cadence in ms — used to compute the countdown ceiling. */
  intervalMs: number
  testId?: string
  busy?: boolean
}

/**
 * Live "next poll in Ns" caption that ticks down every second. Replaces
 * the previous static "refreshes every Ns" string so a reviewer can
 * see at a glance when the panel will refresh next, and so the retry
 * countdown immediately resets after a manual click.
 *
 * Keeps the per-panel timer behaviour the existing
 * {@link RelativeTimestamp} already uses — no shared "now" hook, no
 * cascading state — because the proof page only mounts at most four
 * countdown captions at once.
 */
export function NextPollCountdown({
  lastPollAt,
  intervalMs,
  testId,
  busy = false,
}: NextPollCountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])

  const text = useMemo(
    () => describeNextPoll({ lastPollAt, intervalMs, now, busy }),
    [lastPollAt, intervalMs, now, busy],
  )

  return (
    <span data-testid={testId} title="next scheduled poll">
      {text}
    </span>
  )
}

interface DescribeNextPollInputs {
  lastPollAt: number | null
  intervalMs: number
  now: number
  busy: boolean
}

/**
 * Pure formatter for the countdown caption. Lifted out of
 * {@link NextPollCountdown} so unit tests can pin the wording without
 * mocking timers.
 */
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
