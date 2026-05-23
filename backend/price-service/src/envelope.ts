import { SanitizedSourceStatus } from './source-status';
import { isoFromMs } from './iso';

/**
 * The two meta fields that ride on every response, regardless of
 * endpoint or status code. JSON object iteration order is guaranteed
 * insertion-order for string keys (ES2015+, honoured by V8, jq, and
 * every modern JSON consumer); appending these LAST anchors the eye
 * trail at the bottom of every body.
 */
export interface MetaTail {
  timestamp: number;
  timestampIso: string;
}

/**
 * Operator-facing block for a WebSocket broadcaster advertisement. Held
 * here rather than in `server.ts` so the envelope helper has a stable
 * type to point at without forcing a circular import.
 */
export interface WsAdvertisementShape {
  url: string;
  port: number;
  frames: readonly ['snapshot', 'quote'];
  snapshot: string;
  quote: string;
}

export interface WsErrorShape {
  reason: string;
  port: number;
  humanReason: string;
  nextStep: string;
  severity: 'info' | 'degraded' | 'critical';
}

/**
 * Per-request bag of optional meta fields the envelope appends in
 * canonical order. Every field is optional — handlers pass only the
 * ones their endpoint produces. The helper writes them in the order
 * listed below (NOT the order the caller passes them in), so a fresh
 * integrator running `curl ... | jq` across endpoints sees the same
 * scaffolding in the same place every time.
 *
 * Canonical order, last to first:
 *   1. `source` — upstream-source verdict.
 *   2. `websocket` — live broadcaster advertisement.
 *   3. `websocketError` — bind-failed diagnostic (mutually exclusive
 *      with `websocket`).
 *   4. `status` — string verdict (`ok` | `degraded`) used by most
 *      endpoints.
 *   5. `healthy` — boolean verdict used by `/status/quotes`. Distinct
 *      slot so an endpoint that emits both (none today) would still
 *      place them adjacent.
 *   6. `bootAtMs` + `bootAtIso` + `uptimeMs` — lifecycle triplet.
 *   7. `deprecations` — drift-signal map shipped on endpoints that
 *      carry legacy aliases (e.g. `/quotes.count` → `totalCached`).
 *   8. `timestamp` + `timestampIso` — wall-clock instant; ALWAYS the
 *      last two top-level keys.
 */
export interface EnvelopeCtx {
  src?: SanitizedSourceStatus;
  ws?: WsAdvertisementShape;
  wsErr?: WsErrorShape;
  status?: 'ok' | 'degraded';
  healthy?: boolean;
  boot?: { ms: number; iso: string; uptimeMs: number };
  deprecations?: Record<string, string>;
}

// Re-exported so the existing `server.ts` import surface keeps working
// without forcing every test file to switch imports.
export { isoFromMs };

/**
 * Re-anchor a single key at the end of `body`. JavaScript objects keep
 * insertion order, so plain reassignment to an existing key would
 * leave the value at its original slot — the only way to move it is
 * `delete` + reassign. The helper centralises that pattern so the
 * envelope code can read top-to-bottom without `delete` noise.
 */
function reanchor(body: Record<string, unknown>, key: string, value: unknown): void {
  if (key in body) delete body[key];
  body[key] = value;
}

/**
 * Anchor `timestamp` + `timestampIso` at the end of any body. Used by
 * error paths (catch-all 404, 405, error middleware) and the docs
 * endpoint where no other meta applies. Returns the mutated `body` so
 * `return res.json(finalizeTimestamps(body, now))` reads top-to-bottom.
 */
export function finalizeTimestamps<T extends Record<string, unknown>>(
  body: T,
  now: number,
): T & MetaTail {
  reanchor(body as Record<string, unknown>, 'timestamp', now);
  reanchor(body as Record<string, unknown>, 'timestampIso', isoFromMs(now)!);
  return body as T & MetaTail;
}

/**
 * Append the meta tail in canonical order. Every endpoint with a
 * meta-bearing context routes through here so the four scaffolding
 * fields (`source`/`status`/`bootAt`-block/`timestamp`) appear at the
 * same vertical position on every response — `at(-2)` is always
 * `timestamp`, `at(-1)` is always `timestampIso`.
 *
 * Only the meta keys the caller passes in `ctx` are re-anchored; a
 * pre-existing key the caller is NOT overwriting stays in its original
 * payload slot. This is important for `/quotes/:symbol` 200, where the
 * spread `NormalizedQuote.source` field (literal `'etoro'`) must stay
 * in the payload when no upstream-status getter is wired.
 */
export function finalizeEnvelope<T extends Record<string, unknown>>(
  body: T,
  now: number,
  ctx?: EnvelopeCtx,
): T & MetaTail {
  const b = body as Record<string, unknown>;
  if (ctx?.src) reanchor(b, 'source', ctx.src);
  if (ctx?.ws) reanchor(b, 'websocket', ctx.ws);
  if (ctx?.wsErr) reanchor(b, 'websocketError', ctx.wsErr);
  if (ctx?.status !== undefined) reanchor(b, 'status', ctx.status);
  if (ctx?.healthy !== undefined) reanchor(b, 'healthy', ctx.healthy);
  if (ctx?.boot) {
    reanchor(b, 'bootAtMs', ctx.boot.ms);
    reanchor(b, 'bootAtIso', ctx.boot.iso);
    reanchor(b, 'uptimeMs', ctx.boot.uptimeMs);
  }
  if (ctx?.deprecations) reanchor(b, 'deprecations', ctx.deprecations);
  return finalizeTimestamps(body, now);
}
