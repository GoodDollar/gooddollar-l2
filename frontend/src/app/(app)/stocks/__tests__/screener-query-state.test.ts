import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STOCKS_SCREENER_STATE,
  parseStocksScreenerState,
  serializeStocksScreenerState,
} from '../screenerQueryState'

describe('stocks screener query state', () => {
  it('parses valid query params into screener state', () => {
    const parsed = parseStocksScreenerState(new URLSearchParams(
      'search=NV&sector=Technology&cap=mega&momentum=gainers&liquidity=active&sortField=price&sortDir=asc',
    ))

    expect(parsed).toEqual({
      query: 'NV',
      sortField: 'price',
      sortDir: 'asc',
      sectorFilter: 'Technology',
      capFilter: 'mega',
      momentumFilter: 'gainers',
      liquidityFilter: 'active',
    })
  })

  it('falls back to defaults for invalid enum params', () => {
    const parsed = parseStocksScreenerState(new URLSearchParams(
      'cap=invalid&momentum=maybe&liquidity=unknown&sortField=foo&sortDir=up',
    ))

    expect(parsed).toEqual(DEFAULT_STOCKS_SCREENER_STATE)
  })

  it('serializes only non-default state', () => {
    const params = serializeStocksScreenerState({
      ...DEFAULT_STOCKS_SCREENER_STATE,
      query: 'AAPL',
      sectorFilter: 'Technology',
      momentumFilter: 'gainers',
      sortField: 'price',
    })

    expect(params.toString()).toContain('search=AAPL')
    expect(params.toString()).toContain('sector=Technology')
    expect(params.toString()).toContain('momentum=gainers')
    expect(params.toString()).toContain('sortField=price')
    expect(params.toString()).not.toContain('cap=')
    expect(params.toString()).not.toContain('liquidity=')
    expect(params.toString()).not.toContain('sortDir=')
  })
})
