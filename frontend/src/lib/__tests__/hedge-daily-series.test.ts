import { describe, it, expect } from 'vitest'

import { buildDailySeries, type DailySeriesInput } from '../hedge-daily-series'

const DAY_MS = 86_400_000
const NOW = Date.parse('2026-05-23T15:00:00Z')

function rec(overrides: Partial<DailySeriesInput> = {}): DailySeriesInput {
  return {
    timestamp: NOW,
    notionalUsd: 100,
    success: true,
    ...overrides,
  }
}

describe('buildDailySeries', () => {
  it('returns empty arrays + zero coverage for empty input', () => {
    expect(buildDailySeries([], { now: NOW })).toEqual({
      days: [],
      notional: [],
      orders: [],
      coverageDays: 0,
    })
  })

  it('buckets a single-day batch of receipts into one point', () => {
    const series = buildDailySeries(
      [
        rec({ notionalUsd: 50 }),
        rec({ notionalUsd: 70 }),
        rec({ notionalUsd: 30 }),
      ],
      { now: NOW },
    )
    expect(series.coverageDays).toBe(1)
    expect(series.days).toEqual(['2026-05-23'])
    expect(series.notional).toEqual([150])
    expect(series.orders).toEqual([3])
  })

  it('backfills missing days between oldest receipt and today with zeros', () => {
    const series = buildDailySeries(
      [
        rec({ timestamp: NOW - DAY_MS * 3, notionalUsd: 100 }),
        rec({ timestamp: NOW, notionalUsd: 200 }),
      ],
      { now: NOW },
    )
    expect(series.days).toEqual([
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
    ])
    expect(series.notional).toEqual([100, 0, 0, 200])
    expect(series.orders).toEqual([1, 0, 0, 1])
    expect(series.coverageDays).toBe(2)
  })

  it('caps the window at the configured `days` length, dropping the oldest', () => {
    const inputs: DailySeriesInput[] = []
    for (let i = 0; i < 10; i += 1) {
      inputs.push(rec({ timestamp: NOW - DAY_MS * i, notionalUsd: i * 10 }))
    }
    const series = buildDailySeries(inputs, { now: NOW, days: 7 })
    expect(series.days.length).toBe(7)
    expect(series.days[0]).toBe('2026-05-17')
    expect(series.days.at(-1)).toBe('2026-05-23')
    expect(series.coverageDays).toBe(10)
  })

  it('skips receipts with non-finite timestamp entirely', () => {
    const series = buildDailySeries(
      [rec({ timestamp: NaN, notionalUsd: 100 }), rec({ notionalUsd: 80 })],
      { now: NOW },
    )
    expect(series.coverageDays).toBe(1)
    expect(series.notional).toEqual([80])
    expect(series.orders).toEqual([1])
  })

  it('counts a receipt with non-finite notional as an order but adds 0 to notional', () => {
    const series = buildDailySeries(
      [
        rec({ notionalUsd: Number.POSITIVE_INFINITY }),
        rec({ notionalUsd: 80 }),
      ],
      { now: NOW },
    )
    expect(series.coverageDays).toBe(1)
    expect(series.notional).toEqual([80])
    expect(series.orders).toEqual([2])
  })

  it('uses UTC date keys (matches capSnapshot.dayKey)', () => {
    // 2026-05-22T23:30:00Z falls on 2026-05-22 UTC even though a viewer
    // in UTC+09 would already be in 2026-05-23.
    const series = buildDailySeries(
      [rec({ timestamp: Date.parse('2026-05-22T23:30:00Z') })],
      { now: NOW },
    )
    expect(series.days[0]).toBe('2026-05-22')
  })
})
