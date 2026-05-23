import { SourceStatus } from './types';
import { isoFromMs } from './iso';

/**
 * Severity ladder shipped on every `source.severity` field. `'ok'` was
 * added by task 0050 so the connected branch can render through the
 * same coloured-badge code path as the failure branches — no consumer
 * has to special-case "field absent ⇒ healthy".
 */
export type SourceSeverity = 'ok' | 'info' | 'degraded' | 'critical';

/**
 * RFC 9110 §15.6.4 retry-cadence map keyed off the source severity.
 * Returns `undefined` for `'ok'` (200 path — caller no-ops the
 * `Retry-After` header). Numbers are deliberately conservative: a
 * transient warmup recovers in ~5 s, a `'degraded'` source ~15 s, a
 * `'critical'` config error needs operator intervention (60 s polling
 * helps no-one but slows the retry loop). See task 0066.
 *
 * The same numbers ride on the wire as `source.retryAfterSeconds` so
 * JSON-only consumers can read the same value the `Retry-After`
 * header carries.
 */
export const RETRY_AFTER_SECONDS_BY_SEVERITY: Readonly<
  Record<SourceSeverity, number | undefined>
> = Object.freeze({
  ok: undefined,
  info: 5,
  degraded: 15,
  critical: 60,
});

export function retryAfterSecondsForSeverity(
  severity: SourceSeverity,
): number | undefined {
  return RETRY_AFTER_SECONDS_BY_SEVERITY[severity];
}

/**
 * In-band deprecation message attached to the `source` block on every
 * endpoint so a consumer reading `lastAttachAt` discovers the
 * `lastAttachAtMs`/`lastAttachAtIso` rename without grepping the
 * codebase. Mirrors the `/quotes.count` → `totalCached` deprecation
 * strategy from task 0035.
 */
export const LAST_ATTACH_AT_DEPRECATION =
  'rename → lastAttachAtMs; will be removed in the next release';

export interface SourceDeprecations {
  lastAttachAt: string;
}

export interface SourceReasonDoc {
  /** Stable snake-case enum; matches the slugs written by producers. */
  code: string;
  /** One-sentence plain English explanation of the failure. */
  humanReason: string;
  /** One-sentence "what to try first" hint for an operator. */
  nextStep: string;
  /** Triage hint: `info` = expected transient, `critical` = needs human. */
  severity: SourceSeverity;
}

/**
 * Sanitized read-site shape of `SourceStatus`. The `connected: false`
 * branch grows the three enrichment fields (`humanReason`, `nextStep`,
 * `severity`) so an operator paged on a degraded alert can act without
 * grepping the codebase.
 *
 * The connected branch always carries a populated unix-ms / ISO
 * companion pair (`lastAttachAtMs` + `lastAttachAtIso`) plus the
 * legacy `lastAttachAt` alias and an in-band `deprecations` note.
 *
 * The disconnected branch trims everything that would otherwise ship
 * as a `null` (task 0052): `detail` rides only when populated (the
 * `source-unavailable` branch sets it; everywhere else it is absent),
 * and the timestamp triplet (`lastAttachAtMs` + `lastAttachAtIso` +
 * legacy `lastAttachAt`) plus its `deprecations` rename note ride
 * together iff the canonical timestamp is non-null. Same show-iff-
 * legacy-on-the-wire policy as `count → totalCached` on `/quotes`.
 *
 * Producers (e.g. `index.ts`) keep writing the minimal `SourceStatus`
 * shape; the ISO companion and conditional assembly live here.
 */
export type SanitizedSourceStatus =
  | {
      connected: false;
      reason: string;
      humanReason: string;
      nextStep: string;
      severity: SourceSeverity;
      retryAfterSeconds: number;
      detail?: string;
      lastAttachAtMs?: number;
      lastAttachAtIso?: string;
      lastAttachAt?: number;
      deprecations?: SourceDeprecations;
    }
  | {
      connected: true;
      reason: 'connected';
      humanReason: string;
      nextStep: string;
      severity: SourceSeverity;
      retryAfterSeconds: 0;
      symbols: string[];
      lastAttachAtMs: number;
      lastAttachAtIso: string;
      lastAttachAt: number;
      deprecations: SourceDeprecations;
    };

/**
 * Operator-facing catalog of stable failure modes. Keep slugs identical
 * to what `redactSourceReason` and the producer at `index.ts` emit so
 * `enrichSourceReason` can look them up by exact match.
 */
export const REASON_CATALOG: Readonly<Record<string, SourceReasonDoc>> = Object.freeze({
  'connected': {
    code: 'connected',
    humanReason:
      'Service is attached to the upstream market-data source and ' +
      'receiving ticks for the configured symbol set.',
    nextStep:
      'No action required. Subscribe to the WebSocket feed for live ' +
      'ticks or poll /quotes for snapshots.',
    severity: 'ok',
  },
  'not-attached': {
    code: 'not-attached',
    humanReason:
      'Service is booting and has not yet attempted to attach to the ' +
      'upstream market-data source.',
    nextStep:
      'Wait ~5s for the boot-time attach. If reason does not change, ' +
      'check process logs.',
    severity: 'info',
  },
  'etoro-client-not-installed': {
    code: 'etoro-client-not-installed',
    humanReason:
      'The lane-1 @goodchain/etoro-client package could not be loaded ' +
      '(MODULE_NOT_FOUND).',
    nextStep:
      'Install/rebuild lane-1 (backend/etoro-client) and restart the ' +
      'price-service.',
    severity: 'critical',
  },
  'source-unavailable': {
    code: 'source-unavailable',
    humanReason:
      'The upstream market-data source threw an unrecognized error at ' +
      'attach time.',
    nextStep:
      'Check process logs for the underlying error and the eToro sandbox ' +
      'status page.',
    severity: 'degraded',
  },
});

/**
 * Look up a reason slug in the catalog. Unknown slugs (e.g. the
 * truncated-error-message bucket from `redactSourceReason`) get a
 * synthesised entry that preserves the original reason in
 * `humanReason` so no information is dropped on the wire.
 */
export function enrichSourceReason(reason: string): SourceReasonDoc {
  const known = REASON_CATALOG[reason];
  if (known) return known;
  return {
    code: 'unknown',
    humanReason: `Upstream source attach failed: ${reason}`,
    nextStep:
      'Check process logs; this code is not in the catalog. ' +
      'File an issue if you see it often.',
    severity: 'degraded',
  };
}

/**
 * Convert an arbitrary thrown value (typically the `err` from a failed
 * source attach) into a single-line, path-stripped diagnostic suitable
 * for storage in `SourceStatus.reason`.
 *
 * The output:
 *   - is at most one line (no `\n`)
 *   - never carries an absolute filesystem path (`/home/...`, `C:\...`)
 *   - never carries a Node `Require stack:` trailer
 *   - is bounded to a sane length so a runaway error message can't
 *     bloat the `/health` and `/status/quotes` JSON bodies
 *
 * For Node `MODULE_NOT_FOUND` failures we collapse to the stable code
 * `etoro-client-not-installed` so monitoring can match on it.
 */
export function redactSourceReason(err: unknown): string {
  if (!(err instanceof Error)) return 'source-unavailable';
  const code = (err as NodeJS.ErrnoException).code;
  if (code === 'MODULE_NOT_FOUND') return 'etoro-client-not-installed';
  const firstLine = err.message.split('\n', 1)[0]?.trim() ?? '';
  const stripped = firstLine.replace(/(?:\/|[A-Za-z]:\\)[^\s'"]+/g, '<path>');
  if (stripped.length === 0) return 'source-unavailable';
  return stripped.length > 120 ? `${stripped.slice(0, 117)}...` : stripped;
}

/**
 * Classify a thrown attach-time error into a stable `REASON_CATALOG`
 * slug. The producer at `index.ts` runs every caught error through
 * here and stores both the slug (as `SourceStatus.reason`) and the
 * optional redacted machine string (as `SourceStatus.detail`) so the
 * wire `source.reason` field is ALWAYS one of the catalog keys —
 * matching the contract advertised at `/docs/source-reasons`.
 *
 * Three branches:
 *  - non-Error throws → `source-unavailable` + `null` detail
 *  - `MODULE_NOT_FOUND` → `etoro-client-not-installed` + `null` detail
 *  - any other Error → `source-unavailable` + `redactSourceReason(err)`
 *    detail (single line, path-stripped, length-bounded)
 *
 * The return type pins `reason` to `keyof typeof REASON_CATALOG` so
 * any future divergence between the classifier and the catalog is a
 * TypeScript error at the callsite.
 */
export function classifySourceError(err: unknown): {
  reason: keyof typeof REASON_CATALOG;
  detail: string | null;
} {
  if (!(err instanceof Error)) {
    return { reason: 'source-unavailable', detail: null };
  }
  const code = (err as NodeJS.ErrnoException).code;
  if (code === 'MODULE_NOT_FOUND') {
    return { reason: 'etoro-client-not-installed', detail: null };
  }
  return { reason: 'source-unavailable', detail: redactSourceReason(err) };
}

/**
 * Defense-in-depth wrapper applied at the read sites (`/health`,
 * `/status/quotes`, WS snapshot). Keeps the HTTP/WS surface clean
 * even if a future caller bypasses `redactSourceReason` at the
 * write site, and enriches the disconnected branch with
 * operator-readable `humanReason` / `nextStep` / `severity` so a
 * brand-new operator can act on the alert without grepping the code.
 */
export function sanitizeSourceStatus(status: SourceStatus): SanitizedSourceStatus {
  if (status.connected) {
    const doc = REASON_CATALOG['connected'];
    return {
      connected: true,
      reason: 'connected',
      humanReason: doc.humanReason,
      nextStep: doc.nextStep,
      severity: doc.severity,
      // 0 == "no backoff needed, retry immediately" on the wire. Keeps
      // the field shape symmetric across branches so a consumer can
      // read `body.source.retryAfterSeconds` without a null/undefined
      // check, and preserves the source-block no-null invariant
      // (task 0052). See task 0066.
      retryAfterSeconds: 0,
      symbols: status.symbols,
      lastAttachAtMs: status.lastAttachAt,
      lastAttachAtIso: isoFromMs(status.lastAttachAt)!,
      lastAttachAt: status.lastAttachAt,
      deprecations: { lastAttachAt: LAST_ATTACH_AT_DEPRECATION },
    };
  }
  const safeReason = redactSourceReason(new Error(status.reason));
  const doc = enrichSourceReason(safeReason);
  // Build the disconnected body in two passes (task 0052): the
  // always-present fields first, then the conditional triplet
  // (`detail`, the `lastAttachAt*` family + its deprecation note)
  // only when populated. Insertion order encodes the field-ordering
  // policy from task 0041 — canonical `lastAttachAtMs` before its
  // ISO companion before the legacy alias before the deprecation map.
  // Disconnected branches always carry a non-`'ok'` severity, so the
  // `?? 0` fallback is unreachable; pinned for type-safety against a
  // future enum loosening that would break the `SourceSeverity`
  // narrow.
  const out: SanitizedSourceStatus = {
    connected: false,
    reason: safeReason,
    humanReason: doc.humanReason,
    nextStep: doc.nextStep,
    severity: doc.severity,
    retryAfterSeconds: retryAfterSecondsForSeverity(doc.severity) ?? 0,
  };
  if (status.detail) out.detail = status.detail;
  if (status.lastAttachAt !== null) {
    out.lastAttachAtMs = status.lastAttachAt;
    out.lastAttachAtIso = isoFromMs(status.lastAttachAt)!;
    out.lastAttachAt = status.lastAttachAt;
    out.deprecations = { lastAttachAt: LAST_ATTACH_AT_DEPRECATION };
  }
  return out;
}

/**
 * Public projection of `REASON_CATALOG` suitable for the discovery
 * payload. Strips the `code` field (it duplicates the map key) so
 * the wire shape stays compact.
 */
export const SOURCE_REASONS_PUBLIC: Readonly<
  Record<string, { humanReason: string; nextStep: string; severity: SourceSeverity }>
> = Object.freeze(
  Object.fromEntries(
    Object.values(REASON_CATALOG).map((d) => [
      d.code,
      { humanReason: d.humanReason, nextStep: d.nextStep, severity: d.severity },
    ]),
  ),
);

/**
 * Operator-facing catalog of stable error-envelope slugs that ride on the
 * service's HTTP error paths (404 today; 400/405 to follow as separate
 * tasks). Distinct namespace from `REASON_CATALOG` / `SOURCE_REASONS_PUBLIC`
 * because those catalogs describe upstream-source state, while these
 * describe HTTP-level input-handling state — mixing the two pollutes the
 * `/docs/source-reasons` semantics.
 *
 * Inner shape is identical to `SOURCE_REASONS_PUBLIC` so a consumer
 * rendering one map can render the other with a single template. Shipped
 * under the sibling `errorReasons` field on `/docs/source-reasons`
 * (task 0063) — same endpoint, no new route.
 */
export const ERROR_REASONS_PUBLIC: Readonly<
  Record<string, { humanReason: string; nextStep: string; severity: SourceSeverity }>
> = Object.freeze({
  'not-found': {
    humanReason: 'No endpoint matches this URL.',
    nextStep: 'Retry `didYouMean` if present, else pick from `endpoints`.',
    severity: 'info',
  },
});

/**
 * Catalog of stable WebSocket-broadcaster failure modes. Distinct namespace
 * from `REASON_CATALOG` because the upstream-source verdict (`source.reason`
 * on data endpoints) is unrelated to a service-level WS bind failure: the
 * upstream feed can be perfectly healthy while the broadcaster's own port
 * is held by a stale/parallel instance.
 */
export const WS_REASON_CATALOG: Readonly<Record<string, SourceReasonDoc>> = Object.freeze({
  'ws-bind-failed': {
    code: 'ws-bind-failed',
    humanReason:
      'WebSocket broadcaster failed to bind the configured port; ' +
      'downstream tick-subscribers cannot connect.',
    nextStep:
      'Free PRICE_SERVICE_WS_PORT (ss -tlnp | grep <port>) or change ' +
      'it. Restart the service.',
    severity: 'critical',
  },
});

export function enrichWsReason(reason: string): SourceReasonDoc {
  const known = WS_REASON_CATALOG[reason];
  if (known) return known;
  return {
    code: 'unknown',
    humanReason: `WS broadcaster bind failed: ${reason}`,
    nextStep: 'Check process logs for the underlying error.',
    severity: 'degraded',
  };
}
