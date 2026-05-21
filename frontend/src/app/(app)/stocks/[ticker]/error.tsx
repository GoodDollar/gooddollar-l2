'use client'

import Link from 'next/link'

const RECOVERY_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META']

export default function StockDetailError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  void error

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-2xl font-semibold text-white mb-3">Stock Not Found</h1>
      <p className="text-sm text-gray-400 mb-6 max-w-md">
        This stock symbol is not available.
      </p>
      <Link href="/stocks" className="px-6 py-3 rounded-xl bg-goodgreen text-black font-semibold hover:bg-goodgreen-600 transition-colors">
        Back to Stocks
      </Link>
      <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
        <span>Try:</span>
        {RECOVERY_TICKERS.map(symbol => (
          <Link
            key={symbol}
            href={`/stocks/${symbol}`}
            className="rounded-lg bg-goodgreen/10 px-2 py-1 text-goodgreen hover:bg-goodgreen/20 transition-colors"
          >
            {symbol}
          </Link>
        ))}
      </div>
    </div>
  )
}
