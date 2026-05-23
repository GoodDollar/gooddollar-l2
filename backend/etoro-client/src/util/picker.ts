/**
 * Shared payload-extraction helpers for the eToro SDK.
 *
 * Centralizes the picking of string, identity, numeric, and timestamp
 * fields off raw HTTP / WebSocket envelopes so both `MarketDataModule`
 * and `InstrumentResolver` apply the same parsing and the same
 * malformed-data guards.
 */

/**
 * Outcome of parsing a payload field. `'absent'` means none of the
 * candidate keys were present; `'invalid'` means a key was present but
 * the value was unusable (empty/blank string, numeric zero, non-finite).
 * The reason distinction lets callers route absence and corruption
 * through different recovery paths (e.g. fall back to a sibling field
 * for absent ids, but drop the record entirely for invalid ones).
 */
export type PickResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'absent' | 'invalid' };

/**
 * Grace window for quote timestamps that arrive slightly ahead of the
 * local wall clock (NTP drift, upstream skew). A timestamp beyond
 * `now + FUTURE_TIMESTAMP_GRACE_MS` is treated as malformed.
 */
export const FUTURE_TIMESTAMP_GRACE_MS = 30_000;

/**
 * Result of parsing a timestamp field off a raw payload. The
 * discriminated shape lets callers route the three malformed cases
 * (`absent`, `negative`, `future`) through the same drop pipeline with
 * a precise audit reason key.
 */
export type TimestampResult =
  | { ok: true; ms: number }
  | { ok: false; reason: 'absent' | 'negative' | 'future' };

/** Coerce an `unknown` into a record, or return an empty record. */
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/**
 * Pick the first usable string value from the given keys. Accepts a
 * non-blank string or any finite number (stringified). Use for
 * lenient fields like `currency` and `assetClass` where a fallback
 * default (`'USD'`, `'unknown'`) absorbs any odd shape.
 *
 * For identity fields (`symbol`, `instrumentId`) use `pickStrId`
 * instead — it rejects numeric zero and empty strings, which would
 * otherwise collide unrelated symbols under a single cache key.
 */
export function pickStr(src: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const k of keys) {
    const v = src[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

/**
 * Pick the first usable identity-field value from the given keys. A
 * key is treated as `invalid` (not `absent`) when present-but-unusable:
 * empty/blank string, numeric zero, or non-finite number. Numeric ids
 * must be `> 0` so a buggy adapter that emits `instrumentId: 0`
 * triggers the same malformed-quote drop as a missing id rather than
 * collapsing unrelated symbols into the `'0'` cache slot.
 */
export function pickStrId(src: Record<string, unknown>, keys: readonly string[]): PickResult<string> {
  let sawKey = false;
  for (const k of keys) {
    if (!(k in src)) continue;
    sawKey = true;
    const v = src[k];
    if (typeof v === 'string' && v.trim()) return { ok: true, value: v.trim() };
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return { ok: true, value: String(v) };
  }
  return sawKey ? { ok: false, reason: 'invalid' } : { ok: false, reason: 'absent' };
}

/**
 * Pick the first numeric value from the given keys. Accepts a finite
 * number directly or a comma-stripped string. Returns `undefined` if
 * no key yields a parseable number. `0` is accepted deliberately — a
 * zero price is a valid placeholder for a missing bid/ask side that
 * the confidence scorer drops to 0.
 */
export function pickNum(src: Record<string, unknown>, keys: readonly string[]): number | undefined {
  for (const k of keys) {
    const v = src[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const parsed = Number(v.replace(/,/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

/**
 * Parse a timestamp field off a raw payload, returning a discriminated
 * result so the caller can route malformed cases through their drop
 * pipeline with a precise reason key.
 *
 * Rejected as malformed:
 *   - field absent or unparseable                  → reason 'absent'
 *   - negative timestamp                           → reason 'negative'
 *   - timestamp > now + FUTURE_TIMESTAMP_GRACE_MS  → reason 'future'
 */
export function pickTimestamp(src: Record<string, unknown>, now: number): TimestampResult {
  const raw = src.date ?? src.timestamp ?? src.updatedAt ?? src.time ?? src.lastUpdate;
  let ms: number | null = null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    ms = raw > 10_000_000_000 ? raw : raw * 1000;
  } else if (typeof raw === 'string' && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) ms = parsed;
  }
  if (ms === null) return { ok: false, reason: 'absent' };
  if (ms < 0) return { ok: false, reason: 'negative' };
  if (ms > now + FUTURE_TIMESTAMP_GRACE_MS) return { ok: false, reason: 'future' };
  return { ok: true, ms };
}
