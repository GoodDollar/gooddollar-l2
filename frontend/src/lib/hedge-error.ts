/**
 * Backend error strings for `/api/hedge/status` already name the subject
 * ("Hedge engine unreachable"). Concatenating them with a hardcoded
 * "Hedge engine unavailable:" label produced the tautological banner
 * "Hedge engine unavailable: Hedge engine unreachable".
 *
 * `normalizeHedgeError` strips the redundant subject prefix so the UI
 * banner can render a single coherent sentence. Falls back to
 * "unreachable" when the resulting tail is empty so the headline
 * template always reads cleanly.
 */
export function normalizeHedgeError(raw: string | null | undefined): string {
  if (!raw) return 'unreachable'
  const stripped = raw.replace(/^\s*hedge\s+engine\s*[:\-]?\s*/i, '').trim()
  return stripped.length === 0 ? 'unreachable' : stripped
}

export function buildHedgeErrorHeadline(raw: string | null | undefined): string {
  const tail = normalizeHedgeError(raw)
  if (/^is\s+/i.test(tail)) return `Hedge engine ${tail}.`
  return `Hedge engine is ${tail}.`
}
