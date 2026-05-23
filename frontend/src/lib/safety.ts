/**
 * Frontend safety mirror — Lane 6 release-gate proof.
 *
 * Mirrors the `REAL_TRADING_ENABLED` constant from `backend/etoro-client/src/safety.ts`
 * (and the hedge-engine internal mirror). This is intentionally a literal `false`
 * type so any attempt to set it to `true` is a compile-time TypeScript error.
 *
 * The /live-prices-proof page cross-checks this value against the
 * `/api/safety-state` endpoint (which reads the server-side env). A mismatch
 * (either side reporting `true`) renders a refusal banner.
 */
export const REAL_TRADING_ENABLED: false = false

export const SAFETY_STATE_VERSION = 1 as const

export interface SafetyStateResponse {
  realTradingEnabled: boolean
  etoroMode: string
  version: number
}

/**
 * Allowed values for `ETORO_MODE` on any trading-capable path in this
 * release. Anything outside this set — including `'real'`, the empty
 * string, or any unknown label — must trip the proof page's refusal
 * banner. Mirrors `resolveMode` in `backend/etoro-client/src/auth.ts`,
 * which treats only `'real'` as the real-trading mode and folds
 * everything else into `'sandbox'`; here we go further and refuse to
 * normalise unknown values silently.
 */
export const ALLOWED_ETORO_MODES = ['sandbox', 'demo'] as const

export type AllowedEtoroMode = (typeof ALLOWED_ETORO_MODES)[number]

export function isEtoroModeAllowed(
  raw: string | null | undefined,
): raw is AllowedEtoroMode {
  if (typeof raw !== 'string') return false
  const normalised = raw.toLowerCase().trim()
  return (ALLOWED_ETORO_MODES as readonly string[]).includes(normalised)
}
