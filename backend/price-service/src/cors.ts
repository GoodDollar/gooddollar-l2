/**
 * CORS preflight `Access-Control-Allow-Headers` policy. Reflects the
 * client-requested headers (sanitised per-token via `ALLOW_HEADER_TOKEN_REGEX`)
 * when present, falls back to a fixed default list otherwise. The
 * default list is shipped to browser fetch() consumers that issue a
 * preflight without specifying custom headers — Polygon's broad
 * `Content-Type, Authorization, X-Request-Id, Cache-Control, Accept,
 * Prefer` set covers every common request pattern out of the box.
 * See task 0079.
 */

/**
 * Default fixed Allow-Headers set for the OPTIONS preflight when the
 * client omits `Access-Control-Request-Headers`. Wide enough to cover
 * every reasonable browser fetch() pattern (correlation, auth, cache
 * override, content negotiation) so consumers don't have to know
 * which headers the server explicitly allows.
 */
export const DEFAULT_CORS_ALLOW_HEADERS: readonly string[] = Object.freeze([
  'Content-Type',
  'Authorization',
  'X-Request-Id',
  'Cache-Control',
  'Accept',
  'Prefer',
]);

/**
 * Safe-token gate for per-header reflection. Matches the same alphabet
 * as `REQUEST_ID_REGEX` so a malicious `Access-Control-Request-Headers:
 * X-Inject: foo\r\nSet-Cookie: x` token can't slip through Node's
 * `setHeader` (which strips CR/LF, but defence-in-depth).
 */
export const ALLOW_HEADER_TOKEN_REGEX = /^[a-zA-Z0-9_\-]{1,128}$/;

/**
 * Bound on the number of distinct allow-headers tokens echoed in the
 * preflight response. 32 is plenty for any legitimate consumer; cap
 * exists purely to defend against a hostile preflight flooding the
 * response with 100s of garbage tokens.
 */
export const MAX_ALLOWED_HEADER_TOKENS = 32;

/**
 * Normalise Express's `req.headers['access-control-request-headers']`
 * into a list of safe tokens. `qs` / Node yield one of three shapes:
 *   - `'X-Request-Id, Authorization'`   (string)
 *   - `['X-Request-Id', 'Authorization']` (string[] from duplicate)
 *   - `undefined`
 * Output is deduped (case-insensitive key, case-preserved value),
 * regex-gated per token, and capped at `MAX_ALLOWED_HEADER_TOKENS`.
 * When the input is absent / empty / all tokens drop, the caller
 * receives a copy of `DEFAULT_CORS_ALLOW_HEADERS` instead.
 */
export function parseAllowedHeaders(
  raw: string | string[] | undefined,
): readonly string[] {
  if (raw === undefined) return DEFAULT_CORS_ALLOW_HEADERS;
  const inputs = Array.isArray(raw) ? raw : [raw];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of inputs) {
    for (const tok of piece.split(',')) {
      const trimmed = tok.trim();
      if (trimmed.length === 0) continue;
      if (!ALLOW_HEADER_TOKEN_REGEX.test(trimmed)) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
      if (out.length >= MAX_ALLOWED_HEADER_TOKENS) {
        return out;
      }
    }
  }
  if (out.length === 0) return DEFAULT_CORS_ALLOW_HEADERS;
  return out;
}
