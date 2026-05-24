/**
 * Prometheus text-exposition (`text/plain; version=0.0.4; charset=utf-8`)
 * emitter for the price-service. Operators wire this directly into
 * Grafana via a standard Prometheus scrape — no JSON-to-Prometheus
 * sidecar, no bespoke transformer.
 *
 * Hand-rolled per the clean-code gate: the format is line-based and
 * trivial to emit for ~10 series; the conventional `prom-client`
 * library ships ~50 KB of surface we don't need. See task 0080.
 */

/**
 * Canonical Prometheus 0.0.4 text-exposition Content-Type. Older
 * (`text/plain;version=0.0.4`) is what every existing Prometheus
 * scraper speaks; OpenMetrics 1.0.0 is intentionally out of scope.
 */
export const METRICS_CONTENT_TYPE =
  'text/plain; version=0.0.4; charset=utf-8';

/**
 * Pre-registered rejection-reason buckets emitted as zero-baseline
 * rows for `price_service_rejected_total`, even on a freshly-booted
 * instance that has rejected nothing. Without these, PromQL
 * `rate(...)[5m]` and `increase(...)[5m]` over the counter family
 * return NaN / blank — Grafana panels can't distinguish "no
 * rejections (good)" from "metric missing (bad)" until the second
 * rejection of each reason. See Prometheus best-practices doc on
 * avoiding missing metrics and task 0086.
 *
 * The set mirrors every prefix `risk-filter.ts` emits before the
 * first `:` (which `AuditLogger.reasonBucket` slices off), plus the
 * `'unknown'` fallback the audit logger uses when a producer
 * supplies no reason. A drift test parses risk-filter.ts and asserts
 * every emitted literal appears in this list so a future filter
 * addition is a one-line catalog update.
 *
 * Sorted alphabetically so the constant declaration order matches
 * the emission order (sorted at render time) — helps reviewer grep
 * and keeps the byte-stability test from hinging on a Map's
 * insertion order.
 */
export const KNOWN_REJECTION_REASONS: readonly string[] = [
  'crossed',
  'deviation',
  'halted',
  'invalid',
  'market-closed',
  'spread-too-wide',
  'stale',
  'unknown',
];

/**
 * Dependency-free struct captured at handler entry. Snapshotting once
 * means a mid-render quote tick can't desync `cache_size` from
 * `cache_fresh_size`. The emitter is a pure function of this struct.
 */
export interface MetricsSnapshot {
  version: string;
  uptimeSeconds: number;
  runtime: MetricsRuntime;
  cacheSize: number;
  cacheFreshSize: number;
  cacheAges: ReadonlyArray<MetricsCacheAge>;
  ingestTotal: number;
  acceptedTotal: number;
  rejectedTotalByReason: Readonly<Record<string, number>>;
  sourceReason: string;
  sourceConnected: boolean;
  wsListening: boolean;
  wsClients: number;
  auditWriteErrorsTotal: number;
  auditBufferedDropsTotal: number;
}

export interface MetricsRuntime {
  etoroMode: string;
  network: string;
  fixtureOnly: boolean;
  realTradingEnabled: boolean;
}

export interface MetricsCacheAge {
  symbol: string;
  ageSeconds: number;
}

/**
 * Escape a label value per the 0.0.4 spec: backslash → `\\`, quote →
 * `\"`, newline → `\n`. Today's symbols are ASCII alphanum so this is
 * a no-op for them, but reaching for the spec-correct helper now
 * means future non-ASCII tickers (FX pairs containing `/`) don't
 * blow up a downstream parser.
 */
export function escapeLabelValue(v: string): string {
  let out = '';
  for (let i = 0; i < v.length; i++) {
    const ch = v[i];
    if (ch === '\\') out += '\\\\';
    else if (ch === '"') out += '\\"';
    else if (ch === '\n') out += '\\n';
    else out += ch;
  }
  return out;
}

/**
 * Coerce a possibly-non-finite number into a Prometheus-safe value.
 * Spec forbids `NaN`/`Infinity` (well, allows but they cause parser
 * grief); emit 0 instead — the metric exists, the sample is "no
 * data" rather than "math broke".
 */
function safeNumber(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format a single labeled sample line: `name{k="v",k="v"} value`.
 * Labels are emitted in insertion order so renderings are byte-stable
 * across calls — a property the integration test relies on.
 */
function sampleLine(
  name: string,
  labels: ReadonlyArray<readonly [string, string]>,
  value: number,
): string {
  const v = safeNumber(value);
  if (labels.length === 0) return `${name} ${v}`;
  const inner = labels
    .map(([k, val]) => `${k}="${escapeLabelValue(val)}"`)
    .join(',');
  return `${name}{${inner}} ${v}`;
}

/**
 * Emit a metric family with its `# HELP` and `# TYPE` preamble.
 * `samples` may be empty — Prometheus tolerates families with zero
 * samples, which is the right shape for `cache_age_seconds` when the
 * cache is empty.
 */
function family(
  out: string[],
  name: string,
  type: 'gauge' | 'counter',
  help: string,
  samples: readonly string[],
): void {
  out.push(`# HELP ${name} ${help}`);
  out.push(`# TYPE ${name} ${type}`);
  for (const s of samples) out.push(s);
}

/**
 * Render the full /metrics body — pure, deterministic, tested. The
 * trailing newline is required by the spec.
 */
export function renderMetrics(snap: MetricsSnapshot): string {
  const lines: string[] = [];
  emitInfo(lines, snap);
  emitUptime(lines, snap);
  emitCacheState(lines, snap);
  emitCacheAges(lines, snap);
  emitIngestCounters(lines, snap);
  emitSourceConnected(lines, snap);
  emitWsState(lines, snap);
  emitAuditCounters(lines, snap);
  return lines.join('\n') + '\n';
}

function emitInfo(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_info',
    'gauge',
    'Build and runtime info; constant 1 with labels.',
    [
      sampleLine(
        'price_service_info',
        [
          ['version', snap.version],
          ['etoro_mode', snap.runtime.etoroMode],
          ['network', snap.runtime.network],
          ['fixture_only', snap.runtime.fixtureOnly ? 'true' : 'false'],
          ['real_trading_enabled', snap.runtime.realTradingEnabled ? 'true' : 'false'],
        ],
        1,
      ),
    ],
  );
}

function emitUptime(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_uptime_seconds',
    'gauge',
    'Seconds since the service booted.',
    [sampleLine('price_service_uptime_seconds', [], snap.uptimeSeconds)],
  );
}

function emitCacheState(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_cache_size',
    'gauge',
    'Cached quote entries (any state).',
    [sampleLine('price_service_cache_size', [], snap.cacheSize)],
  );
  family(
    lines,
    'price_service_cache_fresh_size',
    'gauge',
    'Cached quotes that are fresh AND risk-accepted.',
    [sampleLine('price_service_cache_fresh_size', [], snap.cacheFreshSize)],
  );
}

function emitCacheAges(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_cache_age_seconds',
    'gauge',
    'Age of the cached quote per symbol, in seconds. Empty when no quotes are cached.',
    snap.cacheAges.map((c) =>
      sampleLine(
        'price_service_cache_age_seconds',
        [['symbol', c.symbol]],
        c.ageSeconds,
      ),
    ),
  );
}

function emitIngestCounters(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_ingest_total',
    'counter',
    'Total quote-ingest attempts (accepted + rejected).',
    [sampleLine('price_service_ingest_total', [], snap.ingestTotal)],
  );
  family(
    lines,
    'price_service_accepted_total',
    'counter',
    'Total quotes accepted by the risk filter.',
    [sampleLine('price_service_accepted_total', [], snap.acceptedTotal)],
  );
  family(
    lines,
    'price_service_rejected_total',
    'counter',
    'Total quotes rejected by the risk filter, by reason bucket. Every known reason ships a zero-baseline row so PromQL rate()/increase() return 0 (not NaN) on cold boot.',
    renderRejectedSamples(snap.rejectedTotalByReason),
  );
}

/**
 * Overlay the observed `rejectedTotalByReason` counts onto a
 * pre-populated map of every `KNOWN_REJECTION_REASONS` bucket → 0,
 * then emit one sorted sample line per bucket. Unknown future buckets
 * (a reason the catalog hasn't seen yet) ship alongside the
 * baselines so nothing is silently swallowed; the drift test guards
 * the catalog from falling behind risk-filter additions.
 */
function renderRejectedSamples(
  byReason: Readonly<Record<string, number>>,
): string[] {
  const merged = new Map<string, number>();
  for (const reason of KNOWN_REJECTION_REASONS) merged.set(reason, 0);
  for (const [reason, count] of Object.entries(byReason)) {
    merged.set(reason, count);
  }
  return [...merged.keys()].sort().map((reason) =>
    sampleLine(
      'price_service_rejected_total',
      [['reason', reason]],
      merged.get(reason) ?? 0,
    ),
  );
}

function emitSourceConnected(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_source_connected',
    'gauge',
    'Upstream source connection state: one line, labelled with the active reason. Alert on `reason!="connected"` or absence of `reason="connected"`.',
    [
      sampleLine(
        'price_service_source_connected',
        [['reason', snap.sourceReason]],
        snap.sourceConnected ? 1 : 0,
      ),
    ],
  );
}

function emitWsState(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_ws_listening',
    'gauge',
    'WebSocket broadcaster bind state (1=listening, 0=not).',
    [sampleLine('price_service_ws_listening', [], snap.wsListening ? 1 : 0)],
  );
  family(
    lines,
    'price_service_ws_clients',
    'gauge',
    'Currently connected WebSocket clients.',
    [sampleLine('price_service_ws_clients', [], snap.wsClients)],
  );
}

function emitAuditCounters(lines: string[], snap: MetricsSnapshot): void {
  family(
    lines,
    'price_service_audit_write_errors_total',
    'counter',
    'Audit log stream write failures (kernel-rejected writes).',
    [
      sampleLine(
        'price_service_audit_write_errors_total',
        [],
        snap.auditWriteErrorsTotal,
      ),
    ],
  );
  family(
    lines,
    'price_service_audit_buffered_drops_total',
    'counter',
    'Audit log entries dropped due to producer-side back-pressure.',
    [
      sampleLine(
        'price_service_audit_buffered_drops_total',
        [],
        snap.auditBufferedDropsTotal,
      ),
    ],
  );
}

/**
 * Minimal fallback body the handler ships if the snapshot or render
 * throws. Always emits at least the `info` line plus an
 * `# UNAVAILABLE: <reason>` comment so Prometheus scrape parsing
 * succeeds and operators see a 200 response (per the "never 5xx"
 * acceptance criterion) — degraded is observable via the absence of
 * the other families.
 */
export function renderMinimalMetrics(
  runtime: MetricsRuntime,
  version: string,
  reason: string,
): string {
  const lines: string[] = [];
  lines.push(`# UNAVAILABLE: ${reason.replace(/\n/g, ' ')}`);
  emitInfo(lines, {
    version,
    uptimeSeconds: 0,
    runtime,
    cacheSize: 0,
    cacheFreshSize: 0,
    cacheAges: [],
    ingestTotal: 0,
    acceptedTotal: 0,
    rejectedTotalByReason: {},
    sourceReason: 'metrics-emitter-error',
    sourceConnected: false,
    wsListening: false,
    wsClients: 0,
    auditWriteErrorsTotal: 0,
    auditBufferedDropsTotal: 0,
  });
  return lines.join('\n') + '\n';
}
