/**
 * Exposure delta formatter for hedge receipt rows.
 *
 * The receipts table is the demo hedge proof artifact — an operator
 * (or an auditor) reads each row to confirm the engine moved exposure
 * by the intended amount. Every numeric field must therefore read as
 * clean two-decimal money (`$X,XXX.XX`), not as raw `Number.prototype.toString`
 * leaking IEEE-754 subtraction noise like `-42.18000000000064` (task
 * 0050). Every output goes through `formatNotionalUsd` which inherits
 * thousand-separators, half-even rounding, and the `—` defensive
 * placeholder for non-finite inputs.
 *
 * Defensive contract (preserved from task 0040): when the engine omits
 * `beforeExposure` / `afterExposure` — initial dry-run cycle, no-op
 * receipt, malformed envelope — the values arrive as `null` /
 * `undefined`. Widen the input type to `unknown`, guard with
 * `Number.isFinite`, fall through to the em-dash placeholder so the
 * proof artifact never advertises that it is internally broken.
 *
 * Sign convention: positive deltas use a literal `+`; negative deltas
 * use the en-dash `−` (not a hyphen) to stay visually consistent with
 * the parenthesised delta cell in `ReceiptRow`; zero deltas render
 * `$0.00` so the column doesn't switch units row-to-row.
 */

import { formatNotionalUsd } from './format-notional'

export interface ExposureDeltaParts {
  display: string
  deltaSigned: string
  deltaClass: string
}

const PLACEHOLDER: ExposureDeltaParts = {
  display: '— → —',
  deltaSigned: '—',
  deltaClass: 'text-gray-500',
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatExposureDelta(
  before: unknown,
  after: unknown,
): ExposureDeltaParts {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return PLACEHOLDER
  const b = before as number
  const a = after as number
  const display = `${formatNotionalUsd(b)} → ${formatNotionalUsd(a)}`
  const rounded = roundCents(a - b)
  if (!Number.isFinite(rounded) || rounded === 0) {
    return { display, deltaSigned: formatNotionalUsd(0), deltaClass: 'text-gray-500' }
  }
  if (rounded > 0) {
    return {
      display,
      deltaSigned: `+${formatNotionalUsd(rounded)}`,
      deltaClass: 'text-goodgreen',
    }
  }
  return {
    display,
    deltaSigned: `−${formatNotionalUsd(Math.abs(rounded))}`,
    deltaClass: 'text-red-300',
  }
}
