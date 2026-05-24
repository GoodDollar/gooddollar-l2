/**
 * SwapCard over-cap input guard tests (task 0010).
 *
 * Lane 4 promise: the swap surface must refuse to render fantasy quotes.
 * Without a per-symbol input cap the UI happily quotes ~$2 quadrillion of
 * G$ for 99,999,999,999,999 ETH and leaves the green "Swap" CTA enabled.
 *
 * These tests pin the three observable states:
 *   1. under cap   — existing render path unaffected
 *   2. at cap      — existing render path unaffected (cap is inclusive)
 *   3. over cap    — over-cap chip visible, "You receive" em-dash, UBI
 *                    hidden, CTA renders the "Amount Too Large" guard
 *                    button (NOT the active swap button).
 *
 * Mocks mirror SwapCard.dust-guard.test.tsx so we exercise the real
 * SwapWalletActions tree.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

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

vi.mock('../SwapConfirmModal', () => ({
  SwapConfirmModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="swap-confirm-modal-open" /> : null,
}))

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

describe('SwapCard over-cap input guard (task 0010)', () => {
  it('renders normally for inputs comfortably under the per-symbol cap', () => {
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
    fireEvent.change(input, { target: { value: '0.5' } })

    expect(screen.queryByTestId('swap-amount-over-cap')).not.toBeInTheDocument()
    expect(screen.queryByTestId('swap-button-over-cap')).not.toBeInTheDocument()
    expect(screen.getByTestId('swap-button-active')).toBeInTheDocument()
  })

  it('still passes when the input is exactly at the cap (1,000,000 ETH)', () => {
    resetQuote({
      amountOut: 1_000_000_000_000_000_000_000_000n,
      amountOutFormatted: '1000000',
      isSupported: true,
    })

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '1000000' } })

    expect(screen.queryByTestId('swap-amount-over-cap')).not.toBeInTheDocument()
    expect(screen.queryByTestId('swap-button-over-cap')).not.toBeInTheDocument()
  })

  it('shows the over-cap chip and disables submission for absurd inputs', () => {
    resetQuote({
      amountOut: 1_000_000_000_000_000_000_000_000_000_000_000n,
      amountOutFormatted: '1e15',
      isSupported: true,
    })

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    // 99 trillion ETH — well above the 1,000,000 ETH cap.
    fireEvent.change(input, { target: { value: '99999999999999' } })

    const chip = screen.getByTestId('swap-amount-over-cap')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveTextContent(/exceeds the per-swap cap/i)
    expect(chip).toHaveTextContent(/ETH/)

    // Output rendered as em-dash — no fantasy quote.
    expect(screen.getByTestId('output-overcap-desktop')).toHaveTextContent('—')

    // CTA is the over-cap guard, not the active swap button.
    expect(screen.queryByTestId('swap-button-active')).not.toBeInTheDocument()
    const overCapButton = screen.getByTestId('swap-button-over-cap')
    expect(overCapButton).toHaveTextContent(/amount too large/i)
    expect(overCapButton).toBeDisabled()
  })

  it('does not open the confirm modal when the over-cap CTA is clicked', () => {
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
    fireEvent.change(input, { target: { value: '99999999999999' } })

    fireEvent.click(screen.getByTestId('swap-button-over-cap'))

    expect(screen.queryByTestId('swap-confirm-modal-open')).not.toBeInTheDocument()
  })
})
