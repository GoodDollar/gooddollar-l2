import { describe, expect, it } from 'vitest'
import { deriveStocksOracleHealth, getStocksKeeperAgeMs } from '../stocksOracleHealth'

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

  it('returns auth when stocks-keeper reports unauthorized/auth state', () => {
    const state = deriveStocksOracleHealth({
      overall: 'degraded',
      services: [
        { name: 'stocks-keeper', status: 'unauthorized', lastChecked: '2026-05-20T07:29:50.000Z' },
      ],
    }, now)

    expect(state).toBe('auth')
  })

  it('returns offline when stocks-keeper service is missing', () => {
    const state = deriveStocksOracleHealth({ overall: 'healthy', services: [] }, now)
    expect(state).toBe('offline')
  })

  describe('onChainReachable parameter', () => {
    const healthyPayload = {
      overall: 'healthy',
      services: [
        { name: 'stocks-keeper', status: 'ok', lastChecked: '2026-05-20T07:29:40.000Z' },
      ],
    }

    it('returns fallback when keeper is healthy but on-chain oracle is unreachable', () => {
      const state = deriveStocksOracleHealth(healthyPayload, now, false)
      expect(state).toBe('fallback')
    })

    it('returns live when keeper is healthy and on-chain oracle is reachable', () => {
      const state = deriveStocksOracleHealth(healthyPayload, now, true)
      expect(state).toBe('live')
    })

    it('returns live when keeper is healthy and on-chain reachability is unknown (undefined)', () => {
      const state = deriveStocksOracleHealth(healthyPayload, now, undefined)
      expect(state).toBe('live')
    })

    it('does not upgrade degraded status when on-chain is reachable', () => {
      const degradedPayload = {
        overall: 'degraded',
        services: [
          { name: 'stocks-keeper', status: 'error', lastChecked: '2026-05-20T07:29:50.000Z' },
        ],
      }
      const state = deriveStocksOracleHealth(degradedPayload, now, true)
      expect(state).toBe('degraded')
    })

    it('does not downgrade offline to fallback when service missing', () => {
      const state = deriveStocksOracleHealth({ overall: 'healthy', services: [] }, now, false)
      expect(state).toBe('offline')
    })

    it('returns degraded (not fallback) when keeper is stale even if on-chain is unreachable', () => {
      const stalePayload = {
        overall: 'healthy',
        services: [
          { name: 'stocks-keeper', status: 'ok', lastChecked: '2026-05-20T07:28:10.000Z' },
        ],
      }
      const state = deriveStocksOracleHealth(stalePayload, now, false)
      expect(state).toBe('degraded')
    })
  })
})

describe('getStocksKeeperAgeMs', () => {
  const now = Date.parse('2026-05-20T07:30:00.000Z')

  it('returns the heartbeat age when stocks-keeper has a recent lastChecked', () => {
    const age = getStocksKeeperAgeMs(
      {
        overall: 'healthy',
        services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: '2026-05-20T07:29:55.000Z' }],
      },
      now,
    )
    expect(age).toBe(5_000)
  })

  it('returns null when payload is missing', () => {
    expect(getStocksKeeperAgeMs(null, now)).toBeNull()
    expect(getStocksKeeperAgeMs(undefined, now)).toBeNull()
  })

  it('returns null when stocks-keeper service is absent', () => {
    expect(
      getStocksKeeperAgeMs({ overall: 'healthy', services: [] }, now),
    ).toBeNull()
  })

  it('returns null when lastChecked is missing or unparseable', () => {
    expect(
      getStocksKeeperAgeMs(
        { overall: 'healthy', services: [{ name: 'stocks-keeper', status: 'ok' }] },
        now,
      ),
    ).toBeNull()
    expect(
      getStocksKeeperAgeMs(
        {
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: 'not-a-date' }],
        },
        now,
      ),
    ).toBeNull()
  })

  it('clamps a negative age (clock skew) to zero', () => {
    const age = getStocksKeeperAgeMs(
      {
        overall: 'healthy',
        services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: '2026-05-20T07:30:30.000Z' }],
      },
      now,
    )
    expect(age).toBe(0)
  })
})
