import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import LivePricesProofError from '../error'
import ProofAliasError from '../../proof/error'

describe('Proof route error boundaries', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['canonical', LivePricesProofError],
    ['alias', ProofAliasError],
  ])('%s boundary renders the proof-page-scoped fallback title', (_label, Component) => {
    const error = new Error('boom') as Error & { digest?: string }
    render(<Component error={error} reset={() => {}} />)
    expect(
      screen.getByRole('heading', { name: /Live Prices Proof Unavailable/i }),
    ).toBeInTheDocument()
  })

  it('Try Again button invokes reset exactly once', () => {
    const reset = vi.fn()
    const error = new Error('boom') as Error & { digest?: string }
    render(<LivePricesProofError error={error} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('renders a back-to-app link pointing at /portfolio', () => {
    const error = new Error('boom') as Error & { digest?: string }
    render(<LivePricesProofError error={error} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /Back to App/i })
    expect(link).toHaveAttribute('href', '/portfolio')
  })

  it('renders the digest reference when Next.js attaches one', () => {
    const error = new Error('boom') as Error & { digest?: string }
    error.digest = 'digest-xyz-123'
    render(<LivePricesProofError error={error} reset={() => {}} />)
    expect(screen.getByText(/digest-xyz-123/)).toBeInTheDocument()
  })

  it('logs the error to console.error with the [error-boundary] tag', () => {
    const error = new Error('boom') as Error & { digest?: string }
    render(<LivePricesProofError error={error} reset={() => {}} />)
    const consoleErrorMock = vi.mocked(console.error)
    const tagged = consoleErrorMock.mock.calls.find((c) => c[0] === '[error-boundary]')
    expect(tagged).toBeDefined()
    expect(tagged?.[1]).toBe(error)
  })

  it('never renders the raw error.message string in the DOM', () => {
    const error = new Error('this-secret-message-should-stay-hidden') as Error & { digest?: string }
    render(<LivePricesProofError error={error} reset={() => {}} />)
    expect(screen.queryByText(/this-secret-message-should-stay-hidden/)).not.toBeInTheDocument()
  })
})
