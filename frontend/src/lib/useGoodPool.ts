'use client'

import { useMemo, useCallback } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { CONTRACTS } from './chain'
import { GoodPoolABI, GoodDollarTokenABI } from './abi'

// ─── Pool registry ────────────────────────────────────────────────────────────

export type PoolKey = 'G$/WETH' | 'G$/USDC' | 'WETH/USDC'

export interface PoolMeta {
  key: PoolKey
  address: Address
  tokenASymbol: string
  tokenBSymbol: string
  tokenAAddress: Address
  tokenBAddress: Address
  tokenADecimals: number
  tokenBDecimals: number
  feeBps: number       // swap fee basis points
  ubiBps: number       // UBI share of fee basis points
}

export const POOL_LIST: PoolMeta[] = [
  {
    key: 'G$/WETH',
    address: CONTRACTS.SwapPoolGdWeth,
    tokenASymbol: 'G$',
    tokenBSymbol: 'WETH',
    tokenAAddress: CONTRACTS.SwapGD,
    tokenBAddress: CONTRACTS.SwapWETH,
    tokenADecimals: 18,
    tokenBDecimals: 18,
    feeBps: 30,
    ubiBps: 10,
  },
  {
    key: 'G$/USDC',
    address: CONTRACTS.SwapPoolGdUsdc,
    tokenASymbol: 'G$',
    tokenBSymbol: 'USDC',
    tokenAAddress: CONTRACTS.SwapGD,
    tokenBAddress: CONTRACTS.SwapUSDC,
    tokenADecimals: 18,
    tokenBDecimals: 6,
    feeBps: 30,
    ubiBps: 10,
  },
  {
    key: 'WETH/USDC',
    address: CONTRACTS.SwapPoolWethUsdc,
    tokenASymbol: 'WETH',
    tokenBSymbol: 'USDC',
    tokenAAddress: CONTRACTS.SwapWETH,
    tokenBAddress: CONTRACTS.SwapUSDC,
    tokenADecimals: 18,
    tokenBDecimals: 6,
    feeBps: 30,
    ubiBps: 10,
  },
]

export function getPool(key: PoolKey): PoolMeta {
  const pool = POOL_LIST.find(p => p.key === key)
  if (!pool) throw new Error(`Unknown pool: ${key}`)
  return pool
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a human-readable amount string to bigint for a token with `decimals`. */
export function parsePoolAmount(value: string, decimals: number): bigint {
  if (!value || value === '' || value === '0') return BigInt(0)
  try {
    const n = parseFloat(value)
    if (isNaN(n) || n <= 0) return BigInt(0)
    return parseUnits(value, decimals)
  } catch {
    return BigInt(0)
  }
}

/** Format a bigint token amount to a human-readable string. */
export function formatPoolAmount(amount: bigint | undefined, decimals: number): number {
  if (amount === undefined || amount === BigInt(0)) return 0
  return parseFloat(formatUnits(amount, decimals))
}

/**
 * Compute the spot price (tokenB per 1 tokenA) directly from decimal-aware
 * reserves. We do NOT use the contract's `spotPrice()` view because it returns
 * a raw 18-decimal ratio of tokenB-base-units per 1e18 tokenA-base-units. For
 * pools where tokenA and tokenB have different decimals (e.g. G$ 18d / USDC
 * 6d) that ratio is ~1e-12 in floating-point land after `formatUnits(_, 18)`,
 * which then renders as "0" in `formatAmount`. Deriving from already-formatted
 * reserves keeps the math decimal-aware regardless of the underlying pool.
 *
 * @param reserveAFormatted Decimal-aware reserve of tokenA (e.g. 1_000_000 G$)
 * @param reserveBFormatted Decimal-aware reserve of tokenB (e.g. 1 USDC)
 * @returns Spot price `B per 1 A`, or `null` when reserves are missing/invalid
 */
export function computeSpotPrice(
  reserveAFormatted: number | null | undefined,
  reserveBFormatted: number | null | undefined,
): number | null {
  if (reserveAFormatted == null || reserveBFormatted == null) return null
  if (!Number.isFinite(reserveAFormatted) || !Number.isFinite(reserveBFormatted)) return null
  if (reserveAFormatted <= 0) return null
  return reserveBFormatted / reserveAFormatted
}

// ─── Pool health classifier (Task 0024) ───────────────────────────────────────

/**
 * Frontend defense against on-chain pool miscalibration on testnet.
 *
 * Some pools were observed returning reserves that imply absurd spot
 * prices (e.g. 1e-6 G$ paired with 1e18 USDC → ~1e24 USDC per G$). The UI
 * cannot fix the on-chain state, but it can refuse to render a usable
 * trade surface for such pools, replace numeric fields with a placeholder,
 * and steer users to the runbook in `docs/runbooks/pool-misconfigured.md`.
 *
 * Thresholds are intentionally loose so we never flag healthy heavy-
 * liquidity pools as `misconfigured`:
 *
 *   - Spot price must fall in `[1e-9, 1e3]` (tokenB per 1 tokenA after
 *     decimal-aware formatting). This admits realistic G$/USDC at ~1e-6
 *     while flagging the observed 3000+ and 1e12+ pathologies.
 *
 * Inputs accept both `number` (the runtime type returned by
 * `formatPoolAmount`) and `string` (convenient for fixture-driven tests
 * and any future callers reading numeric strings off the wire).
 *
 * @returns `'ok'` (safe to render), `'misconfigured'` (block trading), or
 *   `'unknown'` (reserves missing / non-numeric / zero — caller decides
 *   whether to show loading state or fall back to `ok`).
 */
export type PoolHealth = 'ok' | 'misconfigured' | 'unknown'

/**
 * Sanity bounds for a decimal-aware spot price (tokenB per 1 tokenA).
 *
 * Exported so other surfaces that consume pool-derived prices (notably
 * `useOnChainMarketData` powering `/explore`) can share the same band and
 * not re-define their own bounds. Task 0029.
 */
export const SPOT_MIN = 1e-9
export const SPOT_MAX = 1e3

export function classifyPoolHealth(
  reserveAFormatted: string | number | undefined,
  reserveBFormatted: string | number | undefined,
): PoolHealth {
  const a = typeof reserveAFormatted === 'string' ? Number(reserveAFormatted) : reserveAFormatted
  const b = typeof reserveBFormatted === 'string' ? Number(reserveBFormatted) : reserveBFormatted

  if (a == null || b == null) return 'unknown'
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'unknown'
  if (a <= 0 || b <= 0) return 'unknown'

  const spot = b / a
  if (!Number.isFinite(spot) || spot <= 0) return 'unknown'

  if (spot < SPOT_MIN || spot > SPOT_MAX) return 'misconfigured'

  return 'ok'
}

// ─── Hook: usePoolReserves ────────────────────────────────────────────────────

/**
 * Read live reserve balances and total liquidity for a pool.
 */
export function usePoolReserves(key: PoolKey) {
  const pool = useMemo(() => getPool(key), [key])

  const { data: reserveA, isLoading: loadingA } = useReadContract({
    address: pool.address,
    abi: GoodPoolABI,
    functionName: 'reserveA',
  })

  const { data: reserveB, isLoading: loadingB } = useReadContract({
    address: pool.address,
    abi: GoodPoolABI,
    functionName: 'reserveB',
  })

  const { data: totalLiquidity, isLoading: loadingL } = useReadContract({
    address: pool.address,
    abi: GoodPoolABI,
    functionName: 'totalLiquidity',
  })

  const reserveAFormatted = formatPoolAmount(reserveA as bigint | undefined, pool.tokenADecimals)
  const reserveBFormatted = formatPoolAmount(reserveB as bigint | undefined, pool.tokenBDecimals)
  const totalLiquidityFormatted = formatPoolAmount(totalLiquidity as bigint | undefined, 18)

  // Derive spot price (tokenB per 1 tokenA) from decimal-aware reserves.
  // The on-chain `spotPrice()` view returns a raw 18-decimal ratio that
  // collapses to ~0 in JS floats whenever tokenA/tokenB use different
  // decimals (the G$/USDC pool is the canonical case). See computeSpotPrice
  // doc-comment above for the full reasoning.
  const spotPriceFormatted = computeSpotPrice(reserveAFormatted, reserveBFormatted)

  // Pool health: refuse to render usable trade UX when on-chain reserves
  // imply a nonsensical spot price (Task 0024). While reserves are still
  // loading we report `unknown` rather than `ok` so the UI does not
  // briefly render trade buttons before the guard kicks in.
  const isLoading = loadingA || loadingB || loadingL
  const health: PoolHealth = isLoading
    ? 'unknown'
    : classifyPoolHealth(reserveAFormatted, reserveBFormatted)

  return {
    reserveA: reserveA as bigint | undefined,
    reserveB: reserveB as bigint | undefined,
    totalLiquidity: totalLiquidity as bigint | undefined,
    reserveAFormatted,
    reserveBFormatted,
    totalLiquidityFormatted,
    spotPriceFormatted,
    health,
    isLoading,
    pool,
  }
}

// ─── Hook: useUserLiquidity ───────────────────────────────────────────────────

/**
 * Read the LP balance for `userAddress` in a pool.
 */
export function useUserLiquidity(key: PoolKey, userAddress: Address | undefined) {
  const pool = useMemo(() => getPool(key), [key])

  const { data: userLp, isLoading } = useReadContract({
    address: pool.address,
    abi: GoodPoolABI,
    functionName: 'liquidity',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  })

  const { data: totalLp } = useReadContract({
    address: pool.address,
    abi: GoodPoolABI,
    functionName: 'totalLiquidity',
    query: { enabled: !!userAddress },
  })

  const userLpFormatted = formatPoolAmount(userLp as bigint | undefined, 18)
  const totalLpFormatted = formatPoolAmount(totalLp as bigint | undefined, 18)

  const sharePercent = totalLpFormatted > 0
    ? (userLpFormatted / totalLpFormatted) * 100
    : 0

  return {
    userLp: userLp as bigint | undefined,
    userLpFormatted,
    sharePercent,
    isLoading,
  }
}

// ─── Hook: useAddLiquidity ────────────────────────────────────────────────────

/**
 * Approve + addLiquidity flow for a pool.
 *
 * Usage:
 *   const { approveA, approveB, addLiquidity, ... } = useAddLiquidity('G$/WETH')
 *   await approveA(amountA)    // approve pool to spend tokenA
 *   await approveB(amountB)    // approve pool to spend tokenB
 *   await addLiquidity(amountA, amountB)
 */
export function useAddLiquidity(key: PoolKey) {
  const pool = useMemo(() => getPool(key), [key])

  const { writeContractAsync: writeApproveA, isPending: isApprovingA } = useWriteContract()
  const { writeContractAsync: writeApproveB, isPending: isApprovingB } = useWriteContract()
  const { writeContractAsync: writeAdd, isPending: isAdding, data: txHash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const approveA = useCallback(
    (amount: bigint) =>
      writeApproveA({
        address: pool.tokenAAddress,
        abi: GoodDollarTokenABI,
        functionName: 'approve',
        args: [pool.address, amount],
      }),
    [writeApproveA, pool],
  )

  const approveB = useCallback(
    (amount: bigint) =>
      writeApproveB({
        address: pool.tokenBAddress,
        abi: GoodDollarTokenABI,
        functionName: 'approve',
        args: [pool.address, amount],
      }),
    [writeApproveB, pool],
  )

  const addLiquidity = useCallback(
    (amountA: bigint, amountB: bigint) =>
      writeAdd({
        address: pool.address,
        abi: GoodPoolABI,
        functionName: 'addLiquidity',
        args: [amountA, amountB],
      }),
    [writeAdd, pool],
  )

  return {
    approveA,
    approveB,
    addLiquidity,
    isApprovingA,
    isApprovingB,
    isAdding,
    isConfirming,
    isSuccess,
    txHash,
    pool,
  }
}

// ─── Hook: useRemoveLiquidity ─────────────────────────────────────────────────

/**
 * removeLiquidity flow for a pool.
 */
export function useRemoveLiquidity(key: PoolKey) {
  const pool = useMemo(() => getPool(key), [key])

  const { writeContractAsync: writeRemove, isPending: isRemoving, data: txHash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const removeLiquidity = useCallback(
    (lpAmount: bigint) =>
      writeRemove({
        address: pool.address,
        abi: GoodPoolABI,
        functionName: 'removeLiquidity',
        args: [lpAmount],
      }),
    [writeRemove, pool],
  )

  return {
    removeLiquidity,
    isRemoving,
    isConfirming,
    isSuccess,
    txHash,
    pool,
  }
}

// ─── Hook: useTokenAllowance ──────────────────────────────────────────────────

/**
 * Check token allowance granted to a pool.
 */
export function useTokenAllowance(
  tokenAddress: Address,
  owner: Address | undefined,
  spender: Address,
) {
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: GoodDollarTokenABI,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
    query: { enabled: !!owner },
  })

  return allowance as bigint | undefined
}
