/**
 * Lane 5 — visible-window aggregates for the receipts table totals row.
 *
 * The top-of-card stat tiles surface engine-side day totals
 * (`dailyNotionalUsd`, `dailyOrders`). Those are different from what
 * the operator can actually see on screen — the receipts panel
 * usually shows a strict subset of the day's activity (the newest
 * 5). eToro's order-history audit trail, Bloomberg's tradeblotter,
 * every CEX shows column totals at the bottom of every paginated
 * view; the receipts table is structurally a trade audit trail and
 * should follow the same convention (task 0053).
 *
 * This helper is purely presentational: it consumes the same
 * `HedgeReceipt[]` the table renders and emits a `ReceiptsSummary`
 * the totals `<tfoot>` reads. Returns `null` for empty input so the
 * card can render the empty state without an extra conditional.
 *
 * Defensive: non-finite `notionalUsd` or `beforeExposure /
 * afterExposure` values are dropped from their respective sums so
 * one bad row never poisons the visible-window aggregate. Counts
 * (buy / sell / noop / ok / failed) always include every row.
 */

import type { HedgeReceipt } from '@/components/HedgeStatusCard/ReceiptRow'

export interface ReceiptsSummary {
  count: number
  notionalTotalUsd: number
  buyCount: number
  sellCount: number
  noopCount: number
  okCount: number
  failedCount: number
  exposureNetDelta: number
  sideCaption: string
  statusCaption: string
}

function buildSideCaption(buy: number, sell: number, noop: number): string {
  const parts: string[] = []
  if (buy > 0) parts.push(`${buy} buy`)
  if (sell > 0) parts.push(`${sell} sell`)
  if (noop > 0) parts.push(`${noop} noop`)
  if (parts.length === 0) return 'all noop'
  if (parts.length === 1) {
    if (noop > 0 && buy === 0 && sell === 0) return 'all noop'
    return parts[0]
  }
  return parts.join(' · ')
}

function buildStatusCaption(ok: number, failed: number): string {
  if (failed === 0) return 'all ok'
  if (ok === 0) return 'all failed'
  return `${ok} ok · ${failed} failed`
}

export function summarizeReceipts(
  receipts: ReadonlyArray<HedgeReceipt>,
): ReceiptsSummary | null {
  if (receipts.length === 0) return null
  let notionalTotalUsd = 0
  let buyCount = 0
  let sellCount = 0
  let noopCount = 0
  let okCount = 0
  let failedCount = 0
  let exposureNetDelta = 0
  for (const r of receipts) {
    if (Number.isFinite(r.notionalUsd)) notionalTotalUsd += r.notionalUsd
    switch (r.side) {
      case 'buy':
        buyCount += 1
        break
      case 'sell':
        sellCount += 1
        break
      case 'noop':
        noopCount += 1
        break
      default: {
        const _exhaustive: never = r.side
        void _exhaustive
      }
    }
    if (r.success) okCount += 1
    else failedCount += 1
    if (Number.isFinite(r.beforeExposure) && Number.isFinite(r.afterExposure)) {
      exposureNetDelta += r.afterExposure - r.beforeExposure
    }
  }
  return {
    count: receipts.length,
    notionalTotalUsd,
    buyCount,
    sellCount,
    noopCount,
    okCount,
    failedCount,
    exposureNetDelta,
    sideCaption: buildSideCaption(buyCount, sellCount, noopCount),
    statusCaption: buildStatusCaption(okCount, failedCount),
  }
}
