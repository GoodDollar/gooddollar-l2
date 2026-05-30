'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  POOL_LIST,
  usePoolReserves,
  useUserLiquidity,
  useAddLiquidity,
  useRemoveLiquidity,
  parsePoolAmount,
  type PoolKey,
  type PoolMeta,
  type PoolHealth,
} from '@/lib/useGoodPool'
import { formatAmount } from '@/lib/format'

// Task 0024: route users hitting a misconfigured pool to the operator
// runbook so they can see the known-bad reserve snapshot and the (out-of-
// lane) remediation path instead of staring at `—` placeholders.
const POOL_RUNBOOK_PATH = '/docs/runbooks/pool-misconfigured.md'

// ─── Pool Stats Card ──────────────────────────────────────────────────────────

function PoolStatsCard({
  pool,
  onSelect,
  onHealthChange,
}: {
  pool: PoolMeta
  onSelect: (key: PoolKey) => void
  onHealthChange?: (key: PoolKey, health: PoolHealth) => void
}) {
  const {
    reserveAFormatted,
    reserveBFormatted,
    totalLiquidityFormatted,
    spotPriceFormatted,
    health,
    isLoading,
  } = usePoolReserves(pool.key)
  const { address } = useAccount()
  const { userLpFormatted, sharePercent } = useUserLiquidity(pool.key, address)

  // Task 0024: lift the resolved health value up to the page so the page can
  // (a) render a single banner summarising affected pools and (b) refuse to
  // open the Manage modal even if some future code path bypasses the local
  // disabled-button check.
  useEffect(() => {
    onHealthChange?.(pool.key, health)
  }, [pool.key, health, onHealthChange])

  // Task 0024: refuse to render usable trade UX when on-chain reserves imply
  // a nonsensical spot price. Replace numbers with `—`, surface a badge, and
  // disable the Manage button so the user cannot drill into the modal and
  // sign a self-griefing swap.
  const isMisconfigured = health === 'misconfigured'

  return (
    <div
      className={
        isMisconfigured
          ? 'bg-dark-100 border border-red-500/40 rounded-2xl p-5 flex flex-col gap-4'
          : 'bg-dark-100 border border-gray-700/40 rounded-2xl p-5 flex flex-col gap-4'
      }
      data-pool-key={pool.key}
      data-pool-health={health}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-goodgreen/10 border-2 border-dark-100 flex items-center justify-center text-[10px] font-bold text-goodgreen">
              {pool.tokenASymbol.slice(0, 2)}
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-dark-100 flex items-center justify-center text-[10px] font-bold text-blue-400">
              {pool.tokenBSymbol.slice(0, 2)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">{pool.key}</p>
              {isMisconfigured && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40"
                  title="Pool reserves appear misconfigured. Trading is disabled."
                  aria-label="Pool is misconfigured. Trading is disabled."
                >
                  Misconfigured
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{pool.feeBps / 100}% fee · {pool.ubiBps / 100}% UBI</p>
          </div>
        </div>
        <button
          onClick={() => !isMisconfigured && onSelect(pool.key)}
          disabled={isMisconfigured}
          aria-disabled={isMisconfigured}
          title={isMisconfigured ? 'Pool reserves appear misconfigured. Trading is disabled.' : undefined}
          className={
            isMisconfigured
              ? 'text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-700/30 text-gray-500 cursor-not-allowed'
              : 'text-xs font-medium px-3 py-1.5 rounded-lg bg-goodgreen/10 text-goodgreen hover:bg-goodgreen/10 transition-colors'
          }
        >
          Manage
        </button>
      </div>

      {/* Reserves */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">{pool.tokenASymbol} Reserve</p>
          <p className="text-sm font-semibold text-white">
            {isMisconfigured ? '—' : isLoading ? '…' : formatAmount(reserveAFormatted)}
          </p>
        </div>
        <div className="bg-dark-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">{pool.tokenBSymbol} Reserve</p>
          <p className="text-sm font-semibold text-white">
            {isMisconfigured ? '—' : isLoading ? '…' : formatAmount(reserveBFormatted)}
          </p>
        </div>
      </div>

      {/* Price + TVL */}
      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700/30 pt-3">
        <span>
          Price:{' '}
          <span className="text-white">
            {isMisconfigured
              ? '—'
              : spotPriceFormatted != null
                ? `1 ${pool.tokenASymbol} = ${formatAmount(spotPriceFormatted)} ${pool.tokenBSymbol}`
                : '—'}
          </span>
        </span>
        <span>
          LP tokens:{' '}
          <span className="text-white">
            {isMisconfigured ? '—' : isLoading ? '…' : formatAmount(totalLiquidityFormatted)}
          </span>
        </span>
      </div>

      {/* Per-card runbook hint */}
      {isMisconfigured && (
        <p className="text-[11px] text-red-300/90 border-t border-red-500/20 pt-3">
          On-chain reserves look misconfigured for this pool. Trading is disabled until an
          operator re-seeds the pool. See the{' '}
          <a
            href={POOL_RUNBOOK_PATH}
            className="underline hover:text-red-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            pool-misconfigured runbook
          </a>
          .
        </p>
      )}

      {/* User position (only if connected, and only when the pool is healthy
          enough to trust LP balances) */}
      {!isMisconfigured && address && userLpFormatted > 0 && (
        <div className="bg-goodgreen/5 border border-goodgreen/20 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Your position</span>
          <span className="text-xs font-medium text-goodgreen">
            {formatAmount(userLpFormatted)} LP · {sharePercent.toFixed(2)}% share
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Add Liquidity Form ───────────────────────────────────────────────────────

function AddLiquidityForm({ pool }: { pool: PoolMeta }) {
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [step, setStep] = useState<'idle' | 'approveA' | 'approveB' | 'add' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { approveA, approveB, addLiquidity, isApprovingA, isApprovingB, isAdding, isConfirming } =
    useAddLiquidity(pool.key)

  const parsedA = useMemo(() => parsePoolAmount(amountA, pool.tokenADecimals), [amountA, pool.tokenADecimals])
  const parsedB = useMemo(() => parsePoolAmount(amountB, pool.tokenBDecimals), [amountB, pool.tokenBDecimals])

  const canSubmit = parsedA > BigInt(0) && parsedB > BigInt(0) && step === 'idle'
  const isBusy = isApprovingA || isApprovingB || isAdding || isConfirming

  async function handleSubmit() {
    if (!canSubmit) return
    setErrorMsg('')
    try {
      setStep('approveA')
      await approveA(parsedA)
      setStep('approveB')
      await approveB(parsedB)
      setStep('add')
      await addLiquidity(parsedA, parsedB)
      setStep('done')
      setAmountA('')
      setAmountB('')
    } catch (e: any) {
      setErrorMsg(e?.shortMessage ?? e?.message ?? 'Transaction failed')
      setStep('error')
    }
  }

  function reset() {
    setStep('idle')
    setErrorMsg('')
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-goodgreen/15 flex items-center justify-center">
          <svg className="w-6 h-6 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Liquidity added!</p>
        <button onClick={reset} className="text-xs text-goodgreen hover:underline">Add more</button>
      </div>
    )
  }

  const stepLabel =
    step === 'approveA' ? `Approving ${pool.tokenASymbol}…` :
    step === 'approveB' ? `Approving ${pool.tokenBSymbol}…` :
    step === 'add' ? 'Adding liquidity…' : ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">{pool.tokenASymbol} amount</label>
        <input
          type="number"
          min="0"
          placeholder="0.00"
          value={amountA}
          onChange={e => setAmountA(e.target.value)}
          className="w-full bg-dark-50 border border-gray-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-goodgreen/50"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400">{pool.tokenBSymbol} amount</label>
        <input
          type="number"
          min="0"
          placeholder="0.00"
          value={amountB}
          onChange={e => setAmountB(e.target.value)}
          className="w-full bg-dark-50 border border-gray-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-goodgreen/50"
        />
      </div>

      {step !== 'idle' && step !== 'error' && (
        <p className="text-xs text-goodgreen text-center animate-pulse">{stepLabel}</p>
      )}
      {step === 'error' && (
        <p className="text-xs text-red-400 text-center">{errorMsg}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isBusy}
        className="w-full py-3 rounded-xl bg-goodgreen text-black font-semibold text-sm hover:bg-goodgreen-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isBusy ? 'Processing…' : 'Add Liquidity'}
      </button>

      <p className="text-[10px] text-gray-500 text-center">
        {pool.feeBps / 100}% of swap fees go to LPs · {pool.ubiBps / 100}% routed to UBI pool
      </p>
    </div>
  )
}

// ─── Remove Liquidity Form ────────────────────────────────────────────────────

function RemoveLiquidityForm({ pool }: { pool: PoolMeta }) {
  const [lpAmount, setLpAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'removing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const { address } = useAccount()
  const { userLpFormatted, userLp } = useUserLiquidity(pool.key, address)
  const { removeLiquidity, isRemoving, isConfirming } = useRemoveLiquidity(pool.key)

  const parsedLp = useMemo(() => parsePoolAmount(lpAmount, 18), [lpAmount])
  const canSubmit = parsedLp > BigInt(0) && step === 'idle'
  const isBusy = isRemoving || isConfirming

  function setMax() {
    if (userLpFormatted > 0) setLpAmount(String(userLpFormatted))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setErrorMsg('')
    try {
      setStep('removing')
      await removeLiquidity(parsedLp)
      setStep('done')
      setLpAmount('')
    } catch (e: any) {
      setErrorMsg(e?.shortMessage ?? e?.message ?? 'Transaction failed')
      setStep('error')
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-goodgreen/15 flex items-center justify-center">
          <svg className="w-6 h-6 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Liquidity removed!</p>
        <button onClick={() => setStep('idle')} className="text-xs text-goodgreen hover:underline">Remove more</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {userLp !== undefined && (
        <div className="bg-dark-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Your LP balance</span>
          <span className="text-xs font-medium text-white">{formatAmount(userLpFormatted)} LP</span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">LP tokens to remove</label>
          {userLpFormatted > 0 && (
            <button onClick={setMax} className="text-[10px] text-goodgreen hover:underline">Max</button>
          )}
        </div>
        <input
          type="number"
          min="0"
          placeholder="0.00"
          value={lpAmount}
          onChange={e => setLpAmount(e.target.value)}
          className="w-full bg-dark-50 border border-gray-700/40 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-goodgreen/50"
        />
      </div>

      {step === 'removing' && (
        <p className="text-xs text-goodgreen text-center animate-pulse">Removing liquidity…</p>
      )}
      {step === 'error' && (
        <p className="text-xs text-red-400 text-center">{errorMsg}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isBusy}
        className="w-full py-3 rounded-xl bg-red-500/80 text-white font-semibold text-sm hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isBusy ? 'Processing…' : 'Remove Liquidity'}
      </button>
    </div>
  )
}

// ─── Pool Manager Modal ───────────────────────────────────────────────────────

function PoolManager({
  poolKey,
  onClose,
}: {
  poolKey: PoolKey
  onClose: () => void
}) {
  const pool = POOL_LIST.find(p => p.key === poolKey)!

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-auto bg-dark-100 border border-gray-700/50 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-goodgreen/10 border border-dark-100 flex items-center justify-center text-[9px] font-bold text-goodgreen">
                {pool.tokenASymbol.slice(0, 2)}
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-dark-100 flex items-center justify-center text-[9px] font-bold text-blue-400">
                {pool.tokenBSymbol.slice(0, 2)}
              </div>
            </div>
            <h2 className="text-sm font-semibold text-white">{pool.key} Pool</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="add">
          <TabsList className="flex gap-1 p-3 bg-dark-50 w-full">
            <TabsTrigger
              value="add"
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors data-[state=active]:bg-goodgreen/10 data-[state=active]:text-goodgreen data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white data-[state=active]:shadow-none"
            >
              Add Liquidity
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white data-[state=active]:shadow-none"
            >
              Remove
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="p-5 mt-0">
            <AddLiquidityForm pool={pool} />
          </TabsContent>

          <TabsContent value="remove" className="p-5 mt-0">
            <RemoveLiquidityForm pool={pool} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoolClient() {
  const { isConnected } = useAccount()
  const [selectedPool, setSelectedPool] = useState<PoolKey | null>(null)

  // Task 0024: aggregate health from each PoolStatsCard so we can render a
  // single page-level banner when any pool is misconfigured. We use a callback
  // (state-lifting via callback) instead of calling `usePoolReserves` again in
  // the parent — that would re-fetch chain data and would also force
  // `POOL_LIST.map` to call hooks, which `eslint-react-hooks` forbids.
  const [healthByKey, setHealthByKey] = useState<Record<string, PoolHealth>>({})
  const handleHealthChange = useCallback((key: PoolKey, health: PoolHealth) => {
    setHealthByKey(prev => (prev[key] === health ? prev : { ...prev, [key]: health }))
  }, [])

  const misconfiguredKeys = useMemo(
    () =>
      POOL_LIST
        .map(p => p.key)
        .filter((k): k is PoolKey => healthByKey[k] === 'misconfigured'),
    [healthByKey],
  )

  // Defence in depth: refuse to open the Manage modal for a pool whose reserves
  // look broken, even if the disabled-button check is bypassed somehow.
  const handleSelectPool = useCallback(
    (key: PoolKey) => {
      if (healthByKey[key] === 'misconfigured') return
      setSelectedPool(key)
    },
    [healthByKey],
  )

  // If the selected pool flips to misconfigured while the modal is open
  // (e.g. a fresh reserves read returns extreme values), close the modal.
  useEffect(() => {
    if (selectedPool && healthByKey[selectedPool] === 'misconfigured') {
      setSelectedPool(null)
    }
  }, [selectedPool, healthByKey])

  const safeSelectedPool =
    selectedPool && healthByKey[selectedPool] !== 'misconfigured' ? selectedPool : null

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Liquidity Pools</h1>
        <p className="text-sm text-gray-400">
          Provide liquidity to earn swap fees. Every pool routes{' '}
          <span className="text-goodgreen">a share of fees</span> to the UBI pool.
        </p>
      </div>

      {/* Connect prompt */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-dark-100 border border-gray-700/30 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-gray-400">Connect wallet to manage liquidity</p>
          <ConnectButton accountStatus="avatar" showBalance={false} chainStatus="none" />
        </div>
      )}

      {/* Task 0024: page-level misconfigured pool warning */}
      {misconfiguredKeys.length > 0 && (
        <div
          role="alert"
          data-testid="pool-misconfigured-banner"
          className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex-shrink-0 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300">
                {misconfiguredKeys.length === 1
                  ? '1 pool is misconfigured'
                  : `${misconfiguredKeys.length} pools are misconfigured`}
              </p>
              <p className="mt-1 text-xs text-red-200/80">
                On-chain reserves imply an out-of-range spot price. Trading is
                disabled until reserves are reseeded. See the{' '}
                <a
                  href={POOL_RUNBOOK_PATH}
                  className="underline hover:text-red-100"
                  target="_blank"
                  rel="noreferrer"
                >
                  pool runbook
                </a>{' '}
                for recovery steps.
              </p>
              {misconfiguredKeys.length > 0 && (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-red-200/60">
                  Affected:{' '}
                  <span className="font-mono text-red-200/90">
                    {misconfiguredKeys.join(', ')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UBI banner */}
      <div className="mb-6 p-4 bg-goodgreen/5 border border-goodgreen/20 rounded-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-goodgreen/15 flex-shrink-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs text-gray-300">
          <span className="text-goodgreen font-medium">UBI-aligned liquidity.</span>{' '}
          Every swap on GoodDollar routes part of fees to fund Universal Basic Income.
          LPs earn fees while supporting the mission.
        </p>
      </div>

      {/* Pool list */}
      <div className="flex flex-col gap-4">
        {POOL_LIST.map(pool => (
          <PoolStatsCard
            key={pool.key}
            pool={pool}
            onSelect={handleSelectPool}
            onHealthChange={handleHealthChange}
          />
        ))}
      </div>

      {/* Pool manager modal — guarded against misconfigured pools */}
      {safeSelectedPool && (
        <PoolManager poolKey={safeSelectedPool} onClose={() => setSelectedPool(null)} />
      )}
    </div>
  )
}
