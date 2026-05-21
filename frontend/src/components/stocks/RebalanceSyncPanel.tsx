'use client'

import type {
  RebalanceGuardEvaluation,
  RebalanceProduct,
  SymbolRebalanceStatus,
} from '@/lib/stocksRebalanceInvariant'

const PRODUCT_LABELS: Record<RebalanceProduct, string> = {
  amm: 'AMM',
  perps: 'Perps',
  predict: 'Prediction',
  lend: 'Lend',
  yield: 'Yield',
}

function renderBlock(value: number | null): string {
  if (value === null) return '—'
  return value.toLocaleString('en-US')
}

export function RebalanceSyncPanel({
  status,
  guard,
  currentBlock,
}: {
  status: SymbolRebalanceStatus
  guard: RebalanceGuardEvaluation
  currentBlock: number | null
}) {
  const headline = guard.blocked ? 'Risk stop active' : 'Synced for trading'
  const headlineClass = guard.blocked ? 'text-red-300' : 'text-green-300'

  return (
    <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-4" data-testid="stocks-rebalance-sync-panel">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Rebalance Sync</h3>
        <span className={`text-xs font-medium ${headlineClass}`}>{headline}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-gray-500">Oracle snapshot block</div>
        <div className="text-right text-gray-200">{renderBlock(status.snapshotBlock)}</div>
        <div className="text-gray-500">Current block</div>
        <div className="text-right text-gray-200">{renderBlock(currentBlock)}</div>
        <div className="text-gray-500">Two-block proof</div>
        <div className={`text-right ${guard.hasTwoBlockProof ? 'text-green-300' : 'text-red-300'}`}>
          {guard.hasTwoBlockProof ? 'Ready' : 'Missing'}
        </div>
        <div className="text-gray-500">Max divergence</div>
        <div className={`text-right ${guard.maxDivergencePct > 0.5 ? 'text-red-300' : 'text-gray-200'}`}>
          {guard.maxDivergencePct.toFixed(2)}%
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {(['amm', 'perps', 'predict', 'lend', 'yield'] as RebalanceProduct[]).map((product) => {
          const item = status.products[product]
          const stale = currentBlock !== null && (item.lastSyncedBlock === null || item.lastSyncedBlock < currentBlock)
          return (
            <div key={product} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{PRODUCT_LABELS[product]}</span>
              <span className={stale ? 'text-red-300' : 'text-green-300'}>
                {stale ? 'Unsynced' : 'Synced'} · {renderBlock(item.lastSyncedBlock)}
              </span>
            </div>
          )
        })}
      </div>

      {guard.blocked && (
        <ul className="mt-3 space-y-1 text-[11px] text-red-300" data-testid="stocks-rebalance-reasons">
          {guard.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
