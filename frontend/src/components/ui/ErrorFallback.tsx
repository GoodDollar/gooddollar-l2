'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorFallbackProps {
  title?: string
  message?: string
  reset: () => void
  homeHref?: string
  homeLabel?: string
  error?: Error & { digest?: string }
}

export function ErrorFallback({
  title = 'Something Went Wrong',
  message = 'An unexpected error occurred. Please try again.',
  reset,
  homeHref = '/',
  homeLabel = 'Go Home',
  error,
}: ErrorFallbackProps) {
  useEffect(() => {
    if (error) {
      console.error('[error-boundary]', error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <svg
          className="h-10 w-10 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="mb-3 text-3xl font-bold text-white">{title}</h1>
      <p className="mb-2 max-w-xs text-sm text-gray-400">{message}</p>
      {error?.digest ? (
        <p
          className="mb-6 select-all font-mono text-xs text-gray-500"
          data-testid="error-digest"
        >
          ref: {error.digest}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-goodgreen px-6 py-3 font-semibold text-black transition-colors hover:bg-goodgreen-600 active:scale-[0.98]"
        >
          Try Again
        </button>
        <Link
          href={homeHref}
          className="rounded-xl border border-gray-700/30 bg-dark-50 px-6 py-3 font-semibold text-white transition-colors hover:border-gray-600"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  )
}
