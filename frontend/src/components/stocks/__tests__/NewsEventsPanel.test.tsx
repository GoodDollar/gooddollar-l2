import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewsEventsPanel } from '@/components/stocks/NewsEventsPanel'

describe('NewsEventsPanel', () => {
  it('renders the loading skeleton', () => {
    render(<NewsEventsPanel ticker="AAPL" isLoading error={null} />)
    expect(screen.getByLabelText(/news loading/i)).toBeInTheDocument()
  })

  it('renders the error state when an error is provided', () => {
    render(<NewsEventsPanel ticker="AAPL" isLoading={false} error="Failed to load news" />)
    expect(screen.getByText('Failed to load news')).toBeInTheDocument()
  })

  // Task 0034 — the previous panel rendered three fabricated headlines per
  // ticker (with example.com URLs) without a demo badge, next to a synthetic
  // live price. Until a real news provider is wired up, the only honest
  // rendering is an empty-state telling the user nothing is fabricated.
  it('renders the honest "news feed coming soon" empty state', () => {
    render(<NewsEventsPanel ticker="AAPL" isLoading={false} error={null} />)
    expect(screen.getByText(/news feed coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/none of this is fabricated/i)).toBeInTheDocument()
  })

  it('renders no anchor tags (no fabricated article links)', () => {
    const { container } = render(
      <NewsEventsPanel ticker="AAPL" isLoading={false} error={null} />,
    )
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })
})
