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

// ─── Read: getAmountOut quote ─────────────────────────────────────────────────

export function useSwapQuote(amountIn: string, tokenInSymbol: string, tokenOutSymbol: string): {
  amountOut: bigint | undefined
  amountOutFormatted: string
  isLoading: boolean
  isSupported: boolean
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

  const amountOutFormatted = useMemo(() => {
    if (!result.data || !tokenOut) return ''
    return formatUnits(result.data as bigint, tokenOut.decimals)
  }, [result.data, tokenOut])

  return {
    amountOut: result.data as bigint | undefined,
    amountOutFormatted,
    isLoading: result.isLoading,
    isSupported,
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
