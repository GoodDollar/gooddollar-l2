"use client";

/**
 * useGoodSwap.secure.ts - SECURE VERSION with CVE-4 vulnerability fixes
 *
 * This is a secure replacement for useGoodSwap.ts that includes the transaction
 * validation layer to prevent wallet draining attacks via crafted transactions.
 *
 * Key Security Improvements:
 * - Replaces useWriteContract with useSecureWriteContract
 * - Adds transaction risk assessment and user confirmation
 * - Validates contract addresses against whitelist
 * - Provides detailed transaction UI for user approval
 * - Prevents unauthorized gas limit and value manipulation
 *
 * MIGRATION: Replace imports from './useGoodSwap' to './useGoodSwap.secure'
 */

import { useMemo, useCallback } from "react";
import { useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { CONTRACTS } from "./chain";
import { GoodPoolABI, GoodDollarTokenABI } from "./abi";
import { useSecureWriteContract } from "./secureWagmi";

// ─── Pool registry (unchanged) ──────────────────────────────────────────────

type PoolInfo = {
  address: Address;
  tokenASymbol: string;
  tokenBSymbol: string;
  tokenAAddress: Address;
  tokenBAddress: Address;
  tokenADecimals: number;
  tokenBDecimals: number;
};

const POOLS: Record<string, PoolInfo> = {
  "G$/WETH": {
    address: CONTRACTS.SwapPoolGdWeth,
    tokenASymbol: "G$",
    tokenBSymbol: "WETH",
    tokenAAddress: CONTRACTS.SwapGD,
    tokenBAddress: CONTRACTS.SwapWETH,
    tokenADecimals: 18,
    tokenBDecimals: 18,
  },
  "G$/USDC": {
    address: CONTRACTS.SwapPoolGdUsdc,
    tokenASymbol: "G$",
    tokenBSymbol: "USDC",
    tokenAAddress: CONTRACTS.SwapGD,
    tokenBAddress: CONTRACTS.SwapUSDC,
    tokenADecimals: 18,
    tokenBDecimals: 6,
  },
  "WETH/USDC": {
    address: CONTRACTS.SwapPoolWethUsdc,
    tokenASymbol: "WETH",
    tokenBSymbol: "USDC",
    tokenAAddress: CONTRACTS.SwapWETH,
    tokenBAddress: CONTRACTS.SwapUSDC,
    tokenADecimals: 18,
    tokenBDecimals: 6,
  },
};

function findPool(symbolA: string, symbolB: string): PoolInfo | null {
  const key1 = `${symbolA}/${symbolB}`;
  const key2 = `${symbolB}/${symbolA}`;
  return POOLS[key1] ?? POOLS[key2] ?? null;
}

function getTokenInAddress(pool: PoolInfo, inputSymbol: string): Address {
  return inputSymbol === pool.tokenASymbol
    ? pool.tokenAAddress
    : pool.tokenBAddress;
}

function getTokenDecimals(pool: PoolInfo, symbol: string): number {
  return symbol === pool.tokenASymbol
    ? pool.tokenADecimals
    : pool.tokenBDecimals;
}

// ─── Read-only hooks (unchanged as they don't involve transactions) ───────────

export function useGoodSwapQuote(
  inputSymbol: string,
  outputSymbol: string,
  amountIn: string,
) {
  const pool = useMemo(
    () => findPool(inputSymbol, outputSymbol),
    [inputSymbol, outputSymbol],
  );

  const tokenIn = pool ? getTokenInAddress(pool, inputSymbol) : undefined;
  const decimalsIn = pool ? getTokenDecimals(pool, inputSymbol) : 18;
  const decimalsOut = pool ? getTokenDecimals(pool, outputSymbol) : 18;

  const parsedAmount = useMemo(() => {
    try {
      const amt = parseFloat(amountIn);
      if (!amt || isNaN(amt) || amt <= 0) return undefined;
      return parseUnits(amountIn, decimalsIn);
    } catch {
      return undefined;
    }
  }, [amountIn, decimalsIn]);

  const {
    data: rawAmountOut,
    isLoading,
    error,
  } = useReadContract({
    address: pool?.address,
    abi: GoodPoolABI,
    functionName: "getAmountOut",
    args: tokenIn && parsedAmount ? [tokenIn, parsedAmount] : undefined,
    query: { enabled: !!pool && !!tokenIn && !!parsedAmount },
  });

  const amountOut = useMemo(() => {
    if (!rawAmountOut) return "";
    return formatUnits(rawAmountOut as bigint, decimalsOut);
  }, [rawAmountOut, decimalsOut]);

  return { amountOut, isLoading, error, pool };
}

export function useGoodSwapReserves(inputSymbol: string, outputSymbol: string) {
  const pool = useMemo(
    () => findPool(inputSymbol, outputSymbol),
    [inputSymbol, outputSymbol],
  );

  const { data: reserveA } = useReadContract({
    address: pool?.address,
    abi: GoodPoolABI,
    functionName: "reserveA",
    query: { enabled: !!pool },
  });

  const { data: reserveB } = useReadContract({
    address: pool?.address,
    abi: GoodPoolABI,
    functionName: "reserveB",
    query: { enabled: !!pool },
  });

  return {
    reserveA: reserveA as bigint | undefined,
    reserveB: reserveB as bigint | undefined,
    pool,
  };
}

// ─── SECURE Hook: useGoodSwapExecute (CVE-4 FIX) ──────────────────────────────

/**
 * SECURE version of useGoodSwapExecute with transaction validation
 *
 * Key Security Features:
 * - Uses useSecureWriteContract instead of useWriteContract
 * - Validates all transactions against security policy
 * - Shows risk assessment dialog for medium/high risk transactions
 * - Prevents unlimited gas limits and excessive values
 * - Validates contract addresses against whitelist
 *
 * Usage (with UI component for risk dialog):
 *   const { approve, swap, isApproving, isSwapping, txHash, RiskDialogComponent } = useSecureGoodSwapExecute()
 *
 *   return (
 *     <>
 *       <Button onClick={() => approve(pool, tokenIn, amountIn)}>Approve</Button>
 *       <Button onClick={() => swap(pool, tokenIn, amountIn, minOut)}>Swap</Button>
 *       {RiskDialogComponent}
 *     </>
 *   )
 */
export function useSecureGoodSwapExecute() {
  // SECURITY FIX: Replace useWriteContract with useSecureWriteContract
  const {
    writeContractAsync: writeApprove,
    isPending: isApproving,
    RiskDialogComponent: ApproveRiskDialog,
  } = useSecureWriteContract();

  const {
    writeContractAsync: writeSwap,
    isPending: isSwapping,
    data: txHash,
    RiskDialogComponent: SwapRiskDialog,
  } = useSecureWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const approve = useCallback(
    async (poolAddress: Address, tokenAddress: Address, amount: bigint) => {
      // SECURITY: This will now trigger validation before execution
      return writeApprove({
        address: tokenAddress,
        abi: GoodDollarTokenABI,
        functionName: "approve",
        args: [poolAddress, amount],
        // SECURITY: Add explicit gas limit to prevent gas griefing
        gas: 100_000n,
      } as any);
    },
    [writeApprove],
  );

  const swap = useCallback(
    async (
      poolAddress: Address,
      tokenIn: Address,
      amountIn: bigint,
      minOut: bigint,
    ) => {
      // SECURITY: This will now trigger validation before execution
      return writeSwap({
        address: poolAddress,
        abi: GoodPoolABI,
        functionName: "swap",
        args: [tokenIn, amountIn, minOut],
        // SECURITY: Add explicit gas limit to prevent gas griefing
        gas: 200_000n,
      } as any);
    },
    [writeSwap],
  );

  // Combine both risk dialog components without JSX so this hook can stay in a .ts file.
  const RiskDialogComponent = useMemo(
    () => [ApproveRiskDialog, SwapRiskDialog],
    [ApproveRiskDialog, SwapRiskDialog],
  );

  return {
    approve,
    swap,
    isApproving,
    isSwapping,
    isConfirming,
    isSuccess,
    txHash,
    // SECURITY: Export the risk dialog component for UI integration
    RiskDialogComponent,
  };
}

// ─── Export secure versions ───────────────────────────────────────────────────

export function buildSwapParams(
  inputSymbol: string,
  outputSymbol: string,
  amountIn: string,
  slippageBps: number = 50,
) {
  const pool = findPool(inputSymbol, outputSymbol);
  if (!pool) return null;

  const tokenIn = getTokenInAddress(pool, inputSymbol);
  const decimalsIn = getTokenDecimals(pool, inputSymbol);

  const parsedAmountIn = parseUnits(amountIn, decimalsIn);

  return {
    poolAddress: pool.address,
    tokenIn,
    amountIn: parsedAmountIn,
    slippageBps,
  };
}

export { findPool, POOLS, type PoolInfo };

// ─── Legacy compatibility (deprecated) ────────────────────────────────────────

/**
 * @deprecated Use useSecureGoodSwapExecute instead
 * This is kept for backward compatibility but will show console warnings
 */
export function useGoodSwapExecute() {
  console.warn(
    "⚠️ SECURITY WARNING: useGoodSwapExecute is deprecated due to CVE-4 vulnerability. " +
      "Please migrate to useSecureGoodSwapExecute for security validation.",
  );

  return useSecureGoodSwapExecute();
}
