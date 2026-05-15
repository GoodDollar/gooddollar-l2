'use client'

/**
 * PortfolioOnChain — shows live on-chain positions when wallet is connected to chain 42069.
 *
 * Reads from (all batched into ONE multicall via `usePortfolioReads`):
 *   - GoodDollarToken.balanceOf  (G$ balance)
 *   - gUSD.balanceOf             (gUSD balance from GoodStable)
 *   - GoodLendPool.getUserAccountData (collateral, debt, health factor)
 *   - VaultManager × 3 ilks      (ETH, G$, USDC CDP vaults — vaults + accumulators)
 *
 * Before this refactor the panel held 6 separate `useReadContract`s totalling
 * 9 `eth_call`s every 15s tick. Now it's exactly one `multicall3.aggregate3`.
 */

import { useAccount } from 'wagmi'
import { ILK_ETH, ILK_GD, ILK_USDC, type VaultState } from '@/lib/useGoodStable'
import { type OnChainAccountData } from '@/lib/useGoodLend'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import { usePortfolioReads, type PortfolioReads } from '@/lib/usePortfolioReads'
import Link from 'next/link'

const CHAIN_ID = 42069

interface IlkMeta {
  key: `0x${string}`
  label: string
  vaultKey: 'ethVault' | 'gdVault' | 'usdcVault'
}

const ILKS_META: readonly IlkMeta[] = [
  { key: ILK_ETH,  label: 'WETH', vaultKey: 'ethVault' },
  { key: ILK_GD,   label: 'G$',   vaultKey: 'gdVault' },
  { key: ILK_USDC, label: 'USDC', vaultKey: 'usdcVault' },
] as const

function fmtN(n: number, dp = 4) {
  if (!isFinite(n) || isNaN(n) || n === 0) return '0'
  if (n < 0.0001) return n.toExponential(2)
  return n.toFixed(dp)
}

function hfColor(hf: number) {
  if (!isFinite(hf)) return 'text-goodgreen'
  if (hf >= 2.0) return 'text-goodgreen'
  if (hf >= 1.5) return 'text-yellow-400'
  if (hf >= 1.1) return 'text-orange-400'
  return 'text-red-400'
}

// ─── G$ + gUSD balances row ───────────────────────────────────────────────────

function TokenBalances({ gdBalance, gusdBalance }: { gdBalance: number; gusdBalance: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
      <div className="bg-dark-50/30 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">G$ Balance</div>
          <div className="text-sm font-semibold text-white mt-0.5">{fmtN(gdBalance, 2)} G$</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-goodgreen/20 flex items-center justify-center text-goodgreen text-xs font-bold">G$</div>
      </div>
      <div className="bg-dark-50/30 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">gUSD Balance</div>
          <div className="text-sm font-semibold text-white mt-0.5">{fmtN(gusdBalance, 2)} gUSD</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">$</div>
      </div>
    </div>
  )
}

// ─── GoodLend position ────────────────────────────────────────────────────────

function LendPosition({ data, isLoading }: { data: OnChainAccountData | null; isLoading: boolean }) {
  const hasPosition = data && (data.totalCollateralFloat > 0 || data.totalDebtFloat > 0)

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">GoodLend</span>
        <Link href="/lend" className="text-xs text-goodgreen hover:text-goodgreen/80 transition-colors">Manage →</Link>
      </div>
      {isLoading ? (
        <div className="text-xs text-gray-500 py-2">Loading…</div>
      ) : !hasPosition ? (
        <div className="text-xs text-gray-500 py-2 text-center">No GoodLend positions</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-dark-50/30 rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-gray-400">Supplied</div>
            <div className="text-sm font-medium text-white">${fmtN(data!.totalCollateralFloat, 2)}</div>
          </div>
          <div className="bg-dark-50/30 rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-gray-400">Borrowed</div>
            <div className="text-sm font-medium text-white">${fmtN(data!.totalDebtFloat, 2)}</div>
          </div>
          <div className="bg-dark-50/30 rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-gray-400">Health</div>
            <div className={`text-sm font-medium ${hfColor(data!.healthFactorFloat)}`}>
              {isFinite(data!.healthFactorFloat) ? data!.healthFactorFloat.toFixed(2) : '∞'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GoodStable vault positions ───────────────────────────────────────────────

function StableVaultRow({ ilkMeta, vault, isLoading }: { ilkMeta: IlkMeta; vault: VaultState | null; isLoading: boolean }) {
  const hasPosition = vault && (vault.collateralFloat > 0 || vault.actualDebtFloat > 0)
  if (!hasPosition && !isLoading) return null

  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-dark-50/30 transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-goodgreen/20 flex items-center justify-center text-goodgreen text-[9px] font-bold">
          {ilkMeta.label.slice(0, 2)}
        </div>
        <span className="text-sm text-white">{ilkMeta.label}</span>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <div className="text-[10px] text-gray-500">Collateral</div>
          <div className="text-xs text-white">{isLoading ? '…' : `${fmtN(vault?.collateralFloat ?? 0, 3)} ${ilkMeta.label}`}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">Debt</div>
          <div className="text-xs text-white">{isLoading ? '…' : `${fmtN(vault?.actualDebtFloat ?? 0, 2)} gUSD`}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">Health</div>
          <div className={`text-xs font-medium ${hfColor(vault?.healthFactor ?? Infinity)}`}>
            {isLoading ? '…' : isFinite(vault?.healthFactor ?? Infinity) ? (vault?.healthFactor ?? 0).toFixed(2) : '∞'}
          </div>
        </div>
      </div>
    </div>
  )
}

function StablePositions({ reads }: { reads: PortfolioReads }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">GoodStable</span>
        <Link href="/stable" className="text-xs text-goodgreen hover:text-goodgreen/80 transition-colors">Manage →</Link>
      </div>
      <div className="space-y-0.5">
        {ILKS_META.map(ilk => (
          <StableVaultRow
            key={ilk.key}
            ilkMeta={ilk}
            vault={reads[ilk.vaultKey]}
            isLoading={reads.isLoading}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PortfolioOnChain() {
  const { address, chainId } = useAccount()
  const { prices } = usePriceFeeds(['WETH', 'G$', 'USDC'])
  const reads = usePortfolioReads(address, prices)

  if (!address || chainId !== CHAIN_ID) return null

  return (
    <div className="bg-dark-100 rounded-2xl border border-goodgreen/20 p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-goodgreen animate-pulse" />
        <h2 className="text-sm font-semibold text-white">On-Chain Positions</h2>
        <span className="text-xs text-gray-500">· devnet chain 42069</span>
      </div>

      <TokenBalances gdBalance={reads.gdBalance} gusdBalance={reads.gusdBalance} />
      <LendPosition data={reads.lend} isLoading={reads.isLoading} />
      <StablePositions reads={reads} />
    </div>
  )
}
