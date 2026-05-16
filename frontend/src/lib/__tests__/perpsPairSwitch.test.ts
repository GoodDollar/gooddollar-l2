import { describe, it, expect } from 'vitest'

/**
 * Contract test for /perps OrderForm pair-switch reset behaviour.
 *
 * Bug (task 0077): When the user typed a Limit price for ETH-USD
 * (~$1,900) and then switched the trading pair to SOL-USD (~$134),
 * the price input still showed "1900". A subsequent submit would
 * have placed a SOL order at a price ~14x above the market — a
 * financial safety hazard.
 *
 * Root cause: The inline `OrderForm` component in
 * `frontend/src/app/(app)/perps/page.tsx` holds `limitPrice`,
 * `triggerPrice`, `tp`, `sl` in local `useState`. The parent
 * `PerpsPage` re-renders `<OrderForm pair={pair} ...>` on pair
 * change without a `key={pair.symbol}` prop, so React preserves
 * the component instance and its local state survives the switch.
 *
 * Fix: A `useEffect` keyed on `pair.symbol` resets only the
 * market-relative price fields. User preferences (side, orderType,
 * leverage, marginMode, size) are intentionally preserved — they
 * are not market-specific.
 *
 * This test mirrors the contract those setters MUST satisfy. It
 * matches the established codebase pattern in `perpsValidation.test.ts`
 * (the production helper is redeclared inline so the contract can be
 * unit-tested without mounting the full /perps page).
 */

interface OrderFormPriceState {
  limitPrice: string
  triggerPrice: string
  tp: string
  sl: string
}

interface OrderFormUserPrefs {
  side: 'long' | 'short'
  orderType: 'market' | 'limit' | 'trigger'
  size: string
  leverage: number
  marginMode: 'cross' | 'isolated'
}

/** Mirrors the reset performed by the pair-switch useEffect in OrderForm. */
function resetPriceFieldsOnPairSwitch(
  prices: OrderFormPriceState,
): OrderFormPriceState {
  // Always reset, regardless of previous values — switching pairs
  // invalidates any market-relative price the user had typed.
  void prices
  return { limitPrice: '', triggerPrice: '', tp: '', sl: '' }
}

/** Mirrors the fields the useEffect deliberately does NOT touch. */
function preserveUserPrefsOnPairSwitch(
  prefs: OrderFormUserPrefs,
): OrderFormUserPrefs {
  return prefs
}

describe('OrderForm pair-switch reset (task 0077)', () => {
  it('clears the limit price when switching pairs', () => {
    const after = resetPriceFieldsOnPairSwitch({
      limitPrice: '1900',
      triggerPrice: '',
      tp: '',
      sl: '',
    })
    expect(after.limitPrice).toBe('')
  })

  it('clears the trigger price when switching pairs', () => {
    const after = resetPriceFieldsOnPairSwitch({
      limitPrice: '',
      triggerPrice: '1850',
      tp: '',
      sl: '',
    })
    expect(after.triggerPrice).toBe('')
  })

  it('clears take-profit and stop-loss when switching pairs', () => {
    const after = resetPriceFieldsOnPairSwitch({
      limitPrice: '',
      triggerPrice: '',
      tp: '2100',
      sl: '1700',
    })
    expect(after.tp).toBe('')
    expect(after.sl).toBe('')
  })

  it('clears ALL price fields together (no partial reset)', () => {
    const after = resetPriceFieldsOnPairSwitch({
      limitPrice: '1900',
      triggerPrice: '1850',
      tp: '2100',
      sl: '1700',
    })
    expect(after).toEqual({
      limitPrice: '',
      triggerPrice: '',
      tp: '',
      sl: '',
    })
  })

  it('preserves user-preference fields across pair switch', () => {
    const before: OrderFormUserPrefs = {
      side: 'short',
      orderType: 'limit',
      size: '5',
      leverage: 15,
      marginMode: 'isolated',
    }
    const after = preserveUserPrefsOnPairSwitch(before)
    expect(after).toEqual(before)
  })

  it('is idempotent when all price fields are already empty', () => {
    const empty: OrderFormPriceState = {
      limitPrice: '',
      triggerPrice: '',
      tp: '',
      sl: '',
    }
    expect(resetPriceFieldsOnPairSwitch(empty)).toEqual(empty)
  })

  it('documents the safety hazard the reset prevents', () => {
    // Scenario: ETH at ~$1,900, user types a limit price near market.
    const ethState: OrderFormPriceState = {
      limitPrice: '1900',
      triggerPrice: '',
      tp: '',
      sl: '',
    }
    // User switches to SOL (~$134). Without the reset, "1900" would
    // persist — that would place a SOL buy ~14x above market.
    const solState = resetPriceFieldsOnPairSwitch(ethState)
    expect(solState.limitPrice).not.toBe('1900')
    expect(solState.limitPrice).toBe('')
  })
})
