/**
 * NewsEventsPanel — honest empty state. The previous implementation
 * rendered three hardcoded "headlines" per ticker from a static map,
 * every URL pointing to a placeholder host and every byline invented.
 * That made the panel read like a live news feed next to a
 * synthetic-stock price, which is the exact trust failure this lane is
 * meant to prevent.
 *
 * Until a real news provider is wired up, the panel renders an empty
 * state that explicitly tells the user no news has been published yet
 * and nothing is fabricated. The component intentionally has no
 * `items` prop — there is no data shape to plumb until a real source
 * exists.
 */

export function NewsEventsPanel({
  ticker: _ticker,
  isLoading,
  error,
}: {
  ticker: string
  isLoading: boolean
  error: string | null
}) {
  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
      <h2 className="text-sm font-semibold text-white mb-3">News &amp; Events</h2>

      {isLoading ? (
        <div className="space-y-2" aria-label="News loading">
          <div className="h-14 rounded-xl bg-dark-50/50 animate-pulse" />
          <div className="h-14 rounded-xl bg-dark-50/50 animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 px-3 py-3">
          <p className="text-xs font-medium text-gray-200">News feed coming soon</p>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            No news provider is wired up yet — none of this is fabricated.
            Headlines will appear here once a real-time news feed is connected.
          </p>
        </div>
      )}
    </div>
  )
}
