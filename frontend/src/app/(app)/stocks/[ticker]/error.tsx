'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const RECOVERY_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META']

export default function StockDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-white mb-3">Something Went Wrong</h1>
      <p className="text-sm text-gray-400 mb-6 max-w-md">
        We couldn&apos;t load this stock. This may be a temporary issue — try again or browse other stocks.
      </p>

      <div className="flex items-center gap-3 mb-6">
        <Button onClick={reset} size="lg">
          Try Again
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/stocks">
            Back to Stocks
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>Or try:</span>
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
