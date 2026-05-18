'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PortfolioError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Portfolio Unavailable" message="Unable to load your portfolio. Please try again." reset={reset} homeHref="/portfolio" homeLabel="Portfolio" error={error} />
}
