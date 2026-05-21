import { describe, expect, it } from 'vitest'
import { deriveStocksOracleHealth } from '../stocksOracleHealth'

describe('deriveStocksOracleHealth', () => {
  const now = Date.parse('2026-05-20T07:30:00.000Z')

  it('returns live when stocks-keeper is ok and fresh', () => {
    const state = deriveStocksOracleHealth({
      overall: 'healthy',
      services: [
        { name: 'stocks-keeper', status: 'ok', lastChecked: '2026-05-20T07:29:40.000Z' },
      ],
    }, now)

    expect(state).toBe('live')
  })

  it('returns degraded when stocks-keeper is stale', () => {
    const state = deriveStocksOracleHealth({
      overall: 'healthy',
      services: [
        { name: 'stocks-keeper', status: 'ok', lastChecked: '2026-05-20T07:28:10.000Z' },
      ],
    }, now)

    expect(state).toBe('degraded')
  })

  it('returns degraded when stocks-keeper reports non-ok', () => {
    const state = deriveStocksOracleHealth({
      overall: 'degraded',
      services: [
        { name: 'stocks-keeper', status: 'error', lastChecked: '2026-05-20T07:29:50.000Z' },
      ],
    }, now)

    expect(state).toBe('degraded')
  })

  it('returns offline when stocks-keeper service is missing', () => {
    const state = deriveStocksOracleHealth({ overall: 'healthy', services: [] }, now)
    expect(state).toBe('offline')
  })
})

