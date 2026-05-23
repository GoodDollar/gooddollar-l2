import { describe, it, expect } from 'vitest'
import {
  PANEL_BY_AXIS,
  deriveVerdict,
  isFreshQuotes,
  isHealthyOnChain,
  reasonForAxis,
} from '../proofAxes'

describe('proofAxes — PANEL_BY_AXIS (#0052 canonical copy guard)', () => {
  it('pins the rollup reason copy byte-for-byte so a copy edit lands in one place', () => {
    expect(PANEL_BY_AXIS.quotes.reason).toBe('price-service unreachable')
    expect(PANEL_BY_AXIS.onChain.reason).toBe('no on-chain prices')
    expect(PANEL_BY_AXIS.hedgeProof.reason).toBe('hedge-proof missing')
  })

  it('pins the panel anchors so rollup chip hrefs stay stable', () => {
    expect(PANEL_BY_AXIS.quotes.anchor).toBe('panel-live-quotes')
    expect(PANEL_BY_AXIS.onChain.anchor).toBe('panel-onchain-oracle')
    expect(PANEL_BY_AXIS.hedgeProof.anchor).toBe('panel-last-hedge')
  })

  it('reasonForAxis is a thin wrapper over PANEL_BY_AXIS[axis].reason', () => {
    expect(reasonForAxis('quotes')).toBe(PANEL_BY_AXIS.quotes.reason)
    expect(reasonForAxis('onChain')).toBe(PANEL_BY_AXIS.onChain.reason)
    expect(reasonForAxis('hedgeProof')).toBe(PANEL_BY_AXIS.hedgeProof.reason)
  })
})

describe('proofAxes — deriveVerdict', () => {
  it('returns loading when any axis is unknown', () => {
    expect(
      deriveVerdict({ quotes: 'unknown', onChain: 'healthy', hedgeProof: 'healthy' }),
    ).toBe('loading')
  })

  it('returns green only when all three axes are healthy', () => {
    expect(
      deriveVerdict({ quotes: 'healthy', onChain: 'healthy', hedgeProof: 'healthy' }),
    ).toBe('green')
  })

  it('returns red when all three axes are degraded', () => {
    expect(
      deriveVerdict({ quotes: 'degraded', onChain: 'degraded', hedgeProof: 'degraded' }),
    ).toBe('red')
  })

  it('returns amber when at least one axis is degraded but not all three', () => {
    expect(
      deriveVerdict({ quotes: 'degraded', onChain: 'healthy', hedgeProof: 'healthy' }),
    ).toBe('amber')
  })
})

describe('proofAxes — isFreshQuotes', () => {
  it('rejects non-object payloads', () => {
    expect(isFreshQuotes(null, 30_000)).toBe(false)
    expect(isFreshQuotes('not-json', 30_000)).toBe(false)
    expect(isFreshQuotes(42, 30_000)).toBe(false)
  })

  it('rejects when quotes is an array or missing', () => {
    expect(isFreshQuotes({ quotes: [] }, 30_000)).toBe(false)
    expect(isFreshQuotes({}, 30_000)).toBe(false)
  })

  it('rejects when no quote has a numeric cacheAge', () => {
    expect(isFreshQuotes({ quotes: { AAPL: { symbol: 'AAPL' } } }, 30_000)).toBe(false)
  })

  it('accepts when the freshest quote is within the threshold', () => {
    expect(
      isFreshQuotes(
        { quotes: { AAPL: { cacheAge: 5_000 }, MSFT: { cacheAge: 25_000 } } },
        30_000,
      ),
    ).toBe(true)
  })

  it('rejects when every quote is older than the threshold', () => {
    expect(
      isFreshQuotes(
        { quotes: { AAPL: { cacheAge: 60_000 }, MSFT: { cacheAge: 90_000 } } },
        30_000,
      ),
    ).toBe(false)
  })
})

describe('proofAxes — isHealthyOnChain', () => {
  it('accepts non-zero price8 and timestamp bigints', () => {
    expect(isHealthyOnChain({ price8: 17_860_000_000n, timestamp: 1700000000n })).toBe(true)
  })

  it('rejects zero price8', () => {
    expect(isHealthyOnChain({ price8: 0n, timestamp: 1700000000n })).toBe(false)
  })

  it('rejects zero timestamp', () => {
    expect(isHealthyOnChain({ price8: 17_860_000_000n, timestamp: 0n })).toBe(false)
  })

  it('rejects non-bigint values', () => {
    expect(isHealthyOnChain({ price8: 1, timestamp: 1 })).toBe(false)
    expect(isHealthyOnChain(null)).toBe(false)
  })
})
