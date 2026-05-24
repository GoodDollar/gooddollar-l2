/**
 * AnalystOutlookCard — honest empty state. The previous implementation
 * rendered a hand-written consensus / target / rating-distribution
 * mock labelled as an aggregated street consensus directly above a
 * synthetic stock price, with no demo badge — read as a live analyst
 * feed. There is no real consensus source wired up today, so the card
 * renders an empty state until a real feed exists, mirroring the same
 * pattern task 0034 applied to the News & Events panel.
 *
 * The component is prop-only-on-loading: the parent flips
 * `isLoading={true}` while it would have fetched, and the card returns
 * to the empty state once `isLoading` settles. There is no `outlook`
 * data prop because there is no data path until a real feed lands.
 */

export function AnalystOutlookCard({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h2 className="text-sm font-semibold text-white">Analyst Outlook</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2.5" aria-label="Analyst outlook loading">
          <div className="h-3 w-28 rounded bg-dark-50/60 animate-pulse" />
          <div className="h-7 w-36 rounded bg-dark-50/60 animate-pulse" />
          <div className="h-3 w-44 rounded bg-dark-50/60 animate-pulse" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 px-3 py-3">
          <p className="text-xs font-medium text-gray-200">Analyst consensus is not available yet</p>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            No analyst-consensus feed is wired up yet — none of this is fabricated.
            Targets, ratings, and revision trends will appear here once a real
            provider is connected.
          </p>
        </div>
      )}
    </div>
  )
}
