import { describe, it, expect } from 'vitest'
import { DEFAULT_INDICATORS } from '@/lib/indicators'

// Regression guard for task 0069: the chart volume series renders fabricated
// `Math.random()`-derived bars + a prominent "22.71M"-style right-axis tag.
// Until a real volume feed is wired, the default chart must not paint that
// series. We assert here at the indicator-default boundary so every call site
// (stocks detail, perps, future surfaces) inherits the honest default.

describe('DEFAULT_INDICATORS', () => {
  it('keeps the volume series hidden by default until a real volume feed is wired', () => {
    expect(DEFAULT_INDICATORS.vol).toBe(false)
  })

  it('keeps overlay indicators off by default', () => {
    expect(DEFAULT_INDICATORS.sma20).toBe(false)
    expect(DEFAULT_INDICATORS.ema50).toBe(false)
  })
})
