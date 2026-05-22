'use client'

/**
 * usePerps — wagmi hooks for GoodPerps PerpEngine on-chain interactions.
 *
 * Trade flow:
 *   1. Approve MarginVault.collateral() token (G$ on devnet)
 *   2. MarginVault.deposit(margin)
 *   3. PerpEngine.openPosition(marketId, size, isLong, margin)
 *
 * PerpEngine and MarginVault are deployed on devnet (chain 42069).
 */

import { useCallback, useState } from 'react'
import { waitForTransactionReceipt } from '@wagmi/core'
import { useReadContract, useAccount, useWriteContract, useBytecode } from 'wagmi'
import { PerpEngineABI, MarginVaultABI, ERC20ABI } from './abi'
import { CONTRACTS } from './chain'
import { config } from './wagmi'

const ENGINE = CONTRACTS.PerpEngine
const VAULT = CONTRACTS.MarginVault

// ─── Read: open position ──────────────────────────────────────────────────────

export interface OnChainPosition {
  size: bigint
  entryPrice: bigint
  isLong: boolean
  collateral: bigint
  sizeFloat: number
  entryPriceFloat: number
  collateralFloat: number
}

export function usePosition(marketId: bigint): {
  position: OnChainPosition | null
  isLoading: boolean
} {
  const { address } = useAccount()
  const result = useReadContract({
    address: ENGINE ?? undefined,
    abi: PerpEngineABI,
    functionName: 'positions',
    args: ENGINE && address ? [address, marketId] : undefined,
    query: { enabled: !!(ENGINE && address), refetchInterval: 10_000, retry: false },
  })

  if (!result.data) return { position: null, isLoading: result.isLoading }

  const [isOpen, isLong, size, entryPrice, margin] = result.data
  if (!isOpen) return { position: null, isLoading: result.isLoading }

  return {
    position: {
      size,
      entryPrice,
      isLong,
      collateral: margin,
      sizeFloat: Number(size) / 1e18,
      entryPriceFloat: Number(entryPrice) / 1e8,
      collateralFloat: Number(margin) / 1e18,
    },
    isLoading: result.isLoading,
  }
}

// ─── Read: market count ───────────────────────────────────────────────────────

export function usePerpMarketCount(): { count: bigint; isLoading: boolean } {
  const result = useReadContract({
    address: ENGINE ?? undefined,
    abi: PerpEngineABI,
    functionName: 'marketCount',
    query: { enabled: !!ENGINE, refetchInterval: 60_000, retry: false },
  })
  return {
    count: (result.data as bigint | undefined) ?? BigInt(0),
    isLoading: result.isLoading,
  }
}

function usePerpsCollateralToken(): `0x${string}` | undefined {
  const { data } = useReadContract({
    address: VAULT,
    abi: MarginVaultABI,
    functionName: 'collateral',
    query: { enabled: !!VAULT, retry: false },
  })
  return data as `0x${string}` | undefined
}

function usePerpsDeployed(): boolean {
  const collateral = usePerpsCollateralToken()
  const { data: engineCode } = useBytecode({
    address: ENGINE,
    query: { enabled: !!ENGINE },
  })
  const { data: collateralCode } = useBytecode({
    address: collateral,
    query: { enabled: !!collateral },
  })
  return Boolean(
    ENGINE &&
    VAULT &&
    collateral &&
    engineCode &&
    engineCode !== '0x' &&
    collateralCode &&
    collateralCode !== '0x',
  )
}

// ─── Write: open position ─────────────────────────────────────────────────────

export type PerpActionPhase = 'idle' | 'approving' | 'pending' | 'done' | 'error'

export function useOpenPosition() {
  const [phase, setPhase] = useState<PerpActionPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()
  const { address, isConnected } = useAccount()
  const collateralToken = usePerpsCollateralToken()
  const isDeployed = usePerpsDeployed()

  const vaultBalance = useReadContract({
    address: VAULT,
    abi: MarginVaultABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000, retry: false },
  })

  const reset = useCallback(() => { setPhase('idle'); setError(null) }, [])

  const openPosition = useCallback(async (
    marketId: bigint,
    margin: bigint,       // G$ collateral to deposit as margin
    size: bigint,         // notional position size (margin * leverage)
    isLong: boolean,
  ) => {
    if (!isConnected) { setError('Wallet not connected'); return }
    if (!isDeployed || !ENGINE || !VAULT || !collateralToken) {
      setError('PerpEngine not deployed yet')
      return
    }

    try {
      // PerpEngine requires margin + trade fee to already be present in
      // MarginVault. Top up only the missing amount, then open the position.
      const fee = (size * 10n) / 10_000n // PerpEngine.TRADE_FEE_BPS = 10 = 0.1%
      const totalRequired = margin + fee
      const currentVaultBalance = (vaultBalance.data as bigint | undefined) ?? 0n
      const depositAmount = currentVaultBalance >= totalRequired ? 0n : totalRequired - currentVaultBalance

      if (depositAmount > 0n) {
        setPhase('approving')
        const approveHash = await writeContractAsync({
          address: collateralToken,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [VAULT, depositAmount],
        })
        const approveReceipt = await waitForTransactionReceipt(config, { hash: approveHash })
        if (approveReceipt.status === 'reverted') throw new Error('Approval reverted')

        setPhase('pending')
        const depositHash = await writeContractAsync({
          address: VAULT,
          abi: MarginVaultABI,
          functionName: 'deposit',
          args: [depositAmount],
        })
        const depositReceipt = await waitForTransactionReceipt(config, { hash: depositHash })
        if (depositReceipt.status === 'reverted') throw new Error('Margin deposit reverted')
      }

      setPhase('pending')
      const openHash = await writeContractAsync({
        address: ENGINE,
        abi: PerpEngineABI,
        functionName: 'openPosition',
        args: [marketId, size, isLong, margin],
      })
      const openReceipt = await waitForTransactionReceipt(config, { hash: openHash })
      if (openReceipt.status === 'reverted') throw new Error('Open position reverted')
      setPhase('done')
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string }
      setError(e?.shortMessage ?? e?.message ?? 'Transaction failed')
      setPhase('error')
    }
  }, [isConnected, isDeployed, collateralToken, vaultBalance.data, writeContractAsync])

  return { openPosition, phase, error, reset, isConnected, isDeployed }
}

// ─── Write: close position ────────────────────────────────────────────────────

export function useClosePosition() {
  const [phase, setPhase] = useState<PerpActionPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()
  const { isConnected } = useAccount()
  const isDeployed = usePerpsDeployed()

  const reset = useCallback(() => { setPhase('idle'); setError(null) }, [])

  const closePosition = useCallback(async (marketId: bigint) => {
    if (!isConnected) { setError('Wallet not connected'); return }
    if (!isDeployed || !ENGINE) { setError('PerpEngine not deployed yet'); return }

    try {
      setPhase('pending')
      const closeHash = await writeContractAsync({
        address: ENGINE,
        abi: PerpEngineABI,
        functionName: 'closePosition',
        args: [marketId],
      })
      const closeReceipt = await waitForTransactionReceipt(config, { hash: closeHash })
      if (closeReceipt.status === 'reverted') throw new Error('Close position reverted')
      setPhase('done')
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string }
      setError(e?.shortMessage ?? e?.message ?? 'Transaction failed')
      setPhase('error')
    }
  }, [isConnected, isDeployed, writeContractAsync])

  return { closePosition, phase, error, reset, isConnected, isDeployed }
}
