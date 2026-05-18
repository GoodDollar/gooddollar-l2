'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function AgentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Agents Unavailable" message="Unable to load agents. Please try again." reset={reset} homeHref="/agents" homeLabel="Agents" error={error} />
}
