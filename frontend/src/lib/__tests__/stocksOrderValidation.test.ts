import { describe, it, expect } from 'vitest'

import { computeSellGuards, isLimitDisabledOnChain } from '../stocksOrderValidation'

describe('computeSellGuards — buy side', () => {
  it('returns all-clear on the buy side regardless of position', () => {
    const out = computeSellGuards({
      side: 'buy',
      isConnected: true,
      debtFloat: 0,
      sharesRequested: 100,
    })
    expect(out.sellGated).toBe(false)
    expect(out.sellSharesExceedsBalance).toBe(false)
    expect(out.hasPosition).toBe(false)
    expect(out.balanceShares).toBe(0)
  })

  it('returns all-clear on the buy side even with a real position', () => {
    const out = computeSellGuards({
      side: 'buy',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 1,
    })
    expect(out.sellGated).toBe(false)
    expect(out.sellSharesExceedsBalance).toBe(false)
  })
})

describe('computeSellGuards — disconnected wallet', () => {
  it('does not gate the sell side when wallet is disconnected', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: false,
      debtFloat: null,
      sharesRequested: 1,
    })
    expect(out.sellGated).toBe(false)
    expect(out.sellSharesExceedsBalance).toBe(false)
    expect(out.hasPosition).toBe(false)
  })
})

describe('computeSellGuards — connected, no position', () => {
  it('gates the sell side when debtFloat is null', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: null,
      sharesRequested: 0,
    })
    expect(out.sellGated).toBe(true)
    expect(out.sellSharesExceedsBalance).toBe(false)
    expect(out.hasPosition).toBe(false)
    expect(out.balanceShares).toBe(0)
  })

  it('gates the sell side when debtFloat is exactly zero', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0,
      sharesRequested: 10,
    })
    expect(out.sellGated).toBe(true)
    expect(out.sellSharesExceedsBalance).toBe(false)
  })

  it('gates the sell side when debtFloat is NaN', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: Number.NaN,
      sharesRequested: 1,
    })
    expect(out.sellGated).toBe(true)
  })
})

describe('computeSellGuards — connected, with position', () => {
  it('allows selling within the held balance', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 0.25,
    })
    expect(out.sellGated).toBe(false)
    expect(out.sellSharesExceedsBalance).toBe(false)
    expect(out.hasPosition).toBe(true)
    expect(out.balanceShares).toBe(0.5)
  })

  it('allows selling the entire position', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 0.5,
    })
    expect(out.sellSharesExceedsBalance).toBe(false)
  })

  it('flags shares that exceed the held balance', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 1.0,
    })
    expect(out.sellGated).toBe(false)
    expect(out.sellSharesExceedsBalance).toBe(true)
    expect(out.balanceShares).toBe(0.5)
  })

  it('does not flag float-rounding-noise overflows within the epsilon', () => {
    const out = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 0.5 + 1e-12,
    })
    expect(out.sellSharesExceedsBalance).toBe(false)
  })

  it('respects a custom epsilon', () => {
    const tight = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 0.5 + 1e-6,
      epsilon: 1e-12,
    })
    expect(tight.sellSharesExceedsBalance).toBe(true)
  })

  it('treats zero or negative requested shares as in-balance', () => {
    const zero = computeSellGuards({
      side: 'sell',
      isConnected: true,
      debtFloat: 0.5,
      sharesRequested: 0,
    })
    expect(zero.sellSharesExceedsBalance).toBe(false)
  })
})

describe('isLimitDisabledOnChain', () => {
  it('returns true when contracts are deployed and order type is limit', () => {
    const out = isLimitDisabledOnChain({ isDeployed: true, orderType: 'limit' })
    expect(out.disabled).toBe(true)
    expect(out.reason).toBe('limit-not-supported-on-chain')
  })

  it('returns false when order type is market, even if deployed', () => {
    const out = isLimitDisabledOnChain({ isDeployed: true, orderType: 'market' })
    expect(out.disabled).toBe(false)
    expect(out.reason).toBeNull()
  })

  it('returns false when contracts are not deployed (devnet stub flow stays usable)', () => {
    const out = isLimitDisabledOnChain({ isDeployed: false, orderType: 'limit' })
    expect(out.disabled).toBe(false)
    expect(out.reason).toBeNull()
  })

  it('returns false when not deployed AND market', () => {
    const out = isLimitDisabledOnChain({ isDeployed: false, orderType: 'market' })
    expect(out.disabled).toBe(false)
    expect(out.reason).toBeNull()
  })
})
