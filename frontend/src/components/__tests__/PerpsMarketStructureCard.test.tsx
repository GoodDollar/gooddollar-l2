/**
 * Task 0043 — `<PerpsMarketStructureCard>` replaces the legacy
 * `<OrderBook>` + `<RecentTrades>` Math.random()-driven panels on
 * `/perps`. The card must render mark/index/open-interest with
 * `PriceSourceBadge`s for the two prices, an explainer of why GoodPerps
 * has no CLOB, and never the "Order Book" / "Recent Trades" headings.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PerpsMarketStructureCard } from '@/components/PerpsMarketStructureCard'

describe('PerpsMarketStructureCard (task 0043)', () => {
  function renderCard(over: Partial<React.ComponentProps<typeof PerpsMarketStructureCard>> = {}) {
    return render(
      <PerpsMarketStructureCard
        symbol="BTC-USD"
        markPrice={84_250}
        indexPrice={84_251.2}
        openInterestUsd={8.9e8}
        source="chain-oracle"
        {...over}
      />,
    )
  }

  it('renders the explainer heading and copy', () => {
    renderCard()
    expect(screen.getByText(/How GoodPerps prices fills/i)).toBeInTheDocument()
    expect(screen.getByTestId('perps-market-structure-card').textContent).toMatch(
      /no central order book/i,
    )
  })

  it('renders a PriceSourceBadge for both mark and index price rows', () => {
    renderCard()
    const markRow = screen.getByTestId('perps-market-row-mark')
    const indexRow = screen.getByTestId('perps-market-row-index')
    expect(markRow.querySelector('[data-testid="price-source-badge"]')).not.toBeNull()
    expect(indexRow.querySelector('[data-testid="price-source-badge"]')).not.toBeNull()
    expect(
      markRow.querySelector('[data-testid="price-source-badge"]')!.getAttribute('data-source'),
    ).toBe('chain-oracle')
  })

  it('does NOT render an "Order Book" or "Recent Trades" heading', () => {
    renderCard()
    // Only headings — the explainer paragraph legitimately mentions "order
    // book" in body copy. The legacy panel headings must be gone.
    expect(screen.queryByRole('heading', { name: /Order Book/i })).toBeNull()
    expect(screen.queryByRole('heading', { name: /Recent Trades/i })).toBeNull()
  })

  it('shows formatted mark, index, and open interest values', () => {
    renderCard({ markPrice: 84_250, indexPrice: 84_251.2, openInterestUsd: 8.9e8 })
    const card = screen.getByTestId('perps-market-structure-card')
    expect(card.textContent).toContain('$84,250.00')
    expect(card.textContent).toContain('$84,251.20')
    // formatLargeValue suffixes large USD values with B/M/T.
    expect(card.textContent).toMatch(/\$[\d.]+[BM]/)
  })

  it('renders em-dashes when mark / index / open interest are zero', () => {
    renderCard({ markPrice: 0, indexPrice: 0, openInterestUsd: 0 })
    const card = screen.getByTestId('perps-market-structure-card')
    expect((card.textContent || '').match(/—/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
  })

  it('reflects an alternative source on both badges', () => {
    renderCard({ source: 'fallback' })
    const badges = screen.getAllByTestId('price-source-badge')
    expect(badges.length).toBeGreaterThanOrEqual(2)
    for (const badge of badges) {
      expect(badge.getAttribute('data-source')).toBe('fallback')
    }
  })

  it('renders deterministically — calling with identical props twice yields the same DOM string (no Math.random churn)', () => {
    const a = render(
      <PerpsMarketStructureCard
        symbol="BTC-USD" markPrice={84_250} indexPrice={84_251}
        openInterestUsd={8.9e8} source="chain-oracle"
      />,
    )
    const b = render(
      <PerpsMarketStructureCard
        symbol="BTC-USD" markPrice={84_250} indexPrice={84_251}
        openInterestUsd={8.9e8} source="chain-oracle"
      />,
    )
    expect(a.container.innerHTML).toBe(b.container.innerHTML)
  })
})
