'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function LivePricesProofError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Live Prices Proof Unavailable"
      message="One or more proof panels failed to render. Click 'Try again' to re-render — the underlying error has been logged to the browser console."
      reset={reset}
      homeHref="/portfolio"
      homeLabel="Back to App"
      error={error}
    />
  )
}
