/**
 * Task 0025: StockMarketData (the wrapper around the stocks ticker
 * right-side panel) MUST delegate to `<SyntheticStockQuotePanel>` and
 * MUST NOT mount the generic <OrderBook> / <RecentTrades> CLOB
 * components that perps still uses legitimately.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/useSyntheticTokenSupply', () => ({
  useSyntheticTokenSupply: () => ({ supply: 12_453, tokenAddress: '0xabc' }),
}))

vi.mock('@/components/OrderBook', () => ({
  OrderBook: () => <div data-testid="generic-order-book">FAKE CLOB</div>,
}))

vi.mock('@/components/RecentTrades', () => ({
  RecentTrades: () => <div data-testid="generic-recent-trades">FAKE TRADES</div>,
}))

import { StockMarketData } from '@/components/stocks/StockMarketData'

describe('StockMarketData — synthetic-quote integration (task 0025)', () => {
  it('renders the synthetic quote panel, never the generic order book or recent trades', () => {
    render(<StockMarketData ticker="AAPL" markPrice={218.27} source="chain-oracle" />)

    expect(screen.getByTestId('synthetic-stock-quote-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('generic-order-book')).toBeNull()
    expect(screen.queryByTestId('generic-recent-trades')).toBeNull()
  })

  it('forwards the source prop to the panel badge', () => {
    render(<StockMarketData ticker="AAPL" markPrice={218.27} source="fallback" />)
    expect(screen.getByTestId('price-source-badge').getAttribute('data-source')).toBe('fallback')
  })
})
