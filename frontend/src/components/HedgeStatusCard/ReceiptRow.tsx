/**
 * Receipt row component for hedge status table
 */
import { memo } from 'react'
import { formatNotionalUsd } from '@/lib/format-notional'

export interface HedgeReceipt {
  v: number
  id: string
  timestamp: number
  symbol: string
  side: 'buy' | 'sell'
  notionalUsd: number
  success: boolean
  etoroOrderId: string
  beforeExposure: number
  afterExposure: number
  dryRun: boolean
  mode: string
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatExposureDelta(before: number, after: number): string {
  const delta = after - before
  if (Math.abs(delta) < 0.01) return '—'
  
  const sign = delta > 0 ? '+' : '−'
  return `${sign}${formatNotionalUsd(Math.abs(delta))}`
}

function getSideColor(side: string): string {
  if (side === 'buy') return 'text-goodgreen'
  if (side === 'sell') return 'text-red-300'
  return 'text-gray-400' // noop or unknown
}

function getInstrumentClass(symbol: string): string {
  // Basic classification based on symbol patterns
  if (symbol === 'BTC' || symbol === 'ETH' || symbol.endsWith('USD') && (symbol.startsWith('BTC') || symbol.startsWith('ETH'))) {
    return 'crypto'
  }
  if (symbol.length === 6 && symbol.includes('USD')) {
    return 'fx' // e.g., EURUSD
  }
  return 'stock' // Default to stock
}

export const ReceiptRow = memo(function ReceiptRow({ receipt }: { receipt: HedgeReceipt }) {
  const exposureDelta = formatExposureDelta(receipt.beforeExposure, receipt.afterExposure)
  const statusColor = receipt.success ? 'text-green-400' : 'text-red-400'
  const sideColor = getSideColor(receipt.side)
  
  return (
    <tr data-testid="hedge-receipt-row" className="text-gray-300 hover:bg-dark-100/30 font-mono">
      <td className="py-1.5 pr-2 text-xs font-mono">
        {formatTime(receipt.timestamp)}
      </td>
      <td className="py-1.5 pr-2 text-xs font-mono truncate max-w-[8ch]" title={receipt.id}>
        {receipt.id.substring(0, 8)}
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
      <td className="py-1.5 pr-2 text-xs">
        {exposureDelta}
      </td>
      <td className={`py-1.5 text-xs ${statusColor}`}>
        {receipt.success ? 'success' : 'failed'}
      </td>
    </tr>
  )
})