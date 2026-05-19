'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function TestDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Test Dashboard"
      message="The test dashboard couldn't be loaded. Please try again."
      error={error}
      reset={reset}
      homeHref="/tests"
      homeLabel="Test Registry"
    />
  )
}
