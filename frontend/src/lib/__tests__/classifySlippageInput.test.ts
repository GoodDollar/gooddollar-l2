import { describe, it, expect } from 'vitest'
import {
  classifySlippageInput,
  MIN_USEFUL_SLIPPAGE,
  HIGH_SLIPPAGE_THRESHOLD,
  MAX_SLIPPAGE,
} from '../useSwapSettings'

/**
 * Pure-input tests for the slippage classifier (task 0049).
 *
 * Each row of the task spec table maps to one assertion below — the
 * goal is to prevent the regression where the visible input value
 * silently disagrees with the stored slippage.
 */

describe('classifySlippageInput', () => {
  it('returns blank for empty / whitespace / lone dot inputs', () => {
    expect(classifySlippageInput('').kind).toBe('blank')
    expect(classifySlippageInput('   ').kind).toBe('blank')
    expect(classifySlippageInput('.').kind).toBe('blank')
  })

  it('returns blank for non-numeric garbage that sanitizes to empty', () => {
    expect(classifySlippageInput('abc').kind).toBe('blank')
  })

  it('returns invalid-zero for 0, 0.00, and similar', () => {
    expect(classifySlippageInput('0').kind).toBe('invalid-zero')
    expect(classifySlippageInput('0.00').kind).toBe('invalid-zero')
    // The percent sign is stripped by sanitiser, "0%" becomes "0".
    expect(classifySlippageInput('0%').kind).toBe('invalid-zero')
    // Negative inputs are stripped of the minus by the sanitiser, but if
    // somehow a non-positive value sneaks in, we still classify it as
    // invalid-zero (the helper guards on `<= 0`).
  })

  it('classifies low slippage (below MIN_USEFUL_SLIPPAGE) with the value preserved', () => {
    const decision = classifySlippageInput('0.01')
    expect(decision).toEqual({ kind: 'low', value: 0.01 })

    // Boundary: exactly MIN_USEFUL_SLIPPAGE should NOT be `low` —
    // it's the cut-off for "useful".
    const atBoundary = classifySlippageInput(String(MIN_USEFUL_SLIPPAGE))
    expect(atBoundary.kind).toBe('ok')
  })

  it('classifies the default 0.5% as ok', () => {
    expect(classifySlippageInput('0.5')).toEqual({ kind: 'ok', value: 0.5 })
  })

  it('classifies values in (HIGH_SLIPPAGE_THRESHOLD, MAX_SLIPPAGE] as high-risk', () => {
    // Exactly at the high-slippage threshold (5) is still `ok` — the
    // user-visible warning fires only when impact passes that gate.
    expect(classifySlippageInput(String(HIGH_SLIPPAGE_THRESHOLD)).kind).toBe('ok')
    expect(classifySlippageInput('5.001')).toEqual({ kind: 'high-risk', value: 5.001 })
    expect(classifySlippageInput('25')).toEqual({ kind: 'high-risk', value: 25 })
    expect(classifySlippageInput(String(MAX_SLIPPAGE))).toEqual({
      kind: 'high-risk',
      value: MAX_SLIPPAGE,
    })
  })

  it('classifies values above MAX_SLIPPAGE as clamped-max', () => {
    expect(classifySlippageInput('51').kind).toBe('clamped-max')
    expect(classifySlippageInput('100').kind).toBe('clamped-max')
    expect(classifySlippageInput('999').kind).toBe('clamped-max')
  })
})
