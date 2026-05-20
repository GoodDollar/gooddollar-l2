'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function InviteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Invite Page"
      message="The invitation page couldn't be loaded. Please try again."
      error={error}
      reset={reset}
    />
  )
}
