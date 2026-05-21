import Link from 'next/link'

export default function StocksNotFound() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-700/30 bg-dark-100/80 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-700/40 bg-dark-50">
        <span className="text-3xl">🔍</span>
      </div>
      <h1 className="text-3xl font-semibold text-white">Page Not Found</h1>
      <p className="mt-3 text-sm text-gray-400">
        This stocks page does not exist or has moved.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/stocks"
          className="inline-flex items-center justify-center rounded-xl bg-goodgreen px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-goodgreen/90"
        >
          Back to Stocks
        </Link>
        <Link
          href="/stocks/portfolio"
          className="inline-flex items-center justify-center rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-dark-50"
        >
          My Portfolio
        </Link>
      </div>
    </div>
  )
}

