import { describe, it, expect } from 'vitest'
import { generateOrderBook } from '../OrderBook'

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
