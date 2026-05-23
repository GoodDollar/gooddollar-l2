import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { ProofPanelBoundary } from '../ProofPanelBoundary'

function Bomb({ message }: { message: string }): JSX.Element {
  throw new Error(message)
}

function ChildThatThrows({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) throw new Error('boom')
  return <div>recovered child</div>
}

describe('ProofPanelBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error is thrown', () => {
    render(
      <ProofPanelBoundary label="Live Quotes">
        <div>healthy panel</div>
      </ProofPanelBoundary>,
    )

    expect(screen.getByText(/healthy panel/i)).toBeInTheDocument()
    expect(screen.queryByText(/panel crashed/i)).not.toBeInTheDocument()
  })

  it('renders the panel-crashed card with the label when a child throws on render', () => {
    render(
      <ProofPanelBoundary label="Live Quotes">
        <Bomb message="rendering exploded" />
      </ProofPanelBoundary>,
    )

    expect(screen.getByText(/panel crashed/i)).toBeInTheDocument()
    expect(screen.getByText(/Live Quotes panel hit an unexpected runtime error/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.queryByText(/rendering exploded/)).not.toBeInTheDocument()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[proof-panel-boundary]',
      'Live Quotes',
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )
  })

  it('re-mounts the children when Retry is clicked and the underlying issue is resolved', () => {
    function Harness(): JSX.Element {
      const [shouldThrow, setShouldThrow] = useState(true)
      return (
        <>
          <button type="button" onClick={() => setShouldThrow(false)}>
            fix upstream
          </button>
          <ProofPanelBoundary label="Live Quotes">
            <ChildThatThrows shouldThrow={shouldThrow} />
          </ProofPanelBoundary>
        </>
      )
    }

    render(<Harness />)

    expect(screen.getByText(/panel crashed/i)).toBeInTheDocument()
    expect(screen.queryByText(/recovered child/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /fix upstream/i }))
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(screen.queryByText(/panel crashed/i)).not.toBeInTheDocument()
    expect(screen.getByText(/recovered child/i)).toBeInTheDocument()
  })

  it('keeps sibling boundaries healthy when one of them crashes', () => {
    render(
      <>
        <ProofPanelBoundary label="Live Quotes">
          <Bomb message="boom" />
        </ProofPanelBoundary>
        <ProofPanelBoundary label="Safety Banner">
          <div>safety banner content</div>
        </ProofPanelBoundary>
      </>,
    )

    expect(screen.getByText(/Live Quotes panel hit an unexpected runtime error/i)).toBeInTheDocument()
    expect(screen.getByText(/safety banner content/i)).toBeInTheDocument()
  })
})
