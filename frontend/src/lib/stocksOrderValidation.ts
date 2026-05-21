/**
 * stocksOrderValidation — side-aware sell-guard helpers for GoodStocks.
 *
 * Selling a synthetic stock on `/stocks/[ticker]` burns sToken debt
 * (CollateralVault.burn) and withdraws the freed collateral. You can
 * never burn more debt than you actually minted, so the user's current
 * `debtAmount` is the precise gate for "Sell is allowed" and the
 * precise ceiling for the sell amount.
 *
 * This helper returns pure booleans so the order form can:
 *   - disable the Sell submit button when the user has no position,
 *   - disable the Sell submit button when requested shares exceed
 *     the held balance,
 *   - render inline warning chips that explain both states.
 *
 * It deliberately stays silent for the Buy side and for disconnected
 * wallets — those cases are already handled by WalletGatedTradeButton
 * and the existing `hasAmount` gate in StockDetailPage.
 */

export type StocksOrderSide = 'buy' | 'sell'

export interface SellGuardsInput {
  side: StocksOrderSide
  /** Whether a wallet is currently connected. */
  isConnected: boolean
  /**
   * User's current synthetic-token (debt) balance for this stock,
   * expressed in whole shares. `null`, `undefined` or NaN means the
   * position is unknown (e.g. wallet not connected, RPC still loading)
   * and is treated as a zero balance.
   */
  debtFloat: number | null | undefined
  /** Shares the user is about to sell (amount-in-USD ÷ effective price). */
  sharesRequested: number
  /** Float-noise epsilon. Defaults to 1e-9. */
  epsilon?: number
}

export interface SellGuardsResult {
  /** True when `debtFloat > 0`. */
  hasPosition: boolean
  /** Balance available to sell, in whole shares. */
  balanceShares: number
  /**
   * True when the user is connected, on the Sell side, and owns
   * nothing of this stock — the Sell button must be disabled.
   */
  sellGated: boolean
  /**
   * True when the user is on the Sell side, owns a position, and
   * is requesting more shares than they hold — submit must be
   * disabled and an inline "exceeds your balance" chip should be
   * displayed.
   */
  sellSharesExceedsBalance: boolean
}

const CLEAN: SellGuardsResult = {
  hasPosition: false,
  balanceShares: 0,
  sellGated: false,
  sellSharesExceedsBalance: false,
}

export function computeSellGuards(input: SellGuardsInput): SellGuardsResult {
  const { side, isConnected, debtFloat, sharesRequested, epsilon = 1e-9 } = input

  if (side !== 'sell') return CLEAN

  const balanceShares =
    typeof debtFloat === 'number' && Number.isFinite(debtFloat) && debtFloat > 0
      ? debtFloat
      : 0
  const hasPosition = balanceShares > 0

  const sellGated = isConnected && !hasPosition
  const sellSharesExceedsBalance =
    isConnected &&
    hasPosition &&
    Number.isFinite(sharesRequested) &&
    sharesRequested > 0 &&
    sharesRequested > balanceShares + epsilon

  return { hasPosition, balanceShares, sellGated, sellSharesExceedsBalance }
}

/**
 * isLimitDisabledOnChain — gate the Limit-order tab when on-chain.
 *
 * Background: `OrderForm.handleSubmit` only calls `mint()` / `redeem()`
 * when `isDeployed && orderType === 'market'`. The `else` branch silently
 * flashes a success toast for 3 s — meaning a connected user who picks
 * Limit on devnet/L2 thinks their order placed but nothing reaches the
 * vault. Until a real on-chain limit-order book exists, gate the entire
 * Limit tab behind this helper:
 *
 *   - render an informational banner explaining the limitation,
 *   - keep the Submit button disabled,
 *   - short-circuit `handleSubmit` so no fake-success toast fires.
 *
 * On devnet stubs (`isDeployed === false`) the original mock-success
 * flow is preserved so the demo path remains usable.
 */
export type StocksOrderType = 'market' | 'limit'

export interface LimitDisabledInput {
  /** True when the on-chain contracts (Synthetics/Vault) are wired up. */
  isDeployed: boolean
  /** Currently selected order type. */
  orderType: StocksOrderType
}

export interface LimitDisabledResult {
  /** True when the Submit button + handleSubmit branch must be blocked. */
  disabled: boolean
  /**
   * Stable machine-readable reason for telemetry, banner copy lookup,
   * and test assertions. `null` when not disabled.
   */
  reason: 'limit-not-supported-on-chain' | null
}

const ALLOWED: LimitDisabledResult = { disabled: false, reason: null }

export function isLimitDisabledOnChain(input: LimitDisabledInput): LimitDisabledResult {
  if (input.isDeployed && input.orderType === 'limit') {
    return { disabled: true, reason: 'limit-not-supported-on-chain' }
  }
  return ALLOWED
}
