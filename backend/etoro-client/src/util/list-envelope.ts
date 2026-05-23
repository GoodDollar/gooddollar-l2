/**
 * Canonical envelope-key list used by every read endpoint in the SDK
 * that returns an array. The order is significant: `readListEnvelope`
 * scans this list and returns on the first key whose value is an
 * array, so callers can predict which key wins when an envelope
 * happens to carry several recognized keys.
 *
 * Adding a new key here is the documented place to handle eToro
 * schema drift surfaced via the malformed-list audit signal.
 */
export const LIST_ENVELOPE_KEYS = [
  'data',
  'items',
  'results',
  'instruments',
  'quotes',
  'candles',
  'positions',
  'orders',
  'trades',
  'history',
] as const;

export type EnvelopeOutcome =
  | { kind: 'array'; items: unknown[] }
  | { kind: 'envelope'; items: unknown[]; key: string }
  | {
      kind: 'malformed';
      observedShape: 'null' | 'primitive' | 'object-no-match';
      topLevelKeys: string[];
    };

/**
 * Classify a 200-OK response body without ever throwing. Returns one of
 * three outcomes so callers can branch on `kind` and distinguish "the
 * API returned an empty list" (`array` / `envelope` with empty items)
 * from "the API returned a 200 with an unrecognized shape" (`malformed`).
 *
 * The helper is pure and synchronous. Hostile inputs (`Symbol`,
 * functions, primitives, `null`, `undefined`, exotic objects) all map
 * to a `malformed` variant rather than throwing — schema-drift
 * surfacing is the whole point of this helper.
 */
export function readListEnvelope(
  data: unknown,
  allowedKeys: readonly string[],
): EnvelopeOutcome {
  if (Array.isArray(data)) return { kind: 'array', items: data };
  if (data === null || data === undefined) {
    return { kind: 'malformed', observedShape: 'null', topLevelKeys: [] };
  }
  if (typeof data !== 'object') {
    return { kind: 'malformed', observedShape: 'primitive', topLevelKeys: [] };
  }
  const record = data as Record<string, unknown>;
  for (const key of allowedKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return { kind: 'envelope', items: value, key };
    }
  }
  return {
    kind: 'malformed',
    observedShape: 'object-no-match',
    topLevelKeys: Object.keys(record).sort(),
  };
}
