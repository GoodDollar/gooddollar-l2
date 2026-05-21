import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as const

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: mockAddress })),
}))

vi.mock('@/lib/useStockHoldings', () => ({
  useStockHoldings: vi.fn(() => ({
    holdings: [],
    totalValue: 5000,
    totalCollateral: 3000,
    totalRequired: 1500,
    unrealizedPnl: 250,
    pnlPercent: 5.26,
    healthRatio: 200,
    isLive: true,
    isLoading: false,
  })),
}))

import { StockAccountPanel } from '@/components/stocks/StockAccountPanel'
import { useAccount } from 'wagmi'
import { useStockHoldings } from '@/lib/useStockHoldings'

describe('StockAccountPanel', () => {
  it('renders account summary with key metrics', () => {
    render(<StockAccountPanel />)
    expect(screen.getByTestId('stock-account-panel')).toBeInTheDocument()
    expect(screen.getByText('Account Summary')).toBeInTheDocument()
    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('Unrealized P&L')).toBeInTheDocument()
    expect(screen.getByText('Collateral')).toBeInTheDocument()
    expect(screen.getByText('Buying Power')).toBeInTheDocument()
    expect(screen.getByText('Collateral Health')).toBeInTheDocument()
  })

  it('shows buying power as collateral minus required', () => {
    render(<StockAccountPanel />)
    // buyingPower = 3000 - 1500 = 1500 → formatted as $1,500.00
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
  })

  it('does not render when wallet is disconnected', () => {
    vi.mocked(useAccount).mockReturnValueOnce({ address: undefined } as any)
    const { container } = render(<StockAccountPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does not render while loading', () => {
    vi.mocked(useStockHoldings).mockReturnValueOnce({
      holdings: [],
      totalValue: 0,
      totalCollateral: 0,
      totalRequired: 0,
      unrealizedPnl: 0,
      pnlPercent: 0,
      healthRatio: 0,
      isLive: false,
      isLoading: true,
    })
    const { container } = render(<StockAccountPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows green P&L for positive values', () => {
    render(<StockAccountPanel />)
    const pnlEl = screen.getByText(/\+\$250\.00/)
    expect(pnlEl).toHaveClass('text-green-400')
  })

  it('shows red P&L for negative values', () => {
    vi.mocked(useStockHoldings).mockReturnValueOnce({
      holdings: [],
      totalValue: 4750,
      totalCollateral: 3000,
      totalRequired: 1500,
      unrealizedPnl: -250,
      pnlPercent: -5.0,
      healthRatio: 200,
      isLive: true,
      isLoading: false,
    })
    render(<StockAccountPanel />)
    const pnlEl = screen.getByText(/-\$250\.00/)
    expect(pnlEl).toHaveClass('text-red-400')
  })
})
