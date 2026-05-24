import { describe, it, expect } from 'vitest'
import {
  resolvePriceSource,
  STALE_THRESHOLD_MS,
  WARN_THRESHOLD_MS,
  type PriceSource,
} from '../priceSource'

describe('priceSource — shared module', () => {
  it('exposes the agreed stale + warn thresholds', () => {
    expect(STALE_THRESHOLD_MS).toBe(60_000)
    expect(WARN_THRESHOLD_MS).toBe(15_000)
  })

  it('returns chain-oracle when chainOk is true (regardless of other signals)', () => {
    const result: PriceSource = resolvePriceSource({
      chainOk: true,
      coinGeckoLive: true,
      statusQuote: {
        lastUpdateMs: 1000,
        sessionState: 'open',
        source: 'etoro',
      },
    })
    expect(result).toBe('chain-oracle')
  })

  it('returns etoro-demo when no chain price but status quote says source=etoro and fresh', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: false,
      statusQuote: {
        lastUpdateMs: 5000,
        sessionState: 'open',
        source: 'etoro',
      },
    })
    expect(result).toBe('etoro-demo')
  })

  it('returns stale when statusQuote is older than STALE_THRESHOLD_MS', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: false,
      statusQuote: {
        lastUpdateMs: STALE_THRESHOLD_MS + 1,
        sessionState: 'open',
        source: 'etoro',
      },
    })
    expect(result).toBe('stale')
  })

  it('returns closed when sessionState is closed', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: false,
      statusQuote: {
        lastUpdateMs: 1000,
        sessionState: 'closed',
        source: 'etoro',
      },
    })
    expect(result).toBe('closed')
  })

  it('returns closed when sessionState is halted', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: false,
      statusQuote: {
        lastUpdateMs: 1000,
        sessionState: 'halted',
        source: 'etoro',
      },
    })
    expect(result).toBe('closed')
  })

  it('returns coingecko when only CoinGecko has a live value', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: true,
    })
    expect(result).toBe('coingecko')
  })

  it('returns fallback when nothing is live but a (cached) value is present', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: false,
      hasFallback: true,
    })
    expect(result).toBe('fallback')
  })

  it('returns unknown when no signal whatsoever is available', () => {
    const result = resolvePriceSource({
      chainOk: false,
      coinGeckoLive: false,
    })
    expect(result).toBe('unknown')
  })

  it('prefers chain-oracle over closed market signals (chain wins always)', () => {
    const result = resolvePriceSource({
      chainOk: true,
      coinGeckoLive: false,
      statusQuote: {
        lastUpdateMs: 1000,
        sessionState: 'closed',
        source: 'etoro',
      },
    })
    expect(result).toBe('chain-oracle')
  })
})
