'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { type Token } from '@/lib/tokens'
import { SwapConfirmModal } from './SwapConfirmModal'
import { useSwapExecute } from '@/lib/useOnChainSwap'
import { useSwapSettings } from '@/lib/useSwapSettings'
import { toastPending, toastSuccess, toastError } from '@/components/ui/toast'

type BalanceProps = {
  variant: 'balance'
  inputToken: Token
  onSetAmount: (amount: string) => void
}

type SwapButtonProps = {
  variant: 'swap-button'
  inputToken: Token
  outputToken: Token
  inputAmount: string
  hasAmount: boolean
  priceImpact?: number
  outputAmount?: string
  inputUsd?: string
  outputUsd?: string
  exchangeRate?: string
  minimumReceived?: string
  networkFee?: string
  ubiFee?: string
  /** On-chain amountOut * (1 - slippage) — used as amountOutMin for the real swap */
  onChainAmountOutMin?: bigint
  /** True when the selected pair is supported by GoodSwapRouter on devnet */
  pairOnChain?: boolean
  /**
   * Defense-in-depth gate: must be true to allow the modal to open.
   * SwapCard sets this to false for sub-floor / zero-output inputs so the
   * router never receives a zero-amount tx that would either revert on-chain
   * (wasted gas) or succeed with `minimumReceived = 0` (slippage neutralised,
   * sandwich risk). Defaults to true so legacy callers behave identically.
   */
  canSubmit?: boolean
  /**
   * Optional category of the disable reason. Controls the disabled CTA label
   * and the helper line beneath it. Defaults to `'dust'` (the existing
   * sub-floor behaviour). `'over-cap'` is used when the user has typed an
   * amount exceeding the per-symbol sanity cap. `'pair-unsupported'` (task
   * 0046) covers pairs not in `GoodSwapRouter.SWAP_TOKENS` — replaces the
   * old silent no-op inside the confirm modal.
   */
  disabledReason?: DisabledReason
  /** Called when user clicks swap with no amount entered — triggers input shake */
  onInvalidSubmit?: () => void
}

type SwapWalletActionsProps = BalanceProps | SwapButtonProps

export type DisabledReason = 'dust' | 'over-cap' | 'pair-unsupported'

export function SwapWalletActions(props: SwapWalletActionsProps) {
  if (props.variant === 'balance') {
    return null
  }
  return (
    <SwapButton
      inputToken={props.inputToken}
      outputToken={props.outputToken}
      inputAmount={props.inputAmount}
      hasAmount={props.hasAmount}
      priceImpact={props.priceImpact}
      outputAmount={props.outputAmount}
      inputUsd={props.inputUsd}
      outputUsd={props.outputUsd}
      exchangeRate={props.exchangeRate}
      minimumReceived={props.minimumReceived}
      networkFee={props.networkFee}
      ubiFee={props.ubiFee}
      onChainAmountOutMin={props.onChainAmountOutMin}
      pairOnChain={props.pairOnChain}
      canSubmit={props.canSubmit}
      disabledReason={props.disabledReason}
      onInvalidSubmit={props.onInvalidSubmit}
    />
  )
}

type SwapButtonInnerProps = {
  inputToken: Token
  outputToken: Token
  inputAmount: string
  hasAmount: boolean
  priceImpact?: number
  outputAmount?: string
  inputUsd?: string
  outputUsd?: string
  exchangeRate?: string
  minimumReceived?: string
  networkFee?: string
  ubiFee?: string
  onChainAmountOutMin?: bigint
  pairOnChain?: boolean
  canSubmit?: boolean
  disabledReason?: DisabledReason
  onInvalidSubmit?: () => void
}

function SwapButton(props: SwapButtonInnerProps) {
  // RainbowKit render-prop yields `openConnectModal` for the connect-wallet
  // CTA branch (matches the pattern used by ConnectWalletBanner /
  // UBIContributionCard). Wrapping at the root means every branch can call
  // it without re-mounting RainbowKit machinery.
  return (
    <ConnectButton.Custom>
      {({ openConnectModal }) => (
        <SwapButtonInner {...props} openConnectModal={openConnectModal} />
      )}
    </ConnectButton.Custom>
  )
}

function SwapButtonInner({
  inputToken,
  outputToken,
  inputAmount,
  hasAmount,
  priceImpact = 0,
  outputAmount = '',
  inputUsd = '',
  outputUsd = '',
  exchangeRate = '',
  minimumReceived = '',
  networkFee = '< $0.01',
  ubiFee = '',
  onChainAmountOutMin,
  pairOnChain = false,
  canSubmit = true,
  disabledReason = 'dust',
  onInvalidSubmit,
  openConnectModal,
}: SwapButtonInnerProps & { openConnectModal: (() => void) | undefined }) {
  const [showReview, setShowReview] = useState(false)
  const { swap, phase, error, reset, isConnected } = useSwapExecute()
  const { deadline: deadlineMinutes } = useSwapSettings()
  const prevPhase = useRef(phase)

  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = phase
    if (phase === prev) return
    if (phase === 'approving') {
      toastPending('Awaiting approval…', 'Please confirm the token approval in your wallet.')
    } else if (phase === 'swapping') {
      toastPending('Swap submitted', 'Waiting for transaction confirmation…')
    } else if (phase === 'done') {
      toastSuccess('Swap complete!', `${inputToken.symbol} → ${outputToken.symbol} transaction confirmed.`)
    }
  }, [phase, inputToken.symbol, outputToken.symbol])

  useEffect(() => {
    if (error) {
      toastError('Swap failed', error)
    }
  }, [error])

  const handleSwapClick = useCallback(() => {
    setShowReview(true)
  }, [])

  const handleConnectClick = useCallback(() => {
    if (openConnectModal) {
      openConnectModal()
    } else {
      // RainbowKit not mounted (e.g. server-side or mis-configured surface).
      // Surface a toast so the click is never a silent no-op.
      toastError('Wallet connect unavailable', 'Reload the page and try again.')
    }
  }, [openConnectModal])

  const handleConfirm = useCallback(async () => {
    setShowReview(false)
    // Task 0046: every code path inside the confirm handler MUST kick off a
    // user-visible action (wallet open / swap / toast). The old guard
    // `pairOnChain && isConnected` returned silently for the two most common
    // failure modes; the new logic routes each case explicitly.
    if (!isConnected) {
      handleConnectClick()
      return
    }
    if (!pairOnChain) {
      toastError(
        'Pair not supported',
        'Pick a supported pair (G$, ETH, or USDC on devnet) to swap.',
      )
      return
    }
    try {
      await swap(
        inputToken.symbol,
        outputToken.symbol,
        inputAmount,
        onChainAmountOutMin ?? BigInt(0),
        deadlineMinutes,
      )
    } catch (err) {
      // useSwapExecute already calls setError on its own try/catch; this is
      // the last-ditch belt-and-suspenders so a thrown rejection from
      // writeContractAsync never exits silently if the hook's catch is
      // somehow bypassed.
      const msg = err instanceof Error ? err.message : 'Unknown error'
      toastError('Swap failed', msg)
    }
  }, [
    isConnected,
    pairOnChain,
    swap,
    inputToken.symbol,
    outputToken.symbol,
    inputAmount,
    onChainAmountOutMin,
    deadlineMinutes,
    handleConnectClick,
  ])

  const handleClose = useCallback(() => {
    setShowReview(false)
    reset()
  }, [reset])

  const isExecuting = phase === 'approving' || phase === 'swapping'

  const buttonLabel = () => {
    if (phase === 'approving') return 'Approving…'
    if (phase === 'swapping') return 'Swapping…'
    if (phase === 'done') return `Swapped!`
    if (priceImpact >= 10) return `Swap Anyway — High Price Impact`
    return `Swap ${inputToken.symbol} for ${outputToken.symbol}`
  }

  // Branch resolution — single source of truth, evaluated in priority order.
  // Mutually exclusive so JSX below stays a flat early-return ladder.
  let body: React.ReactNode
  if (!hasAmount) {
    body = (
      <>
        <button
          type="button"
          onClick={onInvalidSubmit}
          className="w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed"
          data-testid="swap-button-empty"
        >
          Enter an Amount
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">
          Try swapping {inputToken.symbol} → {outputToken.symbol} — 0.1% of fees fund universal basic income for recipients worldwide
        </p>
      </>
    )
  } else if (disabledReason === 'pair-unsupported' && !canSubmit) {
    body = (
      <>
        <button
          type="button"
          onClick={onInvalidSubmit}
          className="w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed"
          data-testid="swap-button-pair-unsupported"
          aria-disabled="true"
          disabled
        >
          Pair not yet available on GoodSwap
        </button>
        <p className="text-xs text-amber-400/90 text-center mt-3">
          Only G$, ETH, and USDC are supported on devnet right now.
        </p>
      </>
    )
  } else if (!isConnected && pairOnChain && canSubmit) {
    body = (
      <button
        type="button"
        onClick={handleConnectClick}
        className="w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none bg-goodgreen text-black hover:bg-goodgreen-600 focus-visible:ring-goodgreen/50"
        data-testid="swap-button-connect-wallet"
      >
        Connect Wallet to Swap
      </button>
    )
  } else if (!canSubmit) {
    body = disabledReason === 'over-cap' ? (
      <>
        <button
          type="button"
          onClick={onInvalidSubmit}
          className="w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed"
          data-testid="swap-button-over-cap"
          aria-disabled="true"
          disabled
        >
          Amount Too Large
        </button>
        <p className="text-xs text-amber-400/90 text-center mt-3">
          That amount is well above the per-swap cap. Reduce it to continue.
        </p>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={onInvalidSubmit}
          className="w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed"
          data-testid="swap-button-dust-guard"
          aria-disabled="true"
        >
          Amount Too Small
        </button>
        <p className="text-xs text-amber-400/90 text-center mt-3">
          Output rounds to zero. Try a larger amount — sub-dust swaps would
          waste gas and disable slippage protection.
        </p>
      </>
    )
  } else {
    body = (
      <button
        type="button"
        onClick={handleSwapClick}
        disabled={isExecuting}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
          priceImpact >= 10
            ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50'
            : 'bg-goodgreen text-black hover:bg-goodgreen-600 focus-visible:ring-goodgreen/50'
        }`}
        data-testid="swap-button-active"
      >
        {buttonLabel()}
      </button>
    )
  }

  return (
    <>
      {body}

      <SwapConfirmModal
        // Gate on canSubmit so that if a live quote refresh demotes a healthy
        // amount to dust while the modal is already open, the modal hides
        // before the user can confirm a zero-output swap.
        open={showReview && canSubmit}
        onClose={handleClose}
        onConfirm={handleConfirm}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        inputSymbol={inputToken.symbol}
        outputSymbol={outputToken.symbol}
        inputUsd={inputUsd}
        outputUsd={outputUsd}
        exchangeRate={exchangeRate}
        priceImpact={priceImpact}
        minimumReceived={minimumReceived}
        networkFee={networkFee}
        ubiFee={ubiFee}
        deadlineMinutes={deadlineMinutes}
      />
    </>
  )
}
