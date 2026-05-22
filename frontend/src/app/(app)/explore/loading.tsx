/**
 * Route-level loading UI for /explore.
 *
 * Mirrors the real page's <table><tbody><tr> structure so Playwright and
 * assistive tech see token rows during the useSearchParams() Suspense window
 * (see e2e/explore.spec.ts "token rows are present").
 */
export default function ExploreLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-48 bg-dark-50/50 rounded-lg mb-2" />
        <div className="h-4 w-80 bg-dark-50/30 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-dark-100 rounded-2xl border border-gray-700/20" />
        ))}
      </div>
      <div className="h-10 w-72 bg-dark-50/40 rounded-xl mb-4" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-dark-50/30 rounded-lg shrink-0" />
        ))}
      </div>
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/30 text-gray-400 bg-dark-50/25">
                <th className="text-right py-3 px-3 font-semibold w-10">#</th>
                <th className="text-left py-3 px-3 font-semibold">Token</th>
                <th className="text-right py-3 px-3 font-semibold">Price</th>
                <th className="text-right py-3 px-2 font-semibold hidden lg:table-cell">1h</th>
                <th className="text-right py-3 px-3 font-semibold">24h</th>
                <th className="text-right py-3 px-2 font-semibold hidden lg:table-cell">7d</th>
                <th className="text-right py-3 px-3 font-semibold hidden sm:table-cell">Volume</th>
                <th className="text-right py-3 px-3 font-semibold hidden md:table-cell">Market Cap</th>
                <th className="py-3 px-2 font-semibold hidden lg:table-cell">7d Trend</th>
                <th className="w-16 sm:w-20" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-700/10">
                  <td className="py-3 px-3">
                    <div className="h-4 w-6 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-dark-50/40" />
                      <div className="h-4 w-20 bg-dark-50/30 rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-4 w-16 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-2 hidden lg:table-cell">
                    <div className="h-4 w-14 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-4 w-14 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-2 hidden lg:table-cell">
                    <div className="h-4 w-14 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <div className="h-4 w-16 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <div className="h-4 w-16 bg-dark-50/30 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-2 hidden lg:table-cell">
                    <div className="h-4 w-20 bg-dark-50/30 rounded" />
                  </td>
                  <td className="py-3 px-1" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
