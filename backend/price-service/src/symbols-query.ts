import { normalizeSymbol } from './server';

/**
 * Maximum number of distinct symbols a single `?symbols=` query may
 * request. A 200-cap bounds both worst-case filter cost and wire-weight
 * of `body.invalidRequested` / `body.unmatched` arrays. The configured
 * deploy set is ~10 symbols today; the cap exists purely to defend
 * against hostile / accidental `?symbols=A,A,A,...` inputs. See task
 * 0077.
 */
export const MAX_REQUESTED_SYMBOLS = 200;

/**
 * Maximum number of distinct invalid tokens echoed verbatim in
 * `body.invalidRequested` (task 0090). Asymmetric with
 * `MAX_REQUESTED_SYMBOLS` (200, the total-token cap): wide enough to
 * surface a fat-fingered watchlist, narrow enough to bound the wire
 * weight (200 × ~6-byte tokens ≈ 2.5 KB pre-cap; 50 × ~6 bytes
 * ≈ 300 B post-cap). When the cap fires the handler ships
 * `body.invalidRequestedTotal` (count before slice) and
 * `body.invalidCap` so an operator polling for hostile floods sees
 * the volume without paying the wire cost.
 */
export const MAX_INVALID_REPORTED = 50;

/**
 * Outcome of parsing `?symbols=` on `GET /quotes`. `null` is the
 * sentinel for "no filter requested" — the unfiltered legacy path
 * runs unchanged. Otherwise the caller gets a partition of the
 * caller-supplied tokens into the validated set and the rejects
 * (preserved verbatim, post-trim, case-preserved so a typo round-trips
 * to the caller in a readable form).
 *
 * `presentButEmpty: true` (task 0088) marks the distinct case where
 * the query parameter was present on the wire but every token trimmed
 * to empty (`?symbols=`, `?symbols=   `, `?symbols=,,,`). The handler
 * uses this flag to emit `filterDiscarded: 'symbols-query-empty'`
 * rather than fall through to the unfiltered cache dump — a
 * client-side bug that built `?symbols=${arr.join(',')}` from an
 * empty array would otherwise silently pull every cached ticker.
 */
export interface ParsedSymbolsQuery {
  /** Distinct upper-cased symbols that passed `normalizeSymbol`. */
  readonly requested: readonly string[];
  /**
   * Distinct tokens that failed `normalizeSymbol` (trimmed,
   * original-case preserved). Deduped on the verbatim token (NOT the
   * upper-cased canonical) since invalid tokens have no canonical
   * form — `@@@` collapses; `Aaa#` and `aaa#` stay distinct so a
   * case-sensitive watchlist UI sees both typos. Capped at
   * `MAX_INVALID_REPORTED`; `invalidTotal` carries the pre-cap count.
   */
  readonly invalid: readonly string[];
  /** True when the requested+invalid total was capped at MAX_REQUESTED_SYMBOLS. */
  readonly capped: boolean;
  /** True iff the query was present on the wire but every token trimmed to empty (task 0088). */
  readonly presentButEmpty?: true;
  /** Count of DISTINCT invalid tokens before the MAX_INVALID_REPORTED slice (task 0090). */
  readonly invalidTotal: number;
  /** True when the distinct-invalid count exceeded MAX_INVALID_REPORTED (task 0090). */
  readonly invalidCapped: boolean;
}

/**
 * Normalise Express's `req.query.symbols` value into a flat list of
 * comma-separated tokens. `qs` (Express's default parser) yields one
 * of three shapes from the wire:
 *   - `?symbols=AAPL,MSFT`      → `'AAPL,MSFT'`
 *   - `?symbols=A&symbols=B`    → `['A', 'B']`
 *   - `?symbols=`               → `''`
 * The nested-object shape (`?symbols[foo]=bar`) is dropped: nested
 * `ParsedQs` carries no semantic value for a comma-list filter and
 * mapping it would invite quadratic parsing.
 */
function flattenRawSymbols(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const entry of raw) {
      if (typeof entry === 'string') out.push(entry);
    }
    return out;
  }
  return [];
}

/**
 * Parse `req.query.symbols` into a deduped requested-set and a
 * invalid-set partition.
 *
 * Three return shapes (task 0088 splits the previous merged `null`
 * branch):
 *   - `null` — query absent (Express never delivered a `symbols` key).
 *     The bulk `/quotes` handler runs its legacy unfiltered path.
 *   - `{ presentButEmpty: true, ... }` — query present on the wire but
 *     every token trimmed to empty (`?symbols=`, `?symbols=   `,
 *     `?symbols=,,,`). Handler emits `filterDiscarded` instead of
 *     falling through to the unfiltered dump.
 *   - `{ requested, invalid, capped }` — at least one usable token.
 *
 * Pipeline (in order):
 *   1. flatten array / string / undefined shapes from Express
 *   2. split each entry on `,`, trim each token, drop empties
 *   3. cap at `MAX_REQUESTED_SYMBOLS` total tokens (silent overflow
 *      shedding bounds hostile/accidental flooding)
 *   4. dedupe via upper-case key so `AAPL`+`aapl` collapse
 *   5. run each survivor through `normalizeSymbol` (the same validator
 *      `GET /quotes/:symbol` uses, so the shape + alnum gates align)
 *
 * `invalid` carries the original-case trimmed token so a typo like
 * `aapll` shows up readable. `requested` is upper-cased and deduped.
 */
export function parseSymbolsQuery(raw: unknown): ParsedSymbolsQuery | null {
  const flat = flattenRawSymbols(raw);
  if (flat.length === 0) return null;
  const tokens: string[] = [];
  for (const piece of flat) {
    for (const tok of piece.split(',')) {
      const trimmed = tok.trim();
      if (trimmed.length > 0) tokens.push(trimmed);
    }
  }
  if (tokens.length === 0) {
    return {
      requested: [],
      invalid: [],
      capped: false,
      presentButEmpty: true,
      invalidTotal: 0,
      invalidCapped: false,
    };
  }
  const capped = tokens.length > MAX_REQUESTED_SYMBOLS;
  const bounded = capped ? tokens.slice(0, MAX_REQUESTED_SYMBOLS) : tokens;
  // task 0090 — partition with TWO Sets: `seen` keyed by upper-cased
  // canonical so `AAPL` / `aapl` collapse; `invalidSeen` keyed by the
  // verbatim trimmed token because invalid tokens have no canonical
  // form. First-occurrence wins in either bucket so the order is
  // deterministic against the caller's input.
  const seen = new Set<string>();
  const invalidSeen = new Set<string>();
  const requested: string[] = [];
  const invalidAll: string[] = [];
  for (const tok of bounded) {
    const result = normalizeSymbol(tok);
    if (!result.ok) {
      if (invalidSeen.has(tok)) continue;
      invalidSeen.add(tok);
      invalidAll.push(tok);
      continue;
    }
    if (seen.has(result.symbol)) continue;
    seen.add(result.symbol);
    requested.push(result.symbol);
  }
  const invalidTotal = invalidAll.length;
  const invalidCapped = invalidTotal > MAX_INVALID_REPORTED;
  const invalid = invalidCapped
    ? invalidAll.slice(0, MAX_INVALID_REPORTED)
    : invalidAll;
  return { requested, invalid, capped, invalidTotal, invalidCapped };
}
