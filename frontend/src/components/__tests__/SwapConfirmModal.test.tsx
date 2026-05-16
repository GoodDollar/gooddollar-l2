import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwapConfirmModal } from '../SwapConfirmModal'

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  inputAmount: '10',
  outputAmount: '997,000',
  inputSymbol: 'ETH',
  outputSymbol: 'G$',
  inputUsd: '~$30,000',
  outputUsd: '~$9,970',
  exchangeRate: '1 ETH = 100,000 G$',
  priceImpact: 0.45,
  minimumReceived: '992,015 G$',
  networkFee: '< $0.01',
  ubiFee: '999.9 G$',
  deadlineMinutes: 30,
}

describe('SwapConfirmModal', () => {
  it('renders when open', () => {
    render(<SwapConfirmModal {...defaultProps} />)
    expect(screen.getByText('Review Swap')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SwapConfirmModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Review Swap')).not.toBeInTheDocument()
  })

  it('shows input and output amounts with tokens', () => {
    render(<SwapConfirmModal {...defaultProps} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('997,000')).toBeInTheDocument()
    expect(screen.getAllByText('G$').length).toBeGreaterThanOrEqual(1)
  })

  it('shows USD equivalents', () => {
    render(<SwapConfirmModal {...defaultProps} />)
    expect(screen.getByText('~$30,000')).toBeInTheDocument()
    expect(screen.getByText('~$9,970')).toBeInTheDocument()
  })

  it('shows exchange rate', () => {
    render(<SwapConfirmModal {...defaultProps} />)
    expect(screen.getByText('1 ETH = 100,000 G$')).toBeInTheDocument()
  })

  it('shows swap details', () => {
    render(<SwapConfirmModal {...defaultProps} />)
    expect(screen.getByText('0.45%')).toBeInTheDocument()
    expect(screen.getByText('992,015 G$')).toBeInTheDocument()
    expect(screen.getByText('< $0.01')).toBeInTheDocument()
  })

  it('shows UBI contribution', () => {
    render(<SwapConfirmModal {...defaultProps} />)
    expect(screen.getByText(/999\.9 G\$/)).toBeInTheDocument()
  })

  it('shows the user-configured auto-cancel deadline (MEV protection)', () => {
    render(<SwapConfirmModal {...defaultProps} deadlineMinutes={30} />)
    expect(screen.getByText(/auto-cancel/i)).toBeInTheDocument()
    expect(screen.getByText('30 minutes')).toBeInTheDocument()
  })

  it('uses singular wording for a 1-minute deadline', () => {
    render(<SwapConfirmModal {...defaultProps} deadlineMinutes={1} />)
    expect(screen.getByText('1 minute')).toBeInTheDocument()
  })

  it('calls onConfirm when Confirm Swap is clicked', () => {
    const onConfirm = vi.fn()
    render(<SwapConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: /confirm swap/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<SwapConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<SwapConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SwapConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.mouseDown(screen.getByTestId('modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  // ── Extreme price-impact gate (MEV / sandwich protection) ────────────────
  describe('extreme price-impact gate', () => {
    it('does NOT render the extreme warning for normal impacts', () => {
      render(<SwapConfirmModal {...defaultProps} priceImpact={0.45} />)
      expect(screen.queryByTestId('extreme-impact-warning')).not.toBeInTheDocument()
      // Confirm button must remain enabled
      const confirm = screen.getByRole('button', { name: /confirm swap/i })
      expect(confirm).not.toBeDisabled()
    })

    it('does NOT render the extreme warning for high (5%) impact', () => {
      render(<SwapConfirmModal {...defaultProps} priceImpact={7} />)
      expect(screen.queryByTestId('extreme-impact-warning')).not.toBeInTheDocument()
      const confirm = screen.getByRole('button', { name: /confirm swap/i })
      expect(confirm).not.toBeDisabled()
    })

    it('renders an extreme-impact warning at 15% and disables Confirm', () => {
      render(<SwapConfirmModal {...defaultProps} priceImpact={20} />)
      const warning = screen.getByTestId('extreme-impact-warning')
      expect(warning).toBeInTheDocument()
      expect(warning.textContent).toMatch(/extreme/i)
      const confirm = screen.getByRole('button', { name: /confirm swap/i })
      expect(confirm).toBeDisabled()
    })

    it('does not call onConfirm when extreme and unacknowledged', () => {
      const onConfirm = vi.fn()
      render(<SwapConfirmModal {...defaultProps} priceImpact={20} onConfirm={onConfirm} />)
      fireEvent.click(screen.getByRole('button', { name: /confirm swap/i }))
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('enables Confirm after the user ticks "I understand"', () => {
      const onConfirm = vi.fn()
      render(<SwapConfirmModal {...defaultProps} priceImpact={20} onConfirm={onConfirm} />)
      const ack = screen.getByRole('checkbox', { name: /i understand/i })
      fireEvent.click(ack)
      const confirm = screen.getByRole('button', { name: /confirm swap/i })
      expect(confirm).not.toBeDisabled()
      fireEvent.click(confirm)
      expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('resets the acknowledgement when the modal is reopened', () => {
      const { rerender } = render(
        <SwapConfirmModal {...defaultProps} priceImpact={20} />,
      )
      // Acknowledge once
      fireEvent.click(screen.getByRole('checkbox', { name: /i understand/i }))
      // Close…
      rerender(<SwapConfirmModal {...defaultProps} priceImpact={20} open={false} />)
      // …and reopen
      rerender(<SwapConfirmModal {...defaultProps} priceImpact={20} open={true} />)
      // Checkbox must be unchecked again, confirm disabled
      const ack = screen.getByRole('checkbox', { name: /i understand/i })
      expect((ack as HTMLInputElement).checked).toBe(false)
      const confirm = screen.getByRole('button', { name: /confirm swap/i })
      expect(confirm).toBeDisabled()
    })
  })
})
