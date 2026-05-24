'use client'

import { useState, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchX, Clock } from 'lucide-react'

import { filterAndSortMarkets, formatVolume, ALL_CATEGORIES, getMarketStatus, getDaysLeftLabel, generateProbabilityHistory, selectFeaturedMarket, hasMeaningfulPrice, isDevnetSeedMarket, type MarketCategory, type SortOption, type PredictionMarket } from '@/lib/predictData'
import { useMarketCount, useAllOnChainMarkets, type OnChainMarket } from '@/lib/useMarkets'
import { useTwentyFourHourVolume } from '@/lib/useTwentyFourHourVolume'
import { pickArrowDirection, type ArrowDirection } from '@/lib/predictVolume'
import { InfoBanner } from '@/components/InfoBanner'
import { ScrollStrip } from '@/components/ScrollStrip'
import { PredictDiscoverySidebar } from '@/components/predict/PredictDiscoverySidebar'
import PredictLoading from './loading'

function ProbabilityBar({ yesPrice }: { yesPrice: number }) {
  const yesPct = Math.round(yesPrice * 100)
  const noPct = 100 - yesPct
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-dark-50">
      <div className="bg-green-500 transition-all" style={{ width: `${yesPct}%` }} />
      <div className="bg-red-500/60 transition-all" style={{ width: `${noPct}%` }} />
    </div>
  )
}

const CATEGORY_ICONS: Record<MarketCategory, { bg: string; color: string; path: string }> = {
  Crypto: {
    bg: 'bg-amber-500/10',
    color: 'text-amber-400',
    path: 'M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z',
  },
  Politics: {
    bg: 'bg-blue-500/10',
    color: 'text-blue-400',
    path: 'M12 2L3 7v2h18V7l-9-5zM5 11v6h2v-6H5zm4 0v6h2v-6H9zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2zM3 19v2h18v-2H3z',
  },
  Sports: {
    bg: 'bg-orange-500/10',
    color: 'text-orange-400',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 2.07c2.59.44 4.74 2.16 5.74 4.52L13 10.12V4.07zM11 4.07v6.05L5.26 8.59C6.26 6.23 8.41 4.51 11 4.07zM4 12c0-.64.08-1.26.23-1.86L10 12l-5.77 1.86C4.08 13.26 4 12.64 4 12zm7 7.93c-2.59-.44-4.74-2.16-5.74-4.52L11 13.88v6.05zm2 0v-6.05l5.74 1.53c-1 2.36-3.15 4.08-5.74 4.52zM13.77 12L20 10.14c.15.6.23 1.22.23 1.86 0 .64-.08 1.26-.23 1.86L13.77 12z',
  },
  'AI & Tech': {
    bg: 'bg-purple-500/10',
    color: 'text-purple-400',
    path: 'M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
  },
  'World Events': {
    bg: 'bg-cyan-500/10',
    color: 'text-cyan-400',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
  Culture: {
    bg: 'bg-pink-500/10',
    color: 'text-pink-400',
    path: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  },
}

function ProbSparkline({ data, width = 72, height = 24 }: { data: number[] | null; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const w = width
  const h = height
  const pad = 1
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 0.01
  const isUp = data[data.length - 1] >= data[0]

  const coords = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }))

  const linePoints = coords.map(c => `${c.x},${c.y}`).join(' ')
  const areaPoints = `${coords[0].x},${h} ${linePoints} ${coords[coords.length - 1].x},${h}`
  const color = isUp ? '#4ade80' : '#f87171'

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block" aria-hidden="true">
      <polygon points={areaPoints} fill={color} opacity={0.1} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MarketIcon({ category }: { category: MarketCategory }) {
  const icon = CATEGORY_ICONS[category]
  return (
    <div className={`w-9 h-9 shrink-0 rounded-xl ${icon.bg} flex items-center justify-center`}>
      <svg className={`w-[18px] h-[18px] ${icon.color}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={icon.path} />
      </svg>
    </div>
  )
}

/**
 * Up/down/flat indicator next to the 24h volume figure. We deliberately keep
 * this purely presentational and stateless — the *decision* of which arrow to
 * show lives in `pickArrowDirection` (task 0049) so the rule is unit-tested
 * without React.
 */
function MomentumArrow({ direction }: { direction: ArrowDirection }) {
  if (direction === 'neutral') return null
  const isUp = direction === 'up'
  const color = isUp ? 'text-green-400' : 'text-red-400'
  const label = isUp ? 'Volume rising vs. previous 24h' : 'Volume falling vs. previous 24h'
  return (
    <svg
      className={`w-3 h-3 ${color}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      {isUp ? (
        <>
          <path d="M5 12l7-7 7 7" />
          <path d="M12 19V5" />
        </>
      ) : (
        <>
          <path d="M5 12l7 7 7-7" />
          <path d="M12 5v14" />
        </>
      )}
    </svg>
  )
}

function MarketCard({ market }: { market: PredictionMarket }) {
  const router = useRouter()
  const [isTrading, setIsTrading] = useState(false)
  const yesPct = Math.round(market.yesPrice * 100)
  const noPct = 100 - yesPct
  const status = getMarketStatus(market.endDate)
  const isExpired = status === 'expired'
  const timeLabel = getDaysLeftLabel(market.endDate)

  // 24h volume + momentum (task 0049). The forwarding chain is:
  //   useTwentyFourHourVolume -> onChainToMarket -> PredictionMarket
  // both fields are in human-readable G$ (1e18 wei -> 1 G$) at this point,
  // so we can treat them as plain numbers.
  const has24h = typeof market.volume24h === 'number'
  const arrowDir = has24h
    ? pickArrowDirection(
        BigInt(Math.round(market.volume24h ?? 0)),
        market.volume24hPrev === null || market.volume24hPrev === undefined
          ? null
          : BigInt(Math.round(market.volume24hPrev)),
      )
    : 'neutral'

  const timeLabelClass = status === 'expired'
    ? 'text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded'
    : status === 'ending-today'
    ? 'text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded'
    : 'text-gray-500'

  const handleCardClick = () => {
    router.push(`/predict/${market.id}`)
  }

  const handleTradeClick = (side: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTrading) return
    setIsTrading(true)
    router.push(`/predict/${market.id}?side=${side}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-dark-100 rounded-2xl border border-gray-700/20 p-5 hover:border-goodgreen/30 hover:-translate-y-[1px] transition-all group cursor-pointer ${isExpired ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-goodgreen/10 text-goodgreen border border-goodgreen/15">
            {market.category}
          </span>
          {!isExpired && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              Live
            </span>
          )}
        </div>
        <span className={`text-xs font-medium ${timeLabelClass}`}>{timeLabel}</span>
      </div>

      <div className="flex items-start gap-3 mb-1.5 min-h-[2.75rem]">
        <MarketIcon category={market.category} />
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-goodgreen/90 transition-colors line-clamp-2">
          {market.question}
        </h3>
      </div>

      <div className="mb-3 pl-12">
        {has24h ? (
          <div className="flex flex-col gap-0.5 leading-tight">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white/90">
              {formatVolume(market.volume24h ?? 0)} 24h
              <MomentumArrow direction={arrowDir} />
            </span>
            <span className="text-[10px] text-gray-500">{formatVolume(market.volume)} all-time</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-white/80">{formatVolume(market.volume)} Vol.</span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-green-400">{yesPct}%</span>
            <span className="text-xs text-gray-500">chance</span>
          </div>
          {!isExpired && (
            <ProbSparkline
              data={generateProbabilityHistory(
                market.id,
                market.yesPrice,
                30,
                hasMeaningfulPrice(market),
              )}
            />
          )}
        </div>
        <ProbabilityBar yesPrice={market.yesPrice} />
      </div>

      {!isExpired && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={(e) => handleTradeClick('yes', e)}
            disabled={isTrading}
            aria-label={`Buy YES at ${yesPct}¢`}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-green-400/40 focus-visible:outline-none"
          >
            {isTrading ? <span className="inline-block w-3 h-3 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" /> : `Yes ${yesPct}¢`}
          </button>
          <button
            onClick={(e) => handleTradeClick('no', e)}
            disabled={isTrading}
            aria-label={`Buy NO at ${noPct}¢`}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:outline-none"
          >
            {isTrading ? <span className="inline-block w-3 h-3 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" /> : `No ${noPct}¢`}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/15">
        <span>{formatVolume(market.liquidity)} liquidity</span>
        <span>{market.totalShares.toLocaleString(undefined, { maximumFractionDigits: 0 })} shares</span>
      </div>
    </div>
  )
}

function FeaturedMarket({ market }: { market: PredictionMarket | null }) {
  const router = useRouter()
  const [isTrading, setIsTrading] = useState(false)

  if (!market) return null

  const yesPct = Math.round(market.yesPrice * 100)
  const noPct = 100 - yesPct
  const timeLabel = getDaysLeftLabel(market.endDate)
  // Task 0074: when the featured market has no real trading activity yet,
  // suppress the synthetic sparkline and "Live"/"Trending" badges so we
  // don't lie to users about a wiggly history that never happened.
  const isLive = hasMeaningfulPrice(market)
  const sparkData = generateProbabilityHistory(market.id, market.yesPrice, 60, isLive)

  const handleClick = () => router.push(`/predict/${market.id}`)
  const handleTrade = (side: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTrading) return
    setIsTrading(true)
    router.push(`/predict/${market.id}?side=${side}`)
  }

  return (
    <div
      onClick={handleClick}
      data-testid="predict-featured-market"
      className="mb-6 bg-dark-100 rounded-2xl border border-goodgreen/20 p-5 sm:p-6 hover:border-goodgreen/40 transition-all group cursor-pointer relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse at top right, #00B0A0 0%, transparent 60%)' }}
      />

      <div className="flex items-center gap-2 mb-3">
        {isLive ? (
          <>
            <svg className="w-3.5 h-3.5 text-goodgreen" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z" />
            </svg>
            <span className="text-xs font-semibold text-goodgreen uppercase tracking-wider">Trending</span>
          </>
        ) : (
          <span className="text-xs font-semibold text-goodgreen uppercase tracking-wider">Featured</span>
        )}
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-goodgreen/10 text-goodgreen border border-goodgreen/15 ml-1">
          {market.category}
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/15 ml-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            Live
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 ml-1">
            No trades yet
          </span>
        )}
        <span className="text-xs text-gray-500 ml-auto">{timeLabel}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <MarketIcon category={market.category} />
            <h2 className="text-lg font-bold text-white leading-snug group-hover:text-goodgreen/90 transition-colors">
              {market.question}
            </h2>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-green-400">{yesPct}%</span>
            <span className="text-sm text-gray-500">chance</span>
            <span className="text-sm font-bold text-white/80 ml-auto">{formatVolume(market.volume)} Vol.</span>
          </div>

          <ProbabilityBar yesPrice={market.yesPrice} />

          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => handleTrade('yes', e)}
              disabled={isTrading}
              aria-label={`Buy YES at ${yesPct}¢`}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-green-400/40 focus-visible:outline-none"
            >
              {isTrading ? <span className="inline-block w-3 h-3 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" /> : `Yes ${yesPct}¢`}
            </button>
            <button
              onClick={(e) => handleTrade('no', e)}
              disabled={isTrading}
              aria-label={`Buy NO at ${noPct}¢`}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:outline-none"
            >
              {isTrading ? <span className="inline-block w-3 h-3 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" /> : `No ${noPct}¢`}
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
            <span>{formatVolume(market.liquidity)} liquidity</span>
            <span>{market.totalShares.toLocaleString(undefined, { maximumFractionDigits: 0 })} shares</span>
          </div>
        </div>

        <div className="hidden sm:flex sm:w-52 items-center justify-center">
          {sparkData ? (
            <ProbSparkline data={sparkData} width={200} height={64} />
          ) : (
            <div className="text-[11px] text-gray-500 italic px-3 text-center leading-snug">
              Chart will appear after the first trades.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'volume-24h', label: '24h Volume' },
  { value: 'ending', label: 'Ending Soon' },
]

// Rendered when the only thing in the filtered set is the featured hero
// (which gets deduped out of the grid). Without this, the page would render
// a blank dead zone below the filter row — see task 0072.
function OnlyFeaturedNotice({
  isFiltered,
  onClear,
}: {
  isFiltered: boolean
  onClear: () => void
}) {
  return (
    <div
      data-testid="predict-only-featured-notice"
      role="status"
      className="bg-dark-100 rounded-2xl border border-gray-700/20 py-10 px-6 text-center"
    >
      {isFiltered ? (
        <>
          <p className="text-gray-300 text-sm mb-1 font-medium">
            Only the featured market matches your filter
          </p>
          <p className="text-gray-500 text-xs mb-4">
            The hero above is the single match. Clear your filter to see every market.
          </p>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-goodgreen bg-goodgreen/10 border border-goodgreen/20 hover:bg-goodgreen/10 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/40 focus-visible:outline-none"
          >
            Clear filter
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-300 text-sm mb-1 font-medium">
            You&rsquo;re looking at the only active market right now
          </p>
          <p className="text-gray-500 text-xs">
            Check back soon — new markets open frequently.
          </p>
        </>
      )}
    </div>
  )
}

// Renders when the active grid is empty but the expired archive has markets.
// Two variants:
//  - `only-expired`     → no featured hero, no active markets, archive has rows.
//  - `filter-no-active` → user is filtering and only expired matches remain.
// Without this, the page would render ~500px of dark space between the
// filter row and the "Show expired (N)" toggle (task 0061).
function EmptyMarketsNotice({
  variant,
  expiredCount,
  onShowExpired,
  onClear,
}: {
  variant: 'only-expired' | 'filter-no-active'
  expiredCount: number
  onShowExpired: () => void
  onClear: () => void
}) {
  const isFilter = variant === 'filter-no-active'
  return (
    <div
      data-testid="predict-empty-markets-notice"
      role="status"
      className="bg-dark-100 rounded-2xl border border-gray-700/20 py-10 px-6 text-center max-w-md mx-auto"
    >
      <div className="flex justify-center mb-3">
        <Clock
          className="text-gray-600"
          size={32}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      {isFilter ? (
        <>
          <p className="text-gray-300 text-sm mb-1 font-medium">
            No active markets match your filter
          </p>
          <p className="text-gray-500 text-xs mb-4">
            {expiredCount} resolved {expiredCount === 1 ? 'market matches' : 'markets match'}: open the archive below or clear your filters.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onShowExpired}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-goodgreen bg-goodgreen/10 border border-goodgreen/20 hover:bg-goodgreen/20 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/40 focus-visible:outline-none"
            >
              Browse archive →
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-dark-50 border border-gray-700/30 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/40 focus-visible:outline-none"
            >
              Clear filters
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-300 text-sm mb-1 font-medium">
            All current markets have resolved
          </p>
          <p className="text-gray-500 text-xs mb-4">
            Past predictions are archived below. New markets are added by the oracle as upcoming events get scheduled.
          </p>
          <button
            type="button"
            onClick={onShowExpired}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-goodgreen bg-goodgreen/10 border border-goodgreen/20 hover:bg-goodgreen/20 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/40 focus-visible:outline-none"
          >
            Browse archive →
          </button>
        </>
      )}
    </div>
  )
}

function inferCategory(question: string): MarketCategory {
  const q = question.toLowerCase()
  if (q.includes('bitcoin') || q.includes('ethereum') || q.includes('crypto') || q.includes('gooddollar') || q.includes('etoro') || q.includes('etor')) return 'Crypto'
  if (q.includes('election') || q.includes('fed ') || q.includes('regulation') || q.includes('legislation') || q.includes('congress') || q.includes('stablecoin')) return 'Politics'
  if (q.includes('champion') || q.includes('nba') || q.includes('fifa') || q.includes('world cup') || q.includes('olympic')) return 'Sports'
  if (q.includes('ai ') || q.includes('agi') || q.includes('gpt') || q.includes('openai') || q.includes('nvidia') || q.includes('apple') || q.includes('agent')) return 'AI & Tech'
  if (q.includes('spacex') || q.includes('mars') || q.includes('climate') || q.includes('pandemic') || q.includes('who ')) return 'World Events'
  return 'Culture'
}

function onChainToMarket(m: OnChainMarket): PredictionMarket {
  const endDate = new Date(m.endTimeMs).toISOString().slice(0, 10)
  const totalTokens = Number(m.totalYES + m.totalNO)
  // 24h volume comes back as raw wei (bigint) from `useTwentyFourHourVolume`,
  // but `PredictionMarket.volume24h` is a plain number in G$ units to keep
  // the UI helpers (formatVolume, sort comparators) uniform with the existing
  // all-time `volume` field. `null` is preserved for "we tried and got
  // nothing"; `undefined` for "haven't loaded yet". Both render as no-arrow.
  const volume24h = m.volume24h === undefined ? undefined : Number(m.volume24h) / 1e18
  const volume24hPrev =
    m.volume24hPrev === undefined
      ? undefined
      : m.volume24hPrev === null
      ? null
      : Number(m.volume24hPrev) / 1e18
  return {
    id: m.id.toString(),
    question: m.question,
    category: inferCategory(m.question),
    yesPrice: m.yesPrice,
    volume: totalTokens / 1e18,
    liquidity: Number(m.collateral) / 1e18,
    endDate,
    resolved: m.isResolved,
    outcome: m.status === 2 ? 'yes' : m.status === 3 ? 'no' : undefined,
    resolutionSource: 'On-chain oracle resolution',
    createdAt: endDate,
    totalShares: totalTokens / 1e18,
    volume24h,
    volume24hPrev,
  }
}

// Mirrors the Explore listing fix (task 0057): seed the four filter
// states from URL params on mount so deep links like
// `/predict?q=ETH&category=Crypto` reflect the URL on first render
// rather than silently dropping the params. We only read params here;
// we do NOT push state changes back to the URL.
const VALID_SORTS: readonly SortOption[] = [
  'trending', 'newest', 'volume', 'volume-24h', 'ending',
]

function PredictPageContent() {
  const { count } = useMarketCount()
  const { markets: onChainMarkets } = useAllOnChainMarkets(count)
  // 24h volume is a *secondary* signal — the page must keep working if this
  // hook errors or RPC is slow, so we don't gate any render on its loading
  // state. We just merge whatever it has into the OnChainMarket records
  // before they get adapted, and pickArrowDirection / the card both treat
  // undefined/null as "no arrow".
  const { volumes: volumesByMarketId } = useTwentyFourHourVolume()
  const searchParams = useSearchParams()

  const initialQuery = () => (searchParams?.get('q') ?? '').trim()

  const initialCategory = (): MarketCategory | 'All' => {
    const raw = searchParams?.get('category') ?? 'All'
    if (raw === 'All') return 'All'
    return (ALL_CATEGORIES as readonly string[]).includes(raw)
      ? (raw as MarketCategory)
      : 'All'
  }

  const initialSort = (): SortOption => {
    const raw = searchParams?.get('sort') ?? 'trending'
    return (VALID_SORTS as readonly string[]).includes(raw)
      ? (raw as SortOption)
      : 'trending'
  }

  const initialShowExpired = () => {
    const raw = (searchParams?.get('expired') ?? '').toLowerCase()
    if (raw === '1' || raw === 'true') return true
    // task 0015: the "RECENTLY RESOLVED" sidebar widget links to
    // `/predict?view=archive&category=…` to land users on the archive
    // instead of the empty active-filter view. Honour `view=archive`
    // by expanding the archive accordion on mount.
    if ((searchParams?.get('view') ?? '').toLowerCase() === 'archive') return true
    return false
  }

  const [category, setCategory] = useState<MarketCategory | 'All'>(initialCategory)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [query, setQuery] = useState<string>(initialQuery)
  const [showExpired, setShowExpired] = useState<boolean>(initialShowExpired)

  // Used by EmptyMarketsNotice's "Browse archive →" action to scroll the
  // expired-markets section into view after `setShowExpired(true)` (task 0061).
  const expiredSectionRef = useRef<HTMLDivElement>(null)

  const allMarkets = useMemo(() => {
    return onChainMarkets.map(m => {
      const v = volumesByMarketId.get(m.id.toString())
      const enriched: OnChainMarket = v
        ? { ...m, volume24h: v.volume24h, volume24hPrev: v.volume24hPrev }
        : m
      return onChainToMarket(enriched)
    })
  }, [onChainMarkets, volumesByMarketId])

  // Task 0051: hide devnet keeper seed markets (e.g. "Devnet proof market
  // 2026-05-18T..." / bare ISO timestamps) from every consumer on this page
  // — grid, featured hero, and discovery sidebar — so the public testnet
  // surface only shows market questions a real user would recognize. The
  // underlying contracts and indexing are untouched.
  const visibleMarkets = useMemo(
    () => allMarkets.filter(m => !isDevnetSeedMarket(m)),
    [allMarkets],
  )

  const filtered = useMemo(
    () => filterAndSortMarkets(visibleMarkets, category, sort, query),
    [visibleMarkets, category, sort, query],
  )

  const activeMarkets = useMemo(
    () => filtered.filter(m => getMarketStatus(m.endDate) !== 'expired'),
    [filtered],
  )
  const expiredMarkets = useMemo(
    () => filtered.filter(m => getMarketStatus(m.endDate) === 'expired'),
    [filtered],
  )

  // Featured selection is filter-aware (task 0007d-0032): when the user
  // narrows by category or query, the hero only renders if there's a
  // matching market. Without this guard the hero used to show a Crypto
  // market under a "TRENDING" badge while the empty state below said
  // "No markets in World Events yet" — two contradictory things on one
  // page. Devnet seed markets stay excluded via `visibleMarkets` (task
  // 0051), and the grid below dedupes by id (task 0044).
  const featuredPool = useMemo(
    () => (category === 'All' && query.trim() === '' ? visibleMarkets : filtered),
    [category, query, visibleMarkets, filtered],
  )
  const featured = useMemo(() => selectFeaturedMarket(featuredPool), [featuredPool])
  const featuredId = featured?.id
  const activeMarketsWithoutFeatured = useMemo(
    () => activeMarkets.filter(m => m.id !== featuredId),
    [activeMarkets, featuredId],
  )

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Prediction Markets</h1>
          <p className="text-sm text-gray-400">Bet on real-world events. Every trade funds UBI.</p>
        </div>
      </div>

      <InfoBanner
        title="How Prediction Markets Work"
        description="Buy YES or NO shares on any event. If you're right, each share pays $1. If wrong, you lose your stake. Share prices (5¢–95¢) reflect the crowd's probability estimate."
        storageKey="gd-banner-dismissed-predict"
      />

      <FeaturedMarket market={featured} />

      {/*
        Polymarket-parity two-column layout (task 0048).
        Below `lg` we collapse to a single column so the markets grid keeps
        the full width on mobile/tablet. At `lg+` we reserve a fixed 320px
        right rail for the discovery sidebar (Breaking news + Hot topics).
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search markets..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
        />
        <ScrollStrip className="flex gap-1" ariaLabel="Sort markets">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setSort(o.value)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${sort === o.value ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 bg-dark-100 border border-gray-700/30 hover:text-white'}`}
            >
              {o.label}
            </button>
          ))}
        </ScrollStrip>
      </div>

      <ScrollStrip
        wrapperClassName="mb-6"
        className="flex gap-2 pb-1"
        ariaLabel="Filter markets by category"
      >
        <button
          onClick={() => setCategory('All')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === 'All' ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-100 border border-gray-700/20'}`}
        >
          All
        </button>
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-100 border border-gray-700/20'}`}
          >
            {cat}
          </button>
        ))}
      </ScrollStrip>

      {filtered.length === 0 ? (
        <div className="bg-dark-100 rounded-2xl border border-gray-700/20 py-12 px-4">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <SearchX
              className="text-gray-600 mb-3"
              size={36}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="text-sm text-gray-200 font-medium mb-1">
              No markets found
            </p>
            {(query.trim().length > 0 || category !== 'All') && (
              <p className="text-xs text-gray-400 mb-1">
                {query.trim().length > 0 ? (
                  <>
                    Nothing matches{' '}
                    <span className="text-white font-medium break-all">
                      &ldquo;{query}&rdquo;
                    </span>
                    {category !== 'All' && (
                      <>
                        {' '}in{' '}
                        <span className="text-white font-medium">{category}</span>
                      </>
                    )}
                    .
                  </>
                ) : (
                  <>
                    No markets in{' '}
                    <span className="text-white font-medium">{category}</span>{' '}
                    yet.
                  </>
                )}
              </p>
            )}
            <p className="text-xs text-gray-500 mb-4">
              Try adjusting your search or filters
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {query.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-goodgreen/15 text-goodgreen border border-goodgreen/20 hover:bg-goodgreen/25 transition-colors"
                >
                  Clear search
                </button>
              )}
              {category !== 'All' && (
                <button
                  type="button"
                  onClick={() => setCategory('All')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-dark-50 border border-gray-700/30 transition-colors"
                >
                  Show all categories
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {activeMarketsWithoutFeatured.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-3 font-medium">
                {activeMarketsWithoutFeatured.length}{featured ? ' More' : ''} Active {activeMarketsWithoutFeatured.length === 1 ? 'Market' : 'Markets'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMarketsWithoutFeatured.map(market => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            </div>
          )}

          {/* Dead-zone guard (task 0072): when filtered is non-empty but the
              only thing in it is the featured hero (deduped out of the grid)
              and there are no expired markets either, the page used to render
              blank space below the filters. Show a helpful notice instead. */}
          {activeMarketsWithoutFeatured.length === 0 &&
            expiredMarkets.length === 0 &&
            featured && (
              <OnlyFeaturedNotice
                isFiltered={query.trim() !== '' || category !== 'All'}
                onClear={() => {
                  setQuery('')
                  setCategory('All')
                }}
              />
            )}

          {/* Dead-zone guard (task 0061): when no active markets are renderable
              (with or without a featured hero) but the expired archive has
              rows, surface a contextual notice that points the user at the
              archive or at clearing their filters, instead of leaving a blank
              region between the filter row and the "Show expired (N)" toggle. */}
          {activeMarketsWithoutFeatured.length === 0 &&
            !featured &&
            expiredMarkets.length > 0 && (
              <EmptyMarketsNotice
                variant={
                  query.trim() !== '' || category !== 'All'
                    ? 'filter-no-active'
                    : 'only-expired'
                }
                expiredCount={expiredMarkets.length}
                onShowExpired={() => {
                  setShowExpired(true)
                  // Wait one frame so the archive grid is mounted before
                  // we ask the browser to scroll to it.
                  requestAnimationFrame(() => {
                    expiredSectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  })
                }}
                onClear={() => {
                  setQuery('')
                  setCategory('All')
                }}
              />
            )}

          {expiredMarkets.length > 0 && (
            <div ref={expiredSectionRef} className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-700/40" />
                <button
                  onClick={() => setShowExpired(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 bg-dark-100 border border-gray-700/20 hover:border-gray-600/30 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/40 focus-visible:outline-none"
                  aria-expanded={showExpired}
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showExpired ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showExpired ? 'Hide expired' : `Show expired (${expiredMarkets.length})`}
                </button>
                <div className="flex-1 h-px bg-gray-700/40" />
              </div>
              {showExpired && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
                  {expiredMarkets.map(market => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
        </div>

        {/*
          Right rail — Polymarket-parity discovery sidebar (task 0048).
          Hidden below `lg` via the parent grid's column collapse. The
          sidebar reads from `visibleMarkets` (the full set minus devnet
          seed markets — task 0051) so it stays useful as a discovery aid
          even while the user is filtering the main grid.
        */}
        <div className="hidden lg:block">
          <PredictDiscoverySidebar
            markets={visibleMarkets}
            onCategorySelect={setCategory}
          />
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center mt-6">
        Markets are illustrative. Resolution via oracle coming soon.
      </p>
    </div>
  )
}

export default function PredictClient() {
  return (
    <Suspense fallback={<PredictLoading />}>
      <PredictPageContent />
    </Suspense>
  )
}
