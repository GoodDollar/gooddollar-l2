'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Analytics"
      message="The analytics dashboard couldn't be loaded. Please try again."
      error={error}
      reset={reset}
    />
  )
}
