'use client'

import { Component, Fragment, type ReactNode } from 'react'
import { RefreshCcw } from 'lucide-react'

interface SafeDynamicProps {
  children: ReactNode
  /** Optional label used in the default fallback copy ("The {label} couldn't load right now"). */
  label?: string
  /** Custom inline fallback. Receives the reset callback and the caught error. */
  fallback?: (reset: () => void, error: Error) => ReactNode
  /** Optional error hook for analytics / telemetry. */
  onError?: (error: Error) => void
}

interface SafeDynamicState {
  error: Error | null
  attempt: number
}

/**
 * Scoped error boundary for dynamically-imported subtrees. Catches render
 * errors (including `ChunkLoadError` from `next/dynamic` loaders) so a single
 * failing import does not propagate to the page-level GlobalErrorBoundary
 * and blank the entire page.
 *
 * Clicking the default fallback's "Try again" bumps an internal `key`, which
 * remounts the wrapped subtree and causes `next/dynamic` to re-attempt the
 * underlying `import()` without a full page reload.
 */
export class SafeDynamic extends Component<SafeDynamicProps, SafeDynamicState> {
  state: SafeDynamicState = { error: null, attempt: 0 }

  static getDerivedStateFromError(error: Error): Partial<SafeDynamicState> {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[SafeDynamic]', error)
    this.props.onError?.(error)
  }

  private reset = () => {
    this.setState(prev => ({ error: null, attempt: prev.attempt + 1 }))
  }

  render() {
    const { error, attempt } = this.state
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(this.reset, error)
      }
      return <SafeDynamicDefaultFallback label={this.props.label} onRetry={this.reset} />
    }
    return <Fragment key={attempt}>{this.props.children}</Fragment>
  }
}

function SafeDynamicDefaultFallback({ label, onRetry }: { label?: string; onRetry: () => void }) {
  const target = label ?? 'component'
  return (
    <div
      role="alert"
      data-testid="safe-dynamic-fallback"
      className="w-full max-w-[460px] rounded-2xl border border-gray-700/30 bg-dark-100 px-5 py-6 text-center"
    >
      <p className="text-sm text-gray-300 mb-3">The {target} couldn&rsquo;t load right now.</p>
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-goodgreen px-3 py-1.5 text-xs font-semibold text-black hover:brightness-110"
        >
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
        >
          Reload page
        </button>
      </div>
    </div>
  )
}
