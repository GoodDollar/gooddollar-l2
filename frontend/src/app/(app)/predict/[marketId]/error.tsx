'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PredictMarketError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Market Unavailable" message="Unable to load this prediction market. Please try again." reset={reset} homeHref="/predict" homeLabel="Predict" />
}
