'use client'

/**
 * PairSelector — horizontal scrolling strip of perp-market pills across
 * the top of `/perps`. Each pill shows the symbol, mark price, and 24h
 * change percentage.
 *
 * 24h change rendering follows the same honesty contract as the
 * neighbouring PairInfoBar: a `change24h === 0` value is the documented
 * "missing" sentinel emitted by `FALLBACK_PAIRS` / `useOnChainPerps`,
 * so we render a muted em-dash instead of letting `PercentageChange`
 * paint a confident `0.0%`. Both surfaces share the same gate so a
 * crypto-oracle-offline page reads coherently top-to-bottom.
 */

import { ScrollStrip } from '@/components/ScrollStrip'
import { PercentageChange } from '@/components/ui/percentage-change'
import { formatPerpsPrice, type PerpPair } from '@/lib/perpsData'

const EM_DASH = '—'

interface PairSelectorProps {
  pairs: PerpPair[]
  selected: string
  onSelect: (symbol: string) => void
}

export function PairSelector({ pairs, selected, onSelect }: PairSelectorProps) {
  return (
    <ScrollStrip className="flex gap-1.5 pb-1" ariaLabel="Select perpetual market pair">
      {pairs.map((p) => {
        const isActive = selected === p.symbol
        const hasChange = p.change24h !== 0
        return (
          <button
            key={p.symbol}
            type="button"
            onClick={() => onSelect(p.symbol)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
              isActive
                ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20'
                : 'text-gray-400 hover:text-white bg-dark-50/50 border border-transparent'
            }`}
          >
            <span className="block font-semibold">{p.symbol}</span>
            <span
              className="flex items-center gap-1.5 mt-0.5"
              style={{ fontVariantNumeric: 'tabular-nums' }}
              data-testid={`pair-selector-meta-${p.symbol}`}
            >
              <span className={isActive ? 'text-goodgreen/80' : 'text-gray-500'}>
                {formatPerpsPrice(p.markPrice)}
              </span>
              {hasChange ? (
                <PercentageChange value={p.change24h} decimals={1} showSign size="xs" />
              ) : (
                <span className="text-xs text-gray-500" title="24h change unavailable">
                  {EM_DASH}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </ScrollStrip>
  )
}
