import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AmmTradingPanel } from '../AmmTradingPanel'

describe('AmmTradingPanel', () => {
  const baseProps = {
    oraclePrice: 195.5,
    inventoryLong: 5000,
    inventoryShort: 3000,
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

  it('shows warning when market is HALTED', () => {
    render(<AmmTradingPanel {...baseProps} marketState="HALTED" />)
    expect(screen.getByText(/trading is paused/i)).toBeInTheDocument()
  })

  it('shows inventory skew visualization', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/inventory skew/i)).toBeInTheDocument()
  })

  it('renders spread value', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.getByText(/spread/i)).toBeInTheDocument()
  })

  it('does not render any trade button or order input', () => {
    render(<AmmTradingPanel {...baseProps} />)
    expect(screen.queryByRole('button', { name: /buy/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sell/i })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/order size/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/slippage/i)).not.toBeInTheDocument()
  })
})
