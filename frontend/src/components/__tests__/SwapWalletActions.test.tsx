import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwapWalletActions } from '../SwapWalletActions'
import { TestWrapper } from '@/test-utils/wrapper'

// Stable test stubs for the RainbowKit render-prop and the swap-execute hook.
// These let us assert connect-wallet wiring without mounting RainbowKitProvider.
const openConnectModal = vi.fn()
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal }),
  },
}))

const swapExecuteState: {
  swap: ReturnType<typeof vi.fn>
  phase: 'idle' | 'approving' | 'swapping' | 'done' | 'error'
  error: string | null
  reset: ReturnType<typeof vi.fn>
  isConnected: boolean
} = {
  swap: vi.fn(),
  phase: 'idle',
  error: null,
  reset: vi.fn(),
  isConnected: true,
}

vi.mock('@/lib/useOnChainSwap', () => ({
  useSwapExecute: () => swapExecuteState,
}))

vi.mock('@/lib/useSwapSettings', () => ({
  useSwapSettings: () => ({ slippage: 0.5, deadline: 30 }),
}))

vi.mock('@/components/ui/toast', () => ({
  toastPending: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('../SwapConfirmModal', () => ({
  SwapConfirmModal: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) =>
    open ? (
      <div data-testid="swap-confirm-modal-open">
        <button data-testid="swap-confirm-modal-button" onClick={onConfirm}>
          Confirm Swap
        </button>
      </div>
    ) : null,
}))

const baseToken = { symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0', category: 'Infrastructure' as const }
const outputToken = { symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1', category: 'GoodDollar' as const }

beforeEach(() => {
  swapExecuteState.swap = vi.fn()
  swapExecuteState.phase = 'idle'
  swapExecuteState.error = null
  swapExecuteState.reset = vi.fn()
  swapExecuteState.isConnected = true
  openConnectModal.mockReset()
})

describe('SwapWalletActions hint text', () => {
  it('shows hint text when hasAmount is false', () => {
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount=""
          hasAmount={false}
        />
      </TestWrapper>
    )
    expect(screen.getByText(/fees fund universal basic income/i)).toBeInTheDocument()
  })

  it('hides hint text when hasAmount is true', () => {
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="1"
          hasAmount={true}
        />
      </TestWrapper>
    )
    expect(screen.queryByText(/fees fund universal basic income/i)).not.toBeInTheDocument()
  })
})

describe('SwapWalletActions — pair-unsupported branch', () => {
  it('renders a disabled "Pair not yet available on GoodSwap" button when pairOnChain=false and amount entered', () => {
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="100"
          hasAmount={true}
          canSubmit={false}
          disabledReason="pair-unsupported"
        />
      </TestWrapper>
    )
    const btn = screen.getByTestId('swap-button-pair-unsupported')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent(/pair not yet available/i)
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/G\$.*ETH.*USDC|ETH.*G\$.*USDC|G\$.*USDC.*ETH/)).toBeInTheDocument()
  })

  it('does not open the Review modal when the pair is unsupported', () => {
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="100"
          hasAmount={true}
          canSubmit={false}
          disabledReason="pair-unsupported"
        />
      </TestWrapper>
    )
    fireEvent.click(screen.getByTestId('swap-button-pair-unsupported'))
    expect(screen.queryByTestId('swap-confirm-modal-open')).not.toBeInTheDocument()
  })
})

describe('SwapWalletActions — connect-wallet branch', () => {
  it('renders a "Connect Wallet to Swap" CTA when wallet is disconnected', () => {
    swapExecuteState.isConnected = false
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="0.5"
          hasAmount={true}
          canSubmit={true}
          pairOnChain={true}
        />
      </TestWrapper>
    )
    const btn = screen.getByTestId('swap-button-connect-wallet')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent(/connect wallet to swap/i)
  })

  it('clicking the connect-wallet CTA opens the RainbowKit connect modal', () => {
    swapExecuteState.isConnected = false
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="0.5"
          hasAmount={true}
          canSubmit={true}
          pairOnChain={true}
        />
      </TestWrapper>
    )
    fireEvent.click(screen.getByTestId('swap-button-connect-wallet'))
    expect(openConnectModal).toHaveBeenCalledTimes(1)
  })

  it('does not render the active swap CTA when wallet is disconnected', () => {
    swapExecuteState.isConnected = false
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="0.5"
          hasAmount={true}
          canSubmit={true}
          pairOnChain={true}
        />
      </TestWrapper>
    )
    expect(screen.queryByTestId('swap-button-active')).not.toBeInTheDocument()
  })
})

describe('SwapWalletActions — confirm flow always fires user-visible action', () => {
  it('clicking the active swap button opens the review modal and confirm fires swap()', () => {
    swapExecuteState.isConnected = true
    render(
      <TestWrapper>
        <SwapWalletActions
          variant="swap-button"
          inputToken={baseToken}
          outputToken={outputToken}
          inputAmount="0.5"
          hasAmount={true}
          canSubmit={true}
          pairOnChain={true}
        />
      </TestWrapper>
    )

    fireEvent.click(screen.getByTestId('swap-button-active'))
    expect(screen.getByTestId('swap-confirm-modal-open')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('swap-confirm-modal-button'))
    expect(swapExecuteState.swap).toHaveBeenCalledTimes(1)
  })
})
