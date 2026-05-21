import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StockOrderFormFallback } from '../StockOrderFormFallback'

describe('StockOrderFormFallback', () => {
  it('renders an explicit loading label and stable trade structure', () => {
    render(<StockOrderFormFallback />)

    expect(screen.getByText('Preparing trade panel…')).toBeInTheDocument()
    expect(screen.getByText('Loading Buy/Sell controls and order inputs.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buy (loading)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sell (loading)' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Connect wallet (loading)' })).toBeDisabled()
  })
})
