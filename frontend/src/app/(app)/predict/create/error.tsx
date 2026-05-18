'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PredictCreateError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Create Market Unavailable" message="Unable to load market creation form. Please try again." reset={reset} homeHref="/predict" homeLabel="Predict" error={error} />
}
