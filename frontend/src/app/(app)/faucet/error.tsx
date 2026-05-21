'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function FaucetError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Unable to Load Faucet"
      message="The testnet faucet couldn't be loaded. Please try again."
      error={error}
      reset={reset}
    />
  )
}
