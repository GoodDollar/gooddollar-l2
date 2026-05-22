'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatStockPrice, formatStockShares, MAX_STOCK_ORDER_USD } from '@/lib/stockData'
import { sanitizeNumericInput, formatTradeAmount } from '@/lib/format'
import { useWalletReady } from '@/lib/WalletReadyContext'
import { useMintSynthetic, useRedeemSynthetic, type OnChainStockPosition } from '@/lib/useStocks'
import { computeSellGuards, isLimitDisabledOnChain } from '@/lib/stocksOrderValidation'
import { humanizeRiskReason } from '@/lib/stocksRebalanceInvariant'
import { toG$Wei } from '@/lib/gDollarAmount'

interface ConfirmedOrder {
  ticker: string
  side: 'buy' | 'sell'
  shares: number
  price: number
  amount: number
  fee: number
  ubiFee: number
}

function WalletGatedTradeButton({ hasAmount, children }: { hasAmount: boolean; children: React.ReactNode }) {
  const { isConnected } = useAccount()
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button type="button" onClick={openConnectModal}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors">
            Connect Wallet to Trade
          </button>
        )}
      </ConnectButton.Custom>
    )
  }
  if (!hasAmount) {
    return (
      <button type="button" disabled
        className="w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed">
        Enter Amount
      </button>
    )
  }
  return <>{children}</>
}

export function StockOrderForm({
  stock,
  position,
  riskBlockReason = null,
}: {
  stock: { ticker: string; price: number }
  position: OnChainStockPosition | null
  riskBlockReason?: string | null
}) {
  const router = useRouter()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null)
  const walletReady = useWalletReady()
  const { isConnected } = useAccount()
  const { mint, phase: mintPhase, error: mintError, isDeployed } = useMintSynthetic()
  const { redeem, phase: redeemPhase, error: redeemError } = useRedeemSynthetic()

  const parsedLimitPrice = parseFloat(limitPrice)
  const limitPriceInvalid = orderType === 'limit' && limitPrice !== '' && (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0)
  const hasValidPrice = orderType === 'market' || parsedLimitPrice > 0
  const effectivePrice = orderType === 'limit' && parsedLimitPrice > 0 ? parsedLimitPrice : (orderType === 'limit' ? 0 : stock.price)
  const shares = amount && effectivePrice > 0 ? parseFloat(amount) / effectivePrice : 0
  const fee = amount ? parseFloat(amount) * 0.001 : 0
  const ubiFee = fee * 0.33
  // Sanity-cap the Amount (USD) input so the summary cannot advertise
  // implausibly large notional values (e.g. $1T phantom orders) and so
  // we never submit an order the chain would just revert. See task 0058.
  const parsedAmount = parseFloat(amount)
  const amountTooLarge = !!amount && Number.isFinite(parsedAmount) && parsedAmount > MAX_STOCK_ORDER_USD
  const hasAmount = !!amount && parsedAmount > 0 && !amountTooLarge

  // Sell-side balance gating: when a user is on the Sell tab we must not
  // let them attempt to burn more sToken debt than they actually minted —
  // the on-chain `burn` call would revert with poor UX. See task 0057.
  const { sellGated, sellSharesExceedsBalance, balanceShares } = computeSellGuards({
    side,
    isConnected,
    debtFloat: position?.debtFloat ?? null,
    sharesRequested: shares,
  })
  const sellDisabled = sellGated || sellSharesExceedsBalance

  // Limit-order gating: on-chain (`isDeployed`) we do not yet have a limit
  // order book — only `mint()` / `redeem()` exist, which are immediate
  // market trades. Before this gate the Limit tab silently fired a fake
  // "Order Submitted!" toast (3 s) without touching the chain — users
  // believed orders had placed. We now block submit at handleSubmit AND
  // visually (banner + disabled button) until a real limit book ships.
  const limitGate = isLimitDisabledOnChain({ isDeployed, orderType })
  const riskBlocked = !!riskBlockReason

  const resetToForm = useCallback(() => {
    setConfirmedOrder(null)
  }, [])

  useEffect(() => {
    if (!confirmedOrder) return
    const timer = setTimeout(resetToForm, 15_000)
    return () => clearTimeout(timer)
  }, [confirmedOrder, resetToForm])

  const actionPhase = side === 'buy' ? mintPhase : redeemPhase
  const actionError = side === 'buy' ? mintError : redeemError
  const isPending = actionPhase === 'approving' || actionPhase === 'pending'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || limitPriceInvalid || !hasValidPrice) return
    if (amountTooLarge) return
    if (sellDisabled) return
    if (limitGate.disabled) return
    if (riskBlocked) return

    const orderDetails: ConfirmedOrder = {
      ticker: stock.ticker,
      side,
      shares,
      price: effectivePrice,
      amount: parseFloat(amount),
      fee,
      ubiFee,
    }

    if (isDeployed && orderType === 'market') {
      const amountNum = parseFloat(amount)
      const GD_PRICE_USD = 0.01
      const collateralGD = amountNum / GD_PRICE_USD
      const collateralWei = toG$Wei(collateralGD)
      const sharesWei = toG$Wei(shares)
      if (side === 'buy') {
        await mint(stock.ticker, collateralWei, sharesWei)
      } else {
        await redeem(stock.ticker, sharesWei, collateralWei)
      }
    }

    setConfirmedOrder(orderDetails)
    setAmount('')
    setLimitPrice('')
  }

  if (confirmedOrder) {
    return (
      <div data-testid="stocks-order-confirmation" className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        <h3 className="text-center text-white font-semibold text-lg mb-1">Order Submitted!</h3>
        <p className="text-center text-gray-400 text-sm mb-4">
          {confirmedOrder.side === 'buy' ? 'Buy' : 'Sell'} {confirmedOrder.ticker}
        </p>

        <div className="space-y-2 mb-5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Shares</span>
            <span className="text-white">{formatStockShares(confirmedOrder.shares)} {confirmedOrder.ticker}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price</span>
            <span className="text-white">{formatStockPrice(confirmedOrder.price)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Amount</span>
            <span className="text-white">{formatTradeAmount(confirmedOrder.amount)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee (0.1%)</span>
            <span className="text-white">{formatTradeAmount(confirmedOrder.fee)}</span>
          </div>
          <div className="flex justify-between text-goodgreen/80">
            <span>→ UBI Pool (33%)</span>
            <span>{formatTradeAmount(confirmedOrder.ubiFee)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/stocks/portfolio')}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors"
          >
            View Portfolio
          </button>
          <button
            type="button"
            onClick={resetToForm}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-dark-50 text-white border border-gray-700/30 hover:bg-dark-50/80 transition-colors"
          >
            Trade Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <form id="stock-order-form" onSubmit={handleSubmit} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Buy
        </button>
        <button type="button" onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Sell
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setOrderType('market')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${orderType === 'market' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
          Market
        </button>
        <button type="button" onClick={() => setOrderType('limit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${orderType === 'limit' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
          Limit
        </button>
      </div>

      {orderType === 'limit' && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Limit Price</label>
          <input type="text" inputMode="decimal" placeholder="0.00" value={limitPrice} onChange={e => setLimitPrice(sanitizeNumericInput(e.target.value))}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${limitPriceInvalid ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {limitPriceInvalid && (
            <p className="text-red-400 text-[10px] mt-1">Price must be greater than 0</p>
          )}
        </div>
      )}

      {limitGate.disabled && (
        <div
          role="alert"
          aria-live="polite"
          data-testid="limit-not-supported-banner"
          className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
        >
          Limit orders are not yet supported on-chain. Switch to <span className="font-semibold">Market</span> to trade {stock.ticker} now.
        </div>
      )}
      {riskBlocked && (
        <div
          role="alert"
          aria-live="polite"
          data-testid="stocks-risk-stop-banner"
          className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
        >
          <span className="font-medium">Trading paused</span>
          <span className="mx-1">—</span>
          <span>{humanizeRiskReason(riskBlockReason!)}</span>
          <p className="mt-0.5 text-[10px] text-amber-300/70">This usually resolves within a few seconds.</p>
        </div>
      )}

      {sellGated && (
        <div role="alert" aria-live="polite"
          className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          You have no {stock.ticker} to sell. Switch to{' '}
          <button
            type="button"
            onClick={() => setSide('buy')}
            aria-label="Switch to Buy tab"
            data-testid="stocks-sell-gated-switch-to-buy"
            className="font-semibold underline underline-offset-2 decoration-amber-300/40 hover:decoration-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 rounded"
          >
            Buy
          </button>{' '}
          to open a position first.
        </div>
      )}
      {sellSharesExceedsBalance && (
        <div role="alert" aria-live="polite"
          className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          You only hold {balanceShares.toFixed(4)} {stock.ticker}. Reduce the amount to sell.
        </div>
      )}

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
        <input type="text" inputMode="decimal" placeholder="0.00" data-testid="stocks-order-amount-input" value={amount} onChange={e => setAmount(sanitizeNumericInput(e.target.value))}
          aria-invalid={sellSharesExceedsBalance || amountTooLarge || undefined}
          className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${sellSharesExceedsBalance || amountTooLarge ? 'border-red-500/50' : 'border-gray-700/30'}`} />
        {amountTooLarge && (
          <p className="text-red-400 text-[10px] mt-1">
            Max order is ${MAX_STOCK_ORDER_USD.toLocaleString('en-US')} per trade. Split larger orders into multiple smaller ones.
          </p>
        )}
      </div>

      {amount && parseFloat(amount) > 0 && hasValidPrice && effectivePrice > 0 && !sellGated && !sellSharesExceedsBalance && !amountTooLarge && (
        <div className="mb-4 space-y-1.5 text-xs" data-testid="stocks-cost-breakdown">
          <div className="flex justify-between text-gray-400">
            <span>Est. Shares</span>
            <span className="text-white truncate ml-2">{formatStockShares(shares)} {stock.ticker}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price</span>
            <span className="text-white truncate ml-2">{formatStockPrice(effectivePrice)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee (0.1%)</span>
            <span className="text-white truncate ml-2">{formatTradeAmount(fee)}</span>
          </div>
          <div className="flex justify-between text-goodgreen/80">
            <span>→ UBI Pool (33%)</span>
            <span className="truncate ml-2">{formatTradeAmount(ubiFee)}</span>
          </div>
        </div>
      )}

      {actionError && (
        <p className="text-[10px] text-red-400 text-center truncate mb-2">{actionError}</p>
      )}
      {walletReady && sellGated ? (
        <button type="button" disabled
          className="w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed">
          No {stock.ticker} to sell
        </button>
      ) : walletReady ? (
        // When the limit-order on-chain gate is active we still want our own
        // disabled "Limit not available" CTA to render (not the gated
        // "Enter Amount" placeholder). The inner submit button stays disabled
        // and handleSubmit short-circuits, so this is safe — it just gives the
        // user a clearer reason why nothing happens. See task 0028.
        <WalletGatedTradeButton hasAmount={riskBlocked || limitGate.disabled || (hasAmount && hasValidPrice && !sellSharesExceedsBalance)}>
          <button type="submit" disabled={limitPriceInvalid || !hasValidPrice || isPending || sellSharesExceedsBalance || amountTooLarge || limitGate.disabled || riskBlocked}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}>
            {riskBlocked ? 'Trading paused' : limitGate.disabled ? 'Limit not available' : actionPhase === 'approving' ? 'Approving…' : actionPhase === 'pending' ? 'Confirming…' : actionPhase === 'done' ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
          </button>
        </WalletGatedTradeButton>
      ) : (
        <button type="submit" disabled={!hasAmount || limitPriceInvalid || !hasValidPrice || sellDisabled || amountTooLarge || limitGate.disabled || riskBlocked}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}>
          {riskBlocked ? 'Sync required' : limitGate.disabled ? 'Limit not available' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
        </button>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-goodgreen">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <span>0.1% fee → 33% funds UBI</span>
      </div>
    </form>
  )
}
