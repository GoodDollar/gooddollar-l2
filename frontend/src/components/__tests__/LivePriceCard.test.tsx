import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LivePriceCard } from '../LivePriceCard'

describe('LivePriceCard', () => {
  it('renders the symbol, formatted price, and the source badge', () => {
    render(
      <LivePriceCard
        symbol="ETH"
        price={3500.12}
        change24h={1.45}
        source="chain-oracle"
        updatedAgoMs={5000}
      />,
    )
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText(/\$3,500\.12/)).toBeInTheDocument()
    expect(screen.getByTestId('price-source-badge')).toBeInTheDocument()
    expect(screen.getByText('Chain oracle')).toBeInTheDocument()
  })

  it('renders the 24h change with sign + percent and color cue', () => {
    render(
      <LivePriceCard
        symbol="USDC"
        price={1.0}
        change24h={-0.42}
        source="coingecko"
        updatedAgoMs={2000}
      />,
    )
    const change = screen.getByTestId('live-price-change')
    expect(change.textContent).toMatch(/-?0\.42%/)
  })

  it('renders an "Updated …" footer reflecting updatedAgoMs', () => {
    render(
      <LivePriceCard
        symbol="G$"
        price={0.0001}
        change24h={0}
        source="chain-oracle"
        updatedAgoMs={5000}
      />,
    )
    expect(screen.getByText(/Updated 5s ago/)).toBeInTheDocument()
  })

  it('renders fallback in a dimmed style with a regression marker for E2E', () => {
    render(
      <LivePriceCard
        symbol="ETH"
        price={3012.45}
        change24h={0}
        source="fallback"
        updatedAgoMs={null}
      />,
    )
    expect(screen.getByTestId('fallback-price')).toBeInTheDocument()
  })

  it('renders a warning glyph when source is closed or stale', () => {
    const { rerender } = render(
      <LivePriceCard
        symbol="AAPL"
        price={195}
        change24h={0}
        source="closed"
        updatedAgoMs={1000}
      />,
    )
    expect(screen.getByTestId('live-price-warning')).toBeInTheDocument()

    rerender(
      <LivePriceCard
        symbol="AAPL"
        price={195}
        change24h={0}
        source="stale"
        updatedAgoMs={120_000}
      />,
    )
    expect(screen.getByTestId('live-price-warning')).toBeInTheDocument()
  })

  it('omits the 24h change row in compact mode', () => {
    render(
      <LivePriceCard
        symbol="ETH"
        price={3500}
        change24h={1.42}
        source="chain-oracle"
        updatedAgoMs={1000}
        compact
      />,
    )
    expect(screen.queryByTestId('live-price-change')).not.toBeInTheDocument()
  })

  it('always exposes the data-testid="live-price" hook for the invariant suite', () => {
    render(
      <LivePriceCard
        symbol="ETH"
        price={3500}
        change24h={1.42}
        source="chain-oracle"
        updatedAgoMs={1000}
      />,
    )
    expect(screen.getByTestId('live-price')).toBeInTheDocument()
  })
})
