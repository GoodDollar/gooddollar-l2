'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PoolError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Pools Unavailable" message="Unable to load liquidity pools. Please try again." reset={reset} homeHref="/pool" homeLabel="Pools" error={error} />
}
