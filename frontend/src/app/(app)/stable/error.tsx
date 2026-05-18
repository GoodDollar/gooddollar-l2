'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function StableError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Stablecoin Unavailable" message="Unable to load stablecoin data. Please try again." reset={reset} homeHref="/stable" homeLabel="Stablecoin" error={error} />
}
