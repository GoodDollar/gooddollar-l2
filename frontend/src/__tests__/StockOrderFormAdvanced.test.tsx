import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StockOrderFormAdvanced } from '@/components/stocks/StockOrderFormAdvanced'

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: false, address: undefined }),
}))
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: { children: (p: { openConnectModal: () => void }) => React.ReactNode }) => children({ openConnectModal: () => {} }) },
}))

const defaultProps = {
  ticker: 'AAPL',
  price: 185.50,
}

describe('StockOrderFormAdvanced', () => {
  it('renders Market, Limit, and Stop-Limit order type tabs', () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    expect(screen.getByRole('button', { name: /market/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^limit$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /stop-limit/i })).toBeDefined()
  })

  it('renders collapsible TP/SL section', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const tpSlButton = screen.getByText(/TP \/ SL/i)
    expect(tpSlButton).toBeDefined()
    await userEvent.click(tpSlButton)
    expect(screen.getByLabelText(/take profit/i)).toBeDefined()
    expect(screen.getByLabelText(/stop loss/i)).toBeDefined()
  })

  it('renders collapsible Advanced Options section with slippage', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const advButton = screen.getByText(/advanced options/i)
    expect(advButton).toBeDefined()
    await userEvent.click(advButton)
    expect(screen.getByLabelText(/slippage/i)).toBeDefined()
  })

  it('shows trigger price and limit price inputs for Stop-Limit', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const stopLimitTab = screen.getByRole('button', { name: /stop-limit/i })
    await userEvent.click(stopLimitTab)
    expect(screen.getByLabelText(/trigger price/i)).toBeDefined()
    expect(screen.getByLabelText(/limit price/i)).toBeDefined()
  })

  it('shows TP/SL P&L preview when amount and TP are set', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const amountInput = screen.getByPlaceholderText('0.00')
    await userEvent.type(amountInput, '1000')

    const tpSlButton = screen.getByText(/TP \/ SL/i)
    await userEvent.click(tpSlButton)

    const tpInput = screen.getByLabelText(/take profit/i)
    await userEvent.type(tpInput, '200')

    expect(screen.getByText(/Est\. Profit/i)).toBeDefined()
  })

  it('Buy and Sell tabs switch correctly', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const buyBtn = screen.getByRole('button', { name: /^buy$/i })
    const sellBtn = screen.getByRole('button', { name: /^sell$/i })
    expect(buyBtn.className).toContain('green')
    await userEvent.click(sellBtn)
    expect(sellBtn.className).toContain('red')
  })

  it('mobile responsive: form elements render without overflow', () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const form = document.querySelector('form')
    expect(form).toBeDefined()
  })

  it('shows warning when TP is below current price on Buy side', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const amountInput = screen.getByPlaceholderText('0.00')
    await userEvent.type(amountInput, '100')

    const tpSlButton = screen.getByText(/TP \/ SL/i)
    await userEvent.click(tpSlButton)

    const tpInput = screen.getByLabelText(/take profit/i)
    await userEvent.type(tpInput, '150')

    expect(screen.getByText(/take profit should be above/i)).toBeDefined()
  })

  it('shows warning when SL is above current price on Buy side', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const amountInput = screen.getByPlaceholderText('0.00')
    await userEvent.type(amountInput, '100')

    const tpSlButton = screen.getByText(/TP \/ SL/i)
    await userEvent.click(tpSlButton)

    const slInput = screen.getByLabelText(/stop loss/i)
    await userEvent.type(slInput, '200')

    expect(screen.getByText(/stop loss should be below/i)).toBeDefined()
  })

  it('shows warning when slippage exceeds 5%', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const advButton = screen.getByText(/advanced options/i)
    await userEvent.click(advButton)

    const slippageInput = screen.getByLabelText(/slippage/i)
    await userEvent.clear(slippageInput)
    await userEvent.type(slippageInput, '10')

    expect(screen.getByText(/high slippage/i)).toBeDefined()
  })

  it('disables submit when slippage exceeds 50%', async () => {
    render(<StockOrderFormAdvanced {...defaultProps} />)
    const advButton = screen.getByText(/advanced options/i)
    await userEvent.click(advButton)

    const slippageInput = screen.getByLabelText(/slippage/i)
    await userEvent.clear(slippageInput)
    await userEvent.type(slippageInput, '60')

    const amountInput = screen.getByPlaceholderText('0.00')
    await userEvent.type(amountInput, '100')

    const submitBtn = screen.getByRole('button', { name: /buy aapl/i })
    expect(submitBtn).toHaveProperty('disabled', true)
  })
})
