/**
 * @file OrderFormLimitGate.test.tsx
 * @summary RTL component tests for the Limit-order on-chain gate in <OrderForm>.
 *
 * Task 0028 — fix-stocks-limit-order-silent-noop
 *   Before this change, switching to the "Limit" tab on the stock detail page
 *   while the on-chain vault is deployed silently let the user submit an order
 *   that the hook would then drop on the floor (because mintSynthetic only
 *   supports market). This test pins the new behaviour:
 *
 *     - on-chain deployed + Limit tab → informational banner is visible
 *     - on-chain deployed + Limit tab → submit button is disabled and labelled
 *       "Limit not available" so the user cannot fire an unsupported order
 *     - on-chain deployed + Market tab → no banner, normal CTA copy
 *     - devnet stub flow (isDeployed=false) + Limit tab → no banner (the stub
 *       does honour limit orders, so we must not over-gate that path)
 *     - submitting via Enter on Limit tab does NOT invoke mint()
 *
 * The component-level mocks deliberately stub the wallet + on-chain hooks so
 * the test focuses on the validation gate, not on real wagmi/RainbowKit state.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- module mocks ---------------------------------------------------------
// All of these run BEFORE the component module is imported.

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  // Only used by <WalletGatedTradeButton> when the wallet is disconnected.
  // We force isConnected=true in this suite so this should never render,
  // but we provide a safe stub so module evaluation does not throw.
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

// Mounted hook gates client-only UI in some components; force "mounted".
vi.mock('@/lib/useMounted', () => ({
  useMounted: () => true,
}))

// --- resolve mocks after registration ------------------------------------
const { useAccount } = await import('wagmi')
const { useWalletReady } = await import('@/lib/WalletReadyContext')
const { useMintSynthetic, useRedeemSynthetic } = await import('@/lib/useStocks')

// The component under test lives inside the stock detail page module so we
// import it after the mocks above are registered. It is exported by name.
const { StockOrderForm: OrderForm } = await import('@/components/stocks/StockOrderForm')

// --- fixtures ------------------------------------------------------------

const stock = { ticker: 'AAPL', price: 175 }

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

describe('<OrderForm> limit-order on-chain gate', () => {
  it('shows no limit banner on the Market tab when contracts are deployed', () => {
    setupHooks({ isDeployed: true })

    render(<OrderForm stock={stock} position={null} />)

    // The on-chain limit-gate UI must not leak onto the Market tab.
    expect(screen.queryByTestId('limit-not-supported-banner')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /limit not available/i }),
    ).not.toBeInTheDocument()
  })

  it('shows the limit banner and disables the submit button on the Limit tab when contracts are deployed', async () => {
    setupHooks({ isDeployed: true })
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={null} />)

    await user.click(screen.getByRole('button', { name: /^limit$/i }))

    // Banner is visible with the exact testid we wired in the component.
    expect(screen.getByTestId('limit-not-supported-banner')).toBeInTheDocument()
    expect(
      screen.getByText(/limit orders are not yet supported on-chain/i),
    ).toBeInTheDocument()

    // CTA is the "Limit not available" disabled button.
    const cta = screen.getByRole('button', { name: /limit not available/i })
    expect(cta).toBeDisabled()
  })

  it('does NOT call mint() when the limit gate is active and the user presses Enter', async () => {
    setupHooks({ isDeployed: true })
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={null} />)
    await user.click(screen.getByRole('button', { name: /^limit$/i }))

    // Type into amount; even if a stray submission fires, the handler must
    // short-circuit because limit is gated. The amount and limit-price inputs
    // share placeholder "0.00", so we target by testid.
    const amountInput = screen.getByTestId('stocks-order-amount-input')
    await user.type(amountInput, '100')

    // Try to trigger native form submit by pressing Enter inside the form.
    await user.keyboard('{Enter}')

    expect(mintMock).not.toHaveBeenCalled()
    expect(redeemMock).not.toHaveBeenCalled()
  })

  it('does NOT show the limit banner on the Limit tab when contracts are not deployed (devnet stub path)', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={null} />)
    await user.click(screen.getByRole('button', { name: /^limit$/i }))

    expect(screen.queryByTestId('limit-not-supported-banner')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /limit not available/i }),
    ).not.toBeInTheDocument()
  })

  it('shows risk-stop banner and blocks submission when rebalance sync is not current', async () => {
    setupHooks({ isDeployed: true })
    const user = userEvent.setup()

    render(<OrderForm stock={stock} position={null} riskBlockReason="Awaiting same-block sync for: perps" />)

    expect(screen.getByTestId('stocks-risk-stop-banner')).toHaveTextContent('Risk stop active')

    const amountInput = screen.getByTestId('stocks-order-amount-input')
    await user.type(amountInput, '100')

    const cta = screen.getByRole('button', { name: /sync required/i })
    expect(cta).toBeDisabled()

    await user.keyboard('{Enter}')
    expect(mintMock).not.toHaveBeenCalled()
    expect(redeemMock).not.toHaveBeenCalled()
  })
})
