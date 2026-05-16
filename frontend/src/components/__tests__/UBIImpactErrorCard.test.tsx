import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UBIImpactErrorCard } from '../UBIImpactErrorCard'

// ── UBIImpactErrorCard — actionable failure state for /ubi-impact ─────────────
//
// Task 0068. The previous behaviour when the three `useReadContract` hooks
// hung was to render skeletons forever. The new contract for this page is:
// if data hasn't arrived after a hard 10s ceiling, the page must surface
// an actionable error card with a Retry button — never silent skeletons.
//
// This component is that error card. It owns no state; the parent page
// decides when to mount it and what `onRetry` does (typically `refetch()`).

describe('UBIImpactErrorCard', () => {
  it('renders default copy with a Retry button when no message override is provided', () => {
    render(<UBIImpactErrorCard onRetry={() => {}} />)

    // Heading must clearly tell the user *why* they're seeing nothing.
    expect(
      screen.getByRole('heading', { name: /unable to load ubi impact data/i }),
    ).toBeInTheDocument()

    // Default copy explains the network-layer root cause without jargon.
    expect(
      screen.getByText(/network or rpc/i),
    ).toBeInTheDocument()

    // Single primary action.
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('renders a custom message when `message` prop is provided (per-section errors)', () => {
    render(
      <UBIImpactErrorCard
        message="Snapshots are temporarily unavailable."
        onRetry={() => {}}
      />,
    )
    expect(
      screen.getByText('Snapshots are temporarily unavailable.'),
    ).toBeInTheDocument()
  })

  it('invokes onRetry exactly once when the Retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<UBIImpactErrorCard onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders a "Loading is taking longer than expected" hint when variant=timeout', () => {
    render(<UBIImpactErrorCard variant="timeout" onRetry={() => {}} />)

    // Distinct copy so the user understands this is a soft timeout, not a
    // hard contract failure — Retry usually fixes it.
    expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument()
  })

  it('exposes the alert role for assistive tech', () => {
    render(<UBIImpactErrorCard onRetry={() => {}} />)
    // Surfaces in screen readers as an alert, not a passive region.
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders a compact variant for inline / per-section errors', () => {
    render(<UBIImpactErrorCard variant="compact" onRetry={() => {}} />)
    // Compact variant still has a Retry button — that's the whole point.
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    // But the long-form heading is suppressed.
    expect(
      screen.queryByRole('heading', { name: /unable to load ubi impact data/i }),
    ).not.toBeInTheDocument()
  })
})
