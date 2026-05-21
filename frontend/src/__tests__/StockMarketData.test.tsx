import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/OrderBook', () => ({
  OrderBook: ({ markPrice }: { markPrice: number }) => (
    <div data-testid="order-book">OrderBook: {markPrice}</div>
  ),
}))
vi.mock('@/components/RecentTrades', () => ({
  RecentTrades: ({ markPrice }: { markPrice: number }) => (
    <div data-testid="recent-trades">RecentTrades: {markPrice}</div>
  ),
}))

import { StockMarketData } from '@/components/stocks/StockMarketData'

describe('StockMarketData', () => {
  it('renders Order Book tab active by default', () => {
    render(<StockMarketData markPrice={192.5} />)
    expect(screen.getByRole('tab', { name: /order book/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('order-book')).toBeInTheDocument()
    expect(screen.queryByTestId('recent-trades')).not.toBeInTheDocument()
  })

  it('switches to Trades tab on click', async () => {
    const user = userEvent.setup()
    render(<StockMarketData markPrice={192.5} />)

    await user.click(screen.getByRole('tab', { name: /trades/i }))
    expect(screen.getByRole('tab', { name: /trades/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('recent-trades')).toBeInTheDocument()
    expect(screen.queryByTestId('order-book')).not.toBeInTheDocument()
  })

  it('passes markPrice to both child components', async () => {
    const user = userEvent.setup()
    render(<StockMarketData markPrice={345.67} />)

    expect(screen.getByText('OrderBook: 345.67')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /trades/i }))
    expect(screen.getByText('RecentTrades: 345.67')).toBeInTheDocument()
  })
})
