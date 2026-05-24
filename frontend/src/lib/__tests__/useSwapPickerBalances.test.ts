import { describe, it, expect } from 'vitest'
import { decodePickerBalances, decorateTokenRows } from '../useSwapPickerBalances'
import type { Token } from '../tokens'

const T = (symbol: string, name = symbol): Token => ({
  symbol,
  name,
  decimals: 18,
  category: 'Infrastructure',
})

describe('decodePickerBalances', () => {
  it('returns an empty map when neither ERC-20 nor native data is provided', () => {
    expect(decodePickerBalances([], undefined, undefined)).toEqual({})
  })

  it('decodes successful ERC-20 multicall cells using token-specific decimals', () => {
    // USDC has 6 decimals — 1234567 raw is 1.234567 USDC.
    // G$ has 18 decimals — 5e18 raw is exactly 5 G$.
    const result = decodePickerBalances(
      ['G$', 'USDC'],
      [
        { status: 'success', result: 5_000_000_000_000_000_000n },
        { status: 'success', result: 1_234_567n },
      ],
      undefined,
    )
    expect(result['G$']).toEqual({ raw: 5_000_000_000_000_000_000n, formatted: 5 })
    expect(result.USDC?.formatted).toBeCloseTo(1.234567, 5)
  })

  it('skips failed multicall cells (RPC down) without faking a zero balance', () => {
    const result = decodePickerBalances(
      ['G$', 'USDC'],
      [
        { status: 'failure' },
        { status: 'success', result: 1_000_000n },
      ],
      undefined,
    )
    expect(result['G$']).toBeUndefined()
    expect(result.USDC?.formatted).toBe(1)
  })

  it('decodes native ETH balance via useBalance shape', () => {
    const result = decodePickerBalances(
      [],
      undefined,
      { value: 1_500_000_000_000_000_000n }, // 1.5 ETH
    )
    expect(result.ETH?.formatted).toBe(1.5)
  })

  it('combines ERC-20 and native ETH into a single sparse map', () => {
    const result = decodePickerBalances(
      ['WETH'],
      [{ status: 'success', result: 2_000_000_000_000_000_000n }],
      { value: 3_000_000_000_000_000_000n },
    )
    expect(result.WETH?.formatted).toBe(2)
    expect(result.ETH?.formatted).toBe(3)
  })

  it('ignores unknown symbols silently — never invents an address', () => {
    // LINK is not in SWAP_TOKENS so its index has no decoder entry.
    const result = decodePickerBalances(
      ['LINK'],
      [{ status: 'success', result: 1_000_000_000_000_000_000n }],
      undefined,
    )
    expect(result.LINK).toBeUndefined()
  })
})

describe('decorateTokenRows', () => {
  const tokens: Token[] = [
    T('LINK', 'Chainlink'),
    T('ETH',  'Ether'),
    T('G$',   'GoodDollar'),
    T('USDC', 'USD Coin'),
  ]
  const onChain = (s: string) => ['ETH', 'G$', 'USDC', 'WETH'].includes(s)

  it('sorts non-zero balances above zero-balance rows', () => {
    const rows = decorateTokenRows(
      tokens,
      { ETH: { raw: 0n, formatted: 1.2 } },
      {},
      onChain,
    )
    expect(rows[0].token.symbol).toBe('ETH')
    // Remaining rows have no balance — alphabetical fallback within
    // their respective buckets.
  })

  it('orders multiple non-zero balances by USD value desc', () => {
    const rows = decorateTokenRows(
      tokens,
      {
        ETH: { raw: 0n, formatted: 0.5 },     // 0.5 * 3000 = 1500
        USDC: { raw: 0n, formatted: 2000 },   // 2000 * 1   = 2000
      },
      {
        ETH: { priceUsd: 3000 },
        USDC: { priceUsd: 1 },
      },
      onChain,
    )
    expect(rows[0].token.symbol).toBe('USDC')
    expect(rows[1].token.symbol).toBe('ETH')
  })

  it('puts on-chain-supported tokens above off-chain tokens when no balance', () => {
    const rows = decorateTokenRows(tokens, {}, {}, onChain)
    const symbols = rows.map(r => r.token.symbol)
    // On-chain tokens (ETH, G$, USDC) are alphabetised inside their bucket.
    expect(symbols.indexOf('ETH')).toBeLessThan(symbols.indexOf('LINK'))
    expect(symbols.indexOf('G$')).toBeLessThan(symbols.indexOf('LINK'))
    expect(symbols.indexOf('USDC')).toBeLessThan(symbols.indexOf('LINK'))
  })

  it("propagates `source` from the price map (defaulting to 'unknown')", () => {
    const rows = decorateTokenRows(
      tokens,
      {},
      {
        ETH:  { priceUsd: 3000, source: 'chain-oracle' },
        USDC: { priceUsd: 1,    source: 'coingecko' },
      },
      onChain,
    )
    const eth  = rows.find(r => r.token.symbol === 'ETH')!
    const usdc = rows.find(r => r.token.symbol === 'USDC')!
    const link = rows.find(r => r.token.symbol === 'LINK')!
    expect(eth.source).toBe('chain-oracle')
    expect(usdc.source).toBe('coingecko')
    expect(link.source).toBe('unknown')
  })

  it('computes usdValue only when both balance and price are positive', () => {
    const rows = decorateTokenRows(
      tokens,
      {
        ETH:  { raw: 0n, formatted: 1.2 },
        USDC: { raw: 0n, formatted: 50 },
        // G$ in balance but no price.
        'G$': { raw: 0n, formatted: 10 },
      },
      {
        ETH:  { priceUsd: 3000 },
        // USDC has 0 priceUsd — should NOT produce a USD value.
        USDC: { priceUsd: 0 },
      },
      onChain,
    )
    const eth = rows.find(r => r.token.symbol === 'ETH')!
    expect(eth.usdValue).toBe(3600)
    const usdc = rows.find(r => r.token.symbol === 'USDC')!
    expect(usdc.usdValue).toBeUndefined()
    const gd = rows.find(r => r.token.symbol === 'G$')!
    expect(gd.usdValue).toBeUndefined()
  })
})
