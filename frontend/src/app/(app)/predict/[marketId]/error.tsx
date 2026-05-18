'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PredictMarketError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Market Unavailable" message="Unable to load this prediction market. Please try again." reset={reset} homeHref="/predict" homeLabel="Predict" error={error} />
}
