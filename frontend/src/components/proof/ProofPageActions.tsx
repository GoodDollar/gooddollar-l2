'use client'

import { useProofPanelActionsContext } from './ProofPanelActionsProvider'

const ACTION_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-gray-200 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-progress'

/**
 * Page-level action rail rendered above the pipeline status banner.
 * Holds the cross-panel `Refresh all panels` button. Lives behind the
 * `ProofPanelActionsProvider` so the button's disabled state reflects
 * the same in-flight set the per-panel "Retry now" buttons read from.
 *
 * Designed as the home for follow-up actions (e.g. task 0061's
 * `Copy verification snapshot` button) so the rail stays a single
 * concept on the page rather than a scatter of standalone buttons.
 *
 * See task lane6-degraded-panels-offer-no-retry-or-open-url-or-next-poll-
 * countdown (0060).
 */
export function ProofPageActions() {
  const { refreshAll, anyRetrying } = useProofPanelActionsContext()
  return (
    <div
      data-testid="proof-page-actions"
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        onClick={() => void refreshAll()}
        disabled={anyRetrying}
        data-testid="refresh-all-panels"
        aria-label={
          anyRetrying
            ? 'Refresh all panels — retry in flight'
            : 'Refresh all panels — re-runs every panel fetch in parallel'
        }
        className={ACTION_BUTTON_CLASS}
      >
        <RefreshIcon spinning={anyRetrying} />
        <span>{anyRetrying ? 'Refreshing…' : 'Refresh all panels'}</span>
      </button>
    </div>
  )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width={12}
      height={12}
      className={spinning ? 'animate-spin' : ''}
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
