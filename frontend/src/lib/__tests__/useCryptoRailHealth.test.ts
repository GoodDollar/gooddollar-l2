import { describe, it, expect } from 'vitest'
import { deriveCryptoRailHealth } from '@/lib/useCryptoRailHealth'

const NOW = 1_700_000_000_000

describe('deriveCryptoRailHealth', () => {
  it('reports offline when the rail is disabled', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: false, lastSuccessAtMs: null, lastFailureAtMs: null },
      NOW,
    )
    expect(health).toBe('offline')
    expect(ageMs).toBeNull()
  })

  it('reports degraded when enabled but no success heartbeat', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: null, lastFailureAtMs: null },
      NOW,
    )
    expect(health).toBe('degraded')
    expect(ageMs).toBeNull()
  })

  it('reports live when enabled and last success is fresh', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: NOW - 10_000, lastFailureAtMs: NOW - 600_000 },
      NOW,
    )
    expect(health).toBe('live')
    expect(ageMs).toBe(10_000)
  })

  it('reports degraded when enabled but last success is stale (>60s)', () => {
    const { health, ageMs } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: NOW - 120_000, lastFailureAtMs: null },
      NOW,
    )
    expect(health).toBe('degraded')
    expect(ageMs).toBe(120_000)
  })

  it('reports degraded when last failure is more recent than last success', () => {
    const { health } = deriveCryptoRailHealth(
      { enabled: true, lastSuccessAtMs: NOW - 30_000, lastFailureAtMs: NOW - 5_000 },
      NOW,
    )
    expect(health).toBe('degraded')
  })
})
