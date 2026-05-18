'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PerpsPortfolioError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Portfolio Unavailable" message="Unable to load your perps portfolio. Please try again." reset={reset} homeHref="/perps" homeLabel="Perps" error={error} />
}
