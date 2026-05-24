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

const priceFeedsState: {
  prices: Record<string, number>
  isLive: boolean
  sources: Record<string, string>
} = {
  prices: { 'G$': 0.0001, ETH: 3000, WETH: 3000, USDC: 1 },
  isLive: true,
  sources: { 'G$': 'chain-oracle', ETH: 'chain-oracle', WETH: 'chain-oracle', USDC: 'chain-oracle' },
}

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: () => priceFeedsState,
  getPrice: (prices: Record<string, number>, symbol: string) => prices[symbol] ?? 0,
}))

vi.mock('@/lib/useOnChainSwap', () => ({
  useSwapQuote: () => ({
    amountOut: undefined,
    amountOutFormatted: '',
    isLoading: false,
    isSupported: false,
    priceImpactPct: 0,
  }),
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
  useSwapSettings: () => ({
    slippage: 0.5, setSlippage: vi.fn(), deadline: 20, setDeadline: vi.fn(),
  }),
}))

vi.mock('@/components/ui/toast', () => ({
  toastPending: vi.fn(), toastSuccess: vi.fn(), toastError: vi.fn(),
}))

vi.mock('../SwapConfirmModal', () => ({
  SwapConfirmModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="swap-confirm-modal-open" /> : null,
}))

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  const cache = new Map<string, React.ComponentType<Record<string, unknown>>>()
  const motion = new Proxy({} as Record<string, React.ComponentType<Record<string, unknown>>>, {
    get: (_t, prop: string) => {
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

function setSources(sources: Record<string, string>) {
  priceFeedsState.sources = sources
}

beforeEach(() => {
  setSources({ 'G$': 'chain-oracle', ETH: 'chain-oracle', WETH: 'chain-oracle', USDC: 'chain-oracle' })
  priceFeedsState.isLive = true
})

describe('SwapCard — source attribution badge', () => {
  it('shows "Chain oracle" near the rate row when both legs come from chain-oracle', () => {
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>,
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '1' } })

    const badges = screen.getAllByTestId('price-source-badge')
    // The rate row has at least one badge attached when an amount is entered.
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0]).toHaveAttribute('data-source', 'chain-oracle')
    expect(screen.getAllByText('Chain oracle').length).toBeGreaterThan(0)
  })

  it('downgrades to fallback when every leg of the rate is fallback (and shows the stale banner)', () => {
    setSources({ 'G$': 'fallback', ETH: 'fallback', WETH: 'fallback', USDC: 'fallback' })
    priceFeedsState.isLive = false

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>,
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '1' } })

    // The existing stale banner is still rendered when !isLive
    expect(screen.getByTestId('stale-price-banner')).toBeInTheDocument()
    // PLUS the new inline source badge with `fallback` source
    const badges = screen.getAllByTestId('price-source-badge')
    expect(badges.some(b => b.getAttribute('data-source') === 'fallback')).toBe(true)
  })

  it('downgrades the rate badge to fallback when one leg is fallback even if the other is chain-oracle', () => {
    // Default tokens in SwapCard are input=ETH, output=G$. Mark G$ as fallback;
    // the resolved rate source must be `fallback` (the worse of the two).
    setSources({ 'G$': 'fallback', ETH: 'chain-oracle', WETH: 'chain-oracle', USDC: 'chain-oracle' })

    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>,
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '1' } })

    const badges = screen.getAllByTestId('price-source-badge')
    expect(badges.some(b => b.getAttribute('data-source') === 'fallback')).toBe(true)
  })
})
