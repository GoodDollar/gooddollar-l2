'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function AgentsRegisterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Registration Unavailable" message="Unable to load agent registration. Please try again." reset={reset} homeHref="/agents" homeLabel="Agents" error={error} />
}
