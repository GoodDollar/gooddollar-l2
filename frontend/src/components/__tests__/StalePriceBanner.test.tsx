import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StalePriceBanner } from '../StalePriceBanner'

describe('StalePriceBanner (task 0064)', () => {
  it('renders the stocks variant copy + default /lane1 pipeline link', () => {
    render(<StalePriceBanner variant="stocks" />)
    expect(
      screen.getByText(/Oracle offline: showing demo prices/),
    ).toBeInTheDocument()
    const link = screen.getByTestId('stale-price-banner-link')
    expect(link.getAttribute('href')).toBe('/lane1')
    expect(link.textContent).toContain('See pipeline status')
  })

  it('renders the swap variant copy + default /lane1 link', () => {
    render(<StalePriceBanner variant="swap" />)
    expect(
      screen.getByText(/Live prices unavailable: showing cached rates/),
    ).toBeInTheDocument()
    expect(screen.getByTestId('stale-price-banner-link').getAttribute('href')).toBe('/lane1')
  })

  it('respects a linkHref override', () => {
    render(<StalePriceBanner variant="swap" linkHref="/test-dashboard#stock-drift-dashboard" />)
    expect(
      screen.getByTestId('stale-price-banner-link').getAttribute('href'),
    ).toBe('/test-dashboard#stock-drift-dashboard')
  })

  it('suppresses the link when linkHref is null', () => {
    render(<StalePriceBanner variant="swap" linkHref={null} />)
    expect(screen.queryByTestId('stale-price-banner-link')).toBeNull()
  })
})
