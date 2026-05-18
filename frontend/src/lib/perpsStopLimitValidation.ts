/**
 * Side-aware semantic validation for Stop-Limit perp orders.
 *
 * A Stop-Limit order has two prices:
 *   - triggerPrice — when crossed by the mark price, the order activates.
 *   - limitPrice   — the price at which the resulting limit order is placed.
 *
 * For the configuration to make economic sense:
 *   LONG  stop-limit: trigger MUST be strictly above mark, limit MUST be ≥ trigger.
 *   SHORT stop-limit: trigger MUST be strictly below mark, limit MUST be ≤ trigger.
 *
 * This helper returns side-aware flags + human-readable error messages so the
 * UI can paint inputs red, render inline errors and disable the submit button.
 *
 * It deliberately stays silent for empty / partially-typed / non-numeric values
 * so the user is not yelled at while typing. `triggerPriceInvalid` (the simple
 * "must be > 0" check) is handled elsewhere in PerpsOrderPanel and remains the
 * source of truth for that lower-level concern.
 */

export type PerpsOrderType = 'market' | 'limit' | 'stop-limit'
export type PerpsSide = 'long' | 'short'

export interface StopLimitValidationInput {
  orderType: PerpsOrderType
  side: PerpsSide
  /** Current mark price for the selected pair. */
  markPrice: number
  /** Raw string value of the trigger-price input (may be empty / partial). */
  triggerPrice: string
  /** Raw string value of the limit-price input (may be empty / partial). */
  limitPrice: string
}

export interface StopLimitValidationResult {
  /** True when trigger is on the wrong side of mark for the chosen side. */
  triggerWrongSide: boolean
  /** True when limit is on the wrong side of trigger for the chosen side. */
  limitVsTriggerWrong: boolean
  /** Inline message for the trigger-price input, or `null` if no message. */
  triggerErrorMessage: string | null
  /** Inline message for the limit-price input, or `null` if no message. */
  limitErrorMessage: string | null
}

const CLEAN: StopLimitValidationResult = {
  triggerWrongSide: false,
  limitVsTriggerWrong: false,
  triggerErrorMessage: null,
  limitErrorMessage: null,
}

function parsePositive(value: string): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function validateStopLimitOrder(
  input: StopLimitValidationInput,
): StopLimitValidationResult {
  const { orderType, side, markPrice, triggerPrice, limitPrice } = input

  // Helper only applies to stop-limit orders.
  if (orderType !== 'stop-limit') return CLEAN

  // Without a usable mark price, we cannot make a directional claim.
  if (!Number.isFinite(markPrice) || markPrice <= 0) return CLEAN

  const trigger = parsePositive(triggerPrice)
  const limit = parsePositive(limitPrice)

  let triggerWrongSide = false
  let triggerErrorMessage: string | null = null
  let limitVsTriggerWrong = false
  let limitErrorMessage: string | null = null

  if (trigger !== null) {
    if (side === 'long' && trigger <= markPrice) {
      triggerWrongSide = true
      triggerErrorMessage = 'Trigger must be above mark price'
    } else if (side === 'short' && trigger >= markPrice) {
      triggerWrongSide = true
      triggerErrorMessage = 'Trigger must be below mark price'
    }
  }

  // Only evaluate limit-vs-trigger once both are present.
  if (trigger !== null && limit !== null) {
    if (side === 'long' && limit < trigger) {
      limitVsTriggerWrong = true
      limitErrorMessage = 'Limit must be ≥ trigger price'
    } else if (side === 'short' && limit > trigger) {
      limitVsTriggerWrong = true
      limitErrorMessage = 'Limit must be ≤ trigger price'
    }
  }

  return {
    triggerWrongSide,
    limitVsTriggerWrong,
    triggerErrorMessage,
    limitErrorMessage,
  }
}
