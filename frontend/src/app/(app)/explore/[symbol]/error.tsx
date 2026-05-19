'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function ExploreSymbolError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Token Details"
      message="This token's details couldn't be loaded. Please try again."
      error={error}
      reset={reset}
      homeHref="/explore"
      homeLabel="Back to Explore"
    />
  )
}
