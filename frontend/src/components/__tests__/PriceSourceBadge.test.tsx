import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceSourceBadge } from '../PriceSourceBadge'

describe('PriceSourceBadge', () => {
  it('renders the chain-oracle label and a green dot for chain-oracle', () => {
    const { container } = render(<PriceSourceBadge source="chain-oracle" />)
    expect(screen.getByText('Chain oracle')).toBeInTheDocument()
    const dot = container.querySelector('[data-testid="price-source-dot"]')
    expect(dot?.className).toMatch(/bg-(green|emerald)/)
  })

  it('renders eToro demo with the blue/sky dot for etoro-demo', () => {
    const { container } = render(<PriceSourceBadge source="etoro-demo" />)
    expect(screen.getByText('eToro demo')).toBeInTheDocument()
    const dot = container.querySelector('[data-testid="price-source-dot"]')
    expect(dot?.className).toMatch(/bg-(blue|sky|cyan)/)
  })

  it('renders Cached (CoinGecko) with a neutral dot for coingecko', () => {
    render(<PriceSourceBadge source="coingecko" />)
    expect(screen.getByText('Cached (CoinGecko)')).toBeInTheDocument()
  })

  it('renders Fallback price with a yellow/amber dot for fallback', () => {
    const { container } = render(<PriceSourceBadge source="fallback" />)
    expect(screen.getByText('Fallback price')).toBeInTheDocument()
    const dot = container.querySelector('[data-testid="price-source-dot"]')
    expect(dot?.className).toMatch(/bg-(yellow|amber)/)
  })

  it('renders Stale with an amber dot for stale', () => {
    const { container } = render(<PriceSourceBadge source="stale" />)
    expect(screen.getByText('Stale')).toBeInTheDocument()
    const dot = container.querySelector('[data-testid="price-source-dot"]')
    expect(dot?.className).toMatch(/bg-(amber|yellow|orange)/)
  })

  it('renders Market closed with a grey dot for closed', () => {
    const { container } = render(<PriceSourceBadge source="closed" />)
    expect(screen.getByText('Market closed')).toBeInTheDocument()
    const dot = container.querySelector('[data-testid="price-source-dot"]')
    expect(dot?.className).toMatch(/bg-(gray|slate|zinc|neutral)/)
  })

  it('exposes the data-testid hook for the global invariant suite', () => {
    render(<PriceSourceBadge source="chain-oracle" />)
    expect(screen.getByTestId('price-source-badge')).toBeInTheDocument()
  })

  it('includes an accessible aria-label describing the source', () => {
    render(<PriceSourceBadge source="etoro-demo" />)
    const badge = screen.getByTestId('price-source-badge')
    expect(badge.getAttribute('aria-label')).toMatch(/eToro demo/i)
  })

  it('honours size="sm" by rendering a smaller dot', () => {
    const { container: sm } = render(<PriceSourceBadge source="chain-oracle" size="sm" />)
    const { container: md } = render(<PriceSourceBadge source="chain-oracle" size="md" />)
    const smDot = sm.querySelector('[data-testid="price-source-dot"]')
    const mdDot = md.querySelector('[data-testid="price-source-dot"]')
    // sm uses a 1px-smaller box; both must be present and distinct via class.
    expect(smDot).toBeInTheDocument()
    expect(mdDot).toBeInTheDocument()
    expect(smDot?.className).not.toBe(mdDot?.className)
  })
})
