/**
 * predictVolume.test.ts — TDD tests for the 24h volume rollup helpers used
 * by task 0049 (Predict — Surface 24h volume + momentum delta on market
 * cards).
 *
 * The helpers under test are pure data shapers over already-fetched logs.
 * They do NOT touch the network; the React hook in
 * `use24hVolumeForMarkets.ts` is responsible for `getLogs`. That split is
 * deliberate: it lets us unit-test the math without mocking viem.
 *
 * Shape of the input log mirrors the subset of `viem` `Log` we care about:
 *   - `args.marketId: bigint`
 *   - `args.cost: bigint`     // collateral spent on the trade
 *   - `args.isYES: boolean`   // unused for volume, kept for completeness
 *   - `blockTimestamp: bigint` (unix seconds, as viem returns)
 *
 * Out-of-window logs are dropped. Logs with missing fields are dropped.
 * Rollup is keyed by `marketId` and the value is the sum of `cost`.
 */

import { describe, it, expect } from 'vitest'
import {
  rollupBoughtLogs,
  pickArrowDirection,
  type BoughtLog,
} from '../predictVolume'

// ─── Test fixtures ────────────────────────────────────────────────────────────

/** Build a BoughtLog with sane defaults. Cost is `1e6` units by default. */
function mkLog(overrides: Partial<BoughtLog['args']> & { timestampS: number }): BoughtLog {
  const { timestampS, ...args } = overrides
  return {
    args: {
      marketId: BigInt(0),
      buyer: '0x0000000000000000000000000000000000000000',
      isYES: true,
      amount: BigInt(1),
      cost: BigInt(1_000_000),
      ...args,
    },
    blockTimestamp: BigInt(timestampS),
  }
}

const NOW_S = 1_700_000_000 // arbitrary unix seconds anchor
const WINDOW_END_MS = NOW_S * 1000
const WINDOW_START_MS = WINDOW_END_MS - 24 * 60 * 60 * 1000

// ─── rollupBoughtLogs ─────────────────────────────────────────────────────────

describe('rollupBoughtLogs', () => {
  it('returns an empty map for no logs', () => {
    const out = rollupBoughtLogs([], WINDOW_START_MS, WINDOW_END_MS)
    expect(out.size).toBe(0)
  })

  it('sums cost for a single in-window log', () => {
    const logs: BoughtLog[] = [
      mkLog({ marketId: BigInt(3), cost: BigInt(500), timestampS: NOW_S - 60 }),
    ]
    const out = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.get(BigInt(3))).toBe(BigInt(500))
    expect(out.size).toBe(1)
  })

  it('sums cost across multiple in-window logs for the same market', () => {
    const logs: BoughtLog[] = [
      mkLog({ marketId: BigInt(1), cost: BigInt(100), timestampS: NOW_S - 60 }),
      mkLog({ marketId: BigInt(1), cost: BigInt(250), timestampS: NOW_S - 120 }),
      mkLog({ marketId: BigInt(1), cost: BigInt(50), timestampS: NOW_S - 1 }),
    ]
    const out = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.get(BigInt(1))).toBe(BigInt(400))
  })

  it('keys rollup by marketId across multiple markets', () => {
    const logs: BoughtLog[] = [
      mkLog({ marketId: BigInt(0), cost: BigInt(100), timestampS: NOW_S - 60 }),
      mkLog({ marketId: BigInt(1), cost: BigInt(200), timestampS: NOW_S - 60 }),
      mkLog({ marketId: BigInt(1), cost: BigInt(50), timestampS: NOW_S - 120 }),
      mkLog({ marketId: BigInt(2), cost: BigInt(700), timestampS: NOW_S - 60 }),
    ]
    const out = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.get(BigInt(0))).toBe(BigInt(100))
    expect(out.get(BigInt(1))).toBe(BigInt(250))
    expect(out.get(BigInt(2))).toBe(BigInt(700))
    expect(out.size).toBe(3)
  })

  it('drops logs strictly before the window', () => {
    const logs: BoughtLog[] = [
      // 25h ago — outside the [now-24h, now] window
      mkLog({ marketId: BigInt(0), cost: BigInt(999), timestampS: NOW_S - 25 * 3600 }),
    ]
    const out = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.size).toBe(0)
  })

  it('drops logs strictly after the window', () => {
    const logs: BoughtLog[] = [
      // 5 min in the future relative to the window end
      mkLog({ marketId: BigInt(0), cost: BigInt(999), timestampS: NOW_S + 300 }),
    ]
    const out = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.size).toBe(0)
  })

  it('includes logs exactly at window boundaries (inclusive on both ends)', () => {
    const logs: BoughtLog[] = [
      mkLog({ marketId: BigInt(0), cost: BigInt(10), timestampS: NOW_S }), // = end
      mkLog({ marketId: BigInt(0), cost: BigInt(20), timestampS: NOW_S - 24 * 3600 }), // = start
    ]
    const out = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.get(BigInt(0))).toBe(BigInt(30))
  })

  it('only includes logs that fall in this 24h window when given a wider corpus', () => {
    // Helper that constructs a 48h corpus, then we ask for the most recent
    // 24h slice. The "previous" 24h slice (48h..24h ago) must be excluded.
    const logs: BoughtLog[] = [
      mkLog({ marketId: BigInt(0), cost: BigInt(100), timestampS: NOW_S - 36 * 3600 }), // prev window
      mkLog({ marketId: BigInt(0), cost: BigInt(50), timestampS: NOW_S - 12 * 3600 }),  // curr window
      mkLog({ marketId: BigInt(1), cost: BigInt(200), timestampS: NOW_S - 36 * 3600 }), // prev window
    ]
    const currentSlice = rollupBoughtLogs(logs, WINDOW_START_MS, WINDOW_END_MS)
    expect(currentSlice.get(BigInt(0))).toBe(BigInt(50))
    expect(currentSlice.has(BigInt(1))).toBe(false)

    // Now ask for the previous 24h slice on the same corpus.
    const prevEnd = WINDOW_START_MS
    const prevStart = prevEnd - 24 * 60 * 60 * 1000
    const prevSlice = rollupBoughtLogs(logs, prevStart, prevEnd)
    expect(prevSlice.get(BigInt(0))).toBe(BigInt(100))
    expect(prevSlice.get(BigInt(1))).toBe(BigInt(200))
  })

  it('skips logs with missing args (defensive against malformed RPC payloads)', () => {
    const malformed: BoughtLog[] = [
      // Cast through unknown so we can simulate a partially-decoded log
      // (e.g. a node that returned a log we couldn't decodeEventLog on).
      { args: undefined as unknown as BoughtLog['args'], blockTimestamp: BigInt(NOW_S - 60) },
      mkLog({ marketId: BigInt(7), cost: BigInt(42), timestampS: NOW_S - 60 }),
    ]
    const out = rollupBoughtLogs(malformed, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.get(BigInt(7))).toBe(BigInt(42))
    expect(out.size).toBe(1)
  })

  it('skips logs with missing blockTimestamp', () => {
    const noTs: BoughtLog[] = [
      {
        args: {
          marketId: BigInt(0),
          buyer: '0x0000000000000000000000000000000000000000',
          isYES: true,
          amount: BigInt(1),
          cost: BigInt(100),
        },
        blockTimestamp: undefined as unknown as bigint,
      },
      mkLog({ marketId: BigInt(0), cost: BigInt(7), timestampS: NOW_S - 60 }),
    ]
    const out = rollupBoughtLogs(noTs, WINDOW_START_MS, WINDOW_END_MS)
    expect(out.get(BigInt(0))).toBe(BigInt(7))
  })
})

// ─── pickArrowDirection ──────────────────────────────────────────────────────

describe('pickArrowDirection', () => {
  it('returns "up" when current exceeds previous', () => {
    expect(pickArrowDirection(BigInt(100), BigInt(50))).toBe('up')
    expect(pickArrowDirection(BigInt(1), BigInt(0))).toBe('up')
  })

  it('returns "down" when current is below previous', () => {
    expect(pickArrowDirection(BigInt(50), BigInt(100))).toBe('down')
    expect(pickArrowDirection(BigInt(0), BigInt(1))).toBe('down')
  })

  it('returns "neutral" when current equals previous', () => {
    expect(pickArrowDirection(BigInt(0), BigInt(0))).toBe('neutral')
    expect(pickArrowDirection(BigInt(42), BigInt(42))).toBe('neutral')
  })

  it('returns "neutral" when previous is unknown (null)', () => {
    // Never fabricate a direction. If we don't have the previous window
    // (e.g. RPC failure), we render no arrow.
    expect(pickArrowDirection(BigInt(100), null)).toBe('neutral')
    expect(pickArrowDirection(BigInt(0), null)).toBe('neutral')
  })
})
