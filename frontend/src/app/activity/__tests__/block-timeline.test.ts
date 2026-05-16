import { describe, it, expect } from 'vitest'
import { computeBarHeights } from '../block-timeline'

describe('computeBarHeights', () => {
  it('returns an empty array when blocks is empty', () => {
    expect(computeBarHeights([])).toEqual([])
  })

  it('returns the minimum floor for all bars when every block has zero transactions', () => {
    const blocks = Array.from({ length: 5 }, (_, i) => ({
      number: 100 + i,
      txCount: 0,
      timestamp: 0,
    }))
    const heights = computeBarHeights(blocks)
    expect(heights).toHaveLength(5)
    for (const bar of heights) {
      // Should never collapse to 0 (the original bug) or NaN (division by zero)
      expect(Number.isFinite(bar.height)).toBe(true)
      expect(bar.height).toBeGreaterThanOrEqual(4)
      expect(bar.hasTxs).toBe(false)
    }
  })

  it('scales the busiest bar to the full chart height', () => {
    const blocks = [
      { number: 1, txCount: 0, timestamp: 0 },
      { number: 2, txCount: 3, timestamp: 0 },
      { number: 3, txCount: 0, timestamp: 0 },
      { number: 4, txCount: 1, timestamp: 0 },
    ]
    const heights = computeBarHeights(blocks)
    // The busiest block (3 txs) should reach the chart-height ceiling (64px).
    expect(heights[1].height).toBe(64)
    expect(heights[1].hasTxs).toBe(true)
    // The half-busy bar should be proportional (1/3 of 64 = ~21.33).
    expect(heights[3].height).toBeCloseTo((1 / 3) * 64)
    expect(heights[3].hasTxs).toBe(true)
    // Zero bars sit at the minimum floor.
    expect(heights[0].height).toBe(4)
    expect(heights[0].hasTxs).toBe(false)
    expect(heights[2].height).toBe(4)
  })

  it('honours custom chart height and floor', () => {
    const blocks = [
      { number: 1, txCount: 0, timestamp: 0 },
      { number: 2, txCount: 10, timestamp: 0 },
    ]
    const heights = computeBarHeights(blocks, 128, 8)
    expect(heights[1].height).toBe(128)
    expect(heights[0].height).toBe(8)
  })

  it('never returns NaN heights even when called with all-zero counts (division by zero defence)', () => {
    const blocks = Array.from({ length: 20 }, (_, i) => ({
      number: i,
      txCount: 0,
      timestamp: 0,
    }))
    for (const bar of computeBarHeights(blocks)) {
      expect(Number.isNaN(bar.height)).toBe(false)
    }
  })
})
