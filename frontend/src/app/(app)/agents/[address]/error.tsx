'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function AgentDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Agent Not Found" message="Unable to load agent details. Please try again." reset={reset} homeHref="/agents" homeLabel="Agents" error={error} />
}
