import Link from 'next/link'

export default function StocksInvalidPathPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-2xl font-bold text-white mb-3">Stock Not Found</h1>
      <p className="text-sm text-gray-400 mb-6 max-w-md">
        This stock symbol is not available.
      </p>
      <Link href="/stocks" className="px-6 py-3 rounded-xl bg-goodgreen text-black font-semibold hover:bg-goodgreen-600 transition-colors">
        Back to Stocks
      </Link>
    </div>
  )
}

