'use client'

import Link from 'next/link'

interface WatchlistErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function WatchlistError({ reset }: WatchlistErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L3.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z"
          />
        </svg>
      </div>

      <h1 className="mb-3 text-3xl font-bold text-white">Watchlist Unavailable</h1>
      <p className="mb-8 max-w-xs text-sm text-gray-400">
        Something went wrong loading your watchlist. Your saved stocks are safe — try refreshing.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-goodgreen px-6 py-3 font-semibold text-black transition-colors hover:bg-goodgreen-600 active:scale-[0.98]"
        >
          Try Again
        </button>
        <Link
          href="/stocks"
          className="rounded-xl border border-gray-700/30 bg-dark-50 px-6 py-3 font-semibold text-white transition-colors hover:border-gray-600"
        >
          Browse Stocks
        </Link>
      </div>
    </div>
  )
}
