'use client'

/**
 * useOnChainPerps — reads perpetual futures data from PerpEngine + MarginVault on-chain.
 *
 * Replaces mock data from perpsData.ts with real contract reads.
 * Falls back to empty arrays when no on-chain data is available.
 *
 * PerpEngine (chain 42069): markets, positions, unrealized PnL
 * MarginVault: deposited margin balances
 */

import { useMemo } from 'react'
import { useReadContract, useReadContracts, useAccount } from 'wagmi'
import { PerpEngineABI, MarginVaultABI, FundingRateABI } from './abi'
import { CONTRACTS } from './chain'
import { useOracleMarkPrices } from './usePerpsHistory'
import type { PerpPair, AccountSummaryData, OpenPosition } from './perpsData'

// ─── Fallback demo pairs when on-chain data is unavailable ───────────────────
//
// Task 0037: This fallback ships only a sentinel `markPrice` (already
// labelled by the "Crypto oracle offline" banner the perps page mounts
// when the crypto rail is down) plus static market metadata. Every
// quantitative field — change24h, volume24h, fundingRate, openInterest,
// 24h H/L — MUST stay at the zero sentinel (or equal to markPrice for
// H/L) so the PairInfoBar renders honest em-dashes instead of painting
// fabricated stats as if the oracle had reported them. The
// `useOnChainPerps.fallback` suite locks this shape.
//
// Exported for the data-shape regression test.
export const FALLBACK_PAIRS: PerpPair[] = [
  { marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD', markPrice: 84250, indexPrice: 84250, change24h: 0, volume24h: 0, fundingRate: 0, nextFundingTime: Date.now() + 4 * 3600000, openInterest: 0, maxLeverage: 100, high24h: 84250, low24h: 84250 },
  { marketId: 1, symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD', markPrice: 1820, indexPrice: 1820, change24h: 0, volume24h: 0, fundingRate: 0, nextFundingTime: Date.now() + 4 * 3600000, openInterest: 0, maxLeverage: 50, high24h: 1820, low24h: 1820 },
  { marketId: 2, symbol: 'SOL-USD', baseAsset: 'SOL', quoteAsset: 'USD', markPrice: 134.5, indexPrice: 134.5, change24h: 0, volume24h: 0, fundingRate: 0, nextFundingTime: Date.now() + 4 * 3600000, openInterest: 0, maxLeverage: 25, high24h: 134.5, low24h: 134.5 },
  { marketId: 3, symbol: 'BNB-USD', baseAsset: 'BNB', quoteAsset: 'USD', markPrice: 608, indexPrice: 608, change24h: 0, volume24h: 0, fundingRate: 0, nextFundingTime: Date.now() + 4 * 3600000, openInterest: 0, maxLeverage: 25, high24h: 608, low24h: 608 },
  { marketId: 5, symbol: 'ARB-USD', baseAsset: 'ARB', quoteAsset: 'USD', markPrice: 0.82, indexPrice: 0.82, change24h: 0, volume24h: 0, fundingRate: 0, nextFundingTime: Date.now() + 4 * 3600000, openInterest: 0, maxLeverage: 20, high24h: 0.82, low24h: 0.82 },
]

const ENGINE = CONTRACTS.PerpEngine
const VAULT = CONTRACTS.MarginVault
const FUNDING_RATE = CONTRACTS.FundingRate
const FUNDING_INTERVAL_MS = 8 * 3600 * 1000 // 8 hours fallback

// ─── Static market metadata (pairs the PerpEngine supports) ──────────────────
// The on-chain PerpEngine stores markets by ID with a bytes32 key.
// We map known market IDs to human-readable pair info.
// On-chain market ordering (DeployPerps.s.sol seed + keccak256 ticker keys):
//   Market 0: keccak256("BTC") → BTC-USD
//   Market 1: keccak256("ETH") → ETH-USD
const MARKET_META: Record<number, { symbol: string; baseAsset: string; quoteAsset: string; maxLeverage: number }> = {
  0: { symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD', maxLeverage: 100 },
  1: { symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD', maxLeverage: 50 },
  2: { symbol: 'SOL-USD', baseAsset: 'SOL', quoteAsset: 'USD', maxLeverage: 25 },
  3: { symbol: 'BNB-USD', baseAsset: 'BNB', quoteAsset: 'USD', maxLeverage: 25 },
  4: { symbol: 'MATIC-USD', baseAsset: 'MATIC', quoteAsset: 'USD', maxLeverage: 20 },
  5: { symbol: 'ARB-USD', baseAsset: 'ARB', quoteAsset: 'USD', maxLeverage: 20 },
}

// ─── Read all markets ─────────────────────────────────────────────────────────

export function useOnChainPairs(): { pairs: PerpPair[]; isLoading: boolean; isLive: boolean } {
  const countResult = useReadContract({
    address: ENGINE,
    abi: PerpEngineABI,
    functionName: 'marketCount',
    query: { enabled: !!ENGINE, refetchInterval: 60_000, retry: false },
  })

  const count = Number((countResult.data as bigint | undefined) ?? BigInt(0))
  const maxRead = Math.min(count, 10)

  const marketContracts = useMemo(() => {
    if (maxRead === 0) return []
    return Array.from({ length: maxRead }, (_, i) => ({
      address: ENGINE as `0x${string}`,
      abi: PerpEngineABI,
      functionName: 'markets' as const,
      args: [BigInt(i)] as [bigint],
    }))
  }, [maxRead])

  const fundingContracts = useMemo(() => {
    if (maxRead === 0) return []
    return Array.from({ length: maxRead }, (_, i) => ({
      address: FUNDING_RATE as `0x${string}`,
      abi: FundingRateABI,
      functionName: 'lastFundingTime' as const,
      args: [BigInt(i)] as [bigint],
    }))
  }, [maxRead])

  const { data, isLoading } = useReadContracts({
    contracts: marketContracts,
    query: { enabled: maxRead > 0, refetchInterval: 30_000, retry: false },
  })

  const { data: fundingData } = useReadContracts({
    contracts: fundingContracts,
    query: { enabled: maxRead > 0, refetchInterval: 60_000, retry: false },
  })

  // Read oracle prices for all active markets
  const { markPrices, indexPrices } = useOracleMarkPrices(maxRead)

  const pairs = useMemo<PerpPair[]>(() => {
    if (!data || data.length === 0) return []

    const result: PerpPair[] = []
    for (let i = 0; i < data.length; i++) {
      const r = data[i]
      if (r.status !== 'success' || !r.result) continue
      const [, maxLeverage, isActive] = r.result as [string, bigint, boolean]
      if (!isActive) continue

      const meta = MARKET_META[i] ?? {
        symbol: `MKT-${i}`,
        baseAsset: `MKT${i}`,
        quoteAsset: 'USD',
        maxLeverage: 10,
      }

      const lastFundingTime = fundingData?.[i]?.status === 'success'
        ? Number(fundingData[i].result as bigint) * 1000  // convert seconds to ms
        : 0
      const nextFundingTime = lastFundingTime > 0
        ? lastFundingTime + FUNDING_INTERVAL_MS
        : Date.now() + FUNDING_INTERVAL_MS

      const fallbackPair = FALLBACK_PAIRS.find(p => p.symbol === meta.symbol)
      const mark = markPrices[i] && markPrices[i] > 0 ? markPrices[i] : (fallbackPair?.markPrice ?? 0)
      const index = indexPrices[i] && indexPrices[i] > 0 ? indexPrices[i] : (fallbackPair?.indexPrice ?? mark)

      // Task 0037: no 24h aggregator wired yet — surface honest zeros
      // and let PairInfoBar render em-dashes rather than fabricating a
      // swing band from a hardcoded change24h.
      result.push({
        marketId: i,
        symbol: meta.symbol,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        markPrice: mark,
        indexPrice: index,
        change24h: 0,
        volume24h: 0,
        fundingRate: 0,
        nextFundingTime,
        openInterest: 0,
        maxLeverage: Number(maxLeverage),
        high24h: mark,
        low24h: mark,
      })
    }
    return result
  }, [data, fundingData, markPrices, indexPrices])

  // Brand each row so source-attribution can tell a real chain read from a
  // fallback substitution. Task 0026: `useAttributedPrice` refuses to label
  // `isFallback: true` rows as `chain-oracle`, which keeps the LivePriceStrip
  // on `/activity`, `/analytics`, and the landing page honest when the RPC
  // is unreachable.
  const finalPairs: PerpPair[] = pairs.length > 0
    ? pairs.map(p => ({ ...p, isFallback: false }))
    : FALLBACK_PAIRS.map(p => ({ ...p, isFallback: true }))
  return { pairs: finalPairs, isLoading, isLive: pairs.length > 0 }
}

// ─── Read user positions across all markets ──────────────────────────────────

export function useOnChainPositions(): {
  positions: OpenPosition[]
  isLoading: boolean
} {
  const { address } = useAccount()
  const { pairs } = useOnChainPairs()
  const { markPrices } = useOracleMarkPrices(pairs.length)

  const contracts = useMemo(() => {
    if (!address || pairs.length === 0) return []
    return pairs.flatMap((pair) => [
      {
        address: ENGINE as `0x${string}`,
        abi: PerpEngineABI,
        functionName: 'positions' as const,
        args: [address, BigInt(pair.marketId)] as [string, bigint],
      },
      {
        address: ENGINE as `0x${string}`,
        abi: PerpEngineABI,
        functionName: 'unrealizedPnL' as const,
        args: [address, BigInt(pair.marketId)] as [string, bigint],
      },
    ])
  }, [address, pairs]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0, refetchInterval: 10_000 },
  })

  const positions = useMemo<OpenPosition[]>(() => {
    if (!data || data.length === 0) return []

    const result: OpenPosition[] = []
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i]
      const posResult = data[i * 2]
      const pnlResult = data[i * 2 + 1]
      if (posResult?.status !== 'success' || !posResult.result) continue

      const [isOpen, isLong, size, entryPrice, margin] = posResult.result as [boolean, boolean, bigint, bigint, bigint, bigint, bigint]
      if (!isOpen || size === BigInt(0)) continue // no position

      const pnl = pnlResult?.status === 'success' ? Number(pnlResult.result as bigint) / 1e18 : 0
      const sizeFloat = Number(size) / 1e18
      const entryFloat = Number(entryPrice) / 1e8
      const collFloat = Number(margin) / 1e18
      const leverage = collFloat > 0 ? Math.round(sizeFloat * entryFloat / collFloat) : 1
      const mark = markPrices[pair.marketId] ?? entryFloat  // oracle mark price, fallback to entry
      // Liquidation price estimate: entry ± (margin / size) adjusted by maintenance margin
      const marginPerUnit = collFloat > 0 ? collFloat / sizeFloat : 0
      const maintenanceRatio = 0.02 // 2% maintenance margin
      const liqPrice = isLong
        ? entryFloat - marginPerUnit * (1 - maintenanceRatio)
        : entryFloat + marginPerUnit * (1 - maintenanceRatio)

      result.push({
        pair: pair.symbol,
        side: isLong ? 'long' : 'short',
        size: sizeFloat,
        leverage,
        entryPrice: entryFloat,
        markPrice: mark,
        liquidationPrice: Math.max(0, liqPrice),
        unrealizedPnl: pnl,
        margin: collFloat,
        marginMode: 'cross',
      })
    }
    return result
  }, [data, pairs, markPrices])

  return { positions, isLoading }
}

// ─── Read user account summary from MarginVault ──────────────────────────────

export function useOnChainAccountSummary(): {
  summary: AccountSummaryData
  isLoading: boolean
} {
  const { address } = useAccount()
  const { positions } = useOnChainPositions()

  const balResult = useReadContract({
    address: VAULT,
    abi: MarginVaultABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000, retry: false },
  })

  const summary = useMemo<AccountSummaryData>(() => {
    const balance = balResult.data ? Number(balResult.data as bigint) / 1e18 : 0
    const unrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0)
    const equity = balance + unrealizedPnl
    const marginUsed = positions.reduce((sum, p) => sum + p.margin, 0)
    const availableMargin = Math.max(0, equity - marginUsed)
    const marginRatio = equity > 0 ? marginUsed / equity : 0

    return { balance, equity, unrealizedPnl, marginUsed, availableMargin, marginRatio }
  }, [balResult.data, positions])

  return { summary, isLoading: balResult.isLoading }
}
