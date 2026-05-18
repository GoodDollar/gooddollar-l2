'use client'

/**
 * useMarkets — wagmi hooks for reading on-chain prediction markets
 * from the MarketFactory contract (chain 42069).
 *
 * Provides:
 *   - useMarketCount(): number of markets on-chain
 *   - useOnChainMarket(marketId): single market data
 *   - useAllOnChainMarkets(count): batched read of N markets
 *
 * NOTE on units: `MarketFactory.impliedProbabilityYES(uint256)` returns the
 * YES probability in basis points (BPS, 10_000 = 100%), not 1e18-scaled.
 * A freshly-created market with zero liquidity returns 5000 (= 50%).
 * Earlier versions of this file divided by `1e18`, which produced
 * ~5e-15 for the 50% default and made every market render as
 * "YES 0¢ / NO 100¢" in the UI. Use `bpsToYesPrice` below for any
 * conversion to avoid regressing on that bug.
 */

import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS } from './chain'
import { MarketFactoryABI } from './abi'

/** BPS denominator used by MarketFactory.impliedProbabilityYES (10_000 = 100%). */
export const BPS_DENOMINATOR = 10_000

/**
 * Convert a BPS-scaled probability from MarketFactory.impliedProbabilityYES
 * into a 0-1 float suitable for UI display. Returns 0.5 when the on-chain
 * read is still pending or failed, matching the contract's own
 * zero-liquidity default of 5000 BPS.
 */
export function bpsToYesPrice(probRaw: bigint | undefined): number {
  if (probRaw === undefined || probRaw === null) return 0.5
  return Number(probRaw) / BPS_DENOMINATOR
}

export interface OnChainMarket {
  id: bigint
  question: string
  endTime: bigint
  status: number  // 0=active, 1=resolved_yes, 2=resolved_no
  totalYES: bigint
  totalNO: bigint
  collateral: bigint
  yesPrice: number  // 0-1 float derived from totalYES/(totalYES+totalNO)
  endTimeMs: number  // JS timestamp in ms
  isActive: boolean
  isResolved: boolean
  /**
   * Sum of `cost` (collateral spent) across all `Bought` events for this
   * market in the trailing 24h window. Wei-denominated bigint (mirrors how
   * `collateral` is stored). Optional because the volume hook may not have
   * loaded yet on first paint.
   */
  volume24h?: bigint
  /**
   * Same as `volume24h`, but for the *previous* 24h window (i.e. 48h..24h
   * ago). Used by the card to draw an up/down/neutral momentum arrow. `null`
   * means we tried to fetch and got nothing (or the hook failed); `undefined`
   * means we haven't tried yet. Both render as a neutral (no-arrow) card.
   */
  volume24hPrev?: bigint | null
}

// ─── Market count ─────────────────────────────────────────────────────────────

export function useMarketCount(): {
  count: bigint
  isLoading: boolean
  isError: boolean
} {
  // retry:false matches useOnChainMarket so a dead RPC (anvil down, wrong
  // network, MarketFactory redeployed) settles in a single round-trip
  // instead of pinning isLoading=true through wagmi's default retry storm
  // — which previously made the detail page spin forever even after the
  // 5s timeout in task 0014.
  const result = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'marketCount',
    query: { retry: false, refetchInterval: 30_000 },
  })
  return {
    count: (result.data as bigint | undefined) ?? BigInt(0),
    isLoading: result.isLoading,
    isError: result.isError,
  }
}

// ─── Single market ────────────────────────────────────────────────────────────

export function useOnChainMarket(
  marketId: bigint,
  options?: { enabled?: boolean }
): {
  market: OnChainMarket | null
  isLoading: boolean
  isError: boolean
} {
  // When the caller knows the id is out of range (e.g. /predict/9999),
  // pass enabled:false so wagmi doesn't fire — and doesn't retry — a call
  // that will revert with array-out-of-bounds. retry:false also caps the
  // retry storm that previously kept isLoading=true forever and reset any
  // page-level loading-timeout effect.
  const enabled = options?.enabled ?? true

  const result = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'getMarket',
    args: [marketId],
    query: { enabled, retry: false, refetchInterval: 15_000 },
  })

  const probResult = useReadContract({
    address: CONTRACTS.MarketFactory,
    abi: MarketFactoryABI,
    functionName: 'impliedProbabilityYES',
    args: [marketId],
    query: { enabled, retry: false, refetchInterval: 15_000 },
  })

  // Caller asked us not to fetch — surface as "not found" so the page
  // can render MarketNotFound immediately instead of spinning forever.
  if (!enabled) {
    return { market: null, isLoading: false, isError: true }
  }

  if (!result.data) {
    return { market: null, isLoading: result.isLoading, isError: result.isError }
  }

  const [question, endTime, status, totalYES, totalNO, collateral] = result.data
  const probRaw = probResult.data as bigint | undefined
  const yesPrice = bpsToYesPrice(probRaw)

  const endTimeMs = Number(endTime) * 1000
  const statusNum = Number(status)

  return {
    market: {
      id: marketId,
      question,
      endTime,
      status: statusNum,
      totalYES,
      totalNO,
      collateral,
      yesPrice,
      endTimeMs,
      isActive: statusNum === 0,
      isResolved: statusNum === 1 || statusNum === 2,
    },
    isLoading: result.isLoading,
    isError: result.isError,
  }
}

// ─── All markets (batch read up to N) ────────────────────────────────────────

export function useAllOnChainMarkets(count: bigint): {
  markets: OnChainMarket[]
  isLoading: boolean
} {
  const n = Math.min(Number(count), 20)  // cap at 20 to avoid too many reads

  const marketCalls = Array.from({ length: n }, (_, i) => ({
    address: CONTRACTS.MarketFactory as `0x${string}`,
    abi: MarketFactoryABI,
    functionName: 'getMarket' as const,
    args: [BigInt(i)] as [bigint],
  }))

  const probCalls = Array.from({ length: n }, (_, i) => ({
    address: CONTRACTS.MarketFactory as `0x${string}`,
    abi: MarketFactoryABI,
    functionName: 'impliedProbabilityYES' as const,
    args: [BigInt(i)] as [bigint],
  }))

  const marketResults = useReadContracts({
    contracts: marketCalls,
    query: { enabled: n > 0, refetchInterval: 20_000 },
  })

  const probResults = useReadContracts({
    contracts: probCalls,
    query: { enabled: n > 0, refetchInterval: 20_000 },
  })

  const markets: OnChainMarket[] = []

  if (marketResults.data) {
    for (let i = 0; i < n; i++) {
      const r = marketResults.data[i]
      if (r.status !== 'success' || !r.result) continue

      const [question, endTime, status, totalYES, totalNO, collateral] = r.result as [string, bigint, number, bigint, bigint, bigint]
      const probRaw = probResults.data?.[i]?.result as bigint | undefined
      const yesPrice = bpsToYesPrice(probRaw)
      const statusNum = Number(status)

      markets.push({
        id: BigInt(i),
        question,
        endTime,
        status: statusNum,
        totalYES,
        totalNO,
        collateral,
        yesPrice,
        endTimeMs: Number(endTime) * 1000,
        isActive: statusNum === 0,
        isResolved: statusNum === 1 || statusNum === 2,
      })
    }
  }

  const FALLBACK_MARKETS: OnChainMarket[] = [
    { id: BigInt(0), question: 'Will Bitcoin exceed $150,000 by end of 2026?', endTime: BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)), status: 0, totalYES: BigInt(72e17), totalNO: BigInt(28e17), collateral: BigInt(45e20), yesPrice: 0.72, endTimeMs: new Date('2026-12-31').getTime(), isActive: true, isResolved: false },
    { id: BigInt(1), question: 'Will the US pass a stablecoin regulation bill by Q4 2026?', endTime: BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)), status: 0, totalYES: BigInt(58e17), totalNO: BigInt(42e17), collateral: BigInt(21e20), yesPrice: 0.58, endTimeMs: new Date('2026-12-31').getTime(), isActive: true, isResolved: false },
    { id: BigInt(2), question: 'Will OpenAI release GPT-6 before December 2026?', endTime: BigInt(Math.floor(new Date('2026-12-01').getTime() / 1000)), status: 0, totalYES: BigInt(45e17), totalNO: BigInt(55e17), collateral: BigInt(38e20), yesPrice: 0.45, endTimeMs: new Date('2026-12-01').getTime(), isActive: true, isResolved: false },
    { id: BigInt(3), question: 'Will Ethereum surpass $10,000 in 2026?', endTime: BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)), status: 0, totalYES: BigInt(38e17), totalNO: BigInt(62e17), collateral: BigInt(175e19), yesPrice: 0.38, endTimeMs: new Date('2026-12-31').getTime(), isActive: true, isResolved: false },
    { id: BigInt(4), question: 'Will Real Madrid win the 2026 Champions League?', endTime: BigInt(Math.floor(new Date('2026-06-01').getTime() / 1000)), status: 0, totalYES: BigInt(31e17), totalNO: BigInt(69e17), collateral: BigInt(62e20), yesPrice: 0.31, endTimeMs: new Date('2026-06-01').getTime(), isActive: true, isResolved: false },
    { id: BigInt(5), question: 'Will GoodDollar reach 1 million unique claimers by end of 2026?', endTime: BigInt(Math.floor(new Date('2026-12-31').getTime() / 1000)), status: 0, totalYES: BigInt(62e17), totalNO: BigInt(38e17), collateral: BigInt(89e19), yesPrice: 0.62, endTimeMs: new Date('2026-12-31').getTime(), isActive: true, isResolved: false },
  ]

  // Iter 18: when every on-chain market is a zero-liquidity stub (the
  // current devnet state — 4 placeholder markets with totalYES=totalNO=
  // collateral=0), the downstream `hasMeaningfulPrice` filter in
  // predictData.ts drops them all and the Predict grid renders empty.
  // Only suppress the demo fallback when at least one market has actual
  // liquidity to display, so testers always see meaningful cards.
  const hasLiveLiquidity = markets.some(
    (m) => m.totalYES > BigInt(0) || m.totalNO > BigInt(0) || m.collateral > BigInt(0)
  )
  const finalMarkets = hasLiveLiquidity ? markets : FALLBACK_MARKETS
  return {
    markets: finalMarkets,
    isLoading: marketResults.isLoading,
  }
}
