import { describe, expect, it } from 'vitest'

import { deriveStocksTradeOracleHealth } from '../useStocksOracleGuard'

describe('deriveStocksTradeOracleHealth', () => {
  it('returns live for fresh and healthy symbol quote', () => {
    const state = deriveStocksTradeOracleHealth('AAPL', {
      healthy: true,
      freshCount: 1,
      totalCount: 1,
      timestamp: Date.now(),
      quotes: [{ symbol: 'AAPL', lastUpdateMs: 4_500, sessionState: 'open', confidence: 95 }],
    })

    expect(state.health).toBe('live')
    expect(state.reason).toBeNull()
  })

  it('returns degraded for delayed quotes', () => {
    const state = deriveStocksTradeOracleHealth('AAPL', {
      healthy: true,
      freshCount: 0,
      totalCount: 1,
      timestamp: Date.now(),
      quotes: [{ symbol: 'AAPL', lastUpdateMs: 90_000, sessionState: 'open', confidence: 91 }],
    })

    expect(state.health).toBe('degraded')
    expect(state.reason).toContain('prices are delayed')
  })

  it('returns offline for very stale quotes', () => {
    const state = deriveStocksTradeOracleHealth('AAPL', {
      healthy: true,
      freshCount: 0,
      totalCount: 1,
      timestamp: Date.now(),
      quotes: [{ symbol: 'AAPL', lastUpdateMs: 301_000, sessionState: 'open', confidence: 80 }],
    })

    expect(state.health).toBe('offline')
    expect(state.reason).toContain('Price data is stale')
  })
})
