import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/stocks',
}))

import { StocksSectionNav } from '../StocksSectionNav'

describe('StocksSectionNav mobile density', () => {
  it('uses compact mobile tab sizing for improved first-viewport hierarchy', () => {
    render(<StocksSectionNav />)

    const marketsTab = screen.getByRole('link', { name: 'Markets' })
    expect(marketsTab.className).toContain('text-xs')
    expect(marketsTab.className).toContain('sm:text-sm')
    expect(marketsTab.className).toContain('px-3')
  })
})
