/**
 * Export toolbar for hedge receipts
 */
import { HedgeReceipt } from './ReceiptRow'

export interface ReceiptsExportToolbarProps {
  receipts: HedgeReceipt[]
  reason?: string
}

export function ReceiptsExportToolbar({ receipts, reason }: ReceiptsExportToolbarProps) {
  const handleExport = () => {
    const csv = receiptsToCSV(receipts)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hedge-receipts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  if (receipts.length === 0) {
    return null
  }
  
  return (
    <div data-testid="hedge-receipts-export-toolbar">
      <button
        type="button"
        onClick={handleExport}
        data-testid="hedge-receipts-export-csv-button"
        className="text-xs px-2 py-1 rounded border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500"
        title="Export receipts as CSV"
      >
        Export CSV
      </button>
    </div>
  )
}

function receiptsToCSV(receipts: HedgeReceipt[]): string {
  const headers = ['timestamp', 'id', 'symbol', 'side', 'notionalUsd', 'success', 'beforeExposure', 'afterExposure', 'mode']
  const rows = receipts.map(receipt => [
    new Date(receipt.timestamp).toISOString(),
    receipt.id,
    receipt.symbol,
    receipt.side,
    receipt.notionalUsd.toString(),
    receipt.success.toString(),
    receipt.beforeExposure.toString(),
    receipt.afterExposure.toString(),
    receipt.mode
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}