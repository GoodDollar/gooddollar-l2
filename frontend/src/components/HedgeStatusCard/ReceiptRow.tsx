/**
 * Receipt row component for hedge status table.
 */
import { memo, type KeyboardEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { formatNotionalUsd } from '@/lib/format-notional'

export interface HedgeReceipt {
  v: number
  id: string
  timestamp: number
  symbol: string
  side: 'buy' | 'sell' | 'noop' | string
  notionalUsd: number
  success: boolean
  etoroOrderId?: string
  beforeExposure: number
  afterExposure: number
  dryRun: boolean
  mode: string
  error?: string
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function timeAgo(ms: number | null): string {
  if (!ms) return '—'
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatUtcClock(ms: number | null): string {
  if (!ms) return ''
  return new Date(ms).toISOString().slice(11, 19) + ' UTC'
}

function exposureText(beforeValue: unknown, afterValue: unknown): string {
  const before = finiteNumber(beforeValue)
  const after = finiteNumber(afterValue)
  const beforeText = before === null ? '—' : formatNotionalUsd(before)
  const afterText = after === null ? '—' : formatNotionalUsd(after)
  if (before === null || after === null) return `${beforeText} → ${afterText}(—)`

  const delta = Math.round((after - before) * 100) / 100
  if (Math.abs(delta) < 0.01) return `${beforeText} → ${afterText}(—)`
  const sign = delta > 0 ? '+' : '−'
  return `${beforeText} → ${afterText}(${sign}${formatNotionalUsd(Math.abs(delta))})`
}

function getSideColor(side: string): string {
  if (side === 'buy') return 'text-goodgreen'
  if (side === 'sell') return 'text-red-300'
  return 'text-gray-400'
}

function getInstrumentClass(symbol: string): string {
  if (
    symbol === 'BTC' ||
    symbol === 'ETH' ||
    (symbol.endsWith('USD') && (symbol.startsWith('BTC') || symbol.startsWith('ETH')))
  ) {
    return 'crypto'
  }
  if (symbol.length === 6 && symbol.includes('USD')) return 'fx'
  return 'stock'
}

function shortId(value: string, chars: number): string {
  return value.length > chars ? value.slice(0, chars) : value
}

function CopyButton({
  value,
  label,
  testId,
  className,
  children,
}: {
  value: string
  label: string
  testId: string
  className: string
  children: string
}) {
  const copy = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void navigator.clipboard?.writeText(value)
  }
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      title={value}
      onClick={copy}
      className={className}
    >
      {children}
    </button>
  )
}

export const ReceiptRow = memo(function ReceiptRow({ receipt }: { receipt: HedgeReceipt }) {
  const router = useRouter()
  const statusColor = receipt.success ? 'text-green-400' : 'text-red-400'
  const sideColor = getSideColor(receipt.side)
  const timestamp = receipt.timestamp > 0 ? receipt.timestamp : null
  const proofHref = `/analytics/hedge/proof/${receipt.id}`

  const navigate = () => router.push(proofHref)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      navigate()
    }
  }

  return (
    <tr
      data-testid="hedge-receipt-row"
      title={receipt.id}
      role="link"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={onKeyDown}
      className="text-gray-300 hover:bg-dark-100/30 font-mono cursor-pointer focus:outline-none focus:ring-1 focus:ring-goodgreen/60"
    >
      <td className="py-1.5 pr-2 text-xs font-mono" title={timestamp ? new Date(timestamp).toISOString() : undefined}>
        <span className="flex flex-col leading-tight">
          <span data-testid="hedge-receipt-time-relative">{timeAgo(timestamp)}</span>
          <span data-testid="hedge-receipt-time-clock" className="text-[10px] text-gray-500">
            {formatUtcClock(timestamp)}
          </span>
        </span>
      </td>
      <td className="py-1.5 pr-2 text-xs font-mono">
        <span className="flex flex-col gap-0.5 min-w-0">
          <CopyButton
            value={receipt.id}
            label={`Copy hedge id ${receipt.id}`}
            testId="hedge-receipt-internal-id-copy"
            className="text-left truncate max-w-[8ch] inline-block hover:text-goodgreen"
          >
            {shortId(receipt.id, 8)}
          </CopyButton>
          <span data-testid="hedge-receipt-etoro-id" className="text-gray-400 min-w-0">
            {receipt.etoroOrderId ? (
              <CopyButton
                value={receipt.etoroOrderId}
                label={`Copy eToro order id ${receipt.etoroOrderId}`}
                testId="hedge-receipt-etoro-id-copy"
                className="text-left truncate max-w-[10ch] inline-block hover:text-goodgreen"
              >
                {receipt.etoroOrderId}
              </CopyButton>
            ) : (
              <span>—</span>
            )}
          </span>
        </span>
      </td>
      <td className="py-1.5 pr-2 text-xs font-mono">
        {receipt.symbol}
        <span
          data-testid="hedge-receipt-instrument-badge"
          data-instrument-class={getInstrumentClass(receipt.symbol)}
          aria-hidden="true"
          className="ml-1 text-xs opacity-60"
        />
      </td>
      <td className={`py-1.5 pr-2 text-xs font-semibold uppercase ${sideColor}`} data-testid="hedge-receipt-side">
        {receipt.side}
      </td>
      <td className="py-1.5 pr-2 text-right text-xs">
        {formatNotionalUsd(receipt.notionalUsd)}
      </td>
      <td className="py-1.5 pr-2 text-xs" data-testid="hedge-receipt-exposure-delta">
        {exposureText(receipt.beforeExposure, receipt.afterExposure)}
      </td>
      <td className={`py-1.5 text-xs ${statusColor}`}>
        {receipt.success ? 'success' : 'failed'}
      </td>
    </tr>
  )
})
