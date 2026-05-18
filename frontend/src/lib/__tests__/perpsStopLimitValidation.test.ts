import { describe, it, expect } from 'vitest'

import { validateStopLimitOrder } from '../perpsStopLimitValidation'

const MARK = 100

describe('validateStopLimitOrder — non-stop-limit order types', () => {
  it('returns all-clear for market orders regardless of inputs', () => {
    const out = validateStopLimitOrder({
      orderType: 'market',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '50',
      limitPrice: '40',
    })
    expect(out.triggerWrongSide).toBe(false)
    expect(out.limitVsTriggerWrong).toBe(false)
    expect(out.triggerErrorMessage).toBeNull()
    expect(out.limitErrorMessage).toBeNull()
  })

  it('returns all-clear for limit orders regardless of inputs', () => {
    const out = validateStopLimitOrder({
      orderType: 'limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '50',
      limitPrice: '200',
    })
    expect(out.triggerWrongSide).toBe(false)
    expect(out.limitVsTriggerWrong).toBe(false)
  })
})

describe('validateStopLimitOrder — empty / partial input', () => {
  it('does not flag empty trigger', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '',
      limitPrice: '110',
    })
    expect(out.triggerWrongSide).toBe(false)
    expect(out.limitVsTriggerWrong).toBe(false)
  })

  it('does not flag empty limit', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '110',
      limitPrice: '',
    })
    expect(out.triggerWrongSide).toBe(false)
    expect(out.limitVsTriggerWrong).toBe(false)
  })

  it('skips comparisons when markPrice is zero or NaN', () => {
    const zero = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: 0,
      triggerPrice: '50',
      limitPrice: '40',
    })
    expect(zero.triggerWrongSide).toBe(false)
    expect(zero.limitVsTriggerWrong).toBe(false)

    const nan = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: Number.NaN,
      triggerPrice: '50',
      limitPrice: '40',
    })
    expect(nan.triggerWrongSide).toBe(false)
    expect(nan.limitVsTriggerWrong).toBe(false)
  })
})

describe('validateStopLimitOrder — long side', () => {
  it('flags trigger at or below mark for long stop-limit', () => {
    const below = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '90',
      limitPrice: '95',
    })
    expect(below.triggerWrongSide).toBe(true)
    expect(below.triggerErrorMessage).toBe('Trigger must be above mark price')

    const equal = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '100',
      limitPrice: '101',
    })
    expect(equal.triggerWrongSide).toBe(true)
  })

  it('accepts trigger strictly above mark for long stop-limit', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '110',
      limitPrice: '110',
    })
    expect(out.triggerWrongSide).toBe(false)
    expect(out.triggerErrorMessage).toBeNull()
  })

  it('flags limit below trigger for long stop-limit', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '110',
      limitPrice: '105',
    })
    expect(out.limitVsTriggerWrong).toBe(true)
    expect(out.limitErrorMessage).toBe('Limit must be ≥ trigger price')
  })

  it('accepts limit equal to or above trigger for long stop-limit', () => {
    const equal = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '110',
      limitPrice: '110',
    })
    expect(equal.limitVsTriggerWrong).toBe(false)

    const above = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '110',
      limitPrice: '115',
    })
    expect(above.limitVsTriggerWrong).toBe(false)
  })
})

describe('validateStopLimitOrder — short side', () => {
  it('flags trigger at or above mark for short stop-limit', () => {
    const above = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '120',
      limitPrice: '115',
    })
    expect(above.triggerWrongSide).toBe(true)
    expect(above.triggerErrorMessage).toBe('Trigger must be below mark price')

    const equal = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '100',
      limitPrice: '95',
    })
    expect(equal.triggerWrongSide).toBe(true)
  })

  it('accepts trigger strictly below mark for short stop-limit', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '90',
      limitPrice: '90',
    })
    expect(out.triggerWrongSide).toBe(false)
  })

  it('flags limit above trigger for short stop-limit', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '90',
      limitPrice: '95',
    })
    expect(out.limitVsTriggerWrong).toBe(true)
    expect(out.limitErrorMessage).toBe('Limit must be ≤ trigger price')
  })

  it('accepts limit equal to or below trigger for short stop-limit', () => {
    const equal = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '90',
      limitPrice: '90',
    })
    expect(equal.limitVsTriggerWrong).toBe(false)

    const below = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'short',
      markPrice: MARK,
      triggerPrice: '90',
      limitPrice: '85',
    })
    expect(below.limitVsTriggerWrong).toBe(false)
  })
})

describe('validateStopLimitOrder — invalid numeric strings', () => {
  it('ignores non-numeric trigger / limit values', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: 'abc',
      limitPrice: 'xyz',
    })
    expect(out.triggerWrongSide).toBe(false)
    expect(out.limitVsTriggerWrong).toBe(false)
  })

  it('treats zero / negative trigger as not-yet-valid (no side-flag)', () => {
    const out = validateStopLimitOrder({
      orderType: 'stop-limit',
      side: 'long',
      markPrice: MARK,
      triggerPrice: '0',
      limitPrice: '0',
    })
    // existing triggerPriceInvalid in page.tsx handles the "> 0" message;
    // this helper only handles the side-aware semantic check.
    expect(out.triggerWrongSide).toBe(false)
    expect(out.limitVsTriggerWrong).toBe(false)
  })
})
