'use client'

import { useState, useMemo, useCallback } from 'react'
import { sanitizeNumericInput } from '@/lib/format'

type Side = 'buy' | 'sell'
type OrderType = 'market' | 'limit' | 'stop-limit'

interface StockOrderFormAdvancedProps {
  ticker: string
  price: number
  onSubmit?: (order: StockOrderPayload) => void
}

export interface StockOrderPayload {
  side: Side
  orderType: OrderType
  amount: string
  limitPrice: string
  triggerPrice: string
  takeProfit: string
  stopLoss: string
  slippageTolerance: string
}

function parsePositive(value: string): number | null {
  if (!value.trim()) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function StockOrderFormAdvanced({ ticker, price, onSubmit }: StockOrderFormAdvancedProps) {
  const [side, setSide] = useState<Side>('buy')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [triggerPrice, setTriggerPrice] = useState('')

  const [showTpSl, setShowTpSl] = useState(false)
  const [tp, setTp] = useState('')
  const [sl, setSl] = useState('')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [slippage, setSlippage] = useState('0.5')

  const parsedAmount = parseFloat(amount) || 0
  const parsedLimitPrice = parseFloat(limitPrice) || 0
  const parsedTriggerPrice = parseFloat(triggerPrice) || 0
  const parsedTp = parseFloat(tp) || 0
  const parsedSl = parseFloat(sl) || 0

  const limitPriceInvalid = orderType !== 'market' && limitPrice !== '' && (!Number.isFinite(parsedLimitPrice) || parsedLimitPrice <= 0)
  const triggerPriceInvalid = orderType === 'stop-limit' && triggerPrice !== '' && (!Number.isFinite(parsedTriggerPrice) || parsedTriggerPrice <= 0)

  const triggerWrongSide = useMemo(() => {
    if (orderType !== 'stop-limit') return false
    const trig = parsePositive(triggerPrice)
    if (trig === null || price <= 0) return false
    if (side === 'buy' && trig <= price) return true
    if (side === 'sell' && trig >= price) return true
    return false
  }, [orderType, side, triggerPrice, price])

  const limitVsTriggerWrong = useMemo(() => {
    if (orderType !== 'stop-limit') return false
    const trig = parsePositive(triggerPrice)
    const lim = parsePositive(limitPrice)
    if (trig === null || lim === null) return false
    if (side === 'buy' && lim < trig) return true
    if (side === 'sell' && lim > trig) return true
    return false
  }, [orderType, side, triggerPrice, limitPrice])

  const tpWrongSide = useMemo(() => {
    const tpVal = parsePositive(tp)
    if (tpVal === null || price <= 0) return false
    if (side === 'buy' && tpVal <= price) return true
    if (side === 'sell' && tpVal >= price) return true
    return false
  }, [tp, price, side])

  const slWrongSide = useMemo(() => {
    const slVal = parsePositive(sl)
    if (slVal === null || price <= 0) return false
    if (side === 'buy' && slVal >= price) return true
    if (side === 'sell' && slVal <= price) return true
    return false
  }, [sl, price, side])

  const parsedSlippage = parseFloat(slippage) || 0
  const slippageWarning = parsedSlippage > 5 && parsedSlippage <= 50
  const slippageExcessive = parsedSlippage > 50

  const effectivePrice = orderType === 'market' ? price : (parsedLimitPrice > 0 ? parsedLimitPrice : 0)
  const shares = effectivePrice > 0 ? parsedAmount / effectivePrice : 0
  const fee = parsedAmount * 0.001

  const tpPnl = useMemo(() => {
    if (!parsedTp || !effectivePrice || effectivePrice <= 0 || shares <= 0) return null
    const diff = side === 'buy' ? parsedTp - effectivePrice : effectivePrice - parsedTp
    return diff * shares
  }, [parsedTp, effectivePrice, shares, side])

  const slPnl = useMemo(() => {
    if (!parsedSl || !effectivePrice || effectivePrice <= 0 || shares <= 0) return null
    const diff = side === 'buy' ? parsedSl - effectivePrice : effectivePrice - parsedSl
    return diff * shares
  }, [parsedSl, effectivePrice, shares, side])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (limitPriceInvalid || triggerPriceInvalid || triggerWrongSide || limitVsTriggerWrong || slippageExcessive) return
    onSubmit?.({
      side,
      orderType,
      amount,
      limitPrice,
      triggerPrice,
      takeProfit: tp,
      stopLoss: sl,
      slippageTolerance: slippage,
    })
  }, [side, orderType, amount, limitPrice, triggerPrice, tp, sl, slippage, limitPriceInvalid, triggerPriceInvalid, triggerWrongSide, limitVsTriggerWrong, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Buy / Sell tabs */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Buy
        </button>
        <button type="button" onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Sell
        </button>
      </div>

      {/* Order type tabs */}
      <div className="flex gap-1">
        {(['market', 'limit', 'stop-limit'] as OrderType[]).map(ot => (
          <button key={ot} type="button" onClick={() => setOrderType(ot)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${orderType === ot ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
            {ot}
          </button>
        ))}
      </div>

      {/* Advanced Options (collapsible) */}
      <div>
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
          {showAdvanced ? '▾' : '▸'} Advanced Options
          {!showAdvanced && slippage !== '0.5' && (
            <span className="text-[10px] text-gray-600 ml-1">Slippage {slippage}%</span>
          )}
        </button>
        {showAdvanced && (
          <div className="space-y-2 mt-2">
            <div>
              <label htmlFor="slippage-input" className="text-xs text-gray-400 mb-1 block">Slippage Tolerance (%)</label>
              <div className="flex gap-1.5">
                {['0.1', '0.5', '1.0'].map(val => (
                  <button key={val} type="button" onClick={() => setSlippage(val)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${slippage === val ? 'bg-goodgreen/15 text-goodgreen' : 'bg-dark-50 text-gray-400 hover:text-white'}`}>
                    {val}%
                  </button>
                ))}
                <input id="slippage-input" type="text" inputMode="decimal" value={slippage}
                  aria-label="Slippage Tolerance"
                  onChange={e => setSlippage(sanitizeNumericInput(e.target.value))}
                  className={`flex-1 px-2 py-1 rounded bg-dark-50 border text-white text-[10px] outline-none focus-visible:ring-1 focus-visible:ring-goodgreen/50 min-w-0 ${slippageExcessive ? 'border-red-500/50' : slippageWarning ? 'border-yellow-500/50' : 'border-gray-700/30'}`} />
              </div>
              {slippageWarning && (
                <p className="text-yellow-400 text-[10px] mt-1">High slippage — you may receive a worse price</p>
              )}
              {slippageExcessive && (
                <p className="text-red-400 text-[10px] mt-1">Slippage too high — maximum 50%</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stop-Limit: Trigger Price */}
      {orderType === 'stop-limit' && (
        <div>
          <label htmlFor="trigger-price" className="text-xs text-gray-400 mb-1 block">Trigger Price</label>
          <input id="trigger-price" type="text" inputMode="decimal"
            aria-label="Trigger Price"
            placeholder={price.toFixed(2)}
            value={triggerPrice}
            onChange={e => setTriggerPrice(sanitizeNumericInput(e.target.value))}
            className={`w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${(triggerPriceInvalid || triggerWrongSide) ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {triggerPriceInvalid && (
            <p className="text-red-400 text-[10px] mt-1">Price must be greater than 0</p>
          )}
          {!triggerPriceInvalid && triggerWrongSide && (
            <p className="text-red-400 text-[10px] mt-1">
              {side === 'buy' ? 'Trigger must be above current price' : 'Trigger must be below current price'}
            </p>
          )}
        </div>
      )}

      {/* Limit Price (for limit and stop-limit) */}
      {orderType !== 'market' && (
        <div>
          <label htmlFor="limit-price" className="text-xs text-gray-400 mb-1 block">Limit Price</label>
          <input id="limit-price" type="text" inputMode="decimal"
            aria-label="Limit Price"
            placeholder={price.toFixed(2)}
            value={limitPrice}
            onChange={e => setLimitPrice(sanitizeNumericInput(e.target.value))}
            className={`w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${(limitPriceInvalid || limitVsTriggerWrong) ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {limitPriceInvalid && (
            <p className="text-red-400 text-[10px] mt-1">Price must be greater than 0</p>
          )}
          {!limitPriceInvalid && limitVsTriggerWrong && (
            <p className="text-red-400 text-[10px] mt-1">
              {side === 'buy' ? 'Limit must be ≥ trigger price' : 'Limit must be ≤ trigger price'}
            </p>
          )}
        </div>
      )}

      {/* Amount */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
        <input type="text" inputMode="decimal" placeholder="0.00" value={amount}
          onChange={e => setAmount(sanitizeNumericInput(e.target.value))}
          className="w-full px-3 py-2.5 rounded-xl bg-dark-50 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50" />
      </div>

      {/* Order Summary */}
      {parsedAmount > 0 && effectivePrice > 0 && (
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Est. Shares</span>
            <span className="text-white">{shares.toFixed(4)} {ticker}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price</span>
            <span className="text-white">${effectivePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee (0.1%)</span>
            <span className="text-white">${fee.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* TP / SL (collapsible) */}
      <div>
        <button type="button" onClick={() => setShowTpSl(!showTpSl)}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
          {showTpSl ? '▾' : '▸'} TP / SL
          {(tp || sl) && !showTpSl && (
            <span className="text-[10px] text-gray-600 ml-1">
              {tp ? `TP $${parsedTp.toFixed(2)}` : ''}{tp && sl ? ' / ' : ''}{sl ? `SL $${parsedSl.toFixed(2)}` : ''}
            </span>
          )}
        </button>
        {showTpSl && (
          <div className="space-y-2 mt-2">
            <div>
              <label htmlFor="tp-input" className="text-xs text-gray-400 mb-1 block">Take Profit</label>
              <input id="tp-input" type="text" inputMode="decimal"
                aria-label="Take Profit"
                placeholder={side === 'buy' ? (price * 1.1).toFixed(2) : (price * 0.9).toFixed(2)}
                value={tp}
                onChange={e => setTp(sanitizeNumericInput(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${tpWrongSide ? 'border-yellow-500/50' : 'border-gray-700/30'}`} />
              {tpWrongSide && (
                <p className="text-yellow-400 text-[10px] mt-1">
                  {side === 'buy' ? 'Take profit should be above current price' : 'Take profit should be below current price'}
                </p>
              )}
              {tpPnl !== null && !tpWrongSide && (
                <p className={`text-[10px] mt-1 ${tpPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Est. Profit: {tpPnl >= 0 ? '+' : ''}${tpPnl.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="sl-input" className="text-xs text-gray-400 mb-1 block">Stop Loss</label>
              <input id="sl-input" type="text" inputMode="decimal"
                aria-label="Stop Loss"
                placeholder={side === 'buy' ? (price * 0.95).toFixed(2) : (price * 1.05).toFixed(2)}
                value={sl}
                onChange={e => setSl(sanitizeNumericInput(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${slWrongSide ? 'border-yellow-500/50' : 'border-gray-700/30'}`} />
              {slWrongSide && (
                <p className="text-yellow-400 text-[10px] mt-1">
                  {side === 'buy' ? 'Stop loss should be below current price' : 'Stop loss should be above current price'}
                </p>
              )}
              {slPnl !== null && !slWrongSide && (
                <p className={`text-[10px] mt-1 ${slPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Est. Loss: {slPnl >= 0 ? '+' : ''}${slPnl.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button type="submit"
        disabled={parsedAmount <= 0 || limitPriceInvalid || triggerPriceInvalid || triggerWrongSide || limitVsTriggerWrong || slippageExcessive}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
        }`}>
        {side === 'buy' ? 'Buy' : 'Sell'} {ticker}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-goodgreen">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <span>0.1% fee → 20% funds UBI</span>
      </div>
    </form>
  )
}
