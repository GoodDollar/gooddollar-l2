'use client'

/**
 * useOnChainSwap — wagmi hooks for GoodSwapRouter on-chain interactions.
 *
 * GoodSwapRouter (chain 42069) supports three devnet token pairs:
 *   G$/WETH, G$/USDC, WETH/USDC
 *
 * Addresses from CONTRACTS (devnet.ts):
 *   SwapGD, SwapWETH, SwapUSDC, GoodSwapRouter
 *
 * useSwapQuote: live getAmountOut read — replaces mock price feed for supported pairs.
 * useSwapExecute: approve + swapExactTokensForTokens write flow.
 */

import { useMemo, useState, useCallback } from 'react'
import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { GoodSwapRouterABI, ERC20ABI } from './abi'
import { CONTRACTS } from './chain'

const ROUTER = CONTRACTS.GoodSwapRouter

/** Supported devnet tokens: symbol → (address, decimals) */
const SWAP_TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  'G$':   { address: CONTRACTS.SwapGD,   decimals: 18 },
  'WETH': { address: CONTRACTS.SwapWETH, decimals: 18 },
  'ETH':  { address: CONTRACTS.SwapWETH, decimals: 18 }, // native ETH uses WETH wrapper on-chain
  'USDC': { address: CONTRACTS.SwapUSDC, decimals: 6  },
}

export function getSwapTokenAddr(symbol: string): `0x${string}` | undefined {
  return SWAP_TOKENS[symbol]?.address
}

/** Whether a token symbol is supported by the on-chain router */
export function isSwapSupported(symbol: string): boolean {
  return symbol in SWAP_TOKENS
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Lower bound of acceptable swap deadline in seconds (1 minute). */
export const MIN_SWAP_DEADLINE_SECS = 60
/** Upper bound of acceptable swap deadline in seconds (3 hours).
 *  Beyond this the user is exposed to indefinite mempool sandwich risk. */
export const MAX_SWAP_DEADLINE_SECS = 3 * 60 * 60
/** Fallback minutes used when no valid value is provided. */
const DEFAULT_SWAP_DEADLINE_MINUTES = 30

/**
 * Compute the on-chain deadline (unix seconds) for a swap, honouring the
 * user-configured `deadlineMinutes` from `useSwapSettings` while clamping to a
 * safe `[MIN, MAX]` window. Pure for unit-testability — pass `nowSecs` in tests.
 *
 * Why clamping: the Uniswap V2-style router rejects `block.timestamp > deadline`,
 * so a 0/negative value would always revert, while a 24-hour value would leave
 * the swap exposed to MEV/sandwich attacks long after the user walked away.
 */
export function computeSwapDeadline(deadlineMinutes: number, nowSecs?: number): bigint {
  const now = typeof nowSecs === 'number' ? nowSecs : Math.floor(Date.now() / 1000)
  const minutes = Number.isFinite(deadlineMinutes) ? deadlineMinutes : DEFAULT_SWAP_DEADLINE_MINUTES
  const requested = Math.floor(minutes * 60)
  const clamped = Math.min(MAX_SWAP_DEADLINE_SECS, Math.max(MIN_SWAP_DEADLINE_SECS, requested))
  return BigInt(now + clamped)
}

// ─── Price impact (real, reserve-based) ──────────────────────────────────────
//
// Previous behaviour was a synthetic ladder driven by raw input *amount* (not
// liquidity), so a 100 G$ swap would show 1.8% impact even when the pool was
// deep enough to absorb 1M with negligible slippage, and a 1M USDC swap on a
// shallow pool would show ~15% even when it was effectively draining the LP.
// This silently lulled users into approving sandwich-attack-shaped trades and
// is the second half of the iteration #24 deep-dive Swap finding.
//
// Real impact is the gap between the marginal "spot" rate (the rate you'd get
// for an infinitesimal trade) and the executed rate for the user's actual
// trade. We approximate the spot rate by quoting a tiny reference amount from
// the same on-chain `getAmountOut`, which already accounts for fees and the
// constant-product curve. That keeps the math source-of-truth as the router
// itself — no need to mirror its formula in the frontend.

const PRICE_IMPACT_BPS_CAP = 10_000n

/**
 * Compute price impact in basis points (1 bps = 0.01%) from a reference quote
 * (a tiny trade that approximates the marginal spot rate) and the actual quote
 * the user is about to execute.
 *
 * Formula: impact = max(0, (refRate - actualRate) / refRate) where
 *   refRate    = refOut    / refIn
 *   actualRate = actualOut / actualIn
 *
 * Implemented with bigint cross-multiplication to avoid precision loss across
 * tokens with very different decimals (e.g. G$ 18dec ↔ USDC 6dec) and to stay
 * exact for the 256-bit values that come back from the router.
 */
export function computePriceImpactBps(
  refIn: bigint,
  refOut: bigint,
  actualIn: bigint,
  actualOut: bigint,
): number {
  if (refIn <= 0n || refOut < 0n) return 0
  if (actualIn <= 0n) return 0
  if (actualOut <= 0n) return Number(PRICE_IMPACT_BPS_CAP)

  // refRate - actualRate, scaled by refIn * actualIn:
  //   refRate    = refOut   / refIn
  //   actualRate = actualOut / actualIn
  // (refRate - actualRate) / refRate
  //   = 1 - (actualRate / refRate)
  //   = 1 - (actualOut * refIn) / (actualIn * refOut)
  // bps = 10_000 - (actualOut * refIn * 10_000) / (actualIn * refOut)
  if (refOut === 0n) return Number(PRICE_IMPACT_BPS_CAP)

  const numerator = actualOut * refIn * PRICE_IMPACT_BPS_CAP
  const denominator = actualIn * refOut
  if (denominator === 0n) return 0

  const ratioBps = numerator / denominator
  if (ratioBps >= PRICE_IMPACT_BPS_CAP) return 0 // executed rate ≥ spot — clamp to 0
  const impact = PRICE_IMPACT_BPS_CAP - ratioBps
  // Clamp to [0, 10_000]; impact is already non-negative here but be defensive.
  if (impact <= 0n) return 0
  if (impact >= PRICE_IMPACT_BPS_CAP) return Number(PRICE_IMPACT_BPS_CAP)
  return Number(impact)
}

/** Convenience wrapper returning percent (0..100) with up to 4dp of precision. */
export function computePriceImpactPct(
  refIn: bigint,
  refOut: bigint,
  actualIn: bigint,
  actualOut: bigint,
): number {
  const bps = computePriceImpactBps(refIn, refOut, actualIn, actualOut)
  return bps / 100
}

/**
 * Tiered severity used by the UI. Thresholds are tighter than the previous
 * ladder so users see a visible warning *before* the trade enters MEV-bait
 * territory:
 *
 *   <  1%   normal   (no banner)
 *   1–3%    notice   (subtle yellow text)
 *   3–5%    warning  (yellow banner)
 *   5–15%   high     (red banner, button turns red)
 *   ≥ 15%   extreme  (red banner + "I understand" gate)
 */
export type PriceImpactSeverity = 'normal' | 'notice' | 'warning' | 'high' | 'extreme'

export function getPriceImpactSeverity(pct: number): PriceImpactSeverity {
  if (!Number.isFinite(pct) || pct < 1) return 'normal'
  if (pct < 3) return 'notice'
  if (pct < 5) return 'warning'
  if (pct < 15) return 'high'
  return 'extreme'
}

// ─── Read: getAmountOut quote ─────────────────────────────────────────────────

export function useSwapQuote(amountIn: string, tokenInSymbol: string, tokenOutSymbol: string): {
  amountOut: bigint | undefined
  amountOutFormatted: string
  isLoading: boolean
  isSupported: boolean
  /** Real reserve-based price impact in percent (0..100). 0 when unknown / no input. */
  priceImpactPct: number
  /** Tiered severity classification for the UI banners and confirm gate. */
  priceImpactSeverity: PriceImpactSeverity
} {
  const tokenIn  = SWAP_TOKENS[tokenInSymbol]
  const tokenOut = SWAP_TOKENS[tokenOutSymbol]
  const isSupported = !!(tokenIn && tokenOut && tokenInSymbol !== tokenOutSymbol)

  const amountInWei = useMemo(() => {
    if (!isSupported || !amountIn) return BigInt(0)
    try {
      return parseUnits(amountIn, tokenIn!.decimals)
    } catch {
      return BigInt(0)
    }
  }, [amountIn, tokenIn, isSupported])

  const result = useReadContract({
    address: ROUTER,
    abi: GoodSwapRouterABI,
    functionName: 'getAmountOut',
    args: isSupported && amountInWei > BigInt(0)
      ? [amountInWei, tokenIn!.address, tokenOut!.address]
      : undefined,
    query: {
      enabled: isSupported && amountInWei > BigInt(0),
      refetchInterval: 5_000,
    },
  })

  // Reference (tiny) quote — approximates the marginal "spot" rate by asking the
  // router what the user would get for the smallest meaningful unit. We need at
  // least 1 unit at the token's decimals so the router's fee math doesn't round
  // the result to zero on micro inputs.
  const refAmountInWei = useMemo(() => {
    if (!isSupported || !tokenIn) return BigInt(0)
    return BigInt(10) ** BigInt(tokenIn.decimals) // 1 token (e.g. 1e18 wei)
  }, [isSupported, tokenIn])

  const refResult = useReadContract({
    address: ROUTER,
    abi: GoodSwapRouterABI,
    functionName: 'getAmountOut',
    args: isSupported && refAmountInWei > BigInt(0)
      ? [refAmountInWei, tokenIn!.address, tokenOut!.address]
      : undefined,
    query: {
      enabled: isSupported && amountInWei > BigInt(0), // only fetch when user has a trade
      refetchInterval: 5_000,
    },
  })

  const amountOutFormatted = useMemo(() => {
    if (!result.data || !tokenOut) return ''
    return formatUnits(result.data as bigint, tokenOut.decimals)
  }, [result.data, tokenOut])

  const priceImpactPct = useMemo(() => {
    if (!result.data || !refResult.data || refAmountInWei === BigInt(0) || amountInWei === BigInt(0)) return 0
    return computePriceImpactPct(
      refAmountInWei,
      refResult.data as bigint,
      amountInWei,
      result.data as bigint,
    )
  }, [result.data, refResult.data, refAmountInWei, amountInWei])

  const priceImpactSeverity = useMemo(() => getPriceImpactSeverity(priceImpactPct), [priceImpactPct])

  return {
    amountOut: result.data as bigint | undefined,
    amountOutFormatted,
    isLoading: result.isLoading,
    isSupported,
    priceImpactPct,
    priceImpactSeverity,
  }
}

// ─── Write: approve + swapExactTokensForTokens ───────────────────────────────

export type SwapPhase = 'idle' | 'approving' | 'swapping' | 'done' | 'error'

export function useSwapExecute() {
  const [phase, setPhase] = useState<SwapPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()
  const { address, isConnected } = useAccount()

  const reset = useCallback(() => { setPhase('idle'); setError(null) }, [])

  const swap = useCallback(async (
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string,
    amountOutMin: bigint,
    deadlineMinutes: number = DEFAULT_SWAP_DEADLINE_MINUTES,
  ) => {
    if (!isConnected || !address) { setError('Wallet not connected'); return }
    if (!ROUTER) { setError('GoodSwapRouter not deployed'); return }

    const tokenIn  = SWAP_TOKENS[tokenInSymbol]
    const tokenOut = SWAP_TOKENS[tokenOutSymbol]
    if (!tokenIn || !tokenOut) { setError('Token pair not supported on devnet'); return }

    let amountInWei: bigint
    try {
      amountInWei = parseUnits(amountIn, tokenIn.decimals)
    } catch {
      setError('Invalid amount'); return
    }

    // Deadline is plumbed from useSwapSettings (user setting, default 30m, clamped 1m..3h)
    // to honour user-configured MEV protection rather than hardcoding 20m.
    const deadline = computeSwapDeadline(deadlineMinutes)

    try {
      setPhase('approving')
      await writeContractAsync({
        address: tokenIn.address,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [ROUTER, amountInWei],
      })

      setPhase('swapping')
      await writeContractAsync({
        address: ROUTER,
        abi: GoodSwapRouterABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountInWei, amountOutMin, [tokenIn.address, tokenOut.address], address, deadline],
      })

      setPhase('done')
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string }
      setError(e?.shortMessage ?? e?.message ?? 'Swap failed')
      setPhase('error')
    }
  }, [isConnected, address, writeContractAsync])

  return { swap, phase, error, reset, isConnected, isDeployed: !!ROUTER }
}
