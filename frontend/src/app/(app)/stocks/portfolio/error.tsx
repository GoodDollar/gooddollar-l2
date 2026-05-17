'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function StocksPortfolioError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Portfolio Unavailable" message="Unable to load your stocks portfolio. Please try again." reset={reset} homeHref="/stocks" homeLabel="Stocks" />
}
