/**
 * Export toolbar for hedge receipts.
 */
import { HedgeReceipt } from './ReceiptRow'

export interface ReceiptsExportToolbarProps {
  receipts: HedgeReceipt[]
  reason?: string
}

function disabledTooltip(reason: string | undefined): string {
  if (reason?.includes('engine offline')) {
    return 'Engine offline — receipts will be exportable once it comes back'
  }
  if (reason?.includes('degraded')) {
    return 'Receipts source degraded — export disabled until receipts are healthy'
  }
  return 'No receipts to export — nothing has happened yet'
}

export function ReceiptsExportToolbar({ receipts, reason }: ReceiptsExportToolbarProps) {
  const disabled = receipts.length === 0
  const title = disabled ? disabledTooltip(reason) : 'Download CSV'

  const handleExport = () => {
    if (disabled) return
    const csv = receiptsToCSV(receipts)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hedge-receipts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div data-testid="hedge-receipts-export-toolbar">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        data-testid="hedge-receipts-export-csv-button"
        className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500 disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:border-gray-600"
        title={title}
        aria-label={disabled ? title : undefined}
      >
        Export CSV
      </button>
    </div>
  )
}

function csvValue(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function receiptsToCSV(receipts: HedgeReceipt[]): string {
  const headers = [
    'timestamp',
    'id',
    'symbol',
    'side',
    'notionalUsd',
    'success',
    'beforeExposure',
    'afterExposure',
    'mode',
    'etoroOrderId',
  ]
  const rows = receipts.map((receipt) => [
    receipt.timestamp ? new Date(receipt.timestamp).toISOString() : '',
    receipt.id,
    receipt.symbol,
    receipt.side,
    receipt.notionalUsd,
    receipt.success,
    receipt.beforeExposure,
    receipt.afterExposure,
    receipt.mode,
    receipt.etoroOrderId,
  ])

  return [headers, ...rows]
    .map((row) => row.map(csvValue).join(','))
    .join('\n')
}
