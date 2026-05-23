import { describe, it, expect } from 'vitest'
import { formatProofUsd, decimalsFor, CRYPTO_SYMBOLS } from '../proofFormat'

describe('decimalsFor', () => {
  it('returns 2 for stocks regardless of magnitude', () => {
    expect(decimalsFor('AAPL', 309.33)).toBe(2)
    expect(decimalsFor('SPY', 0.5)).toBe(2)
    expect(decimalsFor('BRK', 1_500_000)).toBe(2)
  })

  it('returns 2 for crypto ≥ $1k', () => {
    expect(decimalsFor('BTC', 75_413.3217)).toBe(2)
    expect(decimalsFor('ETH', 2_058.39)).toBe(2)
  })

  it('returns 4 for crypto in $1–$1k range', () => {
    expect(decimalsFor('SOL', 84.112)).toBe(4)
    expect(decimalsFor('ETH', 1)).toBe(4)
  })

  it('returns 6 for sub-$1 crypto', () => {
    expect(decimalsFor('SOL', 0.123456)).toBe(6)
  })
})

describe('formatProofUsd', () => {
  it('formats BTC at 2 decimals when ≥ $1k', () => {
    expect(formatProofUsd('BTC', 75_413.3217)).toBe('$75,413.32')
  })

  it('formats ETH at 2 decimals when ≥ $1k', () => {
    expect(formatProofUsd('ETH', 2_058.3918)).toBe('$2,058.39')
  })

  it('formats SOL at 4 decimals in $1–$1k range', () => {
    expect(formatProofUsd('SOL', 84.112)).toBe('$84.1120')
  })

  it('formats AAPL at 2 decimals regardless of input precision', () => {
    expect(formatProofUsd('AAPL', 309.3333)).toBe('$309.33')
    expect(formatProofUsd('AAPL', 426.10)).toBe('$426.10')
  })

  it('formats stocks at 2 decimals even when synthesised at 3-decimal precision', () => {
    expect(formatProofUsd('TSLA', 426.125)).toBe('$426.13')
    expect(formatProofUsd('NFLX', 88.635)).toBe('$88.64')
  })

  it('formats sub-$1 crypto at 6 decimals', () => {
    expect(formatProofUsd('SOL', 0.123456789)).toBe('$0.123457')
  })

  it('returns em-dash for non-finite inputs', () => {
    expect(formatProofUsd('BTC', NaN)).toBe('—')
    expect(formatProofUsd('AAPL', Infinity)).toBe('—')
    expect(formatProofUsd('AAPL', -Infinity)).toBe('—')
  })

  it('exposes CRYPTO_SYMBOLS as the canonical crypto set', () => {
    expect(CRYPTO_SYMBOLS.has('BTC')).toBe(true)
    expect(CRYPTO_SYMBOLS.has('ETH')).toBe(true)
    expect(CRYPTO_SYMBOLS.has('SOL')).toBe(true)
    expect(CRYPTO_SYMBOLS.has('AAPL')).toBe(false)
  })
})
