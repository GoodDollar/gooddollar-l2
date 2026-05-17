'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function LendError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Lending Unavailable" message="Unable to load lending markets. Please try again." reset={reset} homeHref="/lend" homeLabel="Lending" />
}
