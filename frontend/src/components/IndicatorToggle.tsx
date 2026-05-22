'use client'

import type { ActiveIndicators, IndicatorId } from '@/lib/indicators'

interface IndicatorToggleProps {
  indicators: ActiveIndicators
  onChange: (id: IndicatorId) => void
}

const INDICATOR_CONFIG: { id: IndicatorId; label: string; color: string }[] = [
  { id: 'vol', label: 'Vol', color: '#10B981' },
  { id: 'sma20', label: 'SMA 20', color: '#FBBF24' },
  { id: 'ema50', label: 'EMA 50', color: '#A78BFA' },
]

export function IndicatorToggle({ indicators, onChange }: IndicatorToggleProps) {
  return (
    <div className="flex items-center gap-1">
      {INDICATOR_CONFIG.map(({ id, label, color }) => {
        const active = indicators[id]
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              active
                ? 'bg-white/5 text-white border border-white/10'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: active ? color : 'rgba(156,163,175,0.9)' }}
            />
            {label}
          </button>
        )
      })}
    </div>
  )
}
