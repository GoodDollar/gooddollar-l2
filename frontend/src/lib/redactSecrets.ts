/**
 * Best-effort redaction for secrets and PII in user-submitted feedback.
 *
 * Pure, dependency-free — exported as a separate module so the unit tests
 * in `frontend/src/app/api/feedback/__tests__/route.test.ts` can pin
 * behaviour with deterministic fixtures.
 *
 * Coverage:
 *   - Hex private keys (0x + 64 hex)
 *   - 12/24-word BIP-39 mnemonics
 *   - JWTs (three base64url segments)
 *   - Bearer tokens, Authorization headers, `password=`/`api_key=` query/body
 *   - Email addresses
 *
 * Wallet addresses (0x + 40 hex) are **not** redacted: they are public
 * identifiers, and the feedback report intentionally captures the connected
 * wallet so we can correlate bug reports with on-chain activity.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 */

const PRIV_KEY_RE = /\b0x[a-fA-F0-9]{64}\b/g
// Mnemonics: 12 or 24 lowercase words separated by single spaces. We require
// the full 12/24-word run rather than touching any run of words so normal
// prose ("a few words of context") is not eaten.
const MNEMONIC_RE = /\b(?:[a-z]{3,12}\s){11}[a-z]{3,12}\b/g
const MNEMONIC_RE_24 = /\b(?:[a-z]{3,12}\s){23}[a-z]{3,12}\b/g
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
const BEARER_RE = /\b(bearer)\s+[A-Za-z0-9._\-+/=]+/gi
const AUTH_HEADER_RE = /\b(authorization)\s*[:=]\s*[^\s,;]+/gi
const KV_SECRET_RE = /\b(password|api[_-]?key|secret|token|access[_-]?token|refresh[_-]?token)\s*[=:]\s*[^\s,;&]+/gi
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

export const REDACTED = '[REDACTED]'

/**
 * Redacts secrets in a single string. Returns the string unchanged when no
 * patterns match. The order matters: longer/more-specific patterns first
 * so a JWT is not mistakenly partially redacted as a generic `token=` value.
 */
export function redactString(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return input
  let out = input
  out = out.replace(PRIV_KEY_RE, REDACTED)
  out = out.replace(MNEMONIC_RE_24, REDACTED)
  out = out.replace(MNEMONIC_RE, REDACTED)
  out = out.replace(JWT_RE, REDACTED)
  out = out.replace(BEARER_RE, `$1 ${REDACTED}`)
  out = out.replace(AUTH_HEADER_RE, `$1: ${REDACTED}`)
  out = out.replace(KV_SECRET_RE, (_m, k) => `${k}=${REDACTED}`)
  out = out.replace(EMAIL_RE, REDACTED)
  return out
}

/**
 * Recursively redacts every string leaf in a plain JSON-like value.
 * Non-string scalars (number/boolean/null) are returned as-is.
 */
export function redactDeep<T>(value: T): T {
  if (value == null) return value
  if (typeof value === 'string') return redactString(value) as unknown as T
  if (Array.isArray(value)) {
    return value.map((v) => redactDeep(v)) as unknown as T
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDeep(v)
    }
    return out as unknown as T
  }
  return value
}
