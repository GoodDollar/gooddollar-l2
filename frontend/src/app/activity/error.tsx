'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function ActivityError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Activity"
      message="The activity feed couldn't be loaded. Please try again."
      error={error}
      reset={reset}
    />
  )
}
