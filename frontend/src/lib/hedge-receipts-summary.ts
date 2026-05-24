/**
 * Summarize hedge receipts for totals display.
 */

export interface ReceiptsSummary {
  count: number
  notionalTotalUsd: number
  exposureNetDelta: number
  sideCaption: string
  statusCaption: string
}

export interface HedgeReceipt {
  side: 'buy' | 'sell' | string
  notionalUsd: number
  beforeExposure: number
  afterExposure: number
  success: boolean
  [key: string]: unknown
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

export function summarizeReceipts(receipts: HedgeReceipt[]): ReceiptsSummary | null {
  if (!receipts || receipts.length === 0) return null

  let notionalTotalUsd = 0
  let exposureNetDelta = 0
  let successCount = 0
  let buyCount = 0
  let sellCount = 0

  for (const receipt of receipts) {
    notionalTotalUsd += finiteNumber(receipt.notionalUsd) ?? 0

    const before = finiteNumber(receipt.beforeExposure)
    const after = finiteNumber(receipt.afterExposure)
    if (before !== null && after !== null) {
      exposureNetDelta += after - before
    }

    if (receipt.success) successCount++
    if (receipt.side === 'buy') buyCount++
    if (receipt.side === 'sell') sellCount++
  }

  const failedCount = receipts.length - successCount

  return {
    count: receipts.length,
    notionalTotalUsd: roundCents(notionalTotalUsd),
    exposureNetDelta: roundCents(exposureNetDelta),
    sideCaption: `${buyCount} buy · ${sellCount} sell`,
    statusCaption: `${successCount} ok · ${failedCount} failed`,
  }
}
