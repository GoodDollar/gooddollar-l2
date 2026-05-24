/**
 * Build daily series data from hedge receipts
 */

export interface DailySeries {
  notional: number[]
  orders: number[]
  coverageDays: number
}

export interface HedgeReceipt {
  timestamp: number
  notionalUsd: number
  [key: string]: unknown
}

export function buildDailySeries(receipts: HedgeReceipt[]): DailySeries {
  if (!receipts || receipts.length === 0) {
    return {
      notional: [],
      orders: [],
      coverageDays: 0
    }
  }
  
  // Group receipts by day
  const dayGroups = new Map<string, { notional: number; orders: number }>()
  
  for (const receipt of receipts) {
    const day = new Date(receipt.timestamp).toISOString().split('T')[0]
    const existing = dayGroups.get(day) || { notional: 0, orders: 0 }
    
    dayGroups.set(day, {
      notional: existing.notional + (receipt.notionalUsd || 0),
      orders: existing.orders + 1
    })
  }
  
  // Convert to arrays sorted by date
  const sortedDays = Array.from(dayGroups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
  
  return {
    notional: sortedDays.map(([, data]) => data.notional),
    orders: sortedDays.map(([, data]) => data.orders),
    coverageDays: sortedDays.length
  }
}