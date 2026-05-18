'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function GovernanceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Governance Unavailable" message="Unable to load governance data. Please try again." reset={reset} homeHref="/governance" homeLabel="Governance" error={error} />
}
