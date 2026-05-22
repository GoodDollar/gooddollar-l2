'use client'

import { useState, useMemo, memo, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchX } from 'lucide-react'
import { TokenIcon } from '@/components/TokenIcon'
import { Sparkline } from '@/components/Sparkline'
import { PercentageChange } from '@/components/ui/percentage-change'
import { formatPrice, formatVolume, formatMarketCap, selectTopGainers, type TokenMarketData } from '@/lib/marketData'
import { TOKEN_CATEGORIES, type TokenCategory, resolveCategory } from '@/lib/tokens'
import { useOnChainMarketData } from '@/lib/useOnChainMarketData'
import { ScrollStrip } from '@/components/ScrollStrip'
import ExploreLoading from './loading'

type SortField = 'price' | 'change1h' | 'change24h' | 'change7d' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-600 ml-1">&#8597;</span>
  return <span className="text-goodgreen ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

interface TokenRowProps {
  token: TokenMarketData
  idx: number
  onRowClick: (symbol: string) => void
  onSwapClick: (symbol: string) => void
}

const TokenRow = memo(function TokenRow({ token, idx, onRowClick, onSwapClick }: TokenRowProps) {
  return (
    <tr
      onClick={() => onRowClick(token.symbol)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(token.symbol) } }}
      tabIndex={0}
      className={`group border-b border-gray-700/10 hover:bg-white/[0.04] hover:-translate-y-[1px] cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-goodgreen/40 ${idx % 2 === 1 ? 'bg-dark-50/15' : ''}`}
    >
      <td className="py-3 px-3 text-gray-500 text-right">{idx + 1}</td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <TokenIcon symbol={token.symbol} size={28} />
          <div>
            <span className="font-semibold text-white">{token.symbol}</span>
            <span className="text-gray-500 ml-1.5 hidden sm:inline text-xs">{token.name}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right text-white font-medium">
        {formatPrice(token.price)}
      </td>
      <td className="py-3 px-2 text-right font-medium hidden lg:table-cell">
        <PercentageChange value={token.change1h} decimals={1} size="xs" />
      </td>
      <td className="py-3 px-3 text-right font-medium">
        <PercentageChange value={token.change24h} decimals={2} size="sm" />
      </td>
      <td className="py-3 px-2 text-right font-medium hidden lg:table-cell">
        <PercentageChange value={token.change7d} decimals={1} size="xs" />
      </td>
      <td className="py-3 px-3 text-right text-gray-300 hidden sm:table-cell">
        {formatVolume(token.volume24h)}
      </td>
      <td className="py-3 px-3 text-right text-gray-300 hidden md:table-cell">
        {token.marketCap > 0 ? (
          formatMarketCap(token.marketCap)
        ) : (
          <span className="text-gray-500" title="Market cap unavailable">—</span>
        )}
      </td>
      <td
        className="py-3 px-2 hidden lg:table-cell"
        aria-label={
          token.change7d === null
            ? '7-day trend: unavailable'
            : `7-day trend: ${token.change7d >= 0 ? 'up' : 'down'} ${Math.abs(token.change7d).toFixed(1)}%`
        }
      >
        <Sparkline
          data={token.sparkline7d}
          positive={(token.change24h ?? 0) >= 0}
        />
      </td>
      <td className="py-3 px-1 text-right w-16 sm:w-20">
        <button
          onClick={(e) => { e.stopPropagation(); onSwapClick(token.symbol) }}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-medium rounded-lg bg-goodgreen/10 text-goodgreen hover:bg-goodgreen/10"
        >
          Swap
        </button>
      </td>
    </tr>
  )
})

function MarketCapSparkline({ value, positive }: { value: number; positive: boolean }) {
  // When value is 0 (or negative), every generated point collapses to 0,
  // which renders as a flat filled rectangle along the bottom of the SVG —
  // visually indistinguishable from a real "trending up" chart and
  // contradicting the "$0" / "—" label rendered next to it. Render
  // nothing in that case; the parent card already shows an em-dash.
  const data = useMemo(() => {
    if (value <= 0) return [] as number[]
    const points: number[] = []
    let v = value * (1 - 0.03 * (positive ? 1 : -1))
    const step = (value - v) / 13
    for (let i = 0; i < 14; i++) {
      const noise = (((i * 7 + 3) % 11) / 11 - 0.5) * value * 0.008
      points.push(v + noise)
      v += step
    }
    points[points.length - 1] = value
    return points
  }, [value, positive])

  if (data.length === 0) return null

  const w = 120
  const h = 40
  const pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const color = positive ? '#4ade80' : '#f87171'

  const coords = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }))

  const linePoints = coords.map(c => `${c.x},${c.y}`).join(' ')
  const areaPoints = `${coords[0].x},${h} ${linePoints} ${coords[coords.length - 1].x},${h}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="hidden sm:inline-block" aria-hidden="true">
      <polygon points={areaPoints} fill={color} opacity={0.12} />
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

/**
 * Hard ceiling on a single token's market cap for inclusion in the
 * headline "Total Market Cap" stat (task 0029).
 *
 * `useOnChainMarketData` is the primary defense — it derives the G$ price
 * from decimal-aware reserves and rejects values outside `[SPOT_MIN,
 * SPOT_MAX]`. This is belt-and-suspenders for any token whose market cap
 * still comes through implausibly large (e.g. a new pool variant, an
 * oracle returning 1e18 scaled wrong, a CoinGecko quirk). The largest
 * real-world crypto market cap in 2026 is ~$2T, so $5T is a safe ceiling
 * that lets the rest of the bar render correctly while clearly omitting
 * a misbehaving token.
 */
const MAX_PLAUSIBLE_MARKET_CAP = 5e12 // USD 5 trillion

function MarketStatsBar({ tokens }: { tokens: TokenMarketData[] }) {

  const stats = useMemo(() => {
    // Exclude implausibly large market caps from the headline sum so a
    // single misbehaving token doesn't print "$1,000,000,000.81T" and
    // overwhelm the whole page. We still keep those tokens in `tokens`
    // (and therefore in the table below) — they'll render their own row
    // with the bad value, which is at least less misleading than a
    // 13-digit "total".
    const tokensInBounds = tokens.filter(t => t.marketCap <= MAX_PLAUSIBLE_MARKET_CAP)
    const totalMarketCap = tokensInBounds.reduce((s, t) => s + t.marketCap, 0)
    const excludedCount = tokens.length - tokensInBounds.length
    // No token reports a positive market cap → treat the index as
    // "unavailable" rather than rendering "$0" with a misleading
    // sparkline. Mirrors how `change24h === null` flows through the same
    // card via `weightedChange === null`.
    const hasAnyMarketCap = tokensInBounds.some(t => t.marketCap > 0)
    // Weight only tokens with known change24h (and in-bound market caps) so
    // missing data doesn't drag the index toward zero. If no token reports
    // change24h, weightedChange is null.
    const tokensWithChange = tokensInBounds.filter(t => t.change24h !== null)
    const weightedMarketCap = tokensWithChange.reduce((s, t) => s + t.marketCap, 0)
    const weightedChange = weightedMarketCap > 0
      ? tokensWithChange.reduce((s, t) => s + (t.change24h ?? 0) * t.marketCap, 0) / weightedMarketCap
      : null
    const trending = [...tokens]
      .filter(t => t.volume24h !== null && t.volume24h > 0)
      .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
      .slice(0, 3)
    // Use the shared selector so "Top Gainers" only includes tokens whose
    // 24h change actually renders as a non-zero percent (task 0052). The
    // old inline `change24h > 0` filter let DAI through at +0.02%, which
    // displayed as a contradictory "▲0.0% gainer".
    const gainers = selectTopGainers(tokens, 3)
    return {
      totalMarketCap,
      hasAnyMarketCap,
      weightedChange,
      trending,
      gainers,
      excludedCount,
    }
  }, [tokens])

  const cards = [
    {
      title: "Total Market Cap",
      content: (
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1.5 font-medium flex items-center gap-1.5">
              Total Market Cap
              {stats.excludedCount > 0 && (
                <span
                  className="text-[10px] font-medium text-amber-400/80 uppercase tracking-wide"
                  title={`${stats.excludedCount} token${stats.excludedCount === 1 ? '' : 's'} excluded because reported market cap was implausibly large.`}
                >
                  (partial)
                </span>
              )}
            </div>
            {stats.hasAnyMarketCap ? (
              <div className="text-xl font-bold text-white mb-0.5">{formatMarketCap(stats.totalMarketCap)}</div>
            ) : (
              <div
                className="text-xl font-bold text-gray-500 mb-0.5"
                title="Market cap data unavailable"
              >
                —
              </div>
            )}
            {stats.weightedChange === null ? (
              <span
                className="text-xs font-medium text-gray-500"
                title="24h change data unavailable"
              >
                — (24h)
              </span>
            ) : (
              <span className={`text-xs font-medium ${stats.weightedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.weightedChange >= 0 ? '▲' : '▼'} {Math.abs(stats.weightedChange).toFixed(2)}% (24h)
              </span>
            )}
          </div>
          {stats.hasAnyMarketCap && (
            <MarketCapSparkline
              value={stats.totalMarketCap}
              positive={(stats.weightedChange ?? 0) >= 0}
            />
          )}
        </div>
      )
    },
    {
      title: "Trending",
      content: (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-medium">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z"/></svg>
            Trending
          </div>
          <div className="space-y-1.5">
            {stats.trending.map((t, i) => (
              <div key={t.symbol} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600 w-3">{i + 1}</span>
                  <TokenIcon symbol={t.symbol} size={16} />
                  <span className="text-white font-medium">{t.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{formatPrice(t.price)}</span>
                  {t.change24h === null ? (
                    <span className="text-gray-500" title="24h change unavailable">—</span>
                  ) : (
                    <span className={t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {t.change24h >= 0 ? '▲' : '▼'}{Math.abs(t.change24h).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
            {stats.trending.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-2 text-center">
                No trending data yet
              </div>
            ) : (
              // When fewer than 3 tokens have real volume, render a single
              // clear empty-state line instead of numbered blank rows
              // (task 0052). The previous padded-row treatment looked like
              // the card had half-loaded and broken.
              stats.trending.length < 3 && (
                <div className="text-[11px] text-gray-500 italic pt-1 pl-5">
                  No more trending data in 24h
                </div>
              )
            )}
          </div>
        </div>
      )
    },
    {
      title: "Top Gainers",
      content: (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-medium">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Top Gainers
          </div>
          <div className="space-y-1.5">
            {stats.gainers.map((t, i) => (
              <div key={t.symbol} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600 w-3">{i + 1}</span>
                  <TokenIcon symbol={t.symbol} size={16} />
                  <span className="text-white font-medium">{t.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{formatPrice(t.price)}</span>
                  <span className="text-green-400">
                    ▲{(t.change24h ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            {stats.gainers.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-2 text-center">
                No gainers today
              </div>
            ) : (
              // Single empty-state line when fewer than 3 tokens cleared the
              // visible-gainer floor (task 0052). Replaces the misleading
              // numbered blank rows that looked like a half-loaded card.
              stats.gainers.length < 3 && (
                <div className="text-[11px] text-gray-500 italic pt-1 pl-5">
                  No more gainers in 24h
                </div>
              )
            )}
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="mb-6">
      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-3 gap-3">
        {cards.map((card, index) => (
          <div key={card.title} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4">
            {card.content}
          </div>
        ))}
      </div>

      {/* Mobile: stacked cards keep all headline stats visible and avoid
          transform-created off-screen content contributing to body scrollWidth. */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {cards.map((card) => (
          <div key={card.title} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4">
            {card.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// Inner component reads ?search= and ?category= from the URL. It must be
// wrapped in <Suspense> because Next.js 14 requires useSearchParams
// consumers to live under a Suspense boundary during static rendering.
function ExplorePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('search') ?? ''
  const initialCategoryParam = searchParams?.get('category') ?? ''
  // resolveCategory tells us BOTH the canonical category AND whether the
  // URL needs cleaning up. We use a single useMemo so the resolution is
  // stable across renders and the canonicalisation effect below only fires
  // once per real URL change.
  const resolution = useMemo(
    () => resolveCategory(initialCategoryParam, TOKEN_CATEGORIES),
    [initialCategoryParam],
  )
  const [query, setQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory | 'All'>(resolution.value)
  // Notice shown to the user when their ?category= value was wrong. Null
  // when the URL was already canonical. We clear it on the next category
  // change so it doesn't stick around after the user picks a new filter.
  const [notice, setNotice] = useState<string | null>(() => {
    if (resolution.mode === 'case-fixed') {
      return `Showing "${resolution.value}" — fixed casing from "${resolution.raw}".`
    }
    if (resolution.mode === 'unknown') {
      return `Unknown category "${resolution.raw}" — showing all tokens.`
    }
    return null
  })
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { tokens: data } = useOnChainMarketData()

  // Canonicalise the URL if the user arrived with a typo or unknown
  // category. We use router.replace (not push) so the back button still
  // works the way the user expects, and we only run when the resolution
  // actually says something needs fixing.
  useEffect(() => {
    if (resolution.mode === 'exact' || resolution.mode === 'all') return
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (resolution.mode === 'case-fixed') {
      params.set('category', resolution.value)
    } else {
      // mode === 'unknown' — drop the broken param entirely.
      params.delete('category')
    }
    const qs = params.toString()
    router.replace(qs ? `/explore?${qs}` : '/explore')
    // We intentionally depend only on `resolution` — searchParams changes
    // on every render in some Next.js setups, which would loop forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let tokens = data
    if (selectedCategory !== 'All') {
      tokens = tokens.filter(t => t.category === selectedCategory)
    }
    const trimmed = query.trim()
    if (trimmed) {
      const q = trimmed.toLowerCase()
      tokens = tokens.filter(t =>
        t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      )
    }
    return [...tokens].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      const av = a[sortField]
      const bv = b[sortField]
      // Null values always sort to the bottom — "no data" is worse than any
      // value, regardless of sort direction.
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      return (av - bv) * mul
    })
  }, [data, query, selectedCategory, sortField, sortDir])

  const handleRowClick = useCallback((symbol: string) => {
    router.push(`/explore/${symbol}`)
  }, [router])

  const handleSwapClick = useCallback((symbol: string) => {
    router.push(`/?buy=${symbol}`)
  }, [router])

  // Single source of truth for category clicks: updates state, mirrors to
  // the URL (so bookmarks/shares match what the user sees), and clears any
  // "we ignored your typo" notice from the initial load.
  const handleCategoryClick = useCallback((cat: TokenCategory | 'All') => {
    setSelectedCategory(cat)
    setNotice(null)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (cat === 'All') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    const qs = params.toString()
    router.replace(qs ? `/explore?${qs}` : '/explore')
  }, [router, searchParams])

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Explore Tokens</h1>
        <p className="text-sm text-gray-400">Browse token prices, volume, and market data on GoodDollar L2</p>
      </div>

      <MarketStatsBar tokens={data} />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tokens..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
        />
      </div>

      <ScrollStrip
        wrapperClassName="mb-4"
        className="flex gap-2 pb-1"
        ariaLabel="Filter tokens by category"
      >
        <button
          onClick={() => handleCategoryClick('All')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === 'All' ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-100 border border-gray-700/20'}`}
        >
          All
        </button>
        {TOKEN_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-100 border border-gray-700/20'}`}
          >
            {cat}
          </button>
        ))}
      </ScrollStrip>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          data-testid="category-notice"
          className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-amber-300/70 hover:text-amber-100 transition-colors"
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/30 text-gray-400 bg-dark-50/25">
                <th className="text-right py-3 px-3 font-semibold w-10">#</th>
                <th className="text-left py-3 px-3 font-semibold">Token</th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('price')}
                >
                  Price <SortArrow active={sortField === 'price'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-2 font-semibold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('change1h')}
                >
                  1h <SortArrow active={sortField === 'change1h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('change24h')}
                >
                  24h <SortArrow active={sortField === 'change24h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-2 font-semibold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('change7d')}
                >
                  7d <SortArrow active={sortField === 'change7d'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('volume24h')}
                >
                  Volume <SortArrow active={sortField === 'volume24h'} dir={sortDir} />
                </th>
                <th
                  className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                  onClick={() => handleSort('marketCap')}
                >
                  Market Cap <SortArrow active={sortField === 'marketCap'} dir={sortDir} />
                </th>
                <th className="py-3 px-2 font-semibold hidden lg:table-cell">7d Trend</th>
                <th className="w-16 sm:w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 px-4">
                    <div className="flex flex-col items-center text-center max-w-md mx-auto">
                      <SearchX
                        className="text-gray-600 mb-3"
                        size={36}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <p className="text-sm text-gray-300 mb-1">
                        {query.trim().length > 0 ? (
                          <>
                            No tokens match{' '}
                            <span className="text-white font-medium break-all">
                              &ldquo;{query}&rdquo;
                            </span>
                            {selectedCategory !== 'All' && (
                              <>
                                {' '}in{' '}
                                <span className="text-white font-medium">
                                  {selectedCategory}
                                </span>
                              </>
                            )}
                            .
                          </>
                        ) : selectedCategory !== 'All' ? (
                          <>
                            No tokens in{' '}
                            <span className="text-white font-medium">
                              {selectedCategory}
                            </span>{' '}
                            yet.
                          </>
                        ) : (
                          <>No tokens available right now.</>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Try a different search term or category.
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
                        {selectedCategory !== 'All' && (
                          <button
                            type="button"
                            onClick={() => handleCategoryClick('All')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-dark-50 border border-gray-700/30 transition-colors"
                          >
                            Show all tokens
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((token, idx) => (
                  <TokenRow key={token.symbol} token={token} idx={idx} onRowClick={handleRowClick} onSwapClick={handleSwapClick} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center mt-4">
        Prices shown are illustrative. Real-time data coming soon.
      </p>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreLoading />}>
      <ExplorePageContent />
    </Suspense>
  )
}
