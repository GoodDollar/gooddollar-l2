/**
 * Edge-case tests for SwapCard input/output rendering.
 *
 * Covers task 0063 — trillion-scale and sub-dust pathologies:
 *   - `maxLength` and `sanitizeNumericInput` cap input at 16 chars
 *   - regression guards for `-1` and `0.1.5`
 *   - large `rawOutputAmount` falls back to compact form on desktop
 *   - sub-dust `rawOutputAmount` renders the `< 0.000001` floor literal
 *   - amber pill appears when input is at the 16-char cap
 *
 * The heavy on-chain hooks are mocked so we can drive `useSwapQuote`
 * directly through a per-test setter and exercise the render branches
 * without spinning up wagmi or coingecko.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'
import { sanitizeNumericInput } from '@/lib/format'

// --- Mocks (declared before importing SwapCard) ---

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Stable, deterministic price feed so `usePriceFeeds` doesn't touch
// the network and `formatUsdValue` produces predictable strings.
vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: () => ({
    prices: { 'G$': 0.0001, 'ETH': 3000, 'WETH': 3000, 'USDC': 1 },
    isLive: false,
  }),
  getPrice: (prices: Record<string, number>, symbol: string) =>
    prices[symbol] ?? 0,
}))

// `useSwapQuote` is hoisted via a mutable holder so each test can set
// the return shape it needs to exercise.
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
  getPriceImpactSeverity: () => 'normal' as const,
}))

vi.mock('../SwapWalletActions', () => ({
  SwapWalletActions: () => null,
}))

vi.mock('../SwapConfirmModal', () => ({
  SwapConfirmModal: () => null,
}))

// Reduce framer-motion to a passthrough so AnimatedNumber renders the
// final string synchronously inside test renders. The proxy caches the
// returned component per tag name so React sees stable identity across
// re-renders (otherwise state in children resets every change event).
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  const cache = new Map<string, React.ComponentType<Record<string, unknown>>>()
  const motion = new Proxy({} as Record<string, React.ComponentType<Record<string, unknown>>>, {
    get: (_target, prop: string) => {
      if (!cache.has(prop)) {
        const Tag = prop as keyof JSX.IntrinsicElements
        const Component: React.ComponentType<Record<string, unknown>> = (props) => {
          const { children, ...rest } = props as { children?: React.ReactNode }
          // Strip motion-only props that React will warn about on a plain HTML tag.
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

// Now safe to import the component under test
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

describe('sanitizeNumericInput regression guards (task 0063)', () => {
  it('strips the negative sign from "-1"', () => {
    expect(sanitizeNumericInput('-1')).toBe('1')
  })

  it('collapses "0.1.5" to "0.15"', () => {
    expect(sanitizeNumericInput('0.1.5')).toBe('0.15')
  })

  it('strips non-digit characters', () => {
    expect(sanitizeNumericInput('abc12.3xyz')).toBe('12.3')
  })

  it('preserves a single trailing dot for in-progress typing', () => {
    expect(sanitizeNumericInput('12.')).toBe('12.')
  })

  it('caps to 16 characters when sliced (caller responsibility)', () => {
    // The cap is applied by the input handler via .slice(0, 16),
    // not by sanitizeNumericInput itself. Verify the expected combo.
    const raw = '1'.repeat(20)
    const result = sanitizeNumericInput(raw).slice(0, 16)
    expect(result).toBe('1111111111111111')
    expect(result.length).toBe(16)
  })
})

describe('SwapCard input length cap', () => {
  it('enforces maxLength=16 on the input element', () => {
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.getAttribute('maxLength')).toBe('16')
  })

  it('drops characters past the 16-char cap via onChange', () => {
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Simulate a paste of 20 digits — the handler should clamp to 16.
    fireEvent.change(input, { target: { value: '1'.repeat(20) } })
    expect(input.value).toBe('1111111111111111')
    expect(input.value.length).toBe(16)
  })

  it('shows a warning chip when the input length reaches 16', () => {
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Below cap (and below the over-cap sanity gate) → no warning of either kind.
    fireEvent.change(input, { target: { value: '12345' } })
    expect(screen.queryByTestId('input-cap-warning')).not.toBeInTheDocument()
    expect(screen.queryByTestId('swap-amount-over-cap')).not.toBeInTheDocument()
    // 16 characters of "9" — a 10^15-scale number, well above every per-symbol
    // cap. The newer over-cap chip takes precedence over the legacy length-only
    // chip; either way a warning is visible.
    fireEvent.change(input, { target: { value: '1234567890123456' } })
    const warning =
      screen.queryByTestId('swap-amount-over-cap') ??
      screen.getByTestId('input-cap-warning')
    expect(warning).toBeInTheDocument()
    expect(warning.textContent ?? '').toMatch(/(unusually large|exceeds the per-swap cap)/i)
  })
})

describe('SwapCard output overflow guard', () => {
  it('uses the compact form on desktop when integer digits exceed 10', () => {
    resetQuote({
      amountOut: 2_494_190_417_250_075_080_780_000n,
      amountOutFormatted: '2494190417250075.08',
      isSupported: true,
    })
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    // Any non-zero input triggers the output render path.
    fireEvent.change(input, { target: { value: '1' } })
    const compact = screen.queryByTestId('output-compact')
    expect(compact).toBeInTheDocument()
    // Compact form should be much shorter than the raw 16+ digit string.
    expect((compact?.textContent ?? '').length).toBeLessThan(12)
  })

  it('falls back to the floor literal when output is below 1e-6', () => {
    resetQuote({
      amountOut: 1n, // 1 wei → 1e-18, well below the 1e-6 floor
      amountOutFormatted: '0.000000000000000001',
      isSupported: true,
    })
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '0.000000000000000001' } })
    const floor = screen.queryByTestId('output-floor')
    expect(floor).toBeInTheDocument()
    expect(floor).toHaveTextContent('< 0.000001')
  })

  it('renders the full precise value via title attribute even when display is compact', () => {
    resetQuote({
      amountOut: 2_494_190_417_250_075_080_780_000n,
      amountOutFormatted: '2494190417250075.08',
      isSupported: true,
    })
    render(
      <TestWrapper>
        <SwapCard />
      </TestWrapper>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '1' } })
    const wrapper = screen.getByTestId('output-amount')
    expect(wrapper.getAttribute('title')).toBeTruthy()
    // Title should be non-empty so the user can hover for the raw number.
    expect((wrapper.getAttribute('title') ?? '').length).toBeGreaterThan(5)
  })
})
