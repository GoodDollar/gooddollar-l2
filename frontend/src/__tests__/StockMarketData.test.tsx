import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: undefined, isConnected: false })),
}))

vi.mock('@/lib/useStockTrades', () => ({
  useStockTrades: vi.fn(() => ({
    trades: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}))

vi.mock('@/components/OrderBook', () => ({
  OrderBook: ({ markPrice }: { markPrice: number }) => (
    <div data-testid="order-book">OrderBook: {markPrice}</div>
  ),
}))
vi.mock('@/components/RecentTrades', () => ({
  RecentTrades: ({ trades, symbol, markPrice }: { trades: unknown[]; symbol?: string; markPrice?: number }) => (
    <div data-testid="recent-trades" data-symbol={symbol ?? ''} data-trade-count={trades.length}>
      RecentTrades(symbol={symbol ?? ''}, mark={markPrice ?? 'n/a'}, count={trades.length})
    </div>
  ),
}))

import { StockMarketData } from '@/components/stocks/StockMarketData'
import { useAccount } from 'wagmi'
import { useStockTrades } from '@/lib/useStockTrades'

describe('StockMarketData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAccount).mockReturnValue({ address: undefined, isConnected: false } as ReturnType<typeof useAccount>)
    vi.mocked(useStockTrades).mockReturnValue({ trades: [], isLoading: false, isError: false, refetch: vi.fn() })
  })

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

  it('forwards markPrice and symbol to the children', async () => {
    const user = userEvent.setup()
    render(<StockMarketData markPrice={345.67} symbol="AAPL" />)

    expect(screen.getByText('OrderBook: 345.67')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /trades/i }))
    expect(screen.getByText(/RecentTrades\(symbol=AAPL, mark=345.67/)).toBeInTheDocument()
  })

  it('passes 0 trades to RecentTrades when the wallet is unconnected', async () => {
    const user = userEvent.setup()
    render(<StockMarketData markPrice={100} symbol="AAPL" />)
    await user.click(screen.getByRole('tab', { name: /trades/i }))
    expect(screen.getByTestId('recent-trades').dataset.tradeCount).toBe('0')
  })

  it('filters trades to the active ticker before passing to RecentTrades', async () => {
    vi.mocked(useAccount).mockReturnValue({ address: '0xUser', isConnected: true } as ReturnType<typeof useAccount>)
    vi.mocked(useStockTrades).mockReturnValue({
      trades: [
        { id: '1', ticker: 'AAPL', side: 'buy', shares: 5, price: 191, timestamp: 1, pnl: 0 },
        { id: '2', ticker: 'TSLA', side: 'sell', shares: 2, price: 220, timestamp: 2, pnl: 0 },
        { id: '3', ticker: 'AAPL', side: 'sell', shares: 1, price: 192, timestamp: 3, pnl: 0 },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    const user = userEvent.setup()
    render(<StockMarketData markPrice={191} symbol="AAPL" />)
    await user.click(screen.getByRole('tab', { name: /trades/i }))
    expect(screen.getByTestId('recent-trades').dataset.tradeCount).toBe('2')
  })

  it('caps the forwarded trades to the most recent 20', async () => {
    vi.mocked(useAccount).mockReturnValue({ address: '0xUser', isConnected: true } as ReturnType<typeof useAccount>)
    vi.mocked(useStockTrades).mockReturnValue({
      trades: Array.from({ length: 30 }, (_, i) => ({
        id: `t${i}`,
        ticker: 'AAPL',
        side: i % 2 === 0 ? 'buy' as const : 'sell' as const,
        shares: 1,
        price: 100 + i,
        timestamp: i,
        pnl: 0,
      })),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    const user = userEvent.setup()
    render(<StockMarketData markPrice={191} symbol="AAPL" />)
    await user.click(screen.getByRole('tab', { name: /trades/i }))
    expect(screen.getByTestId('recent-trades').dataset.tradeCount).toBe('20')
  })
})
