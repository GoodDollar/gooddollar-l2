'use client'

/**
 * useOnChainMarketData — live token market data from on-chain contracts + CoinGecko.
 *
 * Price source priority:
 *  1. On-chain (GoodLendPriceOracle for WETH/USDC; G$/USDC pool reserves for G$)
 *  2. CoinGecko live prices (via usePriceFeeds, refreshes every 60s)
 *  3. FALLBACK_PRICES static constants
 *
 * On-chain supplemental data:
 *  - G$ circulating supply: GoodDollarToken.totalSupply()
 *  - G$ market cap: derived from supply × price
 *
 * IMPORTANT (task 0029): we deliberately do NOT call `SwapPoolGdUsdc.spotPrice()`
 * directly. That view returns a raw 18-decimal ratio of tokenB-base-units per
 * 1e18 tokenA-base-units; when tokenA (G$, 18d) and tokenB (USDC, 6d) have
 * different decimals, `formatUnits(_, 18)` of that ratio produces a wildly
 * wrong number (e.g. ~$1 trillion per G$ → $1e21 market cap on /explore).
 * Instead we read decimal-aware reserves and derive the spot price via
 * `computeSpotPrice` (USDC per 1 G$), then clamp with `[SPOT_MIN, SPOT_MAX]`
 * and fall through to CoinGecko / FALLBACK when implausible.
 *
 * On-chain reads refresh every 30s. Falls back gracefully on RPC errors.
 */

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { usePriceFeeds, FALLBACK_PRICES } from './usePriceFeeds'
import { TOKENS, TOKEN_COLORS } from './tokens'
import { CONTRACTS } from './chain'
import { ERC20ABI, GoodPoolABI, GoodLendPriceOracleABI } from './abi'
import type { TokenMarketData } from './marketData'
import { generateSeededSparkline } from './sparklineSeed'
import type { PriceSource } from './priceSource'
import { useAttributedPrices } from './useAttributedPrice'
import {
  computeSpotPrice,
  formatPoolAmount,
  SPOT_MIN,
  SPOT_MAX,
  getPool,
} from './useGoodPool'

/**
 * Symbols that have a canonical resolver via `useAttributedPrices`. Task 0044
 * extends task 0021's BTC/WBTC + ETH/WETH equivalence classes to /explore so
 * the same dollar value the /perps top strip shows for BTC-USD also shows up
 * in /explore's WBTC row. Adding a new entry here is the only change needed
 * to bring a new symbol family into cross-page lockstep.
 */
const CANONICAL_SYMBOLS = ['BTC', 'WBTC', 'ETH', 'WETH'] as const

// ─── Token descriptions (static metadata) ────────────────────────────────────

const TOKEN_DESCRIPTIONS: Record<string, string> = {
  ETH:   'Ethereum — decentralized blockchain enabling smart contracts and dApps.',
  WETH:  'Wrapped Ether — ERC-20 compatible version of ETH for DeFi protocols.',
  WBTC:  'Wrapped Bitcoin — ERC-20 token backed 1:1 by Bitcoin.',
  USDC:  'USD Coin — fully-reserved stablecoin pegged to the US dollar.',
  USDT:  'Tether — largest stablecoin by market cap, pegged to USD.',
  DAI:   'Dai — decentralized overcollateralized stablecoin by MakerDAO.',
  'G$':  'GoodDollar — universal basic income token distributed to verified humans.',
  LINK:  'Chainlink — decentralized oracle network for smart contracts.',
  UNI:   'Uniswap — leading decentralized exchange protocol on Ethereum.',
  AAVE:  'Aave — decentralized lending and borrowing protocol.',
  ARB:   'Arbitrum — Ethereum Layer 2 scaling via optimistic rollups.',
  OP:    'Optimism — Layer 2 powering the OP Stack that GoodDollar L2 is built on.',
  MKR:   'Maker — governance token of MakerDAO behind DAI stablecoin.',
  COMP:  'Compound — DeFi lending protocol with algorithmic interest rates.',
  SNX:   'Synthetix — derivatives protocol for synthetic assets on-chain.',
  CRV:   'Curve — DEX optimized for stablecoin and pegged-asset swaps.',
  LDO:   'Lido — largest liquid staking protocol for ETH.',
  MATIC: 'Polygon — multi-chain scaling framework for Ethereum.',
}

const ALL_SYMBOLS = Object.keys(FALLBACK_PRICES)

// ─── On-chain contract reads ──────────────────────────────────────────────────
//
// We read decimal-aware reserves rather than `spotPrice()` for the G$/USDC
// pool so the math is unambiguous and shares its sanity envelope with the
// rest of the app via `computeSpotPrice` + `SPOT_MIN`/`SPOT_MAX`.
//
// Indices used below:
//   [0] G$ totalSupply
//   [1] G$/USDC pool reserveA (G$ side, 18d)
//   [2] G$/USDC pool reserveB (USDC side, 6d)
//   [3] WETH oracle price
//   [4] USDC oracle price

const GD_USDC_POOL = getPool('G$/USDC')

const ON_CHAIN_CONTRACTS = [
  {
    address: CONTRACTS.GoodDollarToken,
    abi: ERC20ABI,
    functionName: 'totalSupply' as const,
  },
  {
    address: GD_USDC_POOL.address,
    abi: GoodPoolABI,
    functionName: 'reserveA' as const,
  },
  {
    address: GD_USDC_POOL.address,
    abi: GoodPoolABI,
    functionName: 'reserveB' as const,
  },
  {
    address: CONTRACTS.GoodLendPriceOracle,
    abi: GoodLendPriceOracleABI,
    functionName: 'getAssetPrice' as const,
    args: [CONTRACTS.MockWETH] as const,
  },
  {
    address: CONTRACTS.GoodLendPriceOracle,
    abi: GoodLendPriceOracleABI,
    functionName: 'getAssetPrice' as const,
    args: [CONTRACTS.MockUSDC] as const,
  },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a USD price for G$ from raw G$/USDC pool reserves.
 *
 * Returns `null` when reserves are missing, zero, or when the implied
 * spot price falls outside `[SPOT_MIN, SPOT_MAX]` — in which case the
 * caller should fall through to CoinGecko / FALLBACK rather than render
 * a nonsense headline price. Exported for unit testing.
 */
export function deriveGdUsdPriceFromReserves(
  reserveARaw: bigint | undefined,
  reserveBRaw: bigint | undefined,
): number | null {
  const reserveA = formatPoolAmount(reserveARaw, GD_USDC_POOL.tokenADecimals) // G$
  const reserveB = formatPoolAmount(reserveBRaw, GD_USDC_POOL.tokenBDecimals) // USDC

  const spot = computeSpotPrice(reserveA, reserveB) // USDC per 1 G$ ≈ USD per G$
  if (spot == null) return null
  if (!Number.isFinite(spot) || spot <= 0) return null
  if (spot < SPOT_MIN || spot > SPOT_MAX) return null

  return spot
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns live token market data.
 * On-chain contract state is the source of truth; CoinGecko prices are fallback.
 */
/**
 * Cross-page divergence info for a single symbol. Task 0044 — when the
 * chain oracle and CoinGecko both have a value for a canonical asset and
 * they disagree by more than `DIVERGENCE_THRESHOLD`, callers should
 * render a small chip surfacing the rejected number ("Source disagrees:
 * $76,531"). Symbols with no divergence (matching prices, or only one
 * feed has a value) carry a `null` entry — never `undefined`, so the
 * consumer can render a stable React subtree.
 */
export interface DivergenceInfo {
  otherUsd: number
}

export function useOnChainMarketData(): {
  tokens: TokenMarketData[]
  isLive: boolean
  isLoading: boolean
  /**
   * Per-symbol price provenance for the symbols rendered in `tokens`.
   * Lane 4 (task 0007d/0002): consumers can render a single source badge
   * per symbol without re-deriving "did chain win or did CG?" themselves.
   */
  sources: Record<string, PriceSource>
  /**
   * Per-symbol divergence record. `null` (or absent) means no chip; an
   * object means the winning source and the other source disagreed by
   * more than 0.5% — surface a small "Source disagrees: $X" chip.
   */
  divergence: Record<string, DivergenceInfo | null>
} {
  const {
    prices: cgPrices,
    quotes: cgQuotes,
    isLive: isCgLive,
    sources: cgSources,
  } = usePriceFeeds(ALL_SYMBOLS)

  // Task 0044: route canonical assets through the same resolver /perps,
  // /activity, /portfolio, /analytics already use. This is the single
  // change that brings /explore into cross-page lockstep on BTC/WBTC
  // and ETH/WETH. The hook is itself a thin `useMemo` over the same
  // upstream feeds we're already reading, so this is one extra map
  // allocation per refresh tick, not a new network subscription.
  const canonicalAttributed = useAttributedPrices([...CANONICAL_SYMBOLS])

  const { data: onChainData, isLoading: isOnChainLoading } = useReadContracts({
    contracts: ON_CHAIN_CONTRACTS,
    query: { refetchInterval: 30_000 },
  })

  const { tokens, sources, divergence } = useMemo<{
    tokens: TokenMarketData[]
    sources: Record<string, PriceSource>
    divergence: Record<string, DivergenceInfo | null>
  }>(() => {
    // ── Parse on-chain results (undefined on failure — falls back to CoinGecko) ─
    const gdTotalSupplyRaw = onChainData?.[0]?.status === 'success'
      ? (onChainData[0].result as bigint)
      : undefined

    const gdReserveARaw = onChainData?.[1]?.status === 'success'
      ? (onChainData[1].result as bigint)
      : undefined

    const gdReserveBRaw = onChainData?.[2]?.status === 'success'
      ? (onChainData[2].result as bigint)
      : undefined

    const wethOraclePriceRaw = onChainData?.[3]?.status === 'success'
      ? (onChainData[3].result as bigint)
      : undefined

    const usdcOraclePriceRaw = onChainData?.[4]?.status === 'success'
      ? (onChainData[4].result as bigint)
      : undefined

    // ── Derive human-readable values ──────────────────────────────────────────

    // G$ price: derived from decimal-aware G$/USDC pool reserves, then
    // sanity-bounded. `null` means "the pool is missing or pathological —
    // fall through to CoinGecko / FALLBACK below."
    const gdPriceOnChain = deriveGdUsdPriceFromReserves(gdReserveARaw, gdReserveBRaw)

    // WETH/USDC prices from GoodLend oracle (8 decimals, same as Chainlink)
    const wethPriceOnChain = wethOraclePriceRaw !== undefined && wethOraclePriceRaw > 0n
      ? parseFloat(formatUnits(wethOraclePriceRaw, 8))
      : null

    const usdcPriceOnChain = usdcOraclePriceRaw !== undefined && usdcOraclePriceRaw > 0n
      ? parseFloat(formatUnits(usdcOraclePriceRaw, 8))
      : null

    // G$ circulating supply (18 decimals)
    const gdCirculatingSupply = gdTotalSupplyRaw !== undefined
      ? parseFloat(formatUnits(gdTotalSupplyRaw, 18))
      : undefined

    // ── Merge prices: on-chain wins, CoinGecko is fallback ────────────────────
    const prices: Record<string, number> = { ...cgPrices }
    // Start from the CG-tagged map and overwrite when chain answered.
    const sourcesOut: Record<string, PriceSource> = { ...cgSources }

    if (gdPriceOnChain !== null && gdPriceOnChain > 0) {
      prices['G$'] = gdPriceOnChain
      sourcesOut['G$'] = 'chain-oracle'
    }
    if (wethPriceOnChain !== null && wethPriceOnChain > 0) {
      prices['ETH']  = wethPriceOnChain
      prices['WETH'] = wethPriceOnChain
      sourcesOut['ETH']  = 'chain-oracle'
      sourcesOut['WETH'] = 'chain-oracle'
    }
    if (usdcPriceOnChain !== null && usdcPriceOnChain > 0) {
      prices['USDC'] = usdcPriceOnChain
      sourcesOut['USDC'] = 'chain-oracle'
    }

    // ── Canonical-symbol override (task 0044) ─────────────────────────
    // The attributed resolver already considered the chain mark, CoinGecko,
    // the fallback table, and any session-state overlay; trust its
    // verdict for the canonical equivalence classes so /explore reports
    // the same dollar value the /perps strip reports for BTC-USD /
    // ETH-USD. Skip when the resolver itself is `unknown` — there's no
    // signal to apply.
    const divergenceOut: Record<string, DivergenceInfo | null> = {}
    for (const sym of CANONICAL_SYMBOLS) {
      const attr = canonicalAttributed[sym]
      if (!attr || attr.source === 'unknown') continue
      if (attr.priceUsd > 0) prices[sym] = attr.priceUsd
      sourcesOut[sym] = attr.source
      divergenceOut[sym] = attr.divergent && attr.divergenceOtherUsd != null
        ? { otherUsd: attr.divergenceOtherUsd }
        : null
    }

    // ── Build token market data ───────────────────────────────────────────────
    const builtTokens = TOKENS
      .filter(t => prices[t.symbol] !== undefined || FALLBACK_PRICES[t.symbol] !== undefined)
      .map(t => {
        const price = prices[t.symbol] ?? FALLBACK_PRICES[t.symbol] ?? 0
        if (price === 0) return null

        const quote = cgQuotes[t.symbol]

        // For G$ we know the on-chain circulating supply, so we can compute
        // an exact market cap. Other tokens use CoinGecko's market cap.
        const circulatingSupply = t.symbol === 'G$' ? gdCirculatingSupply : undefined
        const marketCap = t.symbol === 'G$'
          ? (circulatingSupply ? circulatingSupply * price : 0)
          : (quote?.marketCap ?? 0)

        // Pass through CoinGecko fields with `null` sentinels when missing so
        // the UI can render a neutral placeholder instead of misleading zeros.
        // We don't have on-chain 1h or 7d feeds yet, so they stay null too.
        const change24h = quote?.change24h ?? null
        const volume24h = quote?.volume24h ?? null

        return {
          ...t,
          price,
          change1h:  null,
          change24h,
          change7d:  null,
          volume24h,
          marketCap,
          // Seeded synthetic 7d series until an indexer-backed history is wired in.
          // TODO(post-testnet): replace with real 7d price history from indexer.
          sparkline7d: generateSeededSparkline(t.symbol, price, change24h),
          description: TOKEN_DESCRIPTIONS[t.symbol] ?? `${t.name} token`,
          circulatingSupply,
          maxSupply: t.symbol === 'G$' ? null : undefined,
        }
      })
      .filter(Boolean) as TokenMarketData[]

    // For tokens that fell through to FALLBACK_PRICES (chain miss + no CG
    // entry), make sure the source is `fallback` rather than the absent
    // initial value. We mark every TOKENS symbol explicitly so the consumer
    // never sees `undefined` for a price it can read.
    for (const t of TOKENS) {
      if (sourcesOut[t.symbol] === undefined) {
        sourcesOut[t.symbol] = 'fallback'
      }
    }

    return { tokens: builtTokens, sources: sourcesOut, divergence: divergenceOut }
  }, [cgPrices, cgQuotes, cgSources, onChainData, canonicalAttributed])

  const hasOnChainSuccess = onChainData?.some(d => d?.status === 'success') ?? false
  const isLive = isCgLive || hasOnChainSuccess

  return { tokens, isLive, isLoading: isOnChainLoading, sources, divergence }
}

export { TOKEN_COLORS }
