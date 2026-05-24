import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SafeDynamic } from '../SafeDynamic'

function SafeChild() {
  return <div data-testid="safe-child">child ok</div>
}

function Bomb(): React.ReactElement {
  throw new Error('ChunkLoadError: Loading chunk failed for /_next/static/chunks/foo.js')
}

const reloadMock = vi.fn()

beforeEach(() => {
  vi.restoreAllMocks()
  reloadMock.mockReset()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: reloadMock, pathname: '/', href: 'http://localhost/' },
  })
})

describe('SafeDynamic', () => {
  it('renders children when no error', () => {
    render(
      <SafeDynamic>
        <SafeChild />
      </SafeDynamic>
    )
    expect(screen.getByTestId('safe-child')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-dynamic-fallback')).not.toBeInTheDocument()
  })

  it('renders default fallback when child throws (catches ChunkLoadError)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SafeDynamic label="swap form">
        <Bomb />
      </SafeDynamic>
    )

    const fallback = screen.getByTestId('safe-dynamic-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent(/swap form/i)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('calls onError prop with the caught error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <SafeDynamic onError={onError}>
        <Bomb />
      </SafeDynamic>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect((onError.mock.calls[0][0] as Error).message).toMatch(/ChunkLoadError/)
  })

  it('try again clears the error and remounts the subtree (retry without page reload)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <SafeDynamic label="swap form">
        <Bomb />
      </SafeDynamic>
    )

    expect(screen.getByTestId('safe-dynamic-fallback')).toBeInTheDocument()

    // Simulate a recovered chunk: the parent now renders a working child.
    // The boundary stays in error state until "Try again" clears it.
    rerender(
      <SafeDynamic label="swap form">
        <SafeChild />
      </SafeDynamic>
    )
    expect(screen.getByTestId('safe-dynamic-fallback')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(screen.queryByTestId('safe-dynamic-fallback')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-child')).toBeInTheDocument()
    expect(reloadMock).not.toHaveBeenCalled()
  })

  it('bumps the subtree key on reset so dynamic loaders re-attempt their import', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let mounts = 0
    function MountCounter() {
      React.useEffect(() => {
        mounts += 1
      }, [])
      return <div data-testid="mount-counter">mount #{mounts}</div>
    }

    const { rerender } = render(
      <SafeDynamic>
        <MountCounter />
      </SafeDynamic>
    )
    expect(mounts).toBe(1)

    // Trigger error path by rendering a Bomb in place of the counter.
    rerender(
      <SafeDynamic>
        <Bomb />
      </SafeDynamic>
    )
    expect(screen.getByTestId('safe-dynamic-fallback')).toBeInTheDocument()

    // Replace the failing child with the counter again and reset — the new
    // subtree should mount fresh (key bump remounts the Fragment).
    rerender(
      <SafeDynamic>
        <MountCounter />
      </SafeDynamic>
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(mounts).toBeGreaterThanOrEqual(2)
  })

  it('uses caller-supplied fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SafeDynamic
        fallback={(reset, err) => (
          <div data-testid="custom-fallback">
            <p>custom: {err.message}</p>
            <button type="button" onClick={reset}>custom retry</button>
          </div>
        )}
      >
        <Bomb />
      </SafeDynamic>
    )

    const custom = screen.getByTestId('custom-fallback')
    expect(custom).toBeInTheDocument()
    expect(custom).toHaveTextContent(/ChunkLoadError/)
    expect(screen.queryByTestId('safe-dynamic-fallback')).not.toBeInTheDocument()
  })

  it('Reload page button calls window.location.reload()', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SafeDynamic>
        <Bomb />
      </SafeDynamic>
    )

    fireEvent.click(screen.getByRole('button', { name: /reload page/i }))
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })
})
