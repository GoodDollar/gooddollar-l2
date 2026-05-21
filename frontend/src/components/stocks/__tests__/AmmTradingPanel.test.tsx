import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AmmTradingPanel } from '../AmmTradingPanel'

describe('AmmTradingPanel', () => {
  const baseProps = {
    oraclePrice: 195.5,
    inventoryLong: 5000,
    inventoryShort: 3000,
    poolLiquidity: 1_000_000,
    marketState: 'OPEN' as const,
    ticker: 'AAPL',
  }

  it('renders oracle price', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/oracle mid/i)).toBeInTheDocument()
    expect(screen.getByText('$195.50')).toBeInTheDocument()
  })

  it('shows bid and ask prices', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/bid/i)).toBeInTheDocument()
    expect(screen.getByText(/ask/i)).toBeInTheDocument()
  })

  it('shows market state badge', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText('OPEN')).toBeInTheDocument()
  })

  it('disables trade button when market is CLOSED', () => {
    render(<AmmTradingPanel {...baseProps} marketState="CLOSED" />)
    const tradeBtn = screen.getByRole('button', { name: /market closed/i })
    expect(tradeBtn).toBeDisabled()
  })

  it('shows warning when market is HALTED', () => {
    render(<AmmTradingPanel {...baseProps} marketState="HALTED" />)
    expect(screen.getByText(/trading is paused/i)).toBeInTheDocument()
  })

  it('shows inventory skew visualization', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/inventory skew/i)).toBeInTheDocument()
  })

  it('computes price impact when order size is entered', () => {
    render(<AmmTradingPanel {...baseProps} />)
    const input = screen.getByPlaceholderText(/order size/i)
    fireEvent.change(input, { target: { value: '10000' } })
    expect(screen.getByText(/price impact/i)).toBeInTheDocument()
  })

  it('shows slippage tolerance selector', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/slippage/i)).toBeInTheDocument()
  })

  it('renders spread value', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/spread/i)).toBeInTheDocument()
  })

  it('allows toggling between buy and sell', () => {
    render(<AmmTradingPanel {...baseProps} />)
    const sellBtn = screen.getByRole('button', { name: /sell/i })
    fireEvent.click(sellBtn)
    expect(sellBtn).toHaveClass('bg-red-600')
  })
})
