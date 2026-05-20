'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function TestnetGuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Testnet Guide"
      message="The testnet guide couldn't be loaded. Please try again."
      error={error}
      reset={reset}
      homeHref="/testnet-guide"
      homeLabel="Reload Guide"
    />
  )
}
