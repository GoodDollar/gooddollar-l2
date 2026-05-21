import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { OracleUnavailableBanner } from '../OracleUnavailableBanner'

describe('<OracleUnavailableBanner />', () => {
  it('shows error message when error is provided', () => {
    render(<OracleUnavailableBanner error="Status endpoint returned 503" onRetry={() => {}} />)
    expect(screen.getByTestId('oracle-unavailable-banner')).toBeInTheDocument()
    expect(screen.getByText(/oracle unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/503/)).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<OracleUnavailableBanner error="Network error" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows consecutive failure count when provided', () => {
    render(<OracleUnavailableBanner error="Timeout" consecutiveFailures={5} onRetry={() => {}} />)
    expect(screen.getByText(/5 consecutive failures/i)).toBeInTheDocument()
  })

  it('does not render when no error', () => {
    const { container } = render(<OracleUnavailableBanner error={null} onRetry={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
