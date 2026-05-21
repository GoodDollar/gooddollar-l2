/**
 * @file OrderFormSellGatedSwitchToBuy.test.tsx
 * @summary RTL component tests for the sell-gated banner's inline "Buy" affordance.
 *
 * Task 0030 — fix-stocks-sell-gated-switch-to-buy-not-actionable
 *   Before this change, the sell-gated banner rendered the word "Buy" as a
 *   bold `<span>` — visually emphasised but not interactive. A user reading
 *   "Switch to **Buy** to open a position first" would intuitively click the
 *   highlighted word and the form would not respond. The actual tab toggle
 *   lives higher in the form.
 *
 *   This test pins the corrected behaviour: the inline "Buy" inside the
 *   banner is a real `<button type="button">` that flips the form's side
 *   to Buy without clearing the Amount (USD) input value.
 *
 * Invariant under test:
 *   - In a sell-gated state (connected wallet + zero debt), an inline
 *     interactive control inside the banner switches the form to the Buy
 *     side. The submit button label flips from "Sell AAPL" to "Buy AAPL"
 *     and a previously-entered amount is preserved.
 *
 * Mocks intentionally stub wallet + on-chain hooks; we are only exercising
 * JSX behaviour at <OrderForm>.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- module mocks ---------------------------------------------------------

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => React.ReactNode }) => (
      <>{children({ openConnectModal: () => {} })}</>
    ),
  },
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

const stock = { ticker: 'AAPL', price: 200 }

// Position with `debtFloat: 0` keeps `hasPosition === false`, so the
// sell-gated banner appears the moment the user clicks the Sell tab.
function zeroPosition() {
  return {
    debtFloat: 0,
    collateralFloat: 0,
    collateralRatio: 0,
    debt: BigInt(0),
    collateral: BigInt(0),
  } as unknown as Parameters<typeof OrderForm>[0]['position']
}

function setupHooks({ isConnected = true, isDeployed = false } = {}) {
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

describe('<OrderForm> sell-gated banner — inline Buy is an actionable button', () => {
  it('renders the banner with an interactive Buy button (not a span) when sell-gated', async () => {
    setupHooks()
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={zeroPosition()} />)

    // Switch to Sell tab to surface the sell-gated banner.
    await user.click(screen.getByRole('button', { name: /^sell$/i }))

    const inlineBuyBtn = screen.getByRole('button', { name: /switch to buy tab/i })
    expect(inlineBuyBtn).toBeInTheDocument()

    // It must be an explicit type="button" so Enter on the banner area
    // never triggers a form submit. See task 0030 risks/invariants.
    expect(inlineBuyBtn).toHaveAttribute('type', 'button')

    // The banner is still announced to screen readers.
    const banner = inlineBuyBtn.closest('[role="alert"]')
    expect(banner).not.toBeNull()
    expect(banner).toHaveAttribute('aria-live', 'polite')
  })

  it('clicking the inline Buy button flips the side state — Buy CTA replaces the sell-gated CTA', async () => {
    setupHooks()
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={zeroPosition()} />)

    // Move to Sell tab. Because debtFloat === 0, the form replaces the
    // normal submit button with the disabled "No <ticker> to sell" CTA.
    await user.click(screen.getByRole('button', { name: /^sell$/i }))
    expect(screen.getByRole('button', { name: /no aapl to sell/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^buy aapl$/i })).not.toBeInTheDocument()

    // Type a non-zero amount so the post-flip Buy state renders the
    // submit CTA (instead of the empty-amount "Enter Amount" gate).
    await user.type(screen.getByTestId('stocks-order-amount-input'), '50')

    // Click the inline "Buy" inside the sell-gated banner.
    await user.click(screen.getByRole('button', { name: /switch to buy tab/i }))

    // Side has flipped: the live "Buy AAPL" submit button is now
    // present and the disabled sell-gated CTA is gone.
    expect(screen.getByRole('button', { name: /^buy aapl$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /no aapl to sell/i })).not.toBeInTheDocument()
  })

  it('preserves the previously-entered Amount (USD) when the inline Buy button flips the side', async () => {
    setupHooks()
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={zeroPosition()} />)

    // Switch to Sell, type an amount.
    await user.click(screen.getByRole('button', { name: /^sell$/i }))
    const amountInput = screen.getByTestId('stocks-order-amount-input') as HTMLInputElement
    await user.type(amountInput, '123.45')
    expect(amountInput.value).toBe('123.45')

    // Use the inline Buy CTA inside the banner to flip the side.
    await user.click(screen.getByRole('button', { name: /switch to buy tab/i }))

    // Amount input keeps its value across the side flip — this is the
    // whole point of the affordance ("take that same amount to Buy").
    expect((screen.getByTestId('stocks-order-amount-input') as HTMLInputElement).value).toBe('123.45')
  })

  it('does not render the inline Buy button when the user is on the Buy tab (banner absent)', async () => {
    setupHooks()

    render(<OrderForm stock={stock} position={zeroPosition()} />)

    // Default tab is Buy; no sell-gated banner, so no inline Buy CTA.
    expect(screen.queryByRole('button', { name: /switch to buy tab/i })).not.toBeInTheDocument()
  })
})
