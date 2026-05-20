'use client'

/**
 * useOnChainMarketData — live token market data from on-chain contracts + CoinGecko.
 *
 * Price source priority:
 *  1. On-chain (GoodLendPriceOracle for WETH/USDC; GD/USDC pool spot price for G$)
 *  2. CoinGecko live prices (via usePriceFeeds, refreshes every 60s)
 *  3. FALLBACK_PRICES static constants
 *
 * On-chain supplemental data:
 *  - G$ circulating supply: GoodDollarToken.totalSupply()
 *  - G$ market cap: derived from supply × price
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

// ─── Pool spot-price helper (pure, decimal-aware) ─────────────────────────────

/**
 * Decode a constant-product pool's spot price as a JS number.
 *
 * The on-chain `spotPrice()` getter returns `(reserveB * 1e18) / reserveA`,
 * which silently assumes both tokens share 18 decimals. For mixed-decimal
 * pools (e.g. G$ 18d / USDC 6d) it produces a result that is off by
 * `10 ** (quoteDecimals - baseDecimals)` — for G$/USDC that's a 1e12 error
 * in either direction depending on address-sort order. That bug surfaced on
 * /explore as a ~$15T G$ market cap.
 *
 * This helper avoids the issue by reading raw reserves directly and
 * normalizing each side by its own token decimals before dividing.
 *
 * @param baseReserve   raw on-chain reserve of the base token (the one whose
 *                      price we want to express)
 * @param quoteReserve  raw on-chain reserve of the quote token (denominator,
 *                      typically a USD-pegged stable)
 * @param baseDecimals  decimals of the base token (e.g. 18 for G$)
 * @param quoteDecimals decimals of the quote token (e.g. 6 for USDC)
 * @returns price of 1 base unit in quote units, or `null` if either reserve
 *          is zero (empty / un-seeded pool — caller falls back to CoinGecko)
 */
export function decodePoolSpotPrice({
  baseReserve,
  quoteReserve,
  baseDecimals,
  quoteDecimals,
}: {
  baseReserve:   bigint
  quoteReserve:  bigint
  baseDecimals:  number
  quoteDecimals: number
}): number | null {
  if (baseReserve === 0n || quoteReserve === 0n) return null

  // formatUnits handles arbitrary bigint precision; parseFloat narrows to
  // JS number at the end. For realistic DEX reserves both sides are well
  // inside Number.MAX_SAFE_INTEGER once normalized by decimals, so the
  // precision loss is acceptable for display-only market data.
  const base  = parseFloat(formatUnits(baseReserve,  baseDecimals))
  const quote = parseFloat(formatUnits(quoteReserve, quoteDecimals))

  if (!Number.isFinite(base) || !Number.isFinite(quote) || base === 0) return null

  const price = quote / base
  return Number.isFinite(price) && price > 0 ? price : null
}

// ─── On-chain contract reads ──────────────────────────────────────────────────

const ON_CHAIN_CONTRACTS = [
  // [0] G$ total supply (18 decimals) — GoodDollarToken
  {
    address: CONTRACTS.GoodDollarToken,
    abi: ERC20ABI,
    functionName: 'totalSupply' as const,
  },
  // [1] G$/USDC pool tokenA address — pool stores tokens in canonical
  //     address-sorted order, so we read this to know which reserve is G$.
  {
    address: CONTRACTS.SwapPoolGdUsdc,
    abi: GoodPoolABI,
    functionName: 'tokenA' as const,
  },
  // [2] G$/USDC pool reserveA (raw, in tokenA's own decimals)
  {
    address: CONTRACTS.SwapPoolGdUsdc,
    abi: GoodPoolABI,
    functionName: 'reserveA' as const,
  },
  // [3] G$/USDC pool reserveB (raw, in tokenB's own decimals)
  {
    address: CONTRACTS.SwapPoolGdUsdc,
    abi: GoodPoolABI,
    functionName: 'reserveB' as const,
  },
  // [4] WETH USD price from GoodLend oracle (8 decimals, Aave-style)
  {
    address: CONTRACTS.GoodLendPriceOracle,
    abi: GoodLendPriceOracleABI,
    functionName: 'getAssetPrice' as const,
    args: [CONTRACTS.MockWETH] as const,
  },
  // [5] USDC USD price from GoodLend oracle (8 decimals, Aave-style)
  {
    address: CONTRACTS.GoodLendPriceOracle,
    abi: GoodLendPriceOracleABI,
    functionName: 'getAssetPrice' as const,
    args: [CONTRACTS.MockUSDC] as const,
  },
] as const

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns live token market data.
 * On-chain contract state is the source of truth; CoinGecko prices are fallback.
 */
export function useOnChainMarketData(): {
  tokens: TokenMarketData[]
  isLive: boolean
  isLoading: boolean
} {
  const { prices: cgPrices, quotes: cgQuotes, isLive: isCgLive } = usePriceFeeds(ALL_SYMBOLS)

  const { data: onChainData, isLoading: isOnChainLoading } = useReadContracts({
    contracts: ON_CHAIN_CONTRACTS,
    query: { refetchInterval: 30_000 },
  })

  const tokens = useMemo<TokenMarketData[]>(() => {
    // ── Parse on-chain results (undefined on failure — falls back to CoinGecko) ─
    const gdTotalSupplyRaw = onChainData?.[0]?.status === 'success'
      ? (onChainData[0].result as bigint)
      : undefined

    const gdPoolTokenA = onChainData?.[1]?.status === 'success'
      ? (onChainData[1].result as `0x${string}`)
      : undefined

    const gdPoolReserveA = onChainData?.[2]?.status === 'success'
      ? (onChainData[2].result as bigint)
      : undefined

    const gdPoolReserveB = onChainData?.[3]?.status === 'success'
      ? (onChainData[3].result as bigint)
      : undefined

    const wethOraclePriceRaw = onChainData?.[4]?.status === 'success'
      ? (onChainData[4].result as bigint)
      : undefined

    const usdcOraclePriceRaw = onChainData?.[5]?.status === 'success'
      ? (onChainData[5].result as bigint)
      : undefined

    // ── Derive human-readable values ──────────────────────────────────────────

    // G$ price: decode the G$/USDC pool reserves with decimal-aware math.
    // The pool stores tokens in address-sorted order, so we check tokenA to
    // know whether G$ is the base (reserveA) or quote (reserveB) side.
    // (Avoids the 1e12 bug from the legacy `spotPrice()` getter that assumes
    // both tokens have 18 decimals.)
    let gdPriceOnChain: number | null = null
    if (
      gdPoolTokenA  !== undefined &&
      gdPoolReserveA !== undefined &&
      gdPoolReserveB !== undefined
    ) {
      const gdIsTokenA =
        gdPoolTokenA.toLowerCase() === CONTRACTS.GoodDollarToken.toLowerCase()
      gdPriceOnChain = decodePoolSpotPrice({
        baseReserve:   gdIsTokenA ? gdPoolReserveA : gdPoolReserveB,
        quoteReserve:  gdIsTokenA ? gdPoolReserveB : gdPoolReserveA,
        baseDecimals:  18, // G$
        quoteDecimals: 6,  // USDC
      })
    }

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

    if (gdPriceOnChain !== null && gdPriceOnChain > 0) {
      prices['G$'] = gdPriceOnChain
    }
    if (wethPriceOnChain !== null && wethPriceOnChain > 0) {
      prices['ETH']  = wethPriceOnChain
      prices['WETH'] = wethPriceOnChain
    }
    if (usdcPriceOnChain !== null && usdcPriceOnChain > 0) {
      prices['USDC'] = usdcPriceOnChain
    }

    // ── Build token market data ───────────────────────────────────────────────
    return TOKENS
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
  }, [cgPrices, cgQuotes, onChainData])

  const hasOnChainSuccess = onChainData?.some(d => d?.status === 'success') ?? false
  const isLive = isCgLive || hasOnChainSuccess

  return { tokens, isLive, isLoading: isOnChainLoading }
}

export { TOKEN_COLORS }
