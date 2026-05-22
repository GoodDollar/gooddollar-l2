import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import StocksInvalidPathPage from '../page'

describe('StocksInvalidPathPage', () => {
  it('renders a branded recovery page for invalid nested stocks paths', () => {
    render(<StocksInvalidPathPage />)

    expect(screen.getByRole('heading', { name: 'Stock Not Found' })).toBeTruthy()
    const link = screen.getByRole('link', { name: 'Back to Stocks' })
    expect(link).toHaveAttribute('href', '/stocks')
  })
})
