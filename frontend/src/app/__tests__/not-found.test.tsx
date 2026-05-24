import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from '../not-found'

describe('Global 404 page', () => {
  it('renders 404 heading and primary CTA', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { name: '404' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to Swap' })).toBeTruthy()
  })

  it('renders quick-nav links to all main sections', () => {
    render(<NotFound />)
    const expectedSections = ['Swap', 'Stocks', 'Perps', 'Lend', 'Yield', 'Explore', 'Portfolio', 'Status']
    for (const section of expectedSections) {
      const link = screen.getByRole('link', { name: section })
      expect(link).toBeTruthy()
      expect(link.getAttribute('href')).toBeTruthy()
    }
  })

  it('links to correct paths', () => {
    render(<NotFound />)
    expect(screen.getByRole('link', { name: 'Stocks' }).getAttribute('href')).toBe('/stocks')
    expect(screen.getByRole('link', { name: 'Perps' }).getAttribute('href')).toBe('/perps')
    expect(screen.getByRole('link', { name: 'Explore' }).getAttribute('href')).toBe('/explore')
    expect(screen.getByRole('link', { name: 'Status' }).getAttribute('href')).toBe('/status')
  })
})
