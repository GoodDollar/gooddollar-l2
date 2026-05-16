import { describe, it, expect } from 'vitest'
import { aggregateBookLevels, generateOrderBook } from '../OrderBook'

// Task 0082 — the perps order book ladder must be strictly monotonic in price.
// Real exchanges (Hyperliquid, Binance, Coinbase, dYdX, GMX) all render asks
// descending top-to-bottom and bids descending top-to-bottom so the row closest
// to the spread is always the best quote. The mock generator must satisfy the
// same invariant on every render or traders read the book as broken.

const MID_PRICES = [
  0.0001, 0.0023, 0.5, 0.97,
  1, 3.14, 5, 9.99,
  10.5, 25, 87.42, 250,
  500, 999.5, 1000, 2500,
  10_000, 25_500, 50_000, 99_999,
]

// Repeat each mid 5× so we hit ~100 randomized calls and overwhelmingly catch
// the i*tickSize*(1+r*0.5) jitter overlap that produced the original bug.
const REPEATS = 5

describe('OrderBook — generateOrderBook', () => {
  it('returns bids strictly descending in price for every mid price', () => {
    for (const mid of MID_PRICES) {
      for (let k = 0; k < REPEATS; k++) {
        const { bids } = generateOrderBook(mid)
        expect(bids.length).toBeGreaterThan(0)
        for (let i = 0; i + 1 < bids.length; i++) {
          expect(bids[i].price).toBeGreaterThan(bids[i + 1].price)
        }
      }
    }
  })

  it('returns asks (in render order) strictly descending in price for every mid price', () => {
    // The JSX iterates `asks` top-down. To match exchange convention, the
    // returned array must be ordered so the first row is the deepest ask and
    // the last row is the best ask (closest to the spread line).
    for (const mid of MID_PRICES) {
      for (let k = 0; k < REPEATS; k++) {
        const { asks } = generateOrderBook(mid)
        expect(asks.length).toBeGreaterThan(0)
        for (let i = 0; i + 1 < asks.length; i++) {
          expect(asks[i].price).toBeGreaterThan(asks[i + 1].price)
        }
      }
    }
  })

  it('reports a strictly positive spread equal to bestAsk - bestBid', () => {
    for (const mid of MID_PRICES) {
      for (let k = 0; k < REPEATS; k++) {
        const { bids, asks, spread } = generateOrderBook(mid)
        const bestBid = Math.max(...bids.map(b => b.price))
        const bestAsk = Math.min(...asks.map(a => a.price))
        expect(bestAsk).toBeGreaterThan(bestBid)
        expect(spread).toBeGreaterThan(0)
        expect(spread).toBeCloseTo(bestAsk - bestBid, 8)
      }
    }
  })

  it('bid cumulative totals are non-decreasing from best bid outward (top to bottom of bid half)', () => {
    for (const mid of MID_PRICES) {
      for (let k = 0; k < REPEATS; k++) {
        const { bids } = generateOrderBook(mid)
        for (let i = 0; i + 1 < bids.length; i++) {
          expect(bids[i + 1].total).toBeGreaterThanOrEqual(bids[i].total)
        }
      }
    }
  })

  it('ask cumulative totals are non-increasing top to bottom (best ask is the smallest total, deepest ask is the largest)', () => {
    // After the final reverse, totals top-to-bottom go: deepest (largest) →
    // best (smallest). So totals must be non-increasing as the row index grows.
    for (const mid of MID_PRICES) {
      for (let k = 0; k < REPEATS; k++) {
        const { asks } = generateOrderBook(mid)
        for (let i = 0; i + 1 < asks.length; i++) {
          expect(asks[i + 1].total).toBeLessThanOrEqual(asks[i].total)
        }
      }
    }
  })
})

// Task 0097 — when adjacent levels round to the same display string, the
// rendered book must aggregate them into a single row. Real CLOBs do this
// natively at the displayed tick; the mock generator produces continuous
// floats that frequently collide after `formatPerpsPrice`'s 2-decimal cap
// for prices >= $1000.
describe('OrderBook — aggregateBookLevels', () => {
  const fmt2 = (n: number) => n.toFixed(2)

  it('passes through entries with distinct formatted prices unchanged', () => {
    const input = [
      { price: 100.55, size: 1, total: 1 },
      { price: 100.45, size: 2, total: 3 },
      { price: 100.35, size: 3, total: 6 },
    ]
    const out = aggregateBookLevels(input, fmt2)
    expect(out).toHaveLength(3)
    expect(out.map(r => r.price)).toEqual([100.55, 100.45, 100.35])
    expect(out.map(r => r.size)).toEqual([1, 2, 3])
    expect(out.map(r => r.total)).toEqual([1, 3, 6])
  })

  it('merges consecutive entries that round to the same display string', () => {
    // Two adjacent levels that both render as "100.55" — must collapse.
    const input = [
      { price: 100.554, size: 1, total: 1 },
      { price: 100.551, size: 2, total: 3 },
      { price: 100.45, size: 3, total: 6 },
    ]
    const out = aggregateBookLevels(input, fmt2)
    expect(out).toHaveLength(2)
    expect(out[0].size).toBe(3) // 1 + 2
    expect(out[1]).toEqual({ price: 100.45, size: 3, total: 6 })
  })

  it('sets merged total equal to the deepest underlying total in the group (input order = best→deep)', () => {
    // Render-order convention: bid array is best→deep, totals grow as index grows.
    // The deepest member of a merge group has the largest `total` and that's what
    // the rendered row must show, otherwise rows farther from the spread would
    // claim less depth than they actually represent.
    const input = [
      { price: 100.554, size: 1, total: 1 },
      { price: 100.551, size: 2, total: 3 },
      { price: 100.549, size: 4, total: 7 },
    ]
    const out = aggregateBookLevels(input, fmt2)
    expect(out).toHaveLength(1)
    expect(out[0].size).toBe(7) // 1 + 2 + 4
    expect(out[0].total).toBe(7) // deepest member's total
    expect(out[0].price).toBe(100.554) // first member's price (representative)
  })

  it('handles input ordered deep→best (asks after reverse): merged total equals deepest member total', () => {
    // For asks, the array passed to render goes deep→best, so totals decrease
    // as index grows. The deepest member of a merge group has the largest
    // `total` — and is the FIRST entry of that group when iterating in render
    // order. Aggregation must preserve "row farther from spread shows higher
    // depth" so the merged total is the maximum total among merged entries.
    const input = [
      { price: 100.553, size: 4, total: 7 },
      { price: 100.549, size: 2, total: 3 },
      { price: 100.547, size: 1, total: 1 },
    ]
    const out = aggregateBookLevels(input, fmt2)
    expect(out).toHaveLength(1)
    expect(out[0].size).toBe(7)
    expect(out[0].total).toBe(7) // max total of merged entries
  })

  it('returns empty array for empty input', () => {
    expect(aggregateBookLevels([], fmt2)).toEqual([])
  })

  it('produces no two consecutive rows with the same formatted price', () => {
    const input = [
      { price: 100.554, size: 1, total: 1 },
      { price: 100.551, size: 2, total: 3 },
      { price: 100.45, size: 3, total: 6 },
      { price: 100.453, size: 1, total: 7 }, // also renders as "100.45"
    ]
    const out = aggregateBookLevels(input, fmt2)
    for (let i = 0; i + 1 < out.length; i++) {
      expect(fmt2(out[i].price)).not.toBe(fmt2(out[i + 1].price))
    }
  })
})
