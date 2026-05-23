/**
 * Exposure delta formatter for hedge receipt rows.
 *
 * The receipt envelope is forwarded from the engine over HTTP with no
 * runtime validation. When the engine omits `beforeExposure` /
 * `afterExposure` (initial dry-run cycle, no-op receipt, malformed
 * envelope) the values arrive as `null` / `undefined` and the raw
 * template-string formatter used to render literal `"null → null"` /
 * `"undefined → undefined"` in the proof dashboard.
 *
 * Mirrors the defensive pattern established for `formatNotionalUsd`:
 * widen the input type to `unknown`, guard with `Number.isFinite`, and
 * fall through to an em-dash placeholder so the proof artifact never
 * advertises that it is internally broken. See task 0040.
 */

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

export function formatExposureDelta(
  before: unknown,
  after: unknown,
): ExposureDeltaParts {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return PLACEHOLDER
  const b = before as number
  const a = after as number
  const delta = a - b
  const display = `${b} → ${a}`
  if (!Number.isFinite(delta) || delta === 0) {
    return { display, deltaSigned: '0', deltaClass: 'text-gray-500' }
  }
  if (delta > 0) {
    return { display, deltaSigned: `+${delta}`, deltaClass: 'text-goodgreen' }
  }
  return { display, deltaSigned: `−${Math.abs(delta)}`, deltaClass: 'text-red-300' }
}
