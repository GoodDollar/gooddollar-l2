'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function YieldError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Yield Unavailable" message="Unable to load yield vaults. Please try again." reset={reset} homeHref="/yield" homeLabel="Yield" error={error} />
}
