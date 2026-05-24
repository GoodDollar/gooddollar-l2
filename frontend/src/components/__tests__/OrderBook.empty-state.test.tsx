import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { OrderBook } from '../OrderBook'

// Task 0033 — the OrderBook panel previously fabricated 12 levels of bid/ask
// depth on every render via Math.random(). There is no on-chain CLOB feeding
// the stocks/perps oracle today, so the only honest rendering is an empty
// state. These tests freeze that contract:
//
//   1. The empty-state copy is rendered.
//   2. No Math.random is invoked.
//   3. No fabricated `$` price rows leak through.

describe('OrderBook — honest empty state', () => {
  it('renders the "No on-chain depth available" copy', () => {
    render(<OrderBook />)
    expect(screen.getByText('No on-chain depth available')).toBeInTheDocument()
    expect(
      screen.getByText(/live order book will appear here once a depth feed is wired/i),
    ).toBeInTheDocument()
  })

  it('never calls Math.random when rendering', () => {
    const spy = vi.spyOn(Math, 'random')
    render(<OrderBook />)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('does not render any fabricated price rows', () => {
    const { container } = render(<OrderBook />)
    expect(container.textContent ?? '').not.toMatch(/\$\d/)
    expect(container.querySelectorAll('[data-testid="order-book-row"]')).toHaveLength(0)
  })
})
