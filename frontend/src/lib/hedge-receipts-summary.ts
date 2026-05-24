/**
 * Summarize hedge receipts for totals display
 */

export interface ReceiptsSummary {
  count: number
  notionalTotalUsd: number
  exposureNetDelta: number
  sideCaption: string
  statusCaption: string
}

export interface HedgeReceipt {
  side: 'buy' | 'sell'
  notionalUsd: number
  beforeExposure: number
  afterExposure: number
  success: boolean
  [key: string]: unknown
}

export function summarizeReceipts(receipts: HedgeReceipt[]): ReceiptsSummary | null {
  if (!receipts || receipts.length === 0) {
    return null
  }
  
  let notionalTotalUsd = 0
  let exposureNetDelta = 0
  let successCount = 0
  let buyCount = 0
  let sellCount = 0
  
  for (const receipt of receipts) {
    notionalTotalUsd += receipt.notionalUsd || 0
    
    const delta = (receipt.afterExposure || 0) - (receipt.beforeExposure || 0)
    exposureNetDelta += delta
    
    if (receipt.success) {
      successCount++
    }
    
    if (receipt.side === 'buy') {
      buyCount++
    } else if (receipt.side === 'sell') {
      sellCount++
    }
  }
  
  const sideCaption = buyCount === sellCount 
    ? 'mixed'
    : buyCount > sellCount 
    ? `${buyCount} buy, ${sellCount} sell`
    : `${sellCount} sell, ${buyCount} buy`
  
  const statusCaption = successCount === receipts.length 
    ? 'all success'
    : successCount === 0
    ? 'all failed'
    : `${successCount}/${receipts.length} success`
  
  return {
    count: receipts.length,
    notionalTotalUsd,
    exposureNetDelta,
    sideCaption,
    statusCaption
  }
}