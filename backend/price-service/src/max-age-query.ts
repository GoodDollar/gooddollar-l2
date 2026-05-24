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

/**
 * Structured rejection reason on the `invalid` branch (task 0089).
 * The canonical `MAX_AGE_MS_REGEX` still owns the final accept /
 * reject decision; this enum classifies WHY a rejected input failed
 * so the wire message can name the specific rule the caller violated
 * instead of collapsing every shape error to one generic phrase.
 *
 * Order is significant for `classifyInvalid`: the first matching
 * pre-check wins so the wire surfaces ONE actionable fix per
 * response (e.g. `-1.5` → `negative`, not `decimal`).
 */
export type InvalidReason =
  | 'type'
  | 'empty'
  | 'leading-zero'
  | 'negative'
  | 'decimal'
  | 'too-many-digits'
  | 'non-numeric';

/**
 * Human-readable suffix appended to the canonical `invalid-max-age-ms`
 * 400 message so an integrator sees the exact rule that fired without
 * having to read `expected.pattern` character by character. Frozen so
 * a typo in a future edit fails at compile time.
 */
export const INVALID_REASON_MESSAGE_TAIL: Readonly<Record<InvalidReason, string>> =
  Object.freeze({
    type: 'saw a non-string (the query parameter was repeated; pass exactly one value)',
    empty: 'saw an empty string (omit ?maxAgeMs= to skip the freshness gate)',
    'leading-zero':
      "saw a non-positive integer (value must be >= 1; 0 means 'always stale' — omit)",
    negative: 'saw a negative integer (value must be >= 1)',
    decimal:
      'saw a decimal value (only whole milliseconds are accepted; round before sending)',
    'too-many-digits':
      'saw a value longer than 11 digits (cap is 99999999999 ms ≈ 3.17 years; pick a tighter budget)',
    'non-numeric':
      'saw a non-numeric value (only base-10 digits 0–9 are accepted)',
  });

export type ParsedMaxAgeMs =
  | { kind: 'absent' }
  | { kind: 'ok'; value: number }
  | { kind: 'invalid'; reason: InvalidReason };

/**
 * Classify why a non-empty string failed `MAX_AGE_MS_REGEX`. Pure
 * pre-check sequence — the canonical regex still owns the
 * accept/reject boundary; this routes the rejection to the right
 * sub-bucket so the wire message names the rule that fired.
 *
 * Order matters: the first matching check wins. `-1.5` classifies as
 * `negative` (not `decimal`) so the caller sees the sign issue first;
 * `030000` as `leading-zero` (not `non-numeric`) so the leading-zero
 * rule surfaces before the all-digits-too-long check.
 */
function classifyInvalid(raw: string): InvalidReason {
  if (raw.startsWith('-')) return 'negative';
  if (raw.includes('.')) return 'decimal';
  if (/^[0-9]+$/.test(raw)) {
    if (raw.length > 11) return 'too-many-digits';
    if (raw.startsWith('0')) return 'leading-zero';
  }
  return 'non-numeric';
}

/**
 * Parse a raw query value into a `ParsedMaxAgeMs` discriminated
 * union. Express types `req.query[k]` as `string | string[] |
 * ParsedQs | ParsedQs[] | undefined`; we accept only the `string`
 * shape so a `?maxAgeMs=30000&maxAgeMs=60000` (array via duplicate
 * key) doesn't sneak past the gate.
 *
 * task 0089: previously `?maxAgeMs=` (empty after trim) returned
 * `{ kind: 'absent' }` (silent skip). It now returns
 * `{ kind: 'invalid', reason: 'empty' }` with an omit-hint tail so
 * a templating bug that produced a bare `?maxAgeMs=` surfaces as a
 * 400 instead of being silently swallowed. Callers that need to
 * skip the gate must drop the query param entirely.
 */
export function parseMaxAgeMs(raw: unknown): ParsedMaxAgeMs {
  if (raw === undefined || raw === null) return { kind: 'absent' };
  if (typeof raw !== 'string') return { kind: 'invalid', reason: 'type' };
  if (raw.length === 0) return { kind: 'invalid', reason: 'empty' };
  if (!MAX_AGE_MS_REGEX.test(raw)) {
    return { kind: 'invalid', reason: classifyInvalid(raw) };
  }
  const n = Number(raw);
  // Belt-and-braces: the regex already requires `[1-9]` leading
  // digit so any accepted input is positive and finite; this guards
  // a future regex relaxation that would otherwise smuggle 0 or
  // NaN through.
  if (!Number.isFinite(n) || n <= 0) return { kind: 'invalid', reason: 'non-numeric' };
  return { kind: 'ok', value: Math.min(n, MAX_MAX_AGE_MS) };
}
