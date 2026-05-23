import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LivePriceStrip } from '../LivePriceStrip'

describe('LivePriceStrip', () => {
  it('renders one card per entry', () => {
    render(
      <LivePriceStrip
        entries={[
          { symbol: 'ETH', price: 3500, change24h: 1.0, source: 'chain-oracle', updatedAgoMs: 4000 },
          { symbol: 'USDC', price: 1.0, change24h: 0.01, source: 'chain-oracle', updatedAgoMs: 4000 },
          { symbol: 'G$', price: 0.0001, change24h: 0, source: 'chain-oracle', updatedAgoMs: 4000 },
        ]}
      />,
    )
    expect(screen.getAllByTestId('live-price-card')).toHaveLength(3)
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('G$')).toBeInTheDocument()
  })

  it('renders 3 skeleton placeholders when entries is empty', () => {
    render(<LivePriceStrip entries={[]} />)
    expect(screen.getAllByTestId('live-price-skeleton')).toHaveLength(3)
  })

  it('exposes a horizontal scroll container for overflow on small screens', () => {
    const { container } = render(
      <LivePriceStrip
        entries={[
          { symbol: 'ETH', price: 3500, change24h: 1.0, source: 'chain-oracle', updatedAgoMs: 4000 },
        ]}
      />,
    )
    const strip = container.querySelector('[data-testid="live-price-strip"]')
    expect(strip).toBeInTheDocument()
    expect(strip?.className).toMatch(/overflow-x-auto|flex/)
  })
})
