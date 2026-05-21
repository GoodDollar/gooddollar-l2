'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class RebalanceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          data-testid="rebalance-error-fallback"
          className="mt-4 rounded-2xl border border-red-600/30 bg-red-950/30 p-4"
          role="alert"
        >
          <p className="text-sm font-semibold text-red-300">Rebalance panel unavailable</p>
          <p className="mt-1 text-xs text-red-300/70">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded-lg bg-red-700/40 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-700/60"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
