/**
 * predictVolume.ts — Pure helpers for rolling up `Bought(...)` event logs
 * into per-market 24h volume figures.
 *
 * The corresponding React hook (`use24hVolumeForMarkets.ts`) is responsible
 * for fetching logs via viem's `getLogs`. We split the math out of the hook
 * deliberately so it can be unit-tested without mocking the network. See
 * task 0049 (Predict — Surface 24h volume + momentum delta on market
 * cards) for the full design.
 *
 * Volume semantics: we sum `cost` (collateral spent on the trade) per
 * marketId. We deliberately ignore the `amount` field (shares bought)
 * because two trades buying different sides at different odds are not
 * comparable in share-space, but they are directly comparable in
 * collateral-space and that is what Polymarket-style "24h volume" means.
 */

/**
 * Minimal viem-`Log`-shaped record we care about. Restricting to this shape
 * keeps the helpers framework-agnostic and lets us hand-roll fixtures in
 * tests without pulling in the full viem `Log` machinery.
 *
 * `args` is the decoded event payload (we expect `decodeEventLog` to have
 * already run upstream, in the hook). `blockTimestamp` is the unix seconds
 * timestamp of the block — viem returns this on `Log` when the underlying
 * RPC supports it (Anvil and most public RPCs do).
 */
export interface BoughtLogArgs {
  marketId: bigint
  buyer: string
  isYES: boolean
  amount: bigint
  cost: bigint
}

export interface BoughtLog {
  args: BoughtLogArgs
  /** Unix seconds. May be missing if the upstream `getLogs` couldn't fill it in. */
  blockTimestamp: bigint
}

/**
 * Roll up `Bought` event logs into a `marketId → totalCost` map for trades
 * whose block timestamp falls within `[windowStartMs, windowEndMs]`
 * (inclusive on both ends).
 *
 * Window arguments are JS millisecond timestamps to match `Date.now()`.
 * Internally we compare against the log's `blockTimestamp * 1000` so the
 * caller never has to think in seconds.
 *
 * Logs with a missing `args` or `blockTimestamp` are silently dropped:
 * defending against a half-decoded log is cheaper than crashing the entire
 * market grid because one RPC returned junk.
 */
export function rollupBoughtLogs(
  logs: readonly BoughtLog[],
  windowStartMs: number,
  windowEndMs: number,
): Map<bigint, bigint> {
  const out = new Map<bigint, bigint>()
  for (const log of logs) {
    if (!log.args) continue
    if (log.blockTimestamp === undefined || log.blockTimestamp === null) continue

    const tsMs = Number(log.blockTimestamp) * 1000
    if (tsMs < windowStartMs || tsMs > windowEndMs) continue

    const { marketId, cost } = log.args
    const prev = out.get(marketId) ?? BigInt(0)
    out.set(marketId, prev + cost)
  }
  return out
}

/**
 * Direction of the 24h-volume momentum arrow on a market card.
 *
 *   - `up`      → current 24h > previous 24h (more activity than yesterday)
 *   - `down`    → current 24h < previous 24h
 *   - `neutral` → equal, both zero, or previous unknown (e.g. RPC failure)
 *
 * We render no arrow at all when this returns `neutral`; that's important —
 * a fabricated arrow on a market we couldn't fetch history for would be
 * actively misleading. Polymarket's own cards omit the delta in that case.
 */
export type ArrowDirection = 'up' | 'down' | 'neutral'

export function pickArrowDirection(current: bigint, previous: bigint | null): ArrowDirection {
  if (previous === null) return 'neutral'
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'neutral'
}
