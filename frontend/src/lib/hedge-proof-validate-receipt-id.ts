/**
 * Lane 5 — receipt id structural validator (#0062).
 *
 * Used by `/api/hedge/proof/[receiptId]` to reject pathologically-shaped
 * ids before they trigger an engine round-trip. The engine remains the
 * source of truth for whether a well-formed id corresponds to a real
 * receipt; this gate only filters inputs the engine can never satisfy
 * (whitespace-only, control/format unicode, anything longer than the
 * documented cap).
 *
 * Receipt ids are routinely copy-pasted from chat, email, audit
 * tickets — pipelines that frequently inject zero-width-spaces, BOMs,
 * stray newlines, or trailing whitespace. Without this gate the
 * operator sees a misleading `engine_down` / `no_proof` card instead
 * of "Receipt id was rejected".
 */

export interface ValidateReceiptIdOk {
  ok: true
  id: string
}

export interface ValidateReceiptIdErr {
  ok: false
  reason: string
}

export type ValidateReceiptIdResult =
  | ValidateReceiptIdOk
  | ValidateReceiptIdErr

const MAX_RECEIPT_ID_LENGTH = 256

// `\p{C}` matches Cc (control), Cf (format), Cn (unassigned), Co
// (private-use), Cs (surrogate). That covers null bytes, ASCII
// control chars (\t, \n, \r, …), the bidi/joiner family
// (\u200B-\u200F), the BOM (\uFEFF), and other invisible characters
// that survive URL encoding but are structurally unusable as ids.
const CONTROL_OR_FORMAT = /\p{C}/u

export function validateReceiptId(raw: string): ValidateReceiptIdResult {
  const input = raw ?? ''
  // Check the raw input first: `String.prototype.trim()` strips
  // \n, \r, \t, BOM, and other whitespace-class characters, so they
  // would otherwise vanish before the control/format check fires.
  if (CONTROL_OR_FORMAT.test(input)) {
    return { ok: false, reason: 'Receipt id contains invalid characters' }
  }
  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return {
      ok: false,
      reason: 'Receipt id is empty or whitespace-only',
    }
  }
  if (trimmed.length > MAX_RECEIPT_ID_LENGTH) {
    return { ok: false, reason: 'Receipt id is too long' }
  }
  return { ok: true, id: trimmed }
}
