'use client'

import { useState, useRef, useEffect, useCallback, useMemo, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useAccount } from 'wagmi'
import { TokenIcon } from './TokenIcon'
import { PriceSourceBadge } from './PriceSourceBadge'
import { TOKENS, POPULAR_TOKENS, type Token } from '@/lib/tokens'
import { useAttributedPrices } from '@/lib/useAttributedPrice'
import { useSwapPickerBalances, decorateTokenRows, type DecoratedTokenRow } from '@/lib/useSwapPickerBalances'
import { isSwapSupported } from '@/lib/useOnChainSwap'
import { formatAmount, formatUsdValue } from '@/lib/format'
import { toastInfo } from './ui/toast'

interface TokenSelectorModalProps {
  open: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  selected: Token
  exclude?: string
}

export function TokenSelectorModal({ open, onClose, onSelect, selected, exclude }: TokenSelectorModalProps) {
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const trimmedQuery = query.trim()
  const { address } = useAccount()
  const balances = useSwapPickerBalances(address, TOKENS)
  const symbols = useMemo(() => TOKENS.map(t => t.symbol), [])
  const prices = useAttributedPrices(symbols)

  const decorated = useMemo(
    () => decorateTokenRows(TOKENS, balances, prices, isSwapSupported),
    [balances, prices],
  )

  const filtered = useMemo(() => decorated.filter(({ token }) => {
    if (!trimmedQuery) return true
    const q = trimmedQuery.toLowerCase()
    return token.symbol.toLowerCase().includes(q) || token.name.toLowerCase().includes(q)
  }), [decorated, trimmedQuery])

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlightedIndex(0)
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  const handleSelect = useCallback((token: Token) => {
    onSelect(token)
    onClose()
  }, [onSelect, onClose])

  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex].token)
        break
    }
  }, [filtered, highlightedIndex, handleSelect])

  useEffect(() => {
    if (!listRef.current) return
    const highlighted = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`)
    highlighted?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const handlePasteHint = useCallback(() => {
    toastInfo(
      'Custom tokens coming soon',
      "We're working on it — for now, pick from the supported list above.",
    )
  }, [])

  if (!open) return null

  const popularFiltered = POPULAR_TOKENS.filter(t => t.symbol !== exclude)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Select a token">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-[440px] max-h-[85vh] sm:max-h-[600px] bg-dark-100 border border-gray-700/40 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:fade-in duration-200"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold text-white">Select a token</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-3">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by name or symbol"
            aria-label="Search tokens by name or symbol"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-dark/80 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
          />
        </div>

        {!trimmedQuery && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {popularFiltered.map(token => (
              <button
                key={token.symbol}
                type="button"
                onClick={() => handleSelect(token)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  token.symbol === selected.symbol
                    ? 'border-goodgreen/50 bg-goodgreen/10 text-goodgreen'
                    : 'border-gray-700/40 bg-dark-50/50 text-white hover:border-gray-600 hover:bg-dark-50'
                }`}
              >
                <TokenIcon symbol={token.symbol} size={18} />
                <span className="font-medium">{token.symbol}</span>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-gray-700/20" />

        <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 py-2" role="listbox">
          {filtered.length === 0 ? (
            <EmptyState query={trimmedQuery} onPasteHint={handlePasteHint} />
          ) : (
            filtered.map((row, index) => (
              <TokenRow
                key={row.token.symbol}
                row={row}
                index={index}
                highlighted={index === highlightedIndex}
                isSelected={row.token.symbol === selected.symbol}
                isExcluded={row.token.symbol === exclude}
                onSelect={() => handleSelect(row.token)}
                onMouseEnter={() => setHighlightedIndex(index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface TokenRowProps {
  row: DecoratedTokenRow
  index: number
  highlighted: boolean
  isSelected: boolean
  isExcluded: boolean
  onSelect: () => void
  onMouseEnter: () => void
}

function TokenRow({ row, index, highlighted, isSelected, isExcluded, onSelect, onMouseEnter }: TokenRowProps) {
  const { token, balance, usdValue, isOnChain, source } = row
  const balanceText = balance && balance.formatted > 0 ? formatAmount(balance.formatted) : '—'
  const usdText = usdValue !== undefined ? formatUsdValue(usdValue) : ''

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-index={index}
      data-testid={`token-row-${token.symbol}`}
      data-on-chain={isOnChain ? 'true' : 'false'}
      onClick={() => !isExcluded && onSelect()}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${
        isExcluded
          ? 'opacity-30 cursor-not-allowed'
          : highlighted
            ? 'bg-goodgreen/10'
            : 'hover:bg-dark-50/60'
      }`}
      disabled={isExcluded}
    >
      <TokenIcon symbol={token.symbol} size={36} />
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white text-sm">{token.symbol}</span>
          {isOnChain && (
            <span
              data-testid="token-row-onchain-pill"
              className="px-1.5 py-0.5 rounded-full bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-[10px] leading-none"
              title="GoodSwap pool available"
            >
              On chain
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 truncate">{token.name}</div>
      </div>

      <div className="flex flex-col items-end justify-center min-w-[80px] tabular-nums">
        <span
          data-testid="token-row-balance"
          className={`text-sm ${balanceText === '—' ? 'text-gray-500' : 'text-white'}`}
        >
          {balanceText}
        </span>
        <span data-testid="token-row-usd" className="text-[11px] text-gray-500">
          {usdText || '\u00a0'}
        </span>
      </div>

      <div className="ml-2 min-w-[110px] flex justify-end">
        <PriceSourceBadge source={source} size="sm" />
      </div>

      {isSelected && (
        <svg className="w-5 h-5 text-goodgreen shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

interface EmptyStateProps {
  query: string
  onPasteHint: () => void
}

function EmptyState({ query, onPasteHint }: EmptyStateProps) {
  return (
    <div className="px-5 py-8 text-center text-sm">
      <p className="text-gray-400">
        No tokens match <span className="text-white">&ldquo;{query}&rdquo;</span>
      </p>
      <p className="mt-3 text-xs text-gray-500">
        Tip: Paste a contract address to add a custom token.
      </p>
      <button
        type="button"
        onClick={onPasteHint}
        aria-label="Paste contract address from clipboard"
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-50 hover:bg-dark-50/80 border border-gray-700/40 text-xs text-white transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Paste from clipboard
      </button>
    </div>
  )
}

export default TokenSelectorModal
