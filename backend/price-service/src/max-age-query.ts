/**
 * Parser for the `?maxAgeMs=` query gate on `GET /quotes/:symbol`
 * (task 0081). Pure, dep-free, exhaustively tested. Output is a
 * tagged union so the caller exhaustively handles {absent, ok,
 * invalid} without smuggling control flow through a sentinel value.
 */

/**
 * Hard upper bound (24 h) on the parsed `maxAgeMs` value. Acts as a
 * silent clamp on overflow — a hostile or accidental
 * `?maxAgeMs=999999999999` collapses to 86_400_000 rather than
 * bypassing the gate by overflowing into never-fires territory.
 */
export const MAX_MAX_AGE_MS = 86_400_000;

/**
 * Strict-positive-integer regex. Forbids leading zeros, `0`,
 * negatives, decimals, exponents. Capped at 11 digits (10 base-10
 * digits + first non-zero digit) — well above the 24 h ms cap while
 * staying safely under `Number.MAX_SAFE_INTEGER`.
 */
export const MAX_AGE_MS_REGEX = /^[1-9][0-9]{0,10}$/;

export type ParsedMaxAgeMs =
  | { kind: 'absent' }
  | { kind: 'ok'; value: number }
  | { kind: 'invalid'; reason: 'type' | 'shape' };

/**
 * Parse a raw query value into a `ParsedMaxAgeMs` discriminated
 * union. Express types `req.query[k]` as `string | string[] |
 * ParsedQs | ParsedQs[] | undefined`; we accept only the `string`
 * shape so a `?maxAgeMs=30000&maxAgeMs=60000` (array via duplicate
 * key) doesn't sneak past the gate.
 */
export function parseMaxAgeMs(raw: unknown): ParsedMaxAgeMs {
  if (raw === undefined || raw === null || raw === '') return { kind: 'absent' };
  if (typeof raw !== 'string') return { kind: 'invalid', reason: 'type' };
  if (!MAX_AGE_MS_REGEX.test(raw)) return { kind: 'invalid', reason: 'shape' };
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return { kind: 'invalid', reason: 'shape' };
  return { kind: 'ok', value: Math.min(n, MAX_MAX_AGE_MS) };
}
