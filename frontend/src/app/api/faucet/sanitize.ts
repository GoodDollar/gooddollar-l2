/**
 * Faucet response/log sanitization helpers (iter-33 task 0046).
 *
 * The public /api/faucet endpoint used to echo `error.message` from the
 * catch-all 500 branch straight back to the client. For viem errors this
 * leaks: package version, operator EOA, RPC URL, calldata, and full
 * stack-trace-like context.
 *
 * These helpers exist so the route handler can:
 *   1. Return a fixed user-safe message regardless of the underlying error.
 *   2. Emit a short correlation `errorId` that ties the user-facing response
 *      to the full server-side `console.error` line.
 *   3. Redact the recipient address in success logs so shared PM2 logs
 *      don't double as a recipient leak.
 *
 * They are intentionally tiny and pure — the contract is pinned by
 * `__tests__/sanitize.test.ts`.
 */
import { randomBytes } from 'crypto'

/**
 * The single user-safe message returned for any uncaught faucet error.
 * Kept as a module constant so tests and runtime share one source of truth.
 */
const GENERIC_FAUCET_ERROR_MESSAGE =
  'Faucet request failed. Please try again later.'

/**
 * Returns a fixed user-safe error message regardless of input. The raw
 * input is intentionally discarded — the full detail is logged
 * server-side via `console.error` with the matching `errorId`.
 */
export function sanitizeFaucetError(_rawMessage: unknown): string {
  return GENERIC_FAUCET_ERROR_MESSAGE
}

/**
 * Generates an 8-character lowercase hex correlation id. Used to tie a
 * sanitized 500 response back to the full error logged on the server.
 *
 * 32 bits of entropy → ~65k entries before 1% collision probability,
 * which is multiple orders of magnitude beyond expected faucet failure
 * volume.
 */
export function generateErrorId(): string {
  return randomBytes(4).toString('hex')
}

/**
 * Shortens a 0x-prefixed Ethereum address to `0xXXXX…YYYY` form for use
 * in server logs. Tx hashes are already logged alongside, so the full
 * recipient is always recoverable via the explorer — this is logging
 * hygiene, not a privacy guarantee.
 *
 * Falls back to:
 *   - the input unchanged if it's a string too short to shorten
 *   - the literal `"unknown"` for non-string input
 */
export function shortenAddress(addr: unknown): string {
  if (typeof addr !== 'string') return 'unknown'
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
