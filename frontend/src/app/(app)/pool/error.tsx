'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PoolError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Pools Unavailable" message="Unable to load liquidity pools. Please try again." reset={reset} homeHref="/pool" homeLabel="Pools" />
}
