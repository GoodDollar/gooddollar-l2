'use client'

/**
 * useTwentyFourHourVolume — per-market 24h trading volume + momentum delta.
 *
 * For task 0049 (Predict — Surface 24h volume + momentum delta on market
 * cards). Computes, for each on-chain prediction market:
 *
 *   volume24h     = sum of `Bought(...).cost` over the trailing 24h
 *   volume24hPrev = sum of `Bought(...).cost` over the 48h..24h window
 *
 * The momentum arrow rendered by `MarketCard` is purely a function of
 * (volume24h, volume24hPrev) — see `pickArrowDirection` in
 * `predictVolume.ts`. We keep the math out of this file (and out of React
 * land) so the same rollup is reachable from unit tests without mocking
 * viem or wagmi at all.
 *
 * Implementation notes:
 *
 *   - We fetch all `Bought` logs in a single `getLogs` call (no marketId
 *     filter), then bucket them in-memory. Doing one RPC round-trip per
 *     market would melt the grid for >10 markets and is unnecessary —
 *     `Bought` is cheap to scan, and on a fresh devnet there are usually
 *     fewer than a few hundred trades total.
 *
 *   - Block timestamps come from a single batched `getBlock` per unique
 *     block, mirroring the pattern already in `useStockTrades.ts`. We
 *     attach the resulting unix-second timestamp back onto each log as
 *     `blockTimestamp`, then hand the enriched logs to `rollupBoughtLogs`.
 *
 *   - Refresh cadence is intentionally slower than the on-chain reads in
 *     `useAllOnChainMarkets` (which refetch every 20s). Volume only moves
 *     when someone trades, so a 60s cadence avoids running an extra
 *     `getLogs` sweep on every probability refresh — the cards still
 *     update within a minute of a fresh trade.
 *
 *   - `fromBlock: 'earliest'` is fine on Anvil/local devnet. On a real
 *     OP Sepolia deployment we'd want a windowed fromBlock (e.g.
 *     currentBlock - 24h worth of blocks) so we don't replay history
 *     from genesis — see TODOs in this file.
 */

import { useMemo } from 'react'
import { usePublicClient } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseAbiItem } from 'viem'
import { CONTRACTS } from './chain'
import { rollupBoughtLogs, type BoughtLog } from './predictVolume'

const BOUGHT_EVENT = parseAbiItem(
  'event Bought(uint256 indexed marketId, address indexed buyer, bool isYES, uint256 amount, uint256 cost)',
)

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export interface MarketVolumeWindow {
  /** Sum of `cost` in wei across all Bought logs in the trailing 24h. */
  volume24h: bigint
  /**
   * Same, but for the previous 24h (48h..24h ago). `null` when we cannot
   * compute it (e.g. RPC returned no logs from that window AND we have no
   * confident lower bound; in practice this means "no trades that old").
   *
   * The downstream arrow renderer treats `null` as "no arrow", which is
   * the correct conservative behaviour — see `pickArrowDirection`.
   */
  volume24hPrev: bigint | null
}

export interface TwentyFourHourVolumeState {
  /** Map keyed by stringified bigint marketId. Empty until first fetch. */
  volumes: Map<string, MarketVolumeWindow>
  isLoading: boolean
  isError: boolean
}

/**
 * Fetch all `Bought` logs from the MarketFactory and roll them up into
 * per-market 24h volume + previous-24h volume.
 *
 * The optional `nowMs` argument is provided for tests so we can pin
 * "now" to a fixed instant; production callers should leave it
 * unspecified (we'll use `Date.now()` at fetch time).
 */
export function useTwentyFourHourVolume(opts?: {
  nowMs?: number
  enabled?: boolean
}): TwentyFourHourVolumeState {
  const client = usePublicClient()
  const enabled = (opts?.enabled ?? true) && !!client

  const result = useQuery({
    queryKey: ['predict-24h-volume', CONTRACTS.MarketFactory],
    queryFn: async (): Promise<Map<string, MarketVolumeWindow>> => {
      if (!client) return new Map()

      // Pulling all Bought logs from genesis is fine on the local devnet
      // (block count is small and indexed). For a long-lived public
      // testnet we'd want fromBlock = currentBlock - ~14400 (24h of 6s
      // blocks) plus a safety margin, but doing that here would require
      // a second `getBlockNumber` round-trip and isn't worth the
      // complexity until we have meaningful history. TODO when migrating
      // to OP Sepolia: switch to a windowed fromBlock.
      const rawLogs = await client.getLogs({
        address: CONTRACTS.MarketFactory,
        event: BOUGHT_EVENT,
        fromBlock: BigInt(0),
      })

      // Batch-resolve block timestamps. viem returns `blockNumber: bigint`
      // on every log (when available); we de-duplicate before fetching
      // blocks so 50 logs in the same block cost one RPC, not fifty.
      const uniqueBlocks = [
        ...new Set(
          rawLogs
            .map(l => l.blockNumber)
            .filter((n): n is bigint => n !== null && n !== undefined),
        ),
      ]
      const blockTimestamps = new Map<bigint, bigint>()
      if (uniqueBlocks.length > 0) {
        const blocks = await Promise.all(
          uniqueBlocks.map(n => client.getBlock({ blockNumber: n })),
        )
        blocks.forEach((b, i) =>
          blockTimestamps.set(uniqueBlocks[i], b.timestamp),
        )
      }

      const enriched: BoughtLog[] = []
      for (const log of rawLogs) {
        const ts =
          log.blockNumber !== null && log.blockNumber !== undefined
            ? blockTimestamps.get(log.blockNumber)
            : undefined
        if (ts === undefined) continue
        const args = log.args as Partial<{
          marketId: bigint
          buyer: `0x${string}`
          isYES: boolean
          amount: bigint
          cost: bigint
        }>
        if (
          args.marketId === undefined ||
          args.buyer === undefined ||
          args.isYES === undefined ||
          args.amount === undefined ||
          args.cost === undefined
        ) {
          continue
        }
        enriched.push({
          args: {
            marketId: args.marketId,
            buyer: args.buyer,
            isYES: args.isYES,
            amount: args.amount,
            cost: args.cost,
          },
          blockTimestamp: ts,
        })
      }

      const now = opts?.nowMs ?? Date.now()
      const currWindow = rollupBoughtLogs(enriched, now - ONE_DAY_MS, now)
      const prevWindow = rollupBoughtLogs(
        enriched,
        now - 2 * ONE_DAY_MS,
        now - ONE_DAY_MS - 1, // exclusive of the boundary the current window covers
      )

      // Union of marketIds that show up in either window — that's the set
      // of markets we have a number for.
      const ids = new Set<bigint>()
      for (const id of currWindow.keys()) ids.add(id)
      for (const id of prevWindow.keys()) ids.add(id)

      const out = new Map<string, MarketVolumeWindow>()
      for (const id of ids) {
        const curr = currWindow.get(id) ?? BigInt(0)
        const prev = prevWindow.has(id) ? (prevWindow.get(id) as bigint) : null
        out.set(id.toString(), { volume24h: curr, volume24hPrev: prev })
      }
      return out
    },
    enabled,
    // Volume only moves when someone trades; refetching too aggressively
    // burns RPC quota and re-renders every card. 60s is a good balance
    // for testnet feel without being chatty.
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  // Stable empty map so consumers can `.get()` safely on first render
  // without thrashing reference equality across re-renders.
  const empty = useMemo(() => new Map<string, MarketVolumeWindow>(), [])

  return {
    volumes: result.data ?? empty,
    isLoading: result.isLoading,
    isError: result.isError,
  }
}
