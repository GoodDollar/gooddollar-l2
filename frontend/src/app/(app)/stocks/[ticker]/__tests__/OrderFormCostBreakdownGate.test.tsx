/**
 * @file OrderFormCostBreakdownGate.test.tsx
 * @summary RTL component tests for the Sell-side cost-breakdown render gate.
 *
 * Task 0029 — fix-stocks-cost-breakdown-shows-while-exceeds-balance
 *   Before this change, on the Sell tab the cost-breakdown panel (Est. Shares /
 *   Price / Fee / UBI Pool) continued to render even when the user's amount
 *   exceeded their on-chain balance. The screen then showed a red "you only
 *   hold N" banner AND a confirmation-style order summary at the same time,
 *   which is contradictory. The submit button was already correctly disabled,
 *   so this is a pure UI-clarity bug, not a funds-at-risk bug.
 *
 *   This test pins the corrected behaviour:
 *
 *     - Sell + amount within balance     → red banner hidden, breakdown shown.
 *     - Sell + amount exceeds balance    → red banner shown, breakdown HIDDEN.
 *     - Sell + amount exceeds MAX cap    → "too large" hint shown, breakdown HIDDEN. (regression guard)
 *     - Buy + same oversized USD amount  → breakdown SHOWN (sell-balance flag is sell-only).
 *
 * Mocks intentionally stub wallet + on-chain hooks; we are only exercising
 * the JSX render gate at <OrderForm>.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- module mocks ---------------------------------------------------------

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => React.ReactNode }) => <>{children({ openConnectModal: () => {} })}</> },
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: vi.fn(),
  WalletReadyContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
}))

const mintMock = vi.fn()
const redeemMock = vi.fn()

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: vi.fn(),
  useRedeemSynthetic: vi.fn(),
  useStockPosition: vi.fn(() => ({ position: null, isLoading: false, refetch: vi.fn() })),
}))

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => true,
}))

// --- resolve mocks after registration ------------------------------------
const { useAccount } = await import('wagmi')
const { useWalletReady } = await import('@/lib/WalletReadyContext')
const { useMintSynthetic, useRedeemSynthetic } = await import('@/lib/useStocks')

const { StockOrderForm: OrderForm } = await import('@/components/stocks/StockOrderForm')

// --- fixtures ------------------------------------------------------------

// Use stock.price = 200 so the arithmetic in the docstring lines up:
// 0.5 shares held; $50 → 0.25 sh (within balance), $200 → 1.0 sh (over balance).
const stock = { ticker: 'AAPL', price: 200 }

// Minimal OnChainStockPosition stub. Only debtFloat is read by computeSellGuards;
// the other fields are present so the type matches at the prop boundary.
function positionWith({ debtFloat }: { debtFloat: number }) {
  return {
    debtFloat,
    collateralFloat: 1000,
    collateralRatio: 2,
    debt: BigInt(0),
    collateral: BigInt(0),
  } as unknown as Parameters<typeof OrderForm>[0]['position']
}

function setupHooks({ isConnected = true, isDeployed = true } = {}) {
  vi.mocked(useAccount).mockReturnValue({
    address: isConnected ? '0x1111111111111111111111111111111111111111' : undefined,
    isConnected,
  } as unknown as ReturnType<typeof useAccount>)

  vi.mocked(useWalletReady).mockReturnValue(true)

  vi.mocked(useMintSynthetic).mockReturnValue({
    mint: mintMock,
    phase: 'idle',
    error: null,
    reset: vi.fn(),
    isConnected,
    isDeployed,
  } as unknown as ReturnType<typeof useMintSynthetic>)

  vi.mocked(useRedeemSynthetic).mockReturnValue({
    redeem: redeemMock,
    phase: 'idle',
    error: null,
    reset: vi.fn(),
    isConnected,
  } as unknown as ReturnType<typeof useRedeemSynthetic>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('<OrderForm> sell-side cost-breakdown render gate', () => {
  it('renders the cost breakdown on Sell tab when amount is within balance', async () => {
    setupHooks({ isDeployed: false }) // devnet stub path keeps Market tab simple
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={positionWith({ debtFloat: 0.5 })} />)

    await user.click(screen.getByRole('button', { name: /^sell$/i }))

    const amountInput = screen.getByTestId('stocks-order-amount-input')
    await user.type(amountInput, '50') // 50 / 200 = 0.25 shares ≤ 0.5 → within balance

    // No exceed-balance banner.
    expect(
      screen.queryByText(/you only hold .* AAPL\. reduce the amount to sell\./i),
    ).not.toBeInTheDocument()

    // Cost breakdown IS visible.
    expect(screen.getByTestId('stocks-cost-breakdown')).toBeInTheDocument()
  })

  it('HIDES the cost breakdown on Sell tab when amount exceeds balance, banner remains', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={positionWith({ debtFloat: 0.5 })} />)

    await user.click(screen.getByRole('button', { name: /^sell$/i }))

    const amountInput = screen.getByTestId('stocks-order-amount-input')
    await user.type(amountInput, '200') // 200 / 200 = 1.0 share > 0.5 → exceeds balance

    // Red exceed-balance banner is the sole signal.
    expect(
      screen.getByText(/you only hold .* AAPL\. reduce the amount to sell\./i),
    ).toBeInTheDocument()

    // Cost breakdown must NOT render.
    expect(screen.queryByTestId('stocks-cost-breakdown')).not.toBeInTheDocument()
  })

  it('HIDES the cost breakdown on Sell tab when amount exceeds the global MAX cap (regression guard)', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={positionWith({ debtFloat: 100 })} />)

    await user.click(screen.getByRole('button', { name: /^sell$/i }))

    const amountInput = screen.getByTestId('stocks-order-amount-input')
    // MAX_STOCK_ORDER_USD is 100_000 in the component; type something well over it.
    await user.type(amountInput, '999999')

    expect(screen.queryByTestId('stocks-cost-breakdown')).not.toBeInTheDocument()
  })

  it('keeps the cost breakdown VISIBLE on the Buy tab even if the same USD amount would exceed the sell balance', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()

    // User holds 0.5 sAAPL but is buying — the sell-side gate must not leak.
    render(<OrderForm stock={stock} position={positionWith({ debtFloat: 0.5 })} />)

    // Stay on the default Buy tab (no click), or click Buy to be explicit.
    await user.click(screen.getByRole('button', { name: /^buy$/i }))

    const amountInput = screen.getByTestId('stocks-order-amount-input')
    await user.type(amountInput, '200')

    expect(
      screen.queryByText(/you only hold .* AAPL\. reduce the amount to sell\./i),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('stocks-cost-breakdown')).toBeInTheDocument()
  })
})
