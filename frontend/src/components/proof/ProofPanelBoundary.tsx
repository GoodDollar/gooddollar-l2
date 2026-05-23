'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ProofPanelBoundaryProps {
  label: string
  children: ReactNode
}

interface ProofPanelBoundaryState {
  hasError: boolean
  retryKey: number
}

export class ProofPanelBoundary extends Component<
  ProofPanelBoundaryProps,
  ProofPanelBoundaryState
> {
  state: ProofPanelBoundaryState = { hasError: false, retryKey: 0 }

  static getDerivedStateFromError(): Partial<ProofPanelBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[proof-panel-boundary]', this.props.label, error, info)
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, retryKey: prev.retryKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">panel crashed</div>
          <div className="mt-1 text-yellow-300/80">
            The {this.props.label} panel hit an unexpected runtime error. The
            rest of this proof page is still valid; details are in the browser
            console.
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-100 transition-colors hover:bg-yellow-500/20"
          >
            Retry
          </button>
        </div>
      )
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>
  }
}
