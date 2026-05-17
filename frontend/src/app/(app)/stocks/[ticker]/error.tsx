'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function StockDetailError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Stock Unavailable" message="Unable to load stock details. Please try again." reset={reset} homeHref="/stocks" homeLabel="Stocks" />
}
