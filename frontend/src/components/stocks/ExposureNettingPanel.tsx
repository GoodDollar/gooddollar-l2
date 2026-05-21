'use client'

import type { ResidualClassification, SymbolExposureSummary } from '@/lib/exposureNetting'

const BADGE_STYLES: Record<ResidualClassification, string> = {
  hedged: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/30',
  partial: 'bg-amber-900/40 text-amber-300 border-amber-600/30',
  unhedged: 'bg-red-900/40 text-red-300 border-red-600/30',
}

const BADGE_LABELS: Record<ResidualClassification, string> = {
  hedged: 'Hedged',
  partial: 'Partial',
  unhedged: 'Unhedged',
}

const BAR_COLORS: Record<ResidualClassification, { long: string; short: string }> = {
  hedged: { long: 'bg-emerald-500', short: 'bg-emerald-700' },
  partial: { long: 'bg-amber-500', short: 'bg-amber-700' },
  unhedged: { long: 'bg-red-500', short: 'bg-red-700' },
}

function formatUsd(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : value > 0 ? '+' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

function ExposureBar({
  grossLong,
  grossShort,
  classification,
}: {
  grossLong: number
  grossShort: number
  classification: ResidualClassification
}) {
  const total = grossLong + grossShort
  if (total === 0) return null

  const longPct = (grossLong / total) * 100
  const shortPct = (grossShort / total) * 100
  const colors = BAR_COLORS[classification]

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
      <div className={`${colors.long} transition-all`} style={{ width: `${longPct}%` }} />
      <div className={`${colors.short} transition-all`} style={{ width: `${shortPct}%` }} />
    </div>
  )
}

function SymbolRow({ summary }: { summary: SymbolExposureSummary }) {
  const badgeStyle = BADGE_STYLES[summary.classification]
  const badgeLabel = BADGE_LABELS[summary.classification]

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{summary.symbol}</span>
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${badgeStyle}`}
          >
            {badgeLabel}
          </span>
        </div>
        <span className="text-sm font-mono text-white/70">
          {formatUsd(summary.netExposureUsd)}
        </span>
      </div>

      <ExposureBar
        grossLong={summary.grossLongUsd}
        grossShort={summary.grossShortUsd}
        classification={summary.classification}
      />

      <div className="flex justify-between text-[11px] text-white/40">
        <span>Long {formatUsd(summary.grossLongUsd)}</span>
        <span>Short {formatUsd(summary.grossShortUsd)}</span>
      </div>
    </div>
  )
}

export function ExposureNettingPanel({
  summaries,
  portfolioDelta,
}: {
  summaries: SymbolExposureSummary[]
  portfolioDelta: number
}) {
  if (summaries.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm text-white/50">No open positions across products</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Unified Exposure</h3>
        <div data-testid="portfolio-delta" className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/40">Portfolio Δ</span>
          <span className="text-sm font-mono font-semibold text-white">
            {formatUsd(portfolioDelta)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {summaries.map((s) => (
          <SymbolRow key={s.symbol} summary={s} />
        ))}
      </div>
    </div>
  )
}
