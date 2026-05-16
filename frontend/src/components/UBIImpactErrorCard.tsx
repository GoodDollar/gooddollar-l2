'use client'

/**
 * UBIImpactErrorCard
 *
 * Actionable failure state for the /ubi-impact dashboard.
 *
 * Replaces the legacy behaviour where stuck JSON-RPC batched reads would
 * leave the page in an indefinite skeleton state with no recourse. The page
 * now hard-caps loading at 10s; on timeout (or hard read failure) it mounts
 * this card so the user always has a Retry path.
 *
 * Three variants:
 *   - "default" — full hero card, used when the entire page failed to load.
 *   - "timeout" — softer copy that hints the request is slow (not broken).
 *   - "compact" — inline failure card used per-section (e.g. snapshots only).
 */

interface UBIImpactErrorCardProps {
  onRetry: () => void
  message?: string
  variant?: 'default' | 'timeout' | 'compact'
}

export function UBIImpactErrorCard({
  onRetry,
  message,
  variant = 'default',
}: UBIImpactErrorCardProps) {
  const isCompact = variant === 'compact'
  const isTimeout = variant === 'timeout'

  const defaultMessage = isTimeout
    ? 'Loading is taking longer than expected. The network or RPC may be congested.'
    : 'There was a problem reading on-chain data — the network or RPC may be temporarily unavailable.'

  const body = message ?? defaultMessage

  return (
    <div
      role="alert"
      className={
        isCompact
          ? 'flex flex-col items-start gap-3 rounded-xl border border-gray-700/20 bg-dark-100 p-4 sm:flex-row sm:items-center sm:justify-between'
          : 'flex flex-col items-center justify-center rounded-2xl border border-gray-700/20 bg-dark-100 px-6 py-12 text-center'
      }
    >
      {!isCompact && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-700/20 bg-dark-50/50">
          <svg
            className="h-6 w-6 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}

      {!isCompact && (
        <h2 className="mb-2 text-lg font-semibold text-white">
          Unable to load UBI Impact data
        </h2>
      )}

      <p
        className={
          isCompact
            ? 'text-sm text-gray-300'
            : 'mb-6 max-w-md text-sm text-gray-400'
        }
      >
        {body}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className={
          isCompact
            ? 'rounded-lg bg-goodgreen px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-goodgreen-600 active:scale-[0.98]'
            : 'rounded-xl bg-goodgreen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-goodgreen-600 active:scale-[0.98]'
        }
      >
        Retry
      </button>
    </div>
  )
}
