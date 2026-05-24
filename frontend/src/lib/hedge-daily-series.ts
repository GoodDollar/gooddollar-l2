/**
 * Lane 5 — derive per-day notional + order-count series from the
 * already-rendered hedge receipts.
 *
 * The hedge status card carries a 5-row receipts table. To draw a 7-day
 * sparkline next to "Today's notional" + "Cycle orders" tiles (task
 * 0044) we bucket those receipts by UTC day key (matching
 * `capSnapshot.dayKey`) and accumulate notional + order counts. Days
 * with no receipts inside the window are backfilled with zeros so the
 * polyline is monotonic in time.
 *
 * Pure, deterministic, side-effect free.
 */

export interface DailySeriesInput {
  timestamp: number
  notionalUsd: number
  success: boolean
}

export interface DailySeries {
  days: string[]
  notional: number[]
  orders: number[]
  coverageDays: number
}

const MS_PER_DAY = 86_400_000

function dayKeyForMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function addDays(dayKey: string, n: number): string {
  const ms = Date.parse(`${dayKey}T00:00:00Z`)
  return new Date(ms + n * MS_PER_DAY).toISOString().slice(0, 10)
}

export interface BuildDailySeriesOptions {
  days?: number
  now?: number
}

export function buildDailySeries(
  receipts: readonly DailySeriesInput[],
  options: BuildDailySeriesOptions = {},
): DailySeries {
  const windowSize = options.days ?? 7
  const buckets = new Map<string, { notional: number; orders: number }>()

  for (const r of receipts) {
    if (!Number.isFinite(r.timestamp)) continue
    const key = dayKeyForMs(r.timestamp)
    const prev = buckets.get(key) ?? { notional: 0, orders: 0 }
    prev.notional += Number.isFinite(r.notionalUsd) ? r.notionalUsd : 0
    prev.orders += 1
    buckets.set(key, prev)
  }

  const coverageDays = buckets.size
  if (coverageDays === 0) {
    return { days: [], notional: [], orders: [], coverageDays: 0 }
  }

  const todayKey = dayKeyForMs(options.now ?? Date.now())
  const sortedKeys = [...buckets.keys()].sort()
  const oldestKey = sortedKeys[0]
  // Newest end of the window is `today` (so a sparkline always lands
  // on the current day). Oldest end is the older of `today - windowSize + 1`
  // and the oldest receipt's day, capped so we never render more than
  // `windowSize` points.
  const desiredOldest = addDays(todayKey, -(windowSize - 1))
  const effectiveOldest = oldestKey < desiredOldest ? desiredOldest : oldestKey

  const days: string[] = []
  const notional: number[] = []
  const orders: number[] = []
  for (
    let cursor = effectiveOldest;
    cursor <= todayKey;
    cursor = addDays(cursor, 1)
  ) {
    const bucket = buckets.get(cursor)
    days.push(cursor)
    notional.push(bucket?.notional ?? 0)
    orders.push(bucket?.orders ?? 0)
  }

  if (days.length > windowSize) {
    const overflow = days.length - windowSize
    days.splice(0, overflow)
    notional.splice(0, overflow)
    orders.splice(0, overflow)
  }

  return { days, notional, orders, coverageDays }
}
