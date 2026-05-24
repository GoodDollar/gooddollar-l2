/**
 * Hedge error handling utilities.
 *
 * The component owns the subject ("Hedge engine …") in one place so backend
 * envelopes can send concise reasons without causing duplicated copy like
 * "Hedge engine Hedge engine unreachable".
 */
export function normalizeHedgeError(error: string | null | undefined): string {
  const raw = typeof error === 'string' ? error.trim() : ''
  if (!raw) return 'unreachable'

  const stripped = raw
    .replace(/^hedge engine(?:\s*[:\-—])?\s*/i, '')
    .trim()

  return stripped || 'unreachable'
}

function sentence(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

export function buildHedgeErrorHeadline(error: string | null | undefined): string {
  const reason = normalizeHedgeError(error)
  const lower = reason.toLowerCase()

  if (lower === 'unreachable') return 'Hedge engine is unreachable.'
  if (lower === 'no network connection') {
    return 'Hedge engine is unreachable: no network connection.'
  }
  if (lower === 'unreadable response') {
    return 'Hedge engine returned an unreadable response.'
  }
  if (lower.startsWith('is ')) return sentence(`Hedge engine ${reason}`)
  if (/^(returned|returning|timed out|timeout|unavailable|offline|failed|refused)\b/i.test(reason)) {
    return sentence(`Hedge engine ${reason}`)
  }

  // Preserve unrelated subjects verbatim: HTTP 500, upstream error (HTTP 500), etc.
  return sentence(reason)
}

export function classifyClientError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return 'request cancelled'
    if (err instanceof SyntaxError || /unexpected token|json|parse/i.test(err.message)) {
      return 'unreadable response'
    }
    if (
      err.name === 'TypeError' &&
      /failed to fetch|networkerror|network error|fetch failed/i.test(err.message)
    ) {
      return 'no network connection'
    }
    if (/econnrefused|econnreset|enotfound|etimedout|unreachable/i.test(err.message)) {
      return 'unreachable'
    }
    return normalizeHedgeError(err.message)
  }

  return 'unreachable'
}
