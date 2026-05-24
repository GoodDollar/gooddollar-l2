import express, { NextFunction, Request, Response } from 'express';
import compression from 'compression';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG, IngestStats, SourceStatus } from './types';
import {
  enrichWsReason,
  ERROR_REASONS_PUBLIC,
  RETRY_AFTER_SECONDS_BY_SEVERITY,
  sanitizeSourceStatus,
  SanitizedSourceStatus,
  SOURCE_REASONS_PUBLIC,
  SourceSeverity,
} from './source-status';
import { RuntimeBlock } from './runtime';
import {
  EnvelopeCtx,
  finalizeEnvelope,
  finalizeTimestamps,
  isoFromMs,
} from './envelope';
import { WsAdvertisement, WsHostnameSource } from './ws-advertisement';
import { buildQuickstart } from './quickstart';

// Re-export the quickstart + WS types and helpers off `./server` so
// existing test imports (`from '../server'`) keep compiling. The
// canonical home is `./quickstart` and `./ws-advertisement`; this
// barrel exists only for back-compat with pre-extraction call sites.
export type { QuickstartStep } from './quickstart';
export {
  STATIC_QUICKSTART,
  buildQuickstart,
  buildWsQuickstartAlternatives,
  buildWsQuickstartStep,
} from './quickstart';
export type { WsAdvertisement, WsHostnameSource } from './ws-advertisement';

// Re-exported so the existing public surface keeps working: tests and
// downstream callers can keep importing `isoFromMs` from `./server`.
export { isoFromMs };

export type IngestStatsGetter = () => IngestStats;
export type SourceStatusGetter = () => SourceStatus;
export type BootAtGetter = () => number;
export type WsAddressGetter = () => { port: number; host?: string };
export type WsStatusGetter = () => {
  listening: boolean;
  bindError: string | null;
  port: number | null;
};
export type RuntimeGetter = () => RuntimeBlock;

/**
 * Operator-facing block shipped on `/` and `/health` when the broadcaster
 * has failed to bind. Mutually exclusive with the `websocket` block: when
 * one is present, the other is absent.
 */
export interface WsErrorBlock {
  reason: string;
  port: number;
  humanReason: string;
  nextStep: string;
  severity: SourceSeverity;
}

/**
 * Frame schema docs for the WS broadcaster, surfaced on both `GET /` and
 * `GET /health` so an integrator who finds only the REST URL can still
 * discover the live-tick feed without cloning the repo. The strings are
 * coupled to the broadcaster contract in `ws-broadcaster.ts`; any future
 * frame-shape change there must also update this constant.
 */
const WS_FRAME_DOCS = {
  snapshot:
    "sent on connect; { type:'snapshot', data: NormalizedQuote[], " +
    'count, source?, timestamp, timestampIso }',
  quote:
    "broadcast per accepted tick; " +
    "{ type:'quote', data: NormalizedQuote, timestamp, timestampIso }",
} as const;

/**
 * Pull the bare hostname out of an HTTP `Host:` header so we can rewrite
 * the port for the WS advertisement. Strips the trailing `:port`,
 * preserves bracketed IPv6 literals (`[::1]:3122` → `[::1]`), and falls
 * back to `localhost` when the header is missing (some raw `http.request`
 * paths don't send one).
 *
 * NOTE: this parser does NOT validate the remaining hostname against
 * the RFC 1123 character set — that gate lives in
 * `resolveAdvertisedHostname` (task 0062) so a malicious `Host: foo bar`
 * value falls back to the allowlist default rather than being echoed
 * verbatim into `ws://foo bar:9301`.
 */
export function hostnameFromHostHeader(h: string | undefined): string {
  if (!h) return 'localhost';
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end > 0 ? h.slice(0, end + 1) : h;
  }
  const idx = h.indexOf(':');
  return idx > 0 ? h.slice(0, idx) : h;
}

/**
 * Default `PRICE_SERVICE_HOSTNAME_ALLOWLIST`. When the env var is unset
 * (typical local-dev path), these three values keep `curl
 * http://localhost:3122/` and the in-process integration tests working
 * without any configuration. A production deploy that wants to use the
 * `Host:` header (e.g. when behind a trusted reverse proxy that pins
 * the header) overrides this with a deploy-specific list.
 */
export const DEFAULT_HOSTNAME_ALLOWLIST: readonly string[] = Object.freeze([
  'localhost',
  '127.0.0.1',
  '[::1]',
]);

/**
 * Validity gate for a header-supplied hostname. Accepts the conservative
 * superset of RFC 1123 LDH characters plus the colon + brackets that
 * `hostnameFromHostHeader` preserves for IPv6 literals (`[::1]`).
 * Anything that contains whitespace, control characters, or a literal
 * `/` is rejected — those can never be a valid hostname and are the
 * exact poisoning vectors the live reproducer demonstrated.
 */
const VALID_HEADER_HOSTNAME = /^[A-Za-z0-9.\-_:[\]]+$/;

export type HostnameSource = WsHostnameSource;

export interface ResolvedHostname {
  hostname: string;
  source: HostnameSource;
}

/**
 * Resolve the advertised hostname through the three-step gate
 * (task 0062):
 *
 *   1. **env pin wins**. When `PRICE_SERVICE_PUBLIC_HOSTNAME` is set, it
 *      overrides any inbound `Host:` header — a misbehaving proxy or a
 *      direct attacker can't influence the advertisement.
 *   2. **validity gate**. The header value must round-trip through
 *      `VALID_HEADER_HOSTNAME`; whitespace, control chars, and `/`
 *      collapse to the allowlist default.
 *   3. **allowlist gate**. The validated value must appear in the
 *      allowlist (case-insensitive); on a miss, fall through to the
 *      first allowlist entry.
 *
 * Returned `source` is the verdict an operator can read off the wire to
 * confirm the deploy is fenced.
 */
export function resolveAdvertisedHostname(args: {
  headerHostname: string;
  envPin?: string;
  allowlist: readonly string[];
}): ResolvedHostname {
  const { headerHostname, envPin, allowlist } = args;
  if (envPin && envPin.length > 0) {
    return { hostname: envPin, source: 'env-pinned' };
  }
  const fallback = allowlist[0] ?? 'localhost';
  if (!VALID_HEADER_HOSTNAME.test(headerHostname)) {
    return { hostname: fallback, source: 'allowlist-default' };
  }
  const loweredHeader = headerHostname.toLowerCase();
  for (const entry of allowlist) {
    if (entry.toLowerCase() === loweredHeader) {
      return { hostname: headerHostname, source: 'host-header' };
    }
  }
  return { hostname: fallback, source: 'allowlist-default' };
}

/**
 * Top-level discovery copy for `GET /`. Static so the body assembly stays a
 * single object literal and the docs can't drift between handler + README.
 */
const SERVICE_DESCRIPTION =
  'Normalizes eToro market data, applies risk filters, caches the latest ' +
  'quote per symbol, and exposes REST + WebSocket feeds for downstream ' +
  'consumers (oracle-signer, frontend).';

const DOCS_URL =
  'https://github.com/goodchain/goodchain-live-prices-lanes/blob/' +
  'ab/0007-lane2-price-service/backend/price-service/README.md';

/**
 * Pull the version string off a `package.json`-shaped object. Defaults to
 * a real `require('../package.json')` so the server can be wired with
 * zero arguments; the injection point exists so tests can exercise the
 * fallback branch without monkey-patching the module loader.
 *
 * Returns the literal `'unknown'` on any throw or shape mismatch so the
 * discovery payload always carries a string and never crashes boot.
 */
export function readPackageVersion(
  pkgRequire: () => unknown = () => require('../package.json'),
): string {
  try {
    const pkg = pkgRequire();
    if (
      pkg !== null &&
      typeof pkg === 'object' &&
      'version' in pkg &&
      typeof (pkg as { version: unknown }).version === 'string'
    ) {
      return (pkg as { version: string }).version;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

const PACKAGE_VERSION = readPackageVersion();

/**
 * Single source of truth for every endpoint the service exposes. The
 * discovery payload (`GET /`), the 404 hint list, and the 405 method
 * dispatch all read off this one array — there's no second place to
 * forget when a new endpoint lands.
 *
 * Summaries are one-line operator hints; the wire contract caps them at
 * 140 chars (asserted in the test suite) so a grep through the live
 * discovery payload stays readable.
 *
 * `responseShape` is a compact TypeScript-ish sketch of the JSON the
 * endpoint returns; capped at 240 chars so a fresh integrator reading
 * `GET /` can write the consumer types without a second request.
 *
 * `parametric: true` marks routes whose path shape carries a placeholder
 * (`/quotes/:symbol`). They are matched by a single regex below rather
 * than by exact-string lookup.
 */
export interface EndpointDoc {
  path: string;
  methods: readonly string[];
  summary: string;
  responseShape: string;
  parametric?: boolean;
}

export const ENDPOINT_CATALOG: readonly EndpointDoc[] = [
  {
    path: '/',
    methods: ['GET'],
    summary: 'Service discovery: lists endpoints, version, docs.',
    responseShape:
      '{service,description,version,docs,runtime?,endpoints[],' +
      'quickstart[],sourceReasonCatalog,source?,websocket?,' +
      "websocketError?,status:'ok'|'degraded',timestamp,timestampIso}",
  },
  {
    path: '/health',
    methods: ['GET'],
    summary: 'Liveness + readiness for load balancers; 503 when degraded.',
    // Inner field list is comma-packed (no surrounding spaces) so the
    // full type-literal annotations (`'ok'|'no-data'`) can ride
    // alongside the long meta tail within the 240-char cap. Outer
    // separators keep spaces for readability. `degraded?` + `message?`
    // added by task 0064; `acceptance{Ratio?,RatioStatus?:no-data|ok}`
    // groups the sibling fields under a shared prefix so the new
    // tokens fit within the cap.
    responseShape:
      '{freshQuotes,totalCached,configuredSymbols,symbols[],runtime?,' +
      'status,degraded?,message?,source?,websocket?,websocketError?,' +
      'ingested?,rejected?,acceptance{Ratio?,RatioStatus?:no-data|ok},' +
      'bootAt*?,uptimeMs?,timestamp,timestampIso} -- 200/503',
  },
  {
    path: '/quotes',
    methods: ['GET'],
    summary:
      'Every cached quote with cache age and per-quote filter verdict; ' +
      '503 when source dead AND cache empty (matches /quotes/fresh/all).',
    responseShape:
      '{ totalCached, count (deprecated→totalCached), deprecations, ' +
      'degraded?, stale?, message?, quotes: Record<string, ' +
      'NormalizedQuote & {cacheAge, filterAccepted, filterReason}>, ' +
      'source?, timestamp, timestampIso } -- 200/503',
  },
  {
    path: '/quotes/fresh/all',
    methods: ['GET'],
    summary:
      'Fresh + risk-accepted quotes only; 503 when source/WS is dead.',
    responseShape:
      '{ quotes: NormalizedQuote[], freshCount, ' +
      'count (deprecated→freshCount), degraded?, message?, source?, ' +
      'deprecations, timestamp, timestampIso } -- 200/503',
  },
  {
    path: '/quotes/:symbol',
    methods: ['GET'],
    summary:
      'Single symbol; 400 invalid-symbol|invalid-symbol-or-path, ' +
      '404 symbol-not-configured|no-quote, 200 quote envelope.',
    parametric: true,
    // The three sub-envelopes (200/400/404) plus the meta tail blow past
    // the 240-char cap when every field is named. 200's inner field
    // detail (cacheAge, filterAccepted, filterReason, …) is documented
    // on the /quotes responseShape; here we just keep the marker. The
    // 400 + 404 envelopes carry full field lists so a fresh integrator
    // can write the error-path types from this string alone. `path*`
    // is shorthand for `path, pathTruncated?, pathOriginalLength?,
    // pathPrefixLength?` (task 0058 — verbatim-prefix echo bounded to
    // MAX_ECHOED_PATH_BYTES bytes, truncation indicated by the three
    // companion fields when present).
    responseShape:
      // 200 body shape mirrors /quotes entries; here we cover the
      // error-envelope shapes the per-symbol route emits. The
      // triplet (humanReason/severity/nextStep) on the 404 branch
      // sources from `ERROR_REASONS_PUBLIC`. See task 0072.
      '200:env | ' +
      '400:{error:invalid-symbol|invalid-symbol-or-path,' +
      'message,expected?,didYouMean?,path*,method} | ' +
      '404:{error,message,humanReason,severity,nextStep,' +
      'symbol,configured,configuredSymbols?(+Count),' +
      'didYouMean?,source?}; tail: ts,tsIso',
  },
  {
    path: '/status/quotes',
    methods: ['GET'],
    summary:
      'Per-symbol cache age, session state, confidence for dashboards.',
    // `degraded:boolean` is the canonical health field (task 0064);
    // legacy `healthy?:boolean` rides one release as a deprecated alias.
    responseShape:
      '{degraded,message?,healthy?(deprecated→degraded),freshCount,' +
      'totalCount,quotes:Array<{symbol,cacheAge,' +
      'lastUpdateMs(deprecated→cacheAge),sessionState,confidence}>,' +
      'deprecations,source?,timestamp,timestampIso} -- 200/503',
  },
  {
    path: '/audit/stats',
    methods: ['GET'],
    summary:
      'Ingested vs rejected counts, rejection breakdown, acceptance ratio, ' +
      'uptime.',
    responseShape:
      '{ingested,rejected,byReason,acceptanceRatio,' +
      "acceptanceRatioStatus:'ok'|'no-data'," +
      'firstAtMs,firstAtIso,lastAtMs,lastAtIso,writeErrors,bufferedDrops,' +
      'firstAt?,lastAt?(dep→*Ms),runtime?,deprecations?,' +
      'bootAt*?,uptimeMs?,timestamp,timestampIso}',
  },
  {
    path: '/docs/source-reasons',
    methods: ['GET'],
    summary:
      'Reference catalog: enum values that may appear as `source.reason` ' +
      'on data endpoints (NOT live state).',
    responseShape:
      '{ reasons: Record<string, {humanReason, nextStep, ' +
      "severity:'ok'|'info'|'degraded'|'critical'}>, count, timestamp, " +
      'timestampIso }',
  },
];

/**
 * Boot-time guard: a future edit that pushes a `responseShape` over the
 * 240-char wire contract should fail at import, not in CI.
 */
for (const e of ENDPOINT_CATALOG) {
  if (e.responseShape.length > 240) {
    throw new Error(
      `responseShape for ${e.path} exceeds 240 chars: ${e.responseShape.length}`,
    );
  }
}

/**
 * Pointer object replacing the inline `sourceReasons` block on `GET /`.
 * Naming the field `sourceReasonCatalog` (singular, with the `Catalog`
 * suffix) and adding the `description` line stops a fresh user from
 * mistaking a 3-entry reference table for three concurrent live errors.
 * The full payload lives at `/docs/source-reasons`; here we ship only
 * the pointer to keep the discovery body small.
 */
const SOURCE_REASON_CATALOG_COUNT = Object.keys(SOURCE_REASONS_PUBLIC).length;

const SOURCE_REASON_CATALOG_POINTER = Object.freeze({
  description:
    'Reference catalog: enum values that may appear as `source.reason` ' +
    'on data endpoints. NOT a live error feed; check `source` on /health ' +
    'for the current verdict.',
  url: '/docs/source-reasons',
  count: SOURCE_REASON_CATALOG_COUNT,
});

/**
 * Pinned regex for the one parametric route this service exposes today.
 * Future parametric routes would carry their own matcher inside the
 * catalog entry; with a single entry, a const keeps the matcher
 * declared next to the data structure it serves.
 */
const QUOTES_SYMBOL_RE = /^\/quotes\/[^/]+$/;

const CATALOG_EXACT: ReadonlyMap<string, EndpointDoc> = new Map(
  ENDPOINT_CATALOG.filter((e) => !e.parametric).map((e) => [e.path, e]),
);

function findCatalogEntry(reqPath: string): EndpointDoc | undefined {
  const exact = CATALOG_EXACT.get(reqPath);
  if (exact) return exact;
  // Only one parametric shape today; if we add more, generalise to a
  // (path, regex) tuple inside `EndpointDoc` rather than reaching for
  // a dispatch table.
  if (QUOTES_SYMBOL_RE.test(reqPath)) {
    return ENDPOINT_CATALOG.find((e) => e.path === '/quotes/:symbol');
  }
  return undefined;
}

/**
 * Compute the `Allow` (RFC 7231 §4.3.7 / §6.5.5) list for a given
 * request path. Single source of truth read by the OPTIONS short-circuit
 * (which carries it via the `Allow` header on 204 No Content) and the
 * 405 branch (which also ships the list in the body's `allowed` field).
 *
 * For unregistered paths the global default `['GET','OPTIONS']` is
 * returned: every documented endpoint today is GET-only, and OPTIONS
 * is universally honoured by the CORS middleware. A future POST/PUT
 * endpoint flows through this helper unchanged — only the catalog
 * entry needs to grow. See task 0059.
 */
const DEFAULT_ALLOWED_METHODS: readonly string[] = ['GET', 'OPTIONS'];

function allowedMethodsForPath(reqPath: string): readonly string[] {
  const entry = findCatalogEntry(reqPath);
  if (entry) return [...entry.methods, 'OPTIONS'];
  return DEFAULT_ALLOWED_METHODS;
}

/**
 * The /quotes/:symbol parametric parent (`/quotes/`) is uniquely worth
 * disambiguating: a developer who typed a stray trailing slash on the
 * bulk endpoint and a developer who forgot the symbol on the parametric
 * route produce the same URL. The disambiguation copy spells out both
 * intentions so the operator's runbook fix is obvious from the 404
 * body alone — no extra round trip to the catalog. See task 0046.
 */
const PARAMETRIC_PARENT_MESSAGE =
  'the parametric route /quotes/:symbol requires a symbol — ' +
  'append a ticker (e.g. /quotes/AAPL) or drop the trailing ' +
  'slash to fetch the bulk dump at /quotes';

/**
 * Suggest a canonical route for a near-miss request path. Handles the
 * deterministic corrections the strict router can otherwise not
 * auto-apply, in pipeline order:
 *
 *  - **trailing-slash strip** (task 0046): `/quotes/` → `/quotes`
 *  - **multi-slash collapse** (task 0065): `//health` → `/health`,
 *    `/quotes//AAPL` → `/quotes/AAPL`, `//HEALTH//` → `/health`
 *  - **case-only fold** (task 0042): `/HEALTH` → `/health`
 *
 * Compositions of all three families fall through the same pipeline:
 * `//QUOTES//AAPL/` → strip trailing → `//QUOTES//AAPL` → collapse →
 * `/QUOTES/AAPL` → lower-case → match parametric → `/quotes/AAPL`
 * (symbol case from the collapsed value so the caller-supplied
 * ticker round-trips).
 *
 * Returns `undefined` when the request path is already canonical or
 * cannot be steered toward a known route — the 404 envelope then omits
 * the field rather than shipping a confusing null.
 */
export function canonicalSuggestion(reqPath: string): string | undefined {
  if (reqPath === '/') return undefined;
  // Pipeline order: collapse runs FIRST so multi-trailing-slash inputs
  // (`//QUOTES///AAPL//`) end up with a single trailing slash that the
  // trim step removes in one pass. Reversing the order would leave a
  // residual slash that fails the parametric `QUOTES_SYMBOL_RE` match.
  const collapsed = reqPath.replace(/\/{2,}/g, '/');
  const trimmed =
    collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed;
  const candidate = trimmed.toLowerCase();
  if (candidate === reqPath) return undefined;
  if (CATALOG_EXACT.has(candidate)) return candidate;
  if (QUOTES_SYMBOL_RE.test(candidate)) {
    const slashIdx = trimmed.lastIndexOf('/');
    return `/quotes/${trimmed.slice(slashIdx + 1)}`;
  }
  return undefined;
}

/**
 * Detect Express's URL-decode failure. Both shapes covered:
 *  - the raw `URIError` from `decodeURIComponent`.
 *  - the `HttpError`-wrapped variant (`status: 400` plus
 *    `code: 'INVALID_URI'` or `type: 'entity.parse.failed'`) used by
 *    some Express versions and the body-parser branches.
 *
 * Lives next to `canonicalSuggestion` so the URL-cleanup helpers stay
 * grouped — the malformed-uri 400 reuses `canonicalSuggestion` to
 * suggest a cleaned canonical form.
 */
function isMalformedUriError(err: unknown): boolean {
  if (err instanceof URIError) return true;
  if (err && typeof err === 'object') {
    const e = err as { status?: unknown; code?: unknown; type?: unknown };
    if (
      e.status === 400 &&
      (e.code === 'INVALID_URI' || e.type === 'entity.parse.failed')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Strip every malformed-percent fragment from a path so the malformed-
 * uri 400 can suggest the cleaned form via `didYouMean`. A fragment is
 * malformed when `%` is NOT followed by exactly two hex digits — the
 * negative lookahead catches all four `decodeURIComponent` failure
 * modes:
 *
 *  - orphan `%` at end (`/quotes/AAPL%`)
 *  - single hex digit (`/quotes/AAPL%2`)
 *  - first digit non-hex (`/quotes/%G`, `/quotes/AAPL%G`)
 *  - second digit non-hex (`/quotes/%4Z`)
 *
 * The trailing `[\s\S]{0,2}` consumes the `%` plus up to two characters
 * — exactly the bytes that would have been the percent-escape sequence
 * if it had been valid. Valid `%XX` (e.g. `%FF`, accepted lexically
 * but rejected as bad UTF-8 by `decodeURIComponent`) is left intact,
 * so the cleaned form falls through to "no real route" and `didYouMean`
 * is omitted.
 *
 * Suggests only when the cleaned form names a route as-is — direct
 * catalog hit or parametric `/quotes/<symbol>` shape. Stays out of
 * `canonicalSuggestion`'s case-fold / trailing-slash steering: a
 * cleaned `/quotes/` (parametric parent with the symbol stripped)
 * shouldn't be steered to the bulk `/quotes` endpoint because the
 * user's URL shape clearly meant single-symbol.
 */
function suggestCleanedPath(rawPath: string): string | undefined {
  const cleaned = rawPath.replace(/%(?![0-9A-Fa-f]{2})[\s\S]{0,2}/g, '');
  if (cleaned === rawPath) return undefined;
  if (CATALOG_EXACT.has(cleaned)) return cleaned;
  if (QUOTES_SYMBOL_RE.test(cleaned)) return cleaned;
  return undefined;
}

const MALFORMED_URI_MESSAGE =
  "URL contains malformed percent encoding — '%' must be followed by " +
  "exactly two hex digits (or be percent-encoded as '%25')";

const MALFORMED_URI_EXPECTED = Object.freeze({
  percentEncoding: '%XX',
  hexDigits: '0-9A-Fa-f',
});

/**
 * Cap on the verbatim prefix of `req.path` echoed back in any 4xx error
 * envelope. 128 bytes is wide enough that every legitimate documented
 * route (`/docs/source-reasons` is 20 bytes; `/quotes/<16-char ticker>`
 * is 24 bytes) rides verbatim, but tight enough that a 5 KB hostile
 * input is bounded to ~150 B for the path field. See task 0058.
 */
export const MAX_ECHOED_PATH_BYTES = 128;

/**
 * Verbatim-prefix echo of `req.path` plus, when the input was longer
 * than the cap, three companion fields that let an operator
 *
 *   1. detect truncation without special-casing a Unicode glyph
 *      (`pathTruncated:true`),
 *   2. sort 4xx logs by request size to find length-attack bursts
 *      (`pathOriginalLength`, BYTES not codepoints), and
 *   3. round-trip `body.path === req.originalUrl.slice(0, pathPrefixLength)`
 *      as an exact-match consumer assertion (`pathPrefixLength`).
 *
 * Truncation fields are absent on under-cap inputs — absence
 * encodes "verbatim" so the show-iff-deprecated policy used elsewhere
 * applies here too.
 */
export interface EchoedPath {
  path: string;
  pathTruncated?: true;
  pathOriginalLength?: number;
  pathPrefixLength?: number;
}

/**
 * Bound the echoed `req.path` to `MAX_ECHOED_PATH_BYTES` of verbatim
 * prefix and, when the input was longer, attach truncation metadata.
 * UTF-8-safe: trims one JS codepoint at a time until the prefix
 * round-trips under the byte cap, so a multi-byte trailing rune is
 * never split mid-character. The U+2026 horizontal ellipsis is REMOVED
 * from the wire entirely — no non-ASCII byte ever appears in `path`,
 * which lets log tooling consume the field as plain ASCII.
 */
export function echoPath(rawPath: string): EchoedPath {
  const fullBytes = Buffer.byteLength(rawPath, 'utf8');
  if (fullBytes <= MAX_ECHOED_PATH_BYTES) return { path: rawPath };
  let prefix = rawPath;
  while (
    prefix.length > 0 &&
    Buffer.byteLength(prefix, 'utf8') > MAX_ECHOED_PATH_BYTES
  ) {
    prefix = prefix.slice(0, -1);
  }
  return {
    path: prefix,
    pathTruncated: true,
    pathOriginalLength: fullBytes,
    pathPrefixLength: Buffer.byteLength(prefix, 'utf8'),
  };
}

/**
 * Static enrichment shipped on every 405 `method-not-allowed` envelope so
 * the body rides the same `{error, message, humanReason, severity,
 * nextStep, …}` contract every other 4xx/5xx on this service follows.
 * `severity` is pinned to `'info'` (typed against `SourceSeverity` so a
 * future enum-narrow fails at compile-time): a misrouted client is not
 * an outage, just a runbook entry an operator wants to be able to
 * filter out of the critical-alert dashboard. See task 0057.
 */
const METHOD_NOT_ALLOWED_HUMAN_REASON =
  'This path is read-only; only the listed verbs are accepted.';

const METHOD_NOT_ALLOWED_NEXT_STEP =
  'Replay the request with one of the verbs in `allowed`. ' +
  'OPTIONS is included for capability discovery.';

const METHOD_NOT_ALLOWED_SEVERITY: SourceSeverity = 'info';

/**
 * Catch-all 404 enrichment shipped on every `not-found` envelope so the
 * body rides the same `{error, message, humanReason, severity, nextStep,
 * …}` contract as the 405 (task 0057) and the source block (task 0050).
 * All three constants read off `ERROR_REASONS_PUBLIC` so the catalog
 * shipped at `/docs/source-reasons` and the live 404 body cannot drift.
 * See task 0063.
 */
const NOT_FOUND_HUMAN_REASON = ERROR_REASONS_PUBLIC['not-found']!.humanReason;
const NOT_FOUND_NEXT_STEP = ERROR_REASONS_PUBLIC['not-found']!.nextStep;
const NOT_FOUND_SEVERITY: SourceSeverity = ERROR_REASONS_PUBLIC['not-found']!.severity;

/**
 * Per-symbol 404 enrichment shipped on `/quotes/:symbol` when the
 * symbol is configured but the cache holds no fresh tick. Severity
 * `'info'` (transient — a fresh tick is expected once the source
 * attaches). Triplet sources from `ERROR_REASONS_PUBLIC` so the
 * live body and `/docs/source-reasons.errorReasons` cannot drift.
 * See task 0072.
 */
const NO_QUOTE_HUMAN_REASON = ERROR_REASONS_PUBLIC['no-quote']!.humanReason;
const NO_QUOTE_NEXT_STEP = ERROR_REASONS_PUBLIC['no-quote']!.nextStep;
const NO_QUOTE_SEVERITY: SourceSeverity = ERROR_REASONS_PUBLIC['no-quote']!.severity;

/**
 * Per-symbol 404 enrichment shipped on `/quotes/:symbol` when the
 * symbol is NOT in `ORACLE_SYMBOLS`. Severity `'critical'`
 * (permanent — operator must extend the subscription set and
 * restart the service). Triplet sources from `ERROR_REASONS_PUBLIC`
 * so the live body and `/docs/source-reasons.errorReasons` cannot
 * drift. See task 0072.
 */
const SYMBOL_NOT_CONFIGURED_HUMAN_REASON =
  ERROR_REASONS_PUBLIC['symbol-not-configured']!.humanReason;
const SYMBOL_NOT_CONFIGURED_NEXT_STEP =
  ERROR_REASONS_PUBLIC['symbol-not-configured']!.nextStep;
const SYMBOL_NOT_CONFIGURED_SEVERITY: SourceSeverity =
  ERROR_REASONS_PUBLIC['symbol-not-configured']!.severity;

/**
 * 400-family enrichment shipped on the three input-validation
 * envelopes (`invalid-symbol`, `invalid-symbol-or-path`,
 * `malformed-uri`). All three pin severity to `'info'` —
 * integrator-side programming errors, not service outages — so a
 * dashboard can filter them out of the critical-alert lane that
 * `source.severity:'critical'` feeds. Triplets source from
 * `ERROR_REASONS_PUBLIC` so the live body and the docs catalog at
 * `/docs/source-reasons.errorReasons` cannot drift. See task 0073.
 */
const INVALID_SYMBOL_HUMAN_REASON =
  ERROR_REASONS_PUBLIC['invalid-symbol']!.humanReason;
const INVALID_SYMBOL_NEXT_STEP =
  ERROR_REASONS_PUBLIC['invalid-symbol']!.nextStep;
const INVALID_SYMBOL_SEVERITY: SourceSeverity =
  ERROR_REASONS_PUBLIC['invalid-symbol']!.severity;

const INVALID_SYMBOL_OR_PATH_HUMAN_REASON =
  ERROR_REASONS_PUBLIC['invalid-symbol-or-path']!.humanReason;
const INVALID_SYMBOL_OR_PATH_NEXT_STEP =
  ERROR_REASONS_PUBLIC['invalid-symbol-or-path']!.nextStep;
const INVALID_SYMBOL_OR_PATH_SEVERITY: SourceSeverity =
  ERROR_REASONS_PUBLIC['invalid-symbol-or-path']!.severity;

const MALFORMED_URI_HUMAN_REASON =
  ERROR_REASONS_PUBLIC['malformed-uri']!.humanReason;
const MALFORMED_URI_NEXT_STEP =
  ERROR_REASONS_PUBLIC['malformed-uri']!.nextStep;
const MALFORMED_URI_SEVERITY: SourceSeverity =
  ERROR_REASONS_PUBLIC['malformed-uri']!.severity;

/**
 * Per-request `message` for the catch-all 404. Names the offending verb
 * and the bounded `path` echo so the audit log line answers
 * "what did this caller try?" without a second lookup.
 */
function buildNotFoundMessage(method: string, path: string): string {
  return `no endpoint matches ${method} ${path}`;
}

/**
 * Template the per-request 405 `message` off the offending verb + the
 * allowed-methods list. Mirrors the `Allow` header shape so an operator
 * grepping the audit log can match body and header on the same line.
 */
function buildMethodNotAllowedMessage(
  method: string,
  allowed: readonly string[],
  path: string,
): string {
  return (
    `Method '${method}' is not allowed on ${path}. ` +
    `Reissue the request with one of: ${allowed.join(', ')}.`
  );
}

/**
 * Derive a "what real route does this single path segment name?" map
 * from `ENDPOINT_CATALOG`. Drift-proof: adding a new endpoint
 * automatically extends the hint map; nothing to hand-edit.
 *
 * Used by the `/quotes/:symbol` handler to detect path typos like
 * `/quotes/fresh` (→ /quotes/fresh/all) and steer the caller with
 * `didYouMean` instead of the strong "edit ORACLE_SYMBOLS and restart"
 * framing of `symbol-not-configured`.
 *
 * Skipped entries:
 * - parametric routes (no name to confuse — they ARE the wildcard).
 * - the root `/` (no segment).
 * - the bare `/quotes` (its name is the parametric parent, not a
 *   sibling route to confuse with a typo'd symbol).
 *
 * Indexing rule: for `/quotes/<x>/...` the trap is the second segment
 * (`x`), because that's the slot the `:symbol` route catches. For
 * any other path the first segment is the trap.
 */
export function buildRouteHints(
  catalog: readonly EndpointDoc[] = ENDPOINT_CATALOG,
): ReadonlyMap<string, string> {
  const hints = new Map<string, string>();
  for (const e of catalog) {
    if (e.parametric) continue;
    if (e.path === '/') continue;
    if (e.path === '/quotes') continue;
    const segments = e.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    const key =
      segments[0] === 'quotes' && segments.length > 1
        ? segments[1].toLowerCase()
        : segments[0].toLowerCase();
    // First write wins (deterministic for the live catalog; future
    // catalog collisions are a build-time signal to disambiguate).
    if (!hints.has(key)) hints.set(key, e.path);
  }
  return hints;
}

const ROUTE_HINTS = buildRouteHints();

interface EndpointIndexEntry {
  path: string;
  methods: readonly string[];
  summary: string;
  responseShape: string;
}

interface EndpointIndexCompactEntry {
  path: string;
  methods: readonly string[];
}

function buildEndpointIndex(): EndpointIndexEntry[] {
  return ENDPOINT_CATALOG.map((e) => ({
    path: e.path,
    methods: e.methods,
    summary: e.summary,
    responseShape: e.responseShape,
  }));
}

/**
 * Compact projection used by the catch-all 404 hint list. Drops `summary`
 * and `responseShape` so wrong-URL responses (typos, /favicon.ico,
 * misconfigured probes, crawler scans) stay small. Full discovery
 * payload lives on `GET /`; the 404 only needs `{path, methods}` for a
 * caller to recognise the right route and retry.
 */
function buildEndpointIndexCompact(): EndpointIndexCompactEntry[] {
  return ENDPOINT_CATALOG.map((e) => ({
    path: e.path,
    methods: e.methods,
  }));
}

/**
 * Boot-time invariant: the catch-all 404 body must stay ≤ 1024 bytes so
 * automated unknown-URL traffic (browser auto-fetches, misconfigured
 * probes) never pays a multi-KB tax per request. Sits next to the
 * 240-char `responseShape` guard above so both invariants are visible
 * at a glance to anyone touching `ENDPOINT_CATALOG`.
 *
 * Uses a worst-case oversize WS hostname so the cap bounds the full body
 * including the largest reasonable advertisement URL.
 */
const WS_GUARD_SYNTHETIC_PATH =
  'ws://very-long-hostname-for-bound.example.com:65535';

/**
 * Synthetic worst-case body the boot guard measures against
 * `MAX_404_BODY_BYTES`. Must mirror the live catch-all 404 shape
 * (task 0063 enrichment included) so the guard's measurement actually
 * reflects the real maximum wire payload.
 */
function build404SyntheticBody(): Record<string, unknown> {
  return {
    error: 'not-found',
    message: 'no endpoint matches DELETE /__boot_guard_synthetic_path__',
    humanReason: ERROR_REASONS_PUBLIC['not-found']!.humanReason,
    severity: ERROR_REASONS_PUBLIC['not-found']!.severity,
    nextStep: ERROR_REASONS_PUBLIC['not-found']!.nextStep,
    path: '/__boot_guard_synthetic__',
    method: 'GET',
    discovery: '/',
    endpoints: [
      ...buildEndpointIndexCompact(),
      { path: WS_GUARD_SYNTHETIC_PATH, methods: ['CONNECT'] },
    ],
    timestamp: 0,
    timestampIso: '1970-01-01T00:00:00.000Z',
  };
}

const MAX_404_BODY_BYTES = 1024;

{
  const bytes = Buffer.byteLength(JSON.stringify(build404SyntheticBody()), 'utf8');
  if (bytes > MAX_404_BODY_BYTES) {
    throw new Error(
      `catch-all 404 body would exceed ${MAX_404_BODY_BYTES} bytes: ${bytes}. ` +
        'Trim ENDPOINT_CATALOG paths or split the 404 hint list.',
    );
  }
}

/**
 * Test-only inspection of the boot-time invariant. Re-measures the
 * synthetic body the boot guard above asserted against, so a unit test
 * can confirm the live catalog stays under cap without re-implementing
 * the recipe.
 */
export function build404BodySize(): number {
  return Buffer.byteLength(JSON.stringify(build404SyntheticBody()), 'utf8');
}

/**
 * Raw-input shape gate: pre-fold ASCII-only check. Run BEFORE
 * `.toUpperCase()` so JavaScript's full Unicode case-fold (which
 * expands `ß → SS`, Latin ligatures → ASCII letters, `ı → I`) cannot
 * silently rewrite caller input into something the post-fold regex
 * would accept.
 *
 * Once raw is ASCII, `.toUpperCase()` is provably letter-case-only
 * (1:1 on the ASCII alphabet, locale-insensitive), so the canonical
 * symbol is exactly what the caller meant — no silent semantic
 * rewrite, no homoglyph slip-through.
 *
 * `ASCII_TICKER_RAW_SOURCE` is the unanchored grammar published in
 * the 400 `invalid-symbol` envelope's `expected.pattern` field so the
 * displayed regex and the validator regex can't drift (task 0045).
 * Tests assert `expected.pattern === '^' + ASCII_TICKER_RAW_SOURCE + '$'`.
 */
export const ASCII_TICKER_RAW_SOURCE = '[A-Za-z0-9._-]{1,16}';
const ASCII_TICKER_RAW = new RegExp(`^${ASCII_TICKER_RAW_SOURCE}$`);

/**
 * Combined-gate regex source published as the wire `expected.pattern` so a
 * single `new RegExp(body.expected.pattern).test(input)` reproduces the
 * server's `normalizeSymbol` verdict bit-for-bit. The lookahead encodes
 * the `HAS_ALNUM` requirement inline; the trailing fragment is the same
 * shape grammar as `ASCII_TICKER_RAW_SOURCE`.
 *
 * Task 0045 shipped only the shape source on the wire, so a frontend
 * piping the pattern through `new RegExp(...)` accepted punctuation-only
 * inputs (`...`, `----------------`) the server then rejected on the
 * alnum branch. Task 0047 unifies the two gates into one regex.
 *
 * Lookaheads are supported by ECMAScript, PCRE, Java, Python, and Go's
 * RE2 (since 2023). Rust's `regex` crate rejects them — Rust consumers
 * fall back to `mustContainAlnum: true`, which stays on the wire as a
 * non-lookahead flag for that case.
 */
export const ASCII_TICKER_FULL_SOURCE = `^(?=.*[A-Za-z0-9])${ASCII_TICKER_RAW_SOURCE}$`;

/**
 * Machine-readable companion to the 400 `invalid-symbol` natural-language
 * message. A frontend / SDK / OpenAPI generator can feed
 * `body.expected.pattern` straight into `new RegExp(...)` and reproduce
 * the server gate bit-for-bit — no regex-string parsing, no copy-paste
 * drift, no client-side validator that's stricter than the server.
 *
 * The same block ships on both 400 branches (`shape` and `no-alnum`):
 * the pattern, length bounds, and case-folding behaviour are identical;
 * only the natural-language `message` differs.
 *
 * `patternShape` carries the previous shape-only regex for one release
 * as a back-compat hook — same release-deprecation cadence as
 * `count → totalCached` (task 0035) and `lastUpdateMs → cacheAge`
 * (task 0033). Removed in the next release.
 */
const INVALID_SYMBOL_EXPECTED = Object.freeze({
  pattern: ASCII_TICKER_FULL_SOURCE,
  patternShape: ASCII_TICKER_RAW.source,
  minLength: 1,
  maxLength: 16,
  mustContainAlnum: true,
  canonicalisation: 'uppercase' as const,
});

/**
 * In-band deprecation note shipped on the 400 `invalid-symbol` envelope
 * so a consumer reading `expected.patternShape` discovers the move to
 * `expected.pattern` (the combined-gate regex) without grepping the
 * codebase. Same deprecation-cadence shape as the `source.deprecations`
 * note for `lastAttachAt` → `lastAttachAtMs`.
 */
const INVALID_SYMBOL_DEPRECATIONS: Readonly<Record<string, string>> = Object.freeze({
  'expected.patternShape':
    'rename → expected.pattern (now encodes the full shape + alnum gate); ' +
    'will be removed in the next release',
});

const INVALID_SYMBOL_SHAPE_MESSAGE =
  `symbol must match /^${ASCII_TICKER_RAW_SOURCE}$/ ` +
  '(case-insensitive — lowercase is accepted and canonicalised to ' +
  'uppercase before lookup)';

/**
 * Second gate: require at least one alphanumeric character in the raw
 * input. Without this, `[._-]{1,16}` strings (`................`,
 * `----------------`, `.-_`) pass the shape check, land on the
 * `symbol-not-configured` 404, and tell the operator to add the junk
 * string to ORACLE_SYMBOLS — which can never work. Real-world tickers
 * (eToro / OPRA / RIC / Bloomberg) always carry at least one letter
 * or digit, so this gate has zero false positives on any instrument
 * in current or planned subscription sets.
 */
const HAS_ALNUM = /[A-Za-z0-9]/;

/**
 * eToro / standard ticker shape: 1..16 chars of upper-case letters,
 * digits, dot, dash, underscore. Matches every symbol in
 * DEFAULT_CONFIG.symbols (`AAPL`, `TSLA`, ...) and the standard eToro
 * instrument surface (`BRK.B`, `BTC-USD`, `BTC_USD`). Kept as a
 * defensive assertion below — unreachable from the public surface
 * once `ASCII_TICKER_RAW` has passed; fires only on a future refactor
 * that breaks the invariant.
 */
const VALID_SYMBOL = /^[A-Z0-9._-]{1,16}$/;

export type NormalizeSymbolResult =
  | { ok: true; symbol: string }
  | { ok: false; reason: 'shape' | 'no-alnum' };

/**
 * Two-row Levenshtein edit distance. Bounded scan: when `|a.length -
 * b.length| > limit`, return `limit + 1` immediately so the caller can
 * reject without paying for the DP. Pure; no allocations beyond two
 * Int32 rows the same size as `b`.
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
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Find the closest configured symbol to a typo'd input. Threshold is
 * `max(2, floor(input.length * 0.3))` — a baseline of 2 catches the
 * realistic 2-edit ticker typos (`APLE` → `AAPL`: insert `A` after the
 * first `A`, delete trailing `E`) while still refusing absurd matches
 * (any 5+ char input far from every configured symbol). Scales gently
 * for longer inputs (a 10-char input gets threshold 3).
 *
 * Returns `undefined` (NOT `null`, NOT `""`) when no candidate clears
 * the threshold, so the wire envelope can omit the field entirely
 * instead of shipping a confusing null.
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

export function normalizeSymbol(raw: string): NormalizeSymbolResult {
  if (typeof raw !== 'string') return { ok: false, reason: 'shape' };
  if (raw.length === 0 || raw.length > 16) return { ok: false, reason: 'shape' };
  if (!ASCII_TICKER_RAW.test(raw)) return { ok: false, reason: 'shape' };
  if (!HAS_ALNUM.test(raw)) return { ok: false, reason: 'no-alnum' };
  const upper = raw.toUpperCase();
  // Defensive: `ASCII_TICKER_RAW` + `HAS_ALNUM` already accepted the
  // raw shape, and `.toUpperCase()` on ASCII letters is provably 1:1.
  // Unreachable in production; guards against a future refactor that
  // loosens the gates.
  if (!VALID_SYMBOL.test(upper)) return { ok: false, reason: 'shape' };
  return { ok: true, symbol: upper };
}

/**
 * Status of the acceptance ratio. The "no-data" state — distinct from
 * real 100% acceptance — keeps dashboards honest: a service that has
 * never seen a tick is NOT the same as a service that accepted every
 * tick it saw. Future states (`'stale'` when ingest is old,
 * `'low-sample'` when the denominator is small) are non-breaking
 * additions; consumers should default-case unknown values.
 */
export type AcceptanceRatioStatus = 'ok' | 'no-data';

export interface AcceptanceRatioResult {
  ratio: number | null;
  status: AcceptanceRatioStatus;
}

/**
 * `ingested / (ingested + rejected)`. The vacuous case
 * (`ingested + rejected === 0`) is reported as
 * `{ratio: null, status: 'no-data'}` so dashboards can render
 * "warming up / N/A" instead of the same 100% green they'd render
 * a real perfect-acceptance moment.
 */
export function computeAcceptanceRatio(
  stats: IngestStats,
): AcceptanceRatioResult {
  const total = stats.ingested + stats.rejected;
  if (total === 0) return { ratio: null, status: 'no-data' };
  return { ratio: stats.ingested / total, status: 'ok' };
}

/**
 * In-band deprecation notes attached to the `/audit/stats` body whenever
 * the legacy `firstAt` / `lastAt` aliases are on the wire (task 0053).
 * Same show-iff-legacy-present rule as task 0052's source-block fix.
 */
const AUDIT_STATS_DEPRECATIONS: Readonly<Record<string, string>> = Object.freeze({
  firstAt: 'rename → firstAtMs; will be removed in the next release',
  lastAt: 'rename → lastAtMs; will be removed in the next release',
});

/**
 * Assemble the `/audit/stats` body from an `IngestStats` snapshot.
 * The canonical `firstAtMs` / `firstAtIso` (and `lastAt*` analog)
 * pair is always present (null on a fresh boot), and the legacy
 * `firstAt` / `lastAt` aliases plus the matching deprecations entries
 * ride iff the canonical timestamp is non-null — same show-iff-
 * legacy-present rule as task 0052's source-block fix.
 *
 * Field ordering encodes the policy from task 0041: canonical Ms
 * before its ISO companion before the legacy alias; the deprecation
 * map is returned alongside so the envelope helper can re-anchor it
 * at the meta tail (after the boot block, before timestamp).
 */
function buildAuditStatsBody(
  stats: IngestStats,
): { body: Record<string, unknown>; deprecations?: Record<string, string> } {
  const ratio = computeAcceptanceRatio(stats);
  const body: Record<string, unknown> = {
    ingested: stats.ingested,
    rejected: stats.rejected,
    byReason: stats.byReason,
    acceptanceRatio: ratio.ratio,
    acceptanceRatioStatus: ratio.status,
    firstAtMs: stats.firstAtMs,
    firstAtIso: isoFromMs(stats.firstAtMs),
    lastAtMs: stats.lastAtMs,
    lastAtIso: isoFromMs(stats.lastAtMs),
    writeErrors: stats.writeErrors,
    bufferedDrops: stats.bufferedDrops,
  };
  if (stats.firstAtMs !== null) body.firstAt = stats.firstAtMs;
  if (stats.lastAtMs !== null) body.lastAt = stats.lastAtMs;
  if (stats.firstAtMs === null && stats.lastAtMs === null) return { body };
  const deprecations: Record<string, string> = {};
  if (stats.firstAtMs !== null) deprecations.firstAt = AUDIT_STATS_DEPRECATIONS.firstAt;
  if (stats.lastAtMs !== null) deprecations.lastAt = AUDIT_STATS_DEPRECATIONS.lastAt;
  return { body, deprecations };
}

/**
 * Single source of truth for the healthy/degraded verdict on
 * `/health` and `/status/quotes`. Two endpoints reading the same
 * inputs must always agree, otherwise downstream consumers
 * (oracle-signer) get conflicting signals.
 *
 * The cache alone is not enough: an empty cache during warmup is
 * fine when the source is connected, but the same empty cache with
 * a dead source is "we will never tick" — degraded. A failed WS
 * bind is also degraded: live-tick subscribers can't connect, so
 * the service is read-only at best (and to a stranger's instance
 * at worst, when the same port is held by another process).
 */
function computeDegraded(
  cache: QuoteCache,
  sourceStatusGetter?: SourceStatusGetter,
  wsStatusGetter?: WsStatusGetter,
): { degraded: boolean; src?: SanitizedSourceStatus } {
  const fresh = cache.getFresh();
  const cacheHealthy = fresh.length > 0 || cache.size === 0;
  let degraded = !cacheHealthy;
  let src: SanitizedSourceStatus | undefined;
  if (sourceStatusGetter) {
    src = sanitizeSourceStatus(sourceStatusGetter());
    if (!src.connected) degraded = true;
  }
  if (wsStatusGetter && !wsStatusGetter().listening) degraded = true;
  return { degraded, src };
}

/**
 * Cache-only-degraded fallback (no `sourceStatusGetter` wired but the
 * cache went sour) — RFC 9110 §15.6.4 still wants a `Retry-After`, so
 * we tag the 503 with the `'degraded'`-severity cadence. Pulled off
 * the same table the source block reads so the policy stays
 * single-sourced.
 */
const FALLBACK_503_RETRY_AFTER_SECONDS =
  RETRY_AFTER_SECONDS_BY_SEVERITY.degraded ?? 15;

/**
 * RFC 9110 §15.6.4 — every 503 SHOULD carry a `Retry-After`. The value
 * rides off `source.severity` (see `RETRY_AFTER_SECONDS_BY_SEVERITY`):
 * `'info'` → 5 s, `'degraded'` → 15 s, `'critical'` → 60 s. The same
 * number ships in the body as `source.retryAfterSeconds` so JSON-only
 * consumers don't have to peek at headers.
 *
 * Called once per 503 site, BEFORE `res.status(...).json(...)` — order
 * matters: setting a header after `.json()` is a noop. See task 0066.
 */
function applyRetryAfterHeader(
  res: Response,
  src: SanitizedSourceStatus | undefined,
): void {
  const seconds =
    src && !src.connected ? src.retryAfterSeconds : FALLBACK_503_RETRY_AFTER_SECONDS;
  res.setHeader('Retry-After', String(seconds));
}

export function createServer(
  cache: QuoteCache,
  config?: Partial<PriceServiceConfig>,
  statsGetter?: IngestStatsGetter,
  sourceStatusGetter?: SourceStatusGetter,
  bootAtGetter?: BootAtGetter,
  wsAddressGetter?: WsAddressGetter,
  wsStatusGetter?: WsStatusGetter,
  runtimeGetter?: RuntimeGetter,
): express.Express {
  const app = express();
  app.disable('x-powered-by');
  // Every response body carries a per-millisecond `timestamp` field via
  // `finalizeTimestamps`, so Express's default weak-ETag (SHA-1 over the
  // body) NEVER matches a follow-up `If-None-Match`. Emitting a
  // validator the service structurally cannot honour advertises a
  // conditional-GET contract that costs CPU + bandwidth and never pays
  // off. With ETag off the request `If-None-Match` is simply ignored —
  // the correct behaviour for a server with no validators. See task 0044.
  app.disable('etag');
  // RFC 9110 §4.2.3 — URL paths are case-sensitive. Default Express
  // matching folds `/HEALTH` onto `/health`, contradicting the discovery
  // catalog which only ships canonical lowercase forms. Flipping this
  // routes case-mangled paths to the 404 catch-all where they get an
  // explicit `didYouMean` steer instead of silently serving the canonical
  // body. See task 0042.
  app.set('case sensitive routing', true);
  // Express default folds /quotes/ onto /quotes — but /quotes/ is the
  // EXACT shape of "forgot the symbol on /quotes/:symbol", so silently
  // serving the bulk dump lets the caller infer the wrong contract. With
  // strict routing on, /quotes/, /health/, /audit/stats/ etc. all fall
  // through to the 404 catch-all, which `canonicalSuggestion` steers
  // back to the canonical form. See task 0046.
  app.set('strict routing', true);
  // Compress JSON responses when the client opts in via `Accept-Encoding`.
  // The `/`, `/health`, and `/docs/source-reasons` payloads are dominated
  // by repeated English vocabulary (catalog summaries, severity labels,
  // enum keys) — exactly what gzip handles best (~60% reduction on `/`).
  // Threshold 256 covers `/audit/stats` (~333 B) without paying the
  // gzip framing cost on near-empty responses; sub-threshold bodies and
  // OPTIONS preflights ride uncompressed. The middleware sets
  // `Vary: Accept-Encoding` on every response so caches that ignore
  // `Cache-Control: no-store` (task 0043) at least don't cross-serve
  // gzip bytes to identity clients. ETags stay disabled (task 0044).
  // See task 0068.
  app.use(compression({ threshold: 256, level: 6 }));
  const cfg = { ...DEFAULT_CONFIG, ...config };
  // Built once: per-request membership check is O(1). Uppercase every
  // entry so deploys with mixed-case `ORACLE_SYMBOLS` still match the
  // upper-cased request path produced by `normalizeSymbol`.
  const configuredSet = new Set(cfg.symbols.map((s) => s.toUpperCase()));

  // Hostname-resolution config read once at server-creation time (task
  // 0062). The env pin overrides any inbound `Host:` header; the
  // allowlist gates the fallback path; both fields are immutable per
  // server instance so a single boot reads consistent values across
  // every request handled.
  const hostnameEnvPin =
    process.env.PRICE_SERVICE_PUBLIC_HOSTNAME?.trim() || undefined;
  const allowlistFromEnv = (process.env.PRICE_SERVICE_HOSTNAME_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const hostnameAllowlist: readonly string[] =
    allowlistFromEnv.length > 0 ? allowlistFromEnv : DEFAULT_HOSTNAME_ALLOWLIST;

  // Single helper so the `/`, `/health`, and 404 surfaces emit identical
  // advertisements off the same input. Returns `undefined` when wiring
  // is absent OR when the broadcaster has not actually bound (avoids
  // handing out a poisoned `ws://` URL — see task 0032). The 5-arg
  // backward-compat fixture path keeps working: with no wsStatusGetter,
  // the bind state is treated as "trust the address getter".
  //
  // Hostname assembly threads through `resolveAdvertisedHostname` so a
  // caller-supplied `Host:` header can never write arbitrary bytes
  // (whitespace, slashes, attacker-controlled DNS names) into the
  // advertised URL — see task 0062.
  function buildWsAdvertisement(req: Request): WsAdvertisement | undefined {
    if (!wsAddressGetter) return undefined;
    if (wsStatusGetter && !wsStatusGetter().listening) return undefined;
    const { port, host } = wsAddressGetter();
    const headerHostname = host ?? hostnameFromHostHeader(req.get('host'));
    const resolved = resolveAdvertisedHostname({
      headerHostname,
      envPin: hostnameEnvPin,
      allowlist: hostnameAllowlist,
    });
    return {
      url: `ws://${resolved.hostname}:${port}`,
      port,
      frames: ['snapshot', 'quote'] as const,
      snapshot: WS_FRAME_DOCS.snapshot,
      quote: WS_FRAME_DOCS.quote,
      hostnameSource: resolved.source,
    };
  }

  // Boot block (lifecycle triplet) for endpoints that surface it
  // (`/health`, `/audit/stats`). Returns `undefined` when the bootAt
  // getter isn't wired so the envelope helper can omit the entire
  // block rather than ship three nulls.
  function buildBootBlock(now: number):
    | { ms: number; iso: string; uptimeMs: number }
    | undefined {
    if (!bootAtGetter) return undefined;
    const bootAt = bootAtGetter();
    return {
      ms: bootAt,
      iso: isoFromMs(bootAt)!,
      uptimeMs: Math.max(0, now - bootAt),
    };
  }

  // Mutually exclusive sibling of `buildWsAdvertisement`: emitted only
  // when the broadcaster has failed to bind. The reason slug is the
  // stable wire code; `humanReason` / `nextStep` / `severity` are the
  // operator-readable enrichment from the WS reason catalog.
  function buildWsErrorBlock(): WsErrorBlock | undefined {
    if (!wsStatusGetter) return undefined;
    const s = wsStatusGetter();
    if (s.listening) return undefined;
    if (s.bindError === null) return undefined;
    const doc = enrichWsReason(s.bindError);
    return {
      reason: s.bindError,
      port: s.port ?? -1,
      humanReason: doc.humanReason,
      nextStep: doc.nextStep,
      severity: doc.severity,
    };
  }

  app.use((req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    // RFC 9111 §5.2.2.5 — `no-store` forbids any storage of the
    // response, including by browser BFCache and CDN edge caches.
    // Live-tick prices are by definition non-cacheable at the transport
    // layer; without this, a CDN fronting the service could pin
    // /quotes/AAPL for minutes and turn the wire itself into a stale
    // source the upstream risk-filter can't detect. `Pragma: no-cache`
    // rides along for HTTP/1.0 intermediaries. See task 0043.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    if (req.method === 'OPTIONS') {
      // RFC 7231 §4.3.7 — a successful OPTIONS response (200 or 204) MUST
      // generate an `Allow` field. The CORS preflight header
      // (`Access-Control-Allow-Methods`) ships the same list, sourced
      // from `allowedMethodsForPath` so the two headers can never drift.
      // Non-CORS clients (curl, Go net/http, Python requests, k6) read
      // the RFC-track header; browsers read the CORS one. See task 0059.
      const allowList = allowedMethodsForPath(req.path).join(', ');
      res.setHeader('Allow', allowList);
      res.setHeader('Access-Control-Allow-Methods', allowList);
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/', (req: Request, res: Response) => {
    const now = Date.now();
    const ws = buildWsAdvertisement(req);
    const quickstart = buildQuickstart(ws ?? null);
    const { degraded, src } = computeDegraded(cache, sourceStatusGetter, wsStatusGetter);
    // Runtime block (task 0055) sits high in the body — directly after
    // the identity triplet (`service`/`description`/`version`/`docs`)
    // and before the catalog — so an integrator scanning the discovery
    // payload sees the safety/mode flags before the long endpoint list.
    const body: Record<string, unknown> = {
      service: 'price-service',
      description: SERVICE_DESCRIPTION,
      version: PACKAGE_VERSION,
      docs: DOCS_URL,
    };
    if (runtimeGetter) body.runtime = runtimeGetter();
    body.endpoints = buildEndpointIndex();
    body.quickstart = quickstart;
    body.sourceReasonCatalog = SOURCE_REASON_CATALOG_POINTER;
    res.json(
      finalizeEnvelope(body, now, {
        src,
        ws,
        wsErr: buildWsErrorBlock(),
        status: degraded ? 'degraded' : 'ok',
      }),
    );
  });

  app.get('/docs/source-reasons', (_req: Request, res: Response) => {
    const now = Date.now();
    // Two sibling maps with identical inner shape (task 0063):
    // `reasons` describes upstream-source state (task 0020 catalog);
    // `errorReasons` describes HTTP error-envelope slugs (`not-found`
    // today; `method-not-allowed` and `invalid-symbol` fold in via
    // separate follow-ups). Same endpoint, no new route.
    // `retryAfterSecondsBySeverity` is the canonical mapping a 503-aware
    // client can read off the same discovery endpoint that lists every
    // source reason — keeps the "what does the wire say" surface in one
    // place. Headers and `source.retryAfterSeconds` both read off this
    // exact table. `'ok'` is the connected branch (no 503) and rides
    // explicitly as `null` so a JSON consumer sees the full enum
    // domain instead of guessing the missing key. See task 0066.
    const body: Record<string, unknown> = {
      reasons: SOURCE_REASONS_PUBLIC,
      count: SOURCE_REASON_CATALOG_COUNT,
      errorReasons: ERROR_REASONS_PUBLIC,
      errorReasonCount: Object.keys(ERROR_REASONS_PUBLIC).length,
      retryAfterSecondsBySeverity: {
        ok: null,
        info: RETRY_AFTER_SECONDS_BY_SEVERITY.info,
        degraded: RETRY_AFTER_SECONDS_BY_SEVERITY.degraded,
        critical: RETRY_AFTER_SECONDS_BY_SEVERITY.critical,
      },
    };
    res.json(finalizeTimestamps(body, now));
  });

  app.get('/health', (req: Request, res: Response) => {
    const now = Date.now();
    const fresh = cache.getFresh();
    const body: Record<string, unknown> = {
      freshQuotes: fresh.length,
      totalCached: cache.size,
      configuredSymbols: cfg.symbols.length,
      symbols: cfg.symbols,
    };
    // Runtime block (task 0055) rides on /health too — load-balancer
    // probes typically only call /health, so without this the safety
    // flags would be invisible to the rest of the system.
    if (runtimeGetter) body.runtime = runtimeGetter();
    if (statsGetter) {
      const stats = statsGetter();
      body.ingested = stats.ingested;
      body.rejected = stats.rejected;
      const ratio = computeAcceptanceRatio(stats);
      body.acceptanceRatio = ratio.ratio;
      body.acceptanceRatioStatus = ratio.status;
    }
    const { degraded, src } = computeDegraded(cache, sourceStatusGetter, wsStatusGetter);
    // Body-level `degraded` boolean unifies the field name across
    // `/health`, `/quotes`, `/quotes/fresh/all`, `/status/quotes`. The
    // existing `status: 'ok'|'degraded'` string stays — it's the
    // human-readable discovery field that `/` also carries (task 0006).
    // See task 0064.
    const degradedMessage = degraded
      ? 'service degraded — see source.reason / source.nextStep'
      : undefined;
    if (degraded) applyRetryAfterHeader(res, src);
    res.status(degraded ? 503 : 200).json(
      finalizeEnvelope(body, now, {
        src,
        ws: buildWsAdvertisement(req),
        wsErr: buildWsErrorBlock(),
        degraded,
        message: degradedMessage,
        status: degraded ? 'degraded' : 'ok',
        boot: buildBootBlock(now),
      }),
    );
  });

  app.get('/quotes', (_req: Request, res: Response) => {
    const now = Date.now();
    const all = cache.getAll();
    const quotes: Record<string, unknown> = {};
    for (const [symbol, entry] of all) {
      quotes[symbol] = {
        ...entry.quote,
        cacheAge: now - entry.cachedAt,
        filterAccepted: entry.filterResult.accepted,
        filterReason: entry.filterResult.reason,
      };
    }
    const count = Object.keys(quotes).length;
    // `count` is the legacy alias for `totalCached`. Both fields hold the
    // EXACT SAME number (drift-gated by tests) and ship together for one
    // deprecation window so existing consumers don't break. The follow-up
    // task drops `count` and the `deprecations.count` entry. Keep the
    // canonical field (`totalCached`) first so a fresh integrator reading
    // top-down learns it before the deprecated alias.
    const body: Record<string, unknown> = {
      totalCached: cache.size,
      count,
    };
    let ctx: EnvelopeCtx = {
      deprecations: {
        count: 'rename → totalCached; will be removed in the next release',
      },
    };
    let status = 200;
    if (sourceStatusGetter) {
      const { degraded, src } = computeDegraded(cache, sourceStatusGetter, wsStatusGetter);
      // 503 only fires when the source is dead AND the cache holds
      // nothing useful — a non-empty cache is still a useful read-only
      // answer (flagged with `stale:true` so a consumer can distinguish
      // fresh from cache-only). See task 0060. The body-level
      // `degraded` + `message` go through the envelope helper so field
      // ordering matches `/health`, `/quotes/fresh/all`, `/status/quotes`.
      // See task 0064.
      let message: string | undefined;
      if (degraded && count === 0) {
        status = 503;
        message =
          'no cached quotes — upstream source is degraded ' +
          '(see source.reason / source.nextStep)';
      } else if (degraded && count > 0) {
        body.stale = true;
        message =
          'serving stale cached quotes — upstream source is dead ' +
          '(see source.reason / source.nextStep)';
      } else if (count === 0) {
        message = 'no cached quotes — source is healthy, awaiting first tick';
      }
      body.quotes = quotes;
      ctx = { ...ctx, src, degraded, message };
    } else {
      body.quotes = quotes;
    }
    if (status === 503) applyRetryAfterHeader(res, ctx.src);
    res.status(status).json(finalizeEnvelope(body, now, ctx));
  });

  // Single helper so all three sub-envelopes (200 success, 404
  // unconfigured, 404 no-quote) thread their optional `source?` field
  // through the same path; input-validation 400s deliberately skip
  // source (they don't depend on upstream state).
  function sanitizedSource(): SanitizedSourceStatus | undefined {
    return sourceStatusGetter ? sanitizeSourceStatus(sourceStatusGetter()) : undefined;
  }

  app.get('/quotes/:symbol', (req: Request, res: Response) => {
    const now = Date.now();
    const result = normalizeSymbol(req.params.symbol);
    if (!result.ok) {
      // Pick the message based on which gate failed so the caller knows
      // exactly what to fix. Pure-special inputs (all dots/dashes/
      // underscores) don't deserve the 404 "edit ORACLE_SYMBOLS and
      // restart" framing — that copy is for legitimate-but-unconfigured
      // tickers, not for inputs that can never be a ticker on any market.
      // 400 is input validation — intentionally does NOT carry source state.
      const message =
        result.reason === 'no-alnum'
          ? 'symbol must contain at least one letter or digit'
          : INVALID_SYMBOL_SHAPE_MESSAGE;
      // `echoPath` bounds the reflected URL to MAX_ECHOED_PATH_BYTES
      // bytes verbatim and, when truncated, attaches three companion
      // fields (pathTruncated/pathOriginalLength/pathPrefixLength) so
      // a 5 KB hostile symbol still ships a ~150 B path field with full
      // forensic metadata. See task 0058.
      // Field order mirrors the 405 / catch-all 404 / per-symbol 404:
      // error → message → humanReason → severity → nextStep →
      // existing tail. Triplet sources from
      // `ERROR_REASONS_PUBLIC['invalid-symbol']`. See task 0073.
      const body: Record<string, unknown> = {
        error: 'invalid-symbol',
        message,
        humanReason: INVALID_SYMBOL_HUMAN_REASON,
        severity: INVALID_SYMBOL_SEVERITY,
        nextStep: INVALID_SYMBOL_NEXT_STEP,
        expected: INVALID_SYMBOL_EXPECTED,
        deprecations: INVALID_SYMBOL_DEPRECATIONS,
        ...echoPath(req.path),
        method: req.method,
      };
      res.status(400).json(finalizeTimestamps(body, now));
      return;
    }
    // Near-miss detection (task 0030): if the canonicalised symbol
    // names a sibling route (`/quotes/fresh` → /quotes/fresh/all,
    // `/quotes/health` → /health, ...), steer the caller with
    // `didYouMean` instead of the strong "edit ORACLE_SYMBOLS and
    // restart" framing of `symbol-not-configured`. Runs BEFORE the
    // configured-set check so the steer wins over the config-error
    // narrative for these specific typos.
    const lowered = result.symbol.toLowerCase();
    const hint = ROUTE_HINTS.get(lowered);
    if (hint) {
      // Field order mirrors the other 4xx envelopes: error → message
      // → humanReason → severity → nextStep → existing tail. Triplet
      // sources from `ERROR_REASONS_PUBLIC['invalid-symbol-or-path']`.
      // See task 0073.
      const body: Record<string, unknown> = {
        error: 'invalid-symbol-or-path',
        message:
          `the path segment '${lowered}' is a known sibling-route ` +
          `prefix; did you mean ${hint}?`,
        humanReason: INVALID_SYMBOL_OR_PATH_HUMAN_REASON,
        severity: INVALID_SYMBOL_OR_PATH_SEVERITY,
        nextStep: INVALID_SYMBOL_OR_PATH_NEXT_STEP,
        didYouMean: hint,
        ...echoPath(req.path),
        method: req.method,
      };
      res.status(400).json(finalizeTimestamps(body, now));
      return;
    }
    if (!configuredSet.has(result.symbol)) {
      // Permanent 404: this symbol will never tick on this deploy
      // because it isn't in the subscription set. Distinct from the
      // transient `no-quote` case so polling consumers can give up
      // and surface a config error instead of retrying forever.
      //
      // Carry the full configured set + count + a Levenshtein-1
      // suggestion so a frontend can render "did you mean AAPL?" from
      // this single response (task 0040). `didYouMean` is omitted —
      // not null — when no candidate clears the threshold.
      // Field order mirrors the 405 / catch-all 404: error → message →
      // humanReason → severity → nextStep → existing tail. The triplet
      // sources from `ERROR_REASONS_PUBLIC['symbol-not-configured']`
      // so the body and the `/docs/source-reasons` catalog cannot
      // drift. See task 0072.
      const body: Record<string, unknown> = {
        error: 'symbol-not-configured',
        message:
          'symbol is not in the deployed subscription set; ' +
          'retrying will not help — update ORACLE_SYMBOLS and restart',
        humanReason: SYMBOL_NOT_CONFIGURED_HUMAN_REASON,
        severity: SYMBOL_NOT_CONFIGURED_SEVERITY,
        nextStep: SYMBOL_NOT_CONFIGURED_NEXT_STEP,
        symbol: result.symbol,
        configured: false,
        configuredSymbols: cfg.symbols,
        configuredSymbolCount: cfg.symbols.length,
      };
      const suggestion = nearestSymbol(result.symbol, cfg.symbols);
      if (suggestion !== undefined) body.didYouMean = suggestion;
      res.status(404).json(finalizeEnvelope(body, now, { src: sanitizedSource() }));
      return;
    }
    const entry = cache.get(result.symbol);
    if (!entry) {
      // Field order mirrors the symbol-not-configured branch above:
      // error → message → humanReason → severity → nextStep →
      // existing tail. Triplet sources from
      // `ERROR_REASONS_PUBLIC['no-quote']`. See task 0072.
      const src = sanitizedSource();
      // Mirror the bulk `/quotes` 503 contract (task 0066): when the
      // upstream source is dead the body's `source.retryAfterSeconds`
      // is the canonical backoff hint, so lift it into the HTTP
      // `Retry-After` header too. Off-the-shelf middleware
      // (urllib3, Faraday, retry-axios) honours the same schedule
      // across bulk and per-symbol endpoints. RFC 9110 §10.2.3
      // explicitly permits `Retry-After` on 404. Gated on
      // `!connected && retryAfterSeconds > 0` so the warmup branch
      // (healthy source, cold cache, non-deterministic first tick)
      // does NOT advertise a misleading hint. See task 0074.
      if (
        src &&
        !src.connected &&
        typeof src.retryAfterSeconds === 'number' &&
        src.retryAfterSeconds > 0
      ) {
        res.setHeader('Retry-After', String(src.retryAfterSeconds));
      }
      const body: Record<string, unknown> = {
        error: 'no-quote',
        message:
          'symbol is configured but the cache holds no fresh tick — ' +
          'retry once source delivers',
        humanReason: NO_QUOTE_HUMAN_REASON,
        severity: NO_QUOTE_SEVERITY,
        nextStep: NO_QUOTE_NEXT_STEP,
        symbol: result.symbol,
        configured: true,
      };
      res.status(404).json(finalizeEnvelope(body, now, { src }));
      return;
    }
    const body: Record<string, unknown> = {
      ...entry.quote,
      cacheAge: now - entry.cachedAt,
      filterAccepted: entry.filterResult.accepted,
      filterReason: entry.filterResult.reason,
    };
    res.json(finalizeEnvelope(body, now, { src: sanitizedSource() }));
  });

  app.get('/quotes/fresh/all', (_req: Request, res: Response) => {
    const now = Date.now();
    const fresh = cache.getFresh();
    // Reuse the canonical `computeDegraded` verdict so /quotes/fresh/all,
    // /health, /status/quotes, and /quotes all agree on "should a consumer
    // trust the empty array?". Without sourceStatusGetter the legacy
    // 200-always behaviour is preserved (cache-only verdict on an empty
    // cache is "not degraded" — the warmup window).
    const { degraded, src } = computeDegraded(cache, sourceStatusGetter, wsStatusGetter);
    // `count` is the legacy alias for `freshCount`; the canonical
    // matches `/status/quotes.freshCount` so a consumer typing
    // `body.freshCount` against either endpoint reads the same field.
    // The two ship together for one deprecation window with a rename
    // pointer (same cadence as `/quotes.count → totalCached` from
    // task 0035). See task 0054.
    const body: Record<string, unknown> = {
      quotes: fresh,
      freshCount: fresh.length,
      count: fresh.length,
    };
    // Body-level `degraded` + `message` flow through the envelope ctx
    // (task 0064) so field ordering matches the other three health
    // endpoints. The legacy direct-write path is kept for the
    // back-compat no-source-getter branch where the wire field is
    // intentionally absent.
    let degradedField: boolean | undefined;
    let degradedMessage: string | undefined;
    if (sourceStatusGetter) {
      degradedField = degraded;
      if (fresh.length === 0) {
        degradedMessage = degraded
          ? 'no fresh quotes — upstream source is degraded ' +
            '(see source.reason / source.nextStep)'
          : 'no fresh quotes — source is healthy, awaiting first ' +
            'accepted tick';
      }
    }
    if (degraded) applyRetryAfterHeader(res, src);
    res.status(degraded ? 503 : 200).json(
      finalizeEnvelope(body, now, {
        src,
        degraded: degradedField,
        message: degradedMessage,
        deprecations: {
          count: 'rename → freshCount; will be removed in the next release',
        },
      }),
    );
  });

  app.get('/audit/stats', (_req: Request, res: Response) => {
    const now = Date.now();
    const stats: IngestStats = statsGetter
      ? statsGetter()
      : {
          ingested: 0,
          rejected: 0,
          byReason: {},
          firstAtMs: null,
          lastAtMs: null,
          writeErrors: 0,
          bufferedDrops: 0,
        };
    const { body, deprecations } = buildAuditStatsBody(stats);
    // Surface the safety block (`etoroMode`, `realTradingEnabled`,
    // `network`, `fixtureOnly`, `configuredAt*`) here too so an SRE
    // polling acceptance-ratio and audit-log backpressure metrics
    // can filter fixture-mode noise without a second GET against
    // `/health`. Same `runtimeGetter()` reference `/` and
    // `/health` use, so the three endpoints can never drift. Slot
    // sits between the domain payload and the boot tail.
    // See task 0075.
    if (runtimeGetter) body.runtime = runtimeGetter();
    res.json(
      finalizeEnvelope(body, now, { boot: buildBootBlock(now), deprecations }),
    );
  });

  app.get('/status/quotes', (_req: Request, res: Response) => {
    const now = Date.now();
    const all = cache.getAll();
    // Per-quote entry shape pins the canonical-duration convention
    // service-wide: `cacheAge` is the duration field across /quotes,
    // /quotes/:symbol, and /status/quotes. `lastUpdateMs` is preserved
    // for one release as a deprecated alias (drift-gated by tests so
    // the two fields stay equal). The `Age` suffix marks durations
    // going forward; `Ms` suffix marks unix-ms timestamps. The lone
    // legacy exception (`uptimeMs`) is intentional.
    const quotes: Array<{
      symbol: string;
      cacheAge: number;
      lastUpdateMs: number;
      sessionState: string;
      confidence: number;
    }> = [];

    let freshCount = 0;
    for (const [symbol, entry] of all) {
      const age = now - entry.cachedAt;
      quotes.push({
        symbol,
        cacheAge: age,
        lastUpdateMs: age,
        sessionState: entry.quote.sessionState,
        confidence: entry.quote.confidence,
      });
      if (!entry.quote.stale && entry.filterResult.accepted) {
        freshCount++;
      }
    }

    const { degraded, src } = computeDegraded(cache, sourceStatusGetter, wsStatusGetter);
    const body: Record<string, unknown> = {
      freshCount,
      totalCount: all.size,
      quotes,
    };
    // `degraded:boolean` is now the canonical field across every
    // health-class endpoint (task 0064). The legacy `healthy:boolean`
    // rides for one release as a polarity-flipped alias with a
    // deprecation pointer — same release-cadence as `count → totalCached`
    // (task 0035) and `lastUpdateMs → cacheAge` (task 0033).
    const degradedMessage = degraded
      ? 'service degraded — see source.reason / source.nextStep'
      : undefined;
    if (degraded) applyRetryAfterHeader(res, src);
    res.status(degraded ? 503 : 200).json(
      finalizeEnvelope(body, now, {
        src,
        degraded,
        message: degradedMessage,
        healthy: !degraded,
        deprecations: {
          lastUpdateMs: 'rename → cacheAge; will be removed in the next release',
          healthy:
            'rename → degraded (polarity flipped); will be removed in the next release',
        },
      }),
    );
  });

  app.all('*', (req: Request, res: Response) => {
    const now = Date.now();
    const entry = findCatalogEntry(req.path);
    if (entry && !entry.methods.includes(req.method)) {
      // OPTIONS is appended at the call site (rather than stored in the
      // catalog) so the discovery payload stays clean of the CORS
      // transport verb while the 405 still advertises it. Both the
      // OPTIONS short-circuit and this 405 branch read the list off
      // `allowedMethodsForPath` so the `Allow` header on a successful
      // capability-discovery probe and the `Allow` header on a
      // wrong-verb 405 cannot drift. See task 0059.
      const allowed = [...allowedMethodsForPath(req.path)];
      res.setHeader('Allow', allowed.join(', '));
      // Field order matches the source-block convention so the catalog's
      // documented responseShape (error → human copy → machine
      // bookkeeping → meta tail) reads top-to-bottom against the wire
      // body. `finalizeTimestamps` re-anchors timestamp+timestampIso last.
      const echoed = echoPath(req.path);
      const body: Record<string, unknown> = {
        error: 'method-not-allowed',
        message: buildMethodNotAllowedMessage(req.method, allowed, echoed.path),
        humanReason: METHOD_NOT_ALLOWED_HUMAN_REASON,
        severity: METHOD_NOT_ALLOWED_SEVERITY,
        nextStep: METHOD_NOT_ALLOWED_NEXT_STEP,
        allowed,
        method: req.method,
        ...echoed,
      };
      res.status(405).json(finalizeTimestamps(body, now));
      return;
    }
    // Compact hint list: every wrong-URL response (typos, /favicon.ico,
    // crawler scans, misconfigured probes) gets a small body. Full
    // per-endpoint discovery (summary + responseShape) lives at GET /.
    const endpoints: EndpointIndexCompactEntry[] = buildEndpointIndexCompact();
    const ws = buildWsAdvertisement(req);
    if (ws) {
      endpoints.push({ path: ws.url, methods: ['CONNECT'] });
    }
    const didYouMean = canonicalSuggestion(req.path);
    const echoed = echoPath(req.path);
    // Field order mirrors the 405 envelope (task 0057): error → message
    // → humanReason → severity → nextStep → ...echo → method →
    // discovery → didYouMean? → endpoints[] → meta tail. The
    // parametric-parent override rides on `message` (the per-request
    // slot), NOT on `humanReason` (the static catalog value) — so the
    // catalog single-source-of-truth stays intact and every 404's
    // humanReason is identical. See task 0063.
    const message =
      req.path === '/quotes/'
        ? PARAMETRIC_PARENT_MESSAGE
        : buildNotFoundMessage(req.method, echoed.path);
    const body: Record<string, unknown> = {
      error: 'not-found',
      message,
      humanReason: NOT_FOUND_HUMAN_REASON,
      severity: NOT_FOUND_SEVERITY,
      nextStep: NOT_FOUND_NEXT_STEP,
    };
    Object.assign(body, echoed);
    body.method = req.method;
    body.discovery = '/';
    if (didYouMean !== undefined) body.didYouMean = didYouMean;
    body.endpoints = endpoints;
    res.status(404).json(finalizeTimestamps(body, now));
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const now = Date.now();
    if (isMalformedUriError(err)) {
      // Slim envelope: the actionable diagnostic (`expected` block) plus
      // a single 5-byte `discovery:'/'` pointer for an automated client
      // that hasn't found the catalog yet. The `endpoints[]` dump that
      // 0027 already trimmed off 404 is deliberately NOT replicated here
      // — an integrator typo'ing percent-encoding already knows the
      // path they meant and should not pay the catalog tax (~400 B
      // saved per response). `endpoints[]` now lives on exactly two
      // call sites: GET / (the discovery endpoint) and the catch-all
      // 404 (typo recovery). See task 0061.
      const didYouMean = suggestCleanedPath(req.path);
      const echoed = echoPath(req.path);
      // Field order mirrors the other 4xx envelopes: error → message
      // → humanReason → severity → nextStep → expected →
      // didYouMean? → ...echoPath → method → discovery. Triplet
      // sources from `ERROR_REASONS_PUBLIC['malformed-uri']`.
      // See task 0073.
      const body: Record<string, unknown> = {
        error: 'malformed-uri',
        message: MALFORMED_URI_MESSAGE,
        humanReason: MALFORMED_URI_HUMAN_REASON,
        severity: MALFORMED_URI_SEVERITY,
        nextStep: MALFORMED_URI_NEXT_STEP,
        expected: MALFORMED_URI_EXPECTED,
      };
      if (didYouMean !== undefined) body.didYouMean = didYouMean;
      Object.assign(body, echoed);
      body.method = req.method;
      body.discovery = '/';
      res.status(400).json(finalizeTimestamps(body, now));
      return;
    }
    const e = (err && typeof err === 'object' ? err : {}) as {
      status?: unknown;
      expose?: unknown;
      message?: unknown;
    };
    const status = typeof e.status === 'number' ? e.status : 500;
    const code = status >= 500 ? 'internal-error' : 'bad-request';
    // Static, redacted message for 5xx — never reflect handler internals.
    const message =
      status >= 500
        ? 'internal error'
        : e.expose === true && typeof e.message === 'string'
          ? e.message
          : code;
    const body: Record<string, unknown> = {
      error: code,
      message,
      ...echoPath(req.path),
      method: req.method,
    };
    res.status(status).json(finalizeTimestamps(body, now));
  });

  return app;
}
