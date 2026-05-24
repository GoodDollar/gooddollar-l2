/**
 * Dust-amount submission guard tests for SwapCard.
 *
 * Covers task 0081 — security: prevent users from submitting swaps with
 * inputs so small the on-chain quote rounds to zero output. Such swaps:
 *   1. Waste gas (the router reverts on `amountOut == 0`), and
 *   2. Neutralise slippage protection — `minimumReceived = 0` means a
 *      sandwich attacker can take the entire output trade.
 *
 * Sibling file `SwapCard.edge.test.tsx` mocks `SwapWalletActions` to null,
 * so it cannot assert on the swap button's text or click behavior. This
 * file does NOT mock `SwapWalletActions` — we test the real component
 * tree and only stub `SwapConfirmModal` with a sentinel so we can detect
 * whether it would have opened.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// --- Mocks (declared before importing SwapCard) ---

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn() }),
  },
}))

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: () => ({
    prices: { 'G$': 0.0001, 'ETH': 3000, 'WETH': 3000, 'USDC': 1 },
    isLive: false,
  }),
  getPrice: (prices: Record<string, number>, symbol: string) =>
    prices[symbol] ?? 0,
}))

// Mutable quote holder so each test can drive the dust / healthy branch.
const swapQuoteState: {
  amountOut: bigint | undefined
  amountOutFormatted: string
  isLoading: boolean
  isSupported: boolean
  priceImpactPct?: number
} = {
  amountOut: undefined,
  amountOutFormatted: '',
  isLoading: false,
  isSupported: true,
  priceImpactPct: 0,
}

vi.mock('@/lib/useOnChainSwap', () => ({
  useSwapQuote: () => swapQuoteState,
  // SwapWalletActions calls useSwapExecute on mount — stub to a stable shape.
  useSwapExecute: () => ({
    swap: vi.fn(),
    phase: 'idle' as const,
    error: null,
    reset: vi.fn(),
    isConnected: true,
  }),
  getPriceImpactSeverity: () => 'normal' as const,
}))

vi.mock('@/lib/useSwapSettings', () => ({
  SWAP_SETTINGS_DEFAULTS: { slippage: 0.5, deadline: 30 },
  useSwapSettings: () => ({
    slippage: 0.5,
    setSlippage: vi.fn(),
    deadline: 20,
    setDeadline: vi.fn(),
  }),
}))

vi.mock('@/components/ui/toast', () => ({
  toastPending: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

// Sentinel for SwapConfirmModal — renders a marker iff `open` is true so we
// can assert from a test that the modal would-have-opened.
vi.mock('../SwapConfirmModal', () => ({
  SwapConfirmModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="swap-confirm-modal-open" /> : null,
}))

// framer-motion passthrough (same shape as SwapCard.edge.test.tsx)
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  const cache = new Map<string, React.ComponentType<Record<string, unknown>>>()
  const motion = new Proxy({} as Record<string, React.ComponentType<Record<string, unknown>>>, {
    get: (_target, prop: string) => {
      if (!cache.has(prop)) {
        const Tag = prop as keyof JSX.IntrinsicElements
        const Component: React.ComponentType<Record<string, unknown>> = (props) => {
          const { children, ...rest } = props as { children?: React.ReactNode }
          const cleaned: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(rest)) {
            if (
              k === 'initial' || k === 'animate' || k === 'exit' || k === 'transition' ||
              k === 'whileHover' || k === 'whileTap' || k === 'whileFocus' || k === 'whileInView' ||
              k === 'layout' || k === 'layoutId' || k === 'variants' || k === 'drag'
            ) continue
            cleaned[k] = v
          }
          return <Tag {...cleaned}>{children}</Tag>
        }
        Component.displayName = `motion.${prop}`
        cache.set(prop, Component)
      }
      return cache.get(prop)!
    },
  })
  return {
    ...actual,
    motion,
    useMotionValue: (v: number) => ({ set: () => {}, get: () => v }),
    useSpring: (v: { get: () => number }) => v,
    useTransform: (_v: unknown, fn: (n: number) => unknown) => fn(0),
  }
})

// Import after all mocks are registered.
import { SwapCard } from '../SwapCard'

function resetQuote(partial: Partial<typeof swapQuoteState> = {}) {
  Object.assign(swapQuoteState, {
    amountOut: undefined,
    amountOutFormatted: '',
    isLoading: false,
    isSupported: true,
    priceImpactPct: 0,
    ...partial,
  })
}

beforeEach(() => {
  resetQuote()
})

/**
 * The swap input area and the swap submit button both expose an `input`
 * with `inputMode="decimal"`. The submit button itself is rendered as a
 * `<button>`. We use testid selectors for the buttons to avoid coupling
 * to user-facing copy.
 */
describe('SwapCard dust-amount submission guard (task 0081)', () => {
  it('renders the "Amount Too Small" button when the on-chain quote rounds to sub-floor', () => {
    // 1 wei output for a non-trivial input → rawOutputAmount ≈ 1e-18,
    // well below the FLOOR_THRESHOLD of 1e-6.
    resetQuote({
      amountOut: 1n,
      amountOutFormatted: '0.000000000000000001',
      isSupported: true,
    })

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0.0000000000001' } })

    // Active swap button must NOT be in the DOM — the guard branch should render instead.
    expect(screen.queryByTestId('swap-button-active')).not.toBeInTheDocument()

    const dustButton = screen.getByTestId('swap-button-dust-guard')
    expect(dustButton).toBeInTheDocument()
    expect(dustButton).toHaveTextContent(/amount too small/i)
    expect(dustButton).toHaveAttribute('aria-disabled', 'true')
  })

  it('prevents the confirmation modal from opening on a dust input click', () => {
    resetQuote({
      amountOut: 1n,
      amountOutFormatted: '0.000000000000000001',
      isSupported: true,
    })

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0.0000000000001' } })

    // Click the guard button; nothing about it should open the modal.
    fireEvent.click(screen.getByTestId('swap-button-dust-guard'))

    expect(screen.queryByTestId('swap-confirm-modal-open')).not.toBeInTheDocument()
  })

  it('renders the active swap button for a healthy on-chain quote', () => {
    // 1 ETH worth of WETH (1e18 wei) → rawOutputAmount = 1, well above floor.
    resetQuote({
      amountOut: 1_000_000_000_000_000_000n,
      amountOutFormatted: '1.0',
      isSupported: true,
    })

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '100' } })

    // Active button is rendered; the guard branch is not.
    expect(screen.queryByTestId('swap-button-dust-guard')).not.toBeInTheDocument()
    const activeButton = screen.getByTestId('swap-button-active')
    expect(activeButton).toBeInTheDocument()
    expect(activeButton).not.toBeDisabled()
  })

  it('renders the empty-state button when no amount is entered', () => {
    // No quote, no input — should show the original "Enter an Amount" state.
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )

    expect(screen.queryByTestId('swap-button-active')).not.toBeInTheDocument()
    expect(screen.queryByTestId('swap-button-dust-guard')).not.toBeInTheDocument()
    const emptyButton = screen.getByTestId('swap-button-empty')
    expect(emptyButton).toBeInTheDocument()
    expect(emptyButton).toHaveTextContent(/enter an amount/i)
  })
})
