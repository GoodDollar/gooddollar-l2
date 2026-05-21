'use client'

export function OracleUnavailableBanner({
  error,
  consecutiveFailures,
  onRetry,
}: {
  error: string | null
  consecutiveFailures?: number
  onRetry: () => void
}) {
  if (!error) return null

  return (
    <div
      data-testid="oracle-unavailable-banner"
      className="mt-4 flex flex-col gap-2 rounded-2xl border border-amber-600/30 bg-amber-950/30 p-4"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-amber-400" aria-hidden="true">⚠</span>
        <span className="text-sm font-semibold text-amber-300">Oracle Unavailable</span>
      </div>
      <p className="text-xs text-amber-200/80">{error}</p>
      {typeof consecutiveFailures === 'number' && consecutiveFailures > 1 && (
        <p className="text-[11px] text-amber-400/70">
          {consecutiveFailures} consecutive failures
        </p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 self-start rounded-lg bg-amber-700/40 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-700/60"
      >
        Retry now
      </button>
    </div>
  )
}
