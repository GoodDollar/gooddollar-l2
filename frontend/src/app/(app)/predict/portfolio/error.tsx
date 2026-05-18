'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PredictPortfolioError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Portfolio Unavailable" message="Unable to load your prediction portfolio. Please try again." reset={reset} homeHref="/predict" homeLabel="Predict" error={error} />
}
