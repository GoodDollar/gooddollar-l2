import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../empty-state'

describe('EmptyState', () => {
  it('renders title and icon', () => {
    render(
      <EmptyState
        icon={<svg data-testid="ic" />}
        title="No stock holdings"
      />,
    )
    expect(screen.getByText('No stock holdings')).toBeInTheDocument()
    expect(screen.getByTestId('ic')).toBeInTheDocument()
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="No stock holdings"
        description="Buy synthetic stocks like sAAPL to start tracking them here."
      />,
    )
    expect(
      screen.getByText(/Buy synthetic stocks like sAAPL/i),
    ).toBeInTheDocument()
  })

  it('renders no description when omitted', () => {
    const { container } = render(
      <EmptyState icon={<svg />} title="Empty" />,
    )
    // Only one <p> renders — the title.
    expect(container.querySelectorAll('p').length).toBe(1)
  })

  it('renders an action CTA as a real navigation link to the given href', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="No stock holdings"
        action={{ label: 'Browse stocks', href: '/stocks' }}
      />,
    )
    const link = screen.getByRole('link', { name: /browse stocks/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/stocks')
  })

  it('does not render an action when omitted', () => {
    render(<EmptyState icon={<svg />} title="No stock holdings" />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('merges className onto the outer container', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="Empty"
        className="custom-extra-class"
      />,
    )
    expect(screen.getByTestId('empty-state').className).toContain(
      'custom-extra-class',
    )
  })
})
