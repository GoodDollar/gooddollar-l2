import { describe, it, expect } from 'vitest'

import { buildSourceLine, chainName, isCryptoRailSymbol } from '../oracleSource'

describe('chainName', () => {
  it('returns "awaiting chain" when chainId is null', () => {
    expect(chainName(null)).toBe('awaiting chain')
  })

  it('returns "awaiting chain" when chainId is undefined', () => {
    expect(chainName(undefined)).toBe('awaiting chain')
  })

  it('maps well-known chain ids to human labels', () => {
    expect(chainName(1)).toBe('Ethereum')
    expect(chainName(42220)).toBe('Celo')
    expect(chainName(42069)).toBe('devnet')
    expect(chainName(31337)).toBe('anvil')
  })

  it('renders "chain <id>" for unknown chain ids', () => {
    expect(chainName(99999)).toBe('chain 99999')
  })
})

describe('buildSourceLine', () => {
  it('renders the canonical eToro→StockOracleV2 line', () => {
    expect(buildSourceLine({ upstreamLabel: 'eToro demo', rail: 'stocks', chainId: 42069 }))
      .toBe('Source: eToro demo → StockOracleV2 (devnet)')
  })

  it('renders SwapPriceOracle for crypto rail', () => {
    expect(buildSourceLine({ upstreamLabel: 'eToro demo', rail: 'crypto', chainId: 42069 }))
      .toBe('Source: eToro demo → SwapPriceOracle (devnet)')
  })

  it('renders "(awaiting chain)" when chainId is null', () => {
    expect(buildSourceLine({ upstreamLabel: 'eToro demo', rail: 'stocks', chainId: null }))
      .toBe('Source: eToro demo → StockOracleV2 (awaiting chain)')
  })

  it('falls back to "mock" when upstream label is missing or empty', () => {
    expect(buildSourceLine({ upstreamLabel: null, rail: 'stocks', chainId: 42069 }))
      .toBe('Source: mock → StockOracleV2 (devnet)')
    expect(buildSourceLine({ upstreamLabel: '  ', rail: 'stocks', chainId: 42069 }))
      .toBe('Source: mock → StockOracleV2 (devnet)')
  })

  it('renders "Source: cached snapshot" verbatim when cached flag is set', () => {
    expect(buildSourceLine({ upstreamLabel: 'eToro demo', rail: 'stocks', chainId: 42069, cached: true }))
      .toBe('Source: cached snapshot')
    expect(buildSourceLine({ upstreamLabel: null, rail: 'crypto', chainId: null, cached: true }))
      .toBe('Source: cached snapshot')
  })

  it('renders "chain 9999" suffix for unknown chains', () => {
    expect(buildSourceLine({ upstreamLabel: 'eToro demo', rail: 'stocks', chainId: 9999 }))
      .toBe('Source: eToro demo → StockOracleV2 (chain 9999)')
  })
})

describe('isCryptoRailSymbol', () => {
  it('returns true for well-known crypto tickers', () => {
    expect(isCryptoRailSymbol('BTC')).toBe(true)
    expect(isCryptoRailSymbol('ETH')).toBe(true)
    expect(isCryptoRailSymbol('SOL')).toBe(true)
    expect(isCryptoRailSymbol('weth')).toBe(true)
  })

  it('returns false for known stock tickers', () => {
    expect(isCryptoRailSymbol('AAPL')).toBe(false)
    expect(isCryptoRailSymbol('TSLA')).toBe(false)
  })
})
