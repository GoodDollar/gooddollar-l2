import { describe, expect, it } from 'vitest'
import { computeLimitPriceFieldState } from '../stocksLimitPriceField'

describe('computeLimitPriceFieldState', () => {
  describe('market mode', () => {
    it('returns hasValidPrice=true and no missing/invalid flags regardless of limit price', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'market',
        limitPrice: '',
        amount: '',
      })
      expect(state).toEqual({
        limitPriceMissing: false,
        limitPriceInvalid: false,
        hasValidPrice: true,
      })
    })

    it('ignores garbage in the limit price field when market is selected', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'market',
        limitPrice: 'abc',
        amount: '100',
      })
      expect(state).toEqual({
        limitPriceMissing: false,
        limitPriceInvalid: false,
        hasValidPrice: true,
      })
    })
  })

  describe('limit mode — empty price', () => {
    it('does NOT nag when amount is also empty (both fields empty → no hint)', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: '',
        amount: '',
      })
      expect(state.limitPriceMissing).toBe(false)
      expect(state.limitPriceInvalid).toBe(false)
      expect(state.hasValidPrice).toBe(false)
    })

    it('flags limitPriceMissing when amount is filled but price is empty', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: '',
        amount: '100',
      })
      expect(state.limitPriceMissing).toBe(true)
      expect(state.limitPriceInvalid).toBe(false)
      expect(state.hasValidPrice).toBe(false)
    })
  })

  describe('limit mode — invalid prices', () => {
    it('flags zero as invalid (not missing)', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: '0',
        amount: '100',
      })
      expect(state.limitPriceMissing).toBe(false)
      expect(state.limitPriceInvalid).toBe(true)
      expect(state.hasValidPrice).toBe(false)
    })

    it('flags negative numbers as invalid', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: '-5',
        amount: '100',
      })
      expect(state.limitPriceInvalid).toBe(true)
      expect(state.hasValidPrice).toBe(false)
    })

    it('flags non-numeric strings as invalid', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: 'abc',
        amount: '100',
      })
      expect(state.limitPriceInvalid).toBe(true)
      expect(state.hasValidPrice).toBe(false)
    })
  })

  describe('limit mode — valid price', () => {
    it('treats a positive number as fully valid', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: '180.50',
        amount: '100',
      })
      expect(state).toEqual({
        limitPriceMissing: false,
        limitPriceInvalid: false,
        hasValidPrice: true,
      })
    })

    it('treats a valid price as valid even when amount is empty', () => {
      const state = computeLimitPriceFieldState({
        orderType: 'limit',
        limitPrice: '180.50',
        amount: '',
      })
      expect(state.limitPriceMissing).toBe(false)
      expect(state.limitPriceInvalid).toBe(false)
      expect(state.hasValidPrice).toBe(true)
    })
  })

  describe('mutual exclusion invariant', () => {
    it('never sets both missing and invalid in the same state', () => {
      const inputs: LimitPriceFieldTestCase[] = [
        { orderType: 'limit', limitPrice: '', amount: '' },
        { orderType: 'limit', limitPrice: '', amount: '50' },
        { orderType: 'limit', limitPrice: '0', amount: '50' },
        { orderType: 'limit', limitPrice: 'abc', amount: '' },
        { orderType: 'limit', limitPrice: '12', amount: '50' },
        { orderType: 'market', limitPrice: '', amount: '' },
      ]
      for (const input of inputs) {
        const state = computeLimitPriceFieldState(input)
        expect(state.limitPriceMissing && state.limitPriceInvalid).toBe(false)
      }
    })
  })
})

interface LimitPriceFieldTestCase {
  orderType: 'market' | 'limit'
  limitPrice: string
  amount: string
}
