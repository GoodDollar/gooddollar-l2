/**
 * Lane 5 — CSV/JSON export helpers for the recent-receipts panel.
 *
 * The Demo hedge proof card is the lane-5 audit surface. eToro's
 * equivalent (Portfolio → History) treats CSV/Excel export as a
 * first-class affordance. These helpers serialise the already-rendered
 * `HedgeReceipt[]` client-side so the export file always matches what
 * the operator sees on screen — no extra round-trip, no server-side
 * aggregation, no risk of disagreement (task 0042).
 *
 * The encoder emits RFC-4180 CSV: comma separator, CRLF terminators,
 * fields quoted only when they contain `"`, `,`, CR, or LF. Embedded
 * `"` is doubled. No BOM (matches eToro's CSV export).
 */

export interface HedgeReceiptExportInput {
  v?: number
  id: string
  timestamp: number
  symbol: string
  side: 'buy' | 'sell' | 'noop'
  notionalUsd: number
  success: boolean
  error?: string
  etoroOrderId?: string
  beforeExposure: number
  afterExposure: number
  dryRun: boolean
  mode: 'sandbox' | 'real' | 'demo' | 'unknown'
}

const CSV_COLUMNS = [
  'time_iso',
  'id',
  'etoro_order_id',
  'symbol',
  'side',
  'notional_usd',
  'before_exposure',
  'after_exposure',
  'exposure_delta',
  'status',
  'mode',
  'dry_run',
] as const

const CSV_NEEDS_QUOTING_RE = /[",\r\n]/

function csvEscape(value: string): string {
  if (!CSV_NEEDS_QUOTING_RE.test(value)) return value
  return `"${value.replace(/"/g, '""')}"`
}

function formatExposure(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : ''
}

function statusFor(r: HedgeReceiptExportInput): string {
  if (r.success) return 'ok'
  return r.error ?? 'failed'
}

function isoFor(ms: number): string {
  return Number.isFinite(ms) ? new Date(ms).toISOString() : ''
}

function rowFor(r: HedgeReceiptExportInput): string[] {
  const delta = Number.isFinite(r.afterExposure) && Number.isFinite(r.beforeExposure)
    ? (r.afterExposure - r.beforeExposure).toFixed(2)
    : ''
  return [
    isoFor(r.timestamp),
    r.id,
    r.etoroOrderId ?? '',
    r.symbol,
    r.side,
    Number.isFinite(r.notionalUsd) ? r.notionalUsd.toFixed(2) : '',
    formatExposure(r.beforeExposure),
    formatExposure(r.afterExposure),
    delta,
    statusFor(r),
    r.mode,
    r.dryRun ? 'true' : 'false',
  ]
}

export function receiptsToCsv(receipts: readonly HedgeReceiptExportInput[]): string {
  const header = CSV_COLUMNS.join(',')
  const body = receipts
    .map((r) => rowFor(r).map(csvEscape).join(','))
    .join('\r\n')
  return body.length === 0 ? `${header}\r\n` : `${header}\r\n${body}\r\n`
}

export function receiptsToJson(receipts: readonly HedgeReceiptExportInput[]): string {
  return `${JSON.stringify(receipts, null, 2)}\n`
}

export type ExportKind = 'csv' | 'json'

export function receiptsExportFilename(
  kind: ExportKind,
  count: number,
  now: Date = new Date(),
): string {
  const day = now.toISOString().slice(0, 10)
  return `hedge-receipts-${day}-${count}.${kind}`
}

// Browser-only side effect; SSR-safe via `typeof document` guard so the
// helper module can be imported during prerender without crashing.
export function downloadBlob(
  filename: string,
  mime: string,
  contents: string,
): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Microtask delay lets the browser flush the download before revoke;
  // 0-ms timeout is enough in every browser we target.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const CSV_MIME = 'text/csv;charset=utf-8'
export const JSON_MIME = 'application/json;charset=utf-8'
