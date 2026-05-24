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

// Tails that already begin with a finite verb form (or a label-shaped
// continuation like "upstream") do NOT need an inserted "is " —
// otherwise the banner reads "Hedge engine is returned an error." or
// "Hedge engine is upstream error (HTTP 500)." Anything else keeps the
// legacy "is …" prefix so noun-shaped tails like "unreachable" /
// "HTTP 500" continue to render the same sentence they always have.
const FINITE_VERB_TAIL =
  /^(is|has|had|returned|returning|timed|timing|failed|crashed|stopped|went|upstream)\s+/i

export function buildHedgeErrorHeadline(raw: string | null | undefined): string {
  const tail = normalizeHedgeError(raw)
  if (FINITE_VERB_TAIL.test(tail)) return `Hedge engine ${tail}.`
  return `Hedge engine is ${tail}.`
}

/**
 * Maps a raw client-side error (browser-runtime / fetch / parse) to a
 * short branded tail that slots cleanly into `buildHedgeErrorHeadline`.
 *
 * Banner copy must never leak Chrome / Firefox / Safari runtime strings
 * (`Failed to fetch`, `NetworkError when attempting to fetch resource.`,
 * `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`) into the
 * operator's view. This classifier is the only place those strings are
 * tolerated; downstream rendering only sees a canonical tail.
 *
 * Tails are crafted so the headline template always reads as a single
 * grammatical sentence — either a finite-verb tail ("returned an
 * unreadable response", "timed out") or an "is …" tail
 * ("is unreachable — no network connection").
 */
export function classifyClientError(err: unknown): string {
  const raw = err instanceof Error ? err.message : ''
  if (/network|failed to fetch|load failed/i.test(raw)) {
    return 'is unreachable — no network connection'
  }
  if (/json|unexpected token|parse/i.test(raw)) {
    return 'returned an unreadable response'
  }
  if (/timeout|timed out/i.test(raw)) {
    return 'timed out'
  }
  return 'is unreachable'
}
