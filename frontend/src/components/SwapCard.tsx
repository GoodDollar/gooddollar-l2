'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { TokenSelector } from './TokenSelector'
import { TOKENS, type Token } from '@/lib/tokens'
import { UBIBreakdown } from './UBIBreakdown'
import { StalePriceBanner } from './StalePriceBanner'
import { SwapSettings } from './SwapSettings'
import { SwapDetails } from './SwapDetails'
import { SwapRoute } from './SwapRoute'
import { PriceImpactWarning } from './PriceImpactWarning'
import { FeeBreakdownBadge } from './FeeBreakdownBadge'
import { formatAmount, compactAmount, sanitizeNumericInput, formatUsdValue } from '@/lib/format'
import { useSwapSettings } from '@/lib/useSwapSettings'
import { SwapWalletActions } from './SwapWalletActions'
import { usePriceFeeds, getPrice } from '@/lib/usePriceFeeds'
import { useSwapQuote } from '@/lib/useOnChainSwap'
import { AnimatedNumber } from './ui/animated-number'
import { PriceSourceBadge } from './PriceSourceBadge'
import type { PriceSource } from '@/lib/priceSource'
import { isAmountWithinCap, getSwapInputCap } from '@/lib/swapLimits'

function getLiveRate(prices: Record<string, number>, from: string, to: string): number {
  if (from === to) return 1
  const fromPrice = getPrice(prices, from)
  const toPrice = getPrice(prices, to)
  if (!fromPrice || !toPrice) return 0
  return fromPrice / toPrice
}

const SWAP_FEE_BPS = 30
const UBI_FEE_BPS = 2000

// Cap on "You pay" input length. 16 chars covers the realistic range
// for every token in the app (G$ totalSupply ≈ 1 trillion → 13 integer
// digits + "." + 2 decimals = 16) without entering JS `Number` precision
// loss territory. Stops the trillion-scale display overflow and the
// 24-digit "huge input flips to tiny output" pathology at the source.
const MAX_INPUT_LEN = 16

// Display floor for the "You receive" cell. When the parsed input is
// non-zero but the resulting `rawOutputAmount` is below 1e-6, we render
// this literal instead of fabricating a numeric value that's
// inevitably the wrong order of magnitude.
const FLOOR_STR = '< 0.000001'
const FLOOR_THRESHOLD = 1e-6

export function SwapCard() {
  const { slippage } = useSwapSettings()
  const searchParams = useSearchParams()
  const [inputToken, setInputToken] = useState<Token>(TOKENS[1])
  const [outputToken, setOutputToken] = useState<Token>(TOKENS[0])
  const [inputAmount, setInputAmount] = useState('')
  // Task 0031: `wasTruncated` flips on when the user's sanitized input
  // would have exceeded `MAX_INPUT_LEN` and the slice dropped digits. It
  // resets on the next edit that fits, so the truncation notice is a
  // one-shot signal tied to the currently-displayed value.
  const [wasTruncated, setWasTruncated] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Live price feeds — falls back to static prices when CoinGecko is unreachable
  const feed = usePriceFeeds(TOKENS.map(t => t.symbol))
  const { prices, isLive } = feed
  // Defensive read: some legacy tests mock `usePriceFeeds` without the
  // lane-4 `sources` field. Treat that as "we don't know" instead of crashing.
  const sources: Record<string, PriceSource> = feed.sources ?? {}

  // Pick the "less authoritative" source between the two legs so the badge
  // honestly reflects the weakest link in the rate calculation. Chain wins
  // when both sides have it; if either side is fallback, the rate is fallback.
  const rateSource: PriceSource = (() => {
    const fromSrc = sources[inputToken.symbol] ?? 'unknown'
    const toSrc   = sources[outputToken.symbol] ?? 'unknown'
    const order: PriceSource[] = ['chain-oracle', 'etoro-demo', 'coingecko', 'stale', 'closed', 'fallback', 'unknown']
    const fromRank = order.indexOf(fromSrc)
    const toRank   = order.indexOf(toSrc)
    return order[Math.max(fromRank, toRank)] ?? 'unknown'
  })()

  useEffect(() => {
    const buyParam = searchParams.get('buy')
    if (buyParam) {
      const found = TOKENS.find(t => t.symbol.toUpperCase() === buyParam.toUpperCase())
      if (found) {
        setOutputToken(prev => {
          if (prev.symbol === found.symbol) return prev
          setInputToken(inp => inp.symbol === found.symbol ? (TOKENS.find(t => t.symbol !== found.symbol) ?? TOKENS[1]) : inp)
          return found
        })
      }
      return
    }

    const tokenParam = searchParams.get('token')
    if (!tokenParam) return
    const found = TOKENS.find(t => t.symbol.toUpperCase() === tokenParam.toUpperCase())
    if (!found) return
    setInputToken(prev => {
      if (prev.symbol === found.symbol) return prev
      setOutputToken(out => out.symbol === found.symbol ? (TOKENS.find(t => t.symbol !== found.symbol) ?? TOKENS[0]) : out)
      return found
    })
  }, [searchParams])

  // On-chain quote from GoodSwapRouter (supported pairs: G$, WETH/ETH, USDC)
  const {
    amountOutFormatted: onChainAmountOut,
    amountOut: onChainAmountOutWei,
    isSupported: pairOnChain,
    priceImpactPct: onChainPriceImpact,
  } = useSwapQuote(inputAmount, inputToken.symbol, outputToken.symbol)

  const rawOutputAmount = useMemo(() => {
    if (pairOnChain && onChainAmountOut) return parseFloat(onChainAmountOut)
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    const rate = getLiveRate(prices, inputToken.symbol, outputToken.symbol)
    const gross = amt * rate
    const fee = gross * (SWAP_FEE_BPS / 10000)
    return gross - fee
  }, [inputAmount, inputToken.symbol, outputToken.symbol, prices, pairOnChain, onChainAmountOut])

  const outputAmount = useMemo(() => {
    if (!rawOutputAmount) return ''
    return formatAmount(rawOutputAmount, outputToken.symbol === 'USDC' ? 2 : 6)
  }, [rawOutputAmount, outputToken.symbol])

  const compactOutputAmount = useMemo(() => {
    if (!rawOutputAmount) return ''
    return compactAmount(rawOutputAmount, 6)
  }, [rawOutputAmount])

  // Number of integer digits in the raw output. >10 means we'd render
  // 11+ digits before the decimal point, which overflows the desktop
  // card past the output-token selector even with the existing font-size
  // clamp. AnimatedNumber uses `.toFixed(decimals)` and does not
  // abbreviate, so the only safe path is to swap to the compact form.
  const integerDigits = useMemo(() => {
    if (!rawOutputAmount) return 0
    return String(Math.floor(Math.abs(rawOutputAmount))).length
  }, [rawOutputAmount])

  // True when the parsed input is non-zero but the resulting output
  // would round to 0 at six decimals. Catches the inverse pathology:
  // `0.000000000000001` ETH → 2.9 trillion G$ render that's purely an
  // artifact of `parseFloat → formatUnits` scientific-notation churn.
  const isBelowFloor = useMemo(() => {
    return rawOutputAmount > 0 && rawOutputAmount < FLOOR_THRESHOLD
  }, [rawOutputAmount])

  // Sanity cap on the parsed amount itself. The 16-char cap doesn't stop
  // the trillion-scale pathology (99,999,999,999,999 ETH is only 14 chars)
  // — this does. When tripped we suppress the quote and disable the CTA.
  const isOverCap = useMemo(
    () => !isAmountWithinCap(inputToken.symbol, inputAmount),
    [inputAmount, inputToken.symbol],
  )

  // Task 0031: the amber "unusually large" chip is now driven by *numeric
  // magnitude*, not raw string length. It fires only when the parsed input
  // is close to (but still within) the per-symbol cap — within 1/10 of the
  // cap. A 16-char sub-dust string like `0.0000000000000001` parses to 0
  // and no longer trips this warning. Trillion-scale typos still trip the
  // separate `isOverCap` chip.
  const inputAtCap = useMemo(() => {
    const parsed = parseFloat(inputAmount)
    if (!Number.isFinite(parsed) || parsed <= 0) return false
    if (isOverCap) return false
    return parsed >= getSwapInputCap(inputToken.symbol) / 10
  }, [inputAmount, inputToken.symbol, isOverCap])
  const overCapNumeric = useMemo(
    () => getSwapInputCap(inputToken.symbol).toLocaleString(),
    [inputToken.symbol],
  )

  const ubiFee = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    const rate = getLiveRate(prices, inputToken.symbol, outputToken.symbol)
    const gross = amt * rate
    const swapFee = gross * (SWAP_FEE_BPS / 10000)
    return swapFee * (UBI_FEE_BPS / 10000)
  }, [inputAmount, inputToken.symbol, outputToken.symbol, prices])

  const priceImpact = useMemo(() => {
    // For on-chain supported pairs, use the real reserve-based impact computed
    // from a tiny reference quote vs. the user's actual quote — that's the only
    // honest answer because the previous synthetic ladder was driven by raw
    // amount, not pool depth, and silently masked sandwich-shaped trades.
    if (pairOnChain) return onChainPriceImpact
    // For unsupported pairs (legacy mock-feed fallback), keep a *capped* and
    // explicitly-conservative estimate so we never under-warn vs. the on-chain
    // path. This only fires off-chain (no reserves to consult).
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return 0
    if (amt < 1) return 0.01
    if (amt < 10) return 0.1 + (amt / 10) * 0.2
    if (amt < 100) return 0.3 + (amt / 100) * 1.5
    return Math.min(0.3 + (amt / 100) * 1.5, 15)
  }, [inputAmount, pairOnChain, onChainPriceImpact])

  const minimumReceived = useMemo(() => {
    if (!rawOutputAmount) return ''
    const min = rawOutputAmount * (1 - slippage / 100)
    return formatAmount(min, outputToken.symbol === 'USDC' ? 2 : 6)
  }, [rawOutputAmount, slippage, outputToken.symbol])

  const exchangeRate = useMemo(() => {
    const rate = getLiveRate(prices, inputToken.symbol, outputToken.symbol)
    if (rate >= 1000) return `1 ${inputToken.symbol} = ${rate.toLocaleString()} ${outputToken.symbol}`
    if (rate >= 1) return `1 ${inputToken.symbol} = ${rate.toFixed(2)} ${outputToken.symbol}`
    return `1 ${inputToken.symbol} = ${rate.toFixed(6)} ${outputToken.symbol}`
  }, [inputToken.symbol, outputToken.symbol, prices])

  const inputUsd = useMemo(() => {
    const amt = parseFloat(inputAmount)
    if (!amt || isNaN(amt)) return ''
    return formatUsdValue(amt * getPrice(prices, inputToken.symbol))
  }, [inputAmount, inputToken.symbol, prices])

  const outputUsd = useMemo(() => {
    if (!rawOutputAmount) return ''
    return formatUsdValue(rawOutputAmount * getPrice(prices, outputToken.symbol))
  }, [rawOutputAmount, outputToken.symbol, prices])

  const inputFontSize = useMemo(() => {
    const len = inputAmount.length
    if (len <= 8) return undefined
    const size = Math.max(16, 30 - (len - 8) * 1.5)
    return `${size}px`
  }, [inputAmount])

  const [inputShake, setInputShake] = useState(0)

  const [flipRotation, setFlipRotation] = useState(0)

  const handleFlip = useCallback(() => {
    setInputToken(outputToken)
    setOutputToken(inputToken)
    setFlipRotation(r => r + 180)
  }, [inputToken, outputToken])

  const handleInputSelect = useCallback((t: Token) => {
    if (t.symbol === outputToken.symbol) setOutputToken(inputToken)
    setInputToken(t)
  }, [inputToken, outputToken])

  const handleOutputSelect = useCallback((t: Token) => {
    if (t.symbol === inputToken.symbol) setInputToken(outputToken)
    setOutputToken(t)
  }, [inputToken, outputToken])

  const hasAmount = !!inputAmount && parseFloat(inputAmount) > 0

  // Defense-in-depth: only allow swap submission when the input is non-zero
  // AND the on-chain quote produces a non-trivial output. Sub-floor outputs
  // (rounded to 0 in the UI, or below FLOOR_THRESHOLD) would either revert
  // on-chain (wasted gas) or accept `amountOutMin = 0`, which disables
  // slippage protection and exposes the user to sandwich attacks. Task 0046
  // adds `pairOnChain` to the gate so unsupported pairs surface a disabled
  // CTA with an explicit reason instead of opening the Review modal.
  const canSubmit = hasAmount && pairOnChain && rawOutputAmount > 0 && !isBelowFloor && !isOverCap

  // Priority order for the disabled-CTA copy: over-cap (clearest), then
  // pair-unsupported (only meaningful with a parsed amount), then dust.
  const disabledReason: 'dust' | 'over-cap' | 'pair-unsupported' = isOverCap
    ? 'over-cap'
    : (hasAmount && !pairOnChain)
      ? 'pair-unsupported'
      : 'dust'

  return (
    <div id="swap-card" className="w-full max-w-[460px]">
      <div className="bg-dark-100 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Swap</h2>
            <div className="flex items-center gap-2">
              <FeeBreakdownBadge />
              {showAdvanced && <SwapSettings />}
            </div>
          </div>

          {/* Advanced Toggle */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none rounded-lg"
              aria-label={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
            >
              <span>Advanced</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Input */}
        <motion.div
          className="mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20"
          animate={inputShake ? { x: [0, 8, -8, 6, -6, 0] } : {}}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          key={inputShake}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You pay</span>
            <SwapWalletActions
              variant="balance"
              inputToken={inputToken}
              onSetAmount={setInputAmount}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              aria-label={`Amount to swap (${inputToken?.symbol ?? 'token'})`}
              value={inputAmount}
              maxLength={MAX_INPUT_LEN}
              onChange={e => {
                const sanitized = sanitizeNumericInput(e.target.value)
                setWasTruncated(sanitized.length > MAX_INPUT_LEN)
                setInputAmount(sanitized.slice(0, MAX_INPUT_LEN))
              }}
              style={inputFontSize ? { fontSize: inputFontSize } : undefined}
              className={`flex-1 bg-transparent font-medium text-white outline-none placeholder:text-gray-500 min-w-0 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:ring-offset-1 focus-visible:ring-offset-dark rounded-lg transition-[font-size] duration-100 ${inputFontSize ? '' : 'text-3xl'}`}
            />
            <TokenSelector
              selected={inputToken}
              onSelect={handleInputSelect}
              exclude={outputToken.symbol}
            />
          </div>
          {inputUsd && (
            <p className="text-xs text-gray-500 mt-1.5" data-testid="input-usd">{inputUsd}</p>
          )}
          {inputAtCap && !isOverCap && (
            <p
              className="text-[11px] text-amber-400 mt-1.5"
              data-testid="input-cap-warning"
              role="status"
            >
              Amount is unusually large. Double-check before swapping.
            </p>
          )}
          {isOverCap && (
            <p
              className="text-[11px] text-amber-400 mt-1.5"
              data-testid="swap-amount-over-cap"
              role="alert"
            >
              Amount exceeds the per-swap cap ({overCapNumeric} {inputToken.symbol}). Reduce to continue.
            </p>
          )}
          {wasTruncated && (
            <p
              className="text-[11px] text-gray-400 mt-1.5"
              data-testid="input-truncation-notice"
              role="status"
            >
              Input truncated to {MAX_INPUT_LEN} characters — extra digits were dropped. For very small amounts, switch to a token with fewer decimals.
            </p>
          )}
        </motion.div>

        {/* Flip */}
        <div className="flex justify-center -my-3 relative z-[60]">
          <button
            onClick={handleFlip}
            aria-label="Swap token direction"
            className="w-10 h-10 rounded-xl bg-dark-100 border border-gray-700/50 flex items-center justify-center hover:border-goodgreen/50 hover:text-goodgreen transition-colors text-gray-400 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
          >
            <ArrowUpDown
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: `rotate(${flipRotation}deg)` }}
            />
          </button>
        </div>

        {/* Output */}
        <div className="mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">You receive</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              title={isOverCap ? '' : (rawOutputAmount ? rawOutputAmount.toString() : '')}
              className="flex-1 text-3xl sm:text-3xl font-medium min-w-0 cursor-default select-text"
              style={{ fontSize: outputAmount.length > 10 ? 'clamp(1.125rem, 5vw, 1.875rem)' : undefined }}
              data-testid="output-amount"
            >
              {/* Mobile — over-cap and below-floor short-circuit before the compact path. */}
              <span className="text-white sm:hidden">
                {isOverCap
                  ? <span className="text-gray-500" data-testid="output-overcap">—</span>
                  : isBelowFloor
                    ? FLOOR_STR
                    : (compactOutputAmount || <span className="text-gray-600">0</span>)}
              </span>
              {/* Desktop — four paths:
                  1. Over-cap         → render em-dash literal (no fantasy quote)
                  2. Sub-dust output  → render the floor literal
                  3. >10 integer digits → drop AnimatedNumber for compact form to avoid `.toFixed(6)` overflow
                  4. Normal range     → animate as before */}
              {isOverCap ? (
                <span className="text-gray-500 hidden sm:inline" data-testid="output-overcap-desktop">—</span>
              ) : isBelowFloor ? (
                <span className="text-white hidden sm:inline" data-testid="output-floor">{FLOOR_STR}</span>
              ) : integerDigits > 10 ? (
                <span className="text-white hidden sm:inline" data-testid="output-compact">{compactOutputAmount}</span>
              ) : rawOutputAmount ? (
                <AnimatedNumber value={rawOutputAmount} decimals={outputToken.symbol === 'USDC' ? 2 : 6} className="text-white hidden sm:inline" />
              ) : (
                <span className="text-gray-600 hidden sm:inline">0</span>
              )}
            </span>
            <TokenSelector
              selected={outputToken}
              onSelect={handleOutputSelect}
              exclude={inputToken.symbol}
            />
          </div>
          {outputUsd && (
            <p className="text-xs text-gray-500 mt-1.5" data-testid="output-usd">{outputUsd}</p>
          )}
        </div>

        {/* Rate */}
        {hasAmount && showAdvanced && (
          <div className="mx-4 mt-3 px-4 py-2 text-xs text-gray-400 flex justify-between items-center gap-2">
            <span className="flex items-center gap-1.5">
              Rate
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[10px] text-goodgreen/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse inline-block" />
                  live
                </span>
              )}
              <PriceSourceBadge source={rateSource} size="sm" />
            </span>
            <span>{exchangeRate}</span>
          </div>
        )}

        {/* Always-on inline badge near rate row, even when Advanced is closed —
            keeps the source attribution visible in the simple-mode default UI. */}
        {hasAmount && !showAdvanced && (
          <div className="mx-4 mt-3 px-4 py-1 flex justify-end">
            <PriceSourceBadge source={rateSource} size="sm" />
          </div>
        )}

        {!isLive && (
          <div className="mx-4 mt-2">
            <StalePriceBanner variant="swap" />
          </div>
        )}

        {/* UBI - Always show to emphasize mission, except when we're refusing
            to quote (over-cap) — otherwise we'd flash a fake 12B G$ UBI line. */}
        <UBIBreakdown
          ubiFeeAmount={ubiFee}
          outputToken={outputToken}
          visible={hasAmount && !isOverCap}
        />

        {/* Advanced Swap Details */}
        {showAdvanced && (
          <>
            <SwapDetails
              priceImpact={priceImpact}
              minimumReceived={minimumReceived}
              outputSymbol={outputToken.symbol}
              networkFee="< $0.01"
              visible={hasAmount}
            />
            <PriceImpactWarning priceImpact={priceImpact} visible={hasAmount} />
            {hasAmount && (
              <SwapRoute
                inputToken={inputToken}
                outputToken={outputToken}
                pairOnChain={pairOnChain}
                rateSource={rateSource}
              />
            )}
          </>
        )}

        {/* Simple mode: Show only critical warnings (high / extreme tiers) */}
        {!showAdvanced && (
          <PriceImpactWarning priceImpact={priceImpact} visible={hasAmount && priceImpact >= 5} />
        )}

        {/* Swap button */}
        <div className="p-4 pt-3">
          <SwapWalletActions
            variant="swap-button"
            inputToken={inputToken}
            outputToken={outputToken}
            inputAmount={inputAmount}
            hasAmount={hasAmount}
            priceImpact={priceImpact}
            outputAmount={outputAmount}
            inputUsd={inputUsd}
            outputUsd={outputUsd}
            exchangeRate={exchangeRate}
            minimumReceived={`${minimumReceived} ${outputToken.symbol}`}
            networkFee="< $0.01"
            ubiFee={ubiFee > 0 ? `${formatAmount(ubiFee)} ${outputToken.symbol}` : ''}
            onChainAmountOutMin={onChainAmountOutWei !== undefined && slippage > 0
              ? onChainAmountOutWei * BigInt(Math.floor((1 - slippage / 100) * 10000)) / BigInt(10000)
              : onChainAmountOutWei}
            pairOnChain={pairOnChain}
            canSubmit={canSubmit}
            disabledReason={disabledReason}
            onInvalidSubmit={() => setInputShake(p => p + 1)}
          />
        </div>
      </div>

    </div>
  )
}
