/**
 * Symbol-ticker normalisation helpers. Extracted from `server.ts` so
 * downstream modules (`symbols-query.ts`, future per-symbol filter
 * helpers) can import the validator without pulling on the full HTTP
 * surface — avoids a circular import when `server.ts` re-imports a
 * helper that itself wants the gate.
 *
 * Public re-exports stay in `server.ts` so existing callers continue
 * to import `normalizeSymbol`/`ASCII_TICKER_RAW_SOURCE`/`nearestSymbol`
 * from `./server` unchanged.
 */

/**
 * Raw-input shape gate: pre-fold ASCII-only check. Run BEFORE
 * `.toUpperCase()` so JavaScript's full Unicode case-fold (which
 * expands `ß → SS`, Latin ligatures → ASCII letters, `ı → I`) cannot
 * silently rewrite caller input into something the post-fold regex
 * would accept.
 */
export const ASCII_TICKER_RAW_SOURCE = '[A-Za-z0-9._-]{1,16}';
export const ASCII_TICKER_RAW = new RegExp(`^${ASCII_TICKER_RAW_SOURCE}$`);

/**
 * Combined-gate regex source published as the wire `expected.pattern`
 * so a single `new RegExp(body.expected.pattern).test(input)`
 * reproduces the server's `normalizeSymbol` verdict bit-for-bit.
 */
export const ASCII_TICKER_FULL_SOURCE = `^(?=.*[A-Za-z0-9])${ASCII_TICKER_RAW_SOURCE}$`;

/** At least one alphanumeric — rejects `....`, `----`, `.-_`. */
const HAS_ALNUM = /[A-Za-z0-9]/;

/** Post-upper-case sanity gate (defensive — unreachable in practice). */
const VALID_SYMBOL = /^[A-Z0-9._-]{1,16}$/;

export type NormalizeSymbolResult =
  | { ok: true; symbol: string }
  | { ok: false; reason: 'shape' | 'no-alnum' };

/**
 * Two-row Levenshtein edit distance with bounded scan. Returns
 * `limit + 1` immediately when the size delta exceeds the limit, so
 * the caller can short-circuit without paying for the DP.
 */
function levenshtein(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  if (a === b) return 0;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Find the closest configured symbol to a typo'd input. Threshold is
 * `max(2, floor(input.length * 0.3))`. Returns `undefined` (NOT
 * `null`) when no candidate clears the threshold so the wire envelope
 * can omit the field entirely.
 */
export function nearestSymbol(
  input: string,
  symbols: readonly string[],
): string | undefined {
  if (symbols.length === 0) return undefined;
  const threshold = Math.max(2, Math.floor(input.length * 0.3));
  let bestDist = Infinity;
  let bestSym: string | undefined;
  for (const sym of symbols) {
    const d = levenshtein(input, sym, threshold);
    if (d < bestDist) {
      bestDist = d;
      bestSym = sym;
      if (d === 0) break;
    }
  }
  return bestDist <= threshold ? bestSym : undefined;
}

/**
 * Run the two-gate validator (shape + alnum) over a raw ticker input
 * and emit the canonical (upper-cased) symbol on success, or the
 * specific reason on failure so the 400 envelope can pick the right
 * `message`.
 */
export function normalizeSymbol(raw: string): NormalizeSymbolResult {
  if (typeof raw !== 'string') return { ok: false, reason: 'shape' };
  if (raw.length === 0 || raw.length > 16) return { ok: false, reason: 'shape' };
  if (!ASCII_TICKER_RAW.test(raw)) return { ok: false, reason: 'shape' };
  if (!HAS_ALNUM.test(raw)) return { ok: false, reason: 'no-alnum' };
  const upper = raw.toUpperCase();
  if (!VALID_SYMBOL.test(upper)) return { ok: false, reason: 'shape' };
  return { ok: true, symbol: upper };
}
