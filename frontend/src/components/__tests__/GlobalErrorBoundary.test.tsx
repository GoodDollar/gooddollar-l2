import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GlobalErrorBoundary } from '../GlobalErrorBoundary'

function Bomb(): React.ReactElement {
  throw new Error('boom')
}

function setPathname(pathname: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      pathname,
      href: `http://localhost${pathname}`,
      reload: vi.fn(),
    },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'group').mockImplementation(() => {})
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
})

describe('GlobalErrorBoundary', () => {
  it('renders children when no error', () => {
    setPathname('/')
    render(
      <GlobalErrorBoundary>
        <div data-testid="child">child</div>
      </GlobalErrorBoundary>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('hides the Go Home button when already on the landing page (task 0051)', () => {
    setPathname('/')
    render(
      <GlobalErrorBoundary>
        <Bomb />
      </GlobalErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /go home/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument()
  })

  it('shows the Go Home button on non-root pages', () => {
    setPathname('/perps')
    render(
      <GlobalErrorBoundary>
        <Bomb />
      </GlobalErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
