import { describe, expect, it } from 'vitest'

import {
  normalizeMalformedHedgeProofPath,
  normalizeMalformedStocksPath,
} from '../safe-route-normalizer.mjs'

describe('normalizeMalformedStocksPath', () => {
  it('keeps valid stocks routes unchanged', () => {
    expect(normalizeMalformedStocksPath('/stocks/AAPL')).toBe('/stocks/AAPL')
    expect(normalizeMalformedStocksPath('/stocks/%2541APL')).toBe('/stocks/%2541APL')
  })

  it('rewrites malformed percent encodings under /stocks to fallback ticker', () => {
    expect(normalizeMalformedStocksPath('/stocks/%2')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%E0%A4%A')).toBe('/stocks/UNKNOWN')
  })

  it('rewrites recursively malformed double-encoded paths under /stocks', () => {
    expect(normalizeMalformedStocksPath('/stocks/%25E0%A4%A')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%2525E0%A4%A')).toBe('/stocks/UNKNOWN')
  })

  it('preserves query string while rewriting malformed /stocks paths', () => {
    expect(normalizeMalformedStocksPath('/stocks/%2?ref=qa&mode=debug')).toBe('/stocks/UNKNOWN?ref=qa&mode=debug')
  })

  it('rewrites replacement-character ticker payloads produced by browser URL normalization', () => {
    expect(normalizeMalformedStocksPath('/stocks/�(�(')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%EF%BF%BD(%EF%BF%BD(')).toBe('/stocks/UNKNOWN')
  })

  it('does not rewrite malformed paths outside /stocks', () => {
    expect(normalizeMalformedStocksPath('/predict/%2')).toBe('/predict/%2')
  })
})

describe('normalizeMalformedHedgeProofPath', () => {
  it('keeps valid hedge-proof routes unchanged', () => {
    expect(normalizeMalformedHedgeProofPath('/analytics/hedge/proof/latest')).toBe(
      '/analytics/hedge/proof/latest',
    )
    expect(
      normalizeMalformedHedgeProofPath(
        '/analytics/hedge/proof/abc12345defg',
      ),
    ).toBe('/analytics/hedge/proof/abc12345defg')
  })

  it('keeps well-formed percent-encoded receipt ids unchanged', () => {
    expect(
      normalizeMalformedHedgeProofPath('/analytics/hedge/proof/abc%2F123'),
    ).toBe('/analytics/hedge/proof/abc%2F123')
    expect(
      normalizeMalformedHedgeProofPath('/analytics/hedge/proof/%E2%9C%93'),
    ).toBe('/analytics/hedge/proof/%E2%9C%93')
  })

  it('rewrites malformed percent encodings under the hedge-proof prefix to the invalid page', () => {
    expect(
      normalizeMalformedHedgeProofPath('/analytics/hedge/proof/foo%E0%80'),
    ).toBe('/analytics/hedge/proof/invalid')
    expect(
      normalizeMalformedHedgeProofPath('/analytics/hedge/proof/%C0'),
    ).toBe('/analytics/hedge/proof/invalid')
    expect(
      normalizeMalformedHedgeProofPath('/analytics/hedge/proof/%'),
    ).toBe('/analytics/hedge/proof/invalid')
    expect(
      normalizeMalformedHedgeProofPath('/analytics/hedge/proof/%2'),
    ).toBe('/analytics/hedge/proof/invalid')
  })

  it('preserves query string when rewriting malformed hedge-proof paths', () => {
    expect(
      normalizeMalformedHedgeProofPath(
        '/analytics/hedge/proof/foo%E0%80?ref=email',
      ),
    ).toBe('/analytics/hedge/proof/invalid?ref=email')
  })

  it('does not rewrite malformed paths outside the hedge-proof prefix', () => {
    expect(normalizeMalformedHedgeProofPath('/predict/%2')).toBe('/predict/%2')
    expect(normalizeMalformedHedgeProofPath('/analytics/%E0%80')).toBe(
      '/analytics/%E0%80',
    )
  })
})
