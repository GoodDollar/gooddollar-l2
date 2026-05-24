'use client'

/**
 * useSwapPickerBalances — chain-read balances for tokens shown in the
 * Swap token-picker modal.
 *
 * The picker now surfaces an inline balance + USD column on every row
 * (lane 4 / task 0050). To keep the data path honest:
 *
 *  - Only tokens whose symbol is part of `SWAP_TOKENS` in
 *    `useOnChainSwap` actually have a known on-chain address. For
 *    everything else we never *try* to read — we let the row show "—"
 *    rather than fabricating a zero.
 *  - `ETH` is the native asset and uses `useBalance({ address })`.
 *  - `WETH`, `USDC`, `G$` go through one batched `useReadContracts`
 *    multicall, mirroring `usePortfolioReads`.
 *
 * Output shape is intentionally a sparse `Record<symbol, { raw,
 * formatted } | undefined>` so consumers can branch on `undefined`
 * without confusing "we have a 0 balance" with "we never read it".
 */

import { useMemo } from 'react'
import { useReadContracts, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { ERC20ABI } from './abi'
import { CONTRACTS, gooddollarL2 } from './chain'
import type { Token } from './tokens'
import type { PriceSource } from './priceSource'

/** Symbol → on-chain ERC-20 address. Mirrors `useOnChainSwap.SWAP_TOKENS`
 *  but excludes the synthetic `ETH` row (handled via `useBalance`). */
const ERC20_BALANCES: Record<string, { address: `0x${string}`; decimals: number }> = {
  'G$':   { address: CONTRACTS.SwapGD,   decimals: 18 },
  'WETH': { address: CONTRACTS.SwapWETH, decimals: 18 },
  'USDC': { address: CONTRACTS.SwapUSDC, decimals: 6  },
}

export interface PickerBalance {
  raw: bigint
  formatted: number
}

export type PickerBalanceMap = Record<string, PickerBalance | undefined>

/**
 * Pure: turn a `useReadContracts` result + native ETH balance into the
 * symbol→balance map the picker consumes. Lifted out of the hook so it
 * is unit-testable without spinning up wagmi.
 *
 * `erc20Symbols` is the ORDER the contracts were submitted in — we use
 * it to map indexes back to symbols.
 */
export function decodePickerBalances(
  erc20Symbols: readonly string[],
  contractResults: ReadonlyArray<{ status: string; result?: unknown }> | undefined,
  ethBalance: { value: bigint } | undefined,
): PickerBalanceMap {
  const out: PickerBalanceMap = {}

  if (contractResults) {
    erc20Symbols.forEach((symbol, i) => {
      const entry = ERC20_BALANCES[symbol]
      if (!entry) return
      const cell = contractResults[i]
      if (!cell || cell.status !== 'success' || typeof cell.result !== 'bigint') return
      const raw = cell.result as bigint
      out[symbol] = { raw, formatted: Number(formatUnits(raw, entry.decimals)) }
    })
  }

  if (ethBalance) {
    out.ETH = {
      raw: ethBalance.value,
      formatted: Number(formatUnits(ethBalance.value, 18)),
    }
  }

  return out
}

/**
 * Read on-chain balances for every token in `tokens` that the swap
 * router actually knows about. Returns `undefined` entries for unknown
 * tokens — callers must NOT treat absence as zero.
 */
export function useSwapPickerBalances(
  address: `0x${string}` | undefined,
  tokens: readonly Token[],
): PickerBalanceMap {
  // Stable list of ERC-20 symbols we will query, in submission order.
  const erc20Symbols = useMemo(
    () => tokens.map(t => t.symbol).filter(s => s in ERC20_BALANCES),
    [tokens],
  )

  const { data: contracts } = useReadContracts({
    contracts: address
      ? erc20Symbols.map(symbol => ({
          address: ERC20_BALANCES[symbol].address,
          abi: ERC20ABI,
          functionName: 'balanceOf' as const,
          args: [address] as const,
        }))
      : [],
    allowFailure: true,
    query: {
      enabled: !!address && erc20Symbols.length > 0,
      refetchInterval: 15_000,
    },
  })

  const { data: ethBal } = useBalance({
    address,
    chainId: gooddollarL2.id,
    query: {
      enabled: !!address && tokens.some(t => t.symbol === 'ETH'),
      refetchInterval: 15_000,
    },
  })

  return useMemo(
    () => decodePickerBalances(erc20Symbols, contracts, ethBal),
    [erc20Symbols, contracts, ethBal],
  )
}

// ─── Row decoration & sort ────────────────────────────────────────────────────

/**
 * Decorated row data the picker actually renders. Pulled out into a
 * pure helper so the sort + USD math is exercised without React.
 */
export interface DecoratedTokenRow {
  token: Token
  balance: PickerBalance | undefined
  /** USD value when both balance and live price are positive, else undefined. */
  usdValue: number | undefined
  /** True iff `GoodSwapRouter` actually routes through this symbol. */
  isOnChain: boolean
  /** Price source for the badge — `'unknown'` when no quote is available. */
  source: PriceSource
}

interface PriceLike {
  priceUsd: number
  source?: PriceSource
}

/**
 * Sort tokens for the picker:
 *   1. Non-zero balance first, by USD value desc (tokens without a USD
 *      price still rank above zero-balance tokens, ordered by raw
 *      formatted balance desc as a tie-break).
 *   2. On-chain-supported tokens (`SWAP_TOKENS`) next.
 *   3. Alphabetical by symbol.
 *
 * Stable. Pure. Same-input → same-output, easy to assert in tests.
 */
export function decorateTokenRows(
  tokens: readonly Token[],
  balances: PickerBalanceMap,
  prices: Record<string, PriceLike | undefined>,
  isOnChain: (symbol: string) => boolean,
): DecoratedTokenRow[] {
  const decorated: DecoratedTokenRow[] = tokens.map(token => {
    const balance = balances[token.symbol]
    const price = prices[token.symbol]
    const formatted = balance?.formatted ?? 0
    const priceUsd = price?.priceUsd ?? 0
    const usdValue = formatted > 0 && priceUsd > 0 ? formatted * priceUsd : undefined
    return {
      token,
      balance,
      usdValue,
      isOnChain: isOnChain(token.symbol),
      source: price?.source ?? 'unknown',
    }
  })

  // Bucket sort so the ranking logic stays explicit rather than spread
  // across a clever comparator branch tree.
  return decorated.slice().sort((a, b) => {
    const aHasBal = (a.balance?.formatted ?? 0) > 0
    const bHasBal = (b.balance?.formatted ?? 0) > 0
    if (aHasBal !== bHasBal) return aHasBal ? -1 : 1

    if (aHasBal && bHasBal) {
      const aUsd = a.usdValue ?? 0
      const bUsd = b.usdValue ?? 0
      if (aUsd !== bUsd) return bUsd - aUsd
      return (b.balance!.formatted) - (a.balance!.formatted)
    }

    if (a.isOnChain !== b.isOnChain) return a.isOnChain ? -1 : 1

    return a.token.symbol.localeCompare(b.token.symbol)
  })
}
