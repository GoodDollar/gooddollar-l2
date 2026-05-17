'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function AgentDetailError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Agent Not Found" message="Unable to load agent details. Please try again." reset={reset} homeHref="/agents" homeLabel="Agents" />
}
