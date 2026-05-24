import type { WsAdvertisement } from './ws-advertisement';

/**
 * One step in the discovery quickstart. The 3 static HTTP steps carry
 * `request` as a `GET /path` line; step 4 (only when the WS broadcaster
 * is bound) carries `request` as a paste-runnable `wscat -c ws://…` and
 * an `alternatives` list of equivalent recipes (websocat, node `ws`).
 *
 * The optional `alternatives` field is the wire shape introduced in
 * task 0056. Static HTTP steps 1–3 omit it. Older readers see no field
 * change on the steps they care about.
 */
export interface QuickstartStep {
  readonly step: number;
  readonly goal: string;
  readonly request: string;
  readonly expect: string;
  readonly alternatives?: readonly string[];
}

/**
 * Sequenced fresh-user walk-through emitted on `GET /`. Replaces the old
 * unordered `examples` map: a fresh integrator gets a step-by-step
 * runbook (verify alive → see all quotes → fetch one symbol → subscribe
 * to live ticks) instead of four parallel options with no "start here".
 * Each step records the user *goal*, the *request* line, and what to
 * *expect* back so the consumer code can be written from this payload
 * alone.
 *
 * Convention: any step that names a deployment-dependent port (e.g.
 * the WS broadcaster port) MUST be assembled per request from
 * `buildWsAdvertisement` — never hardcoded. This constant carries only
 * the three deployment-independent steps; step 4 (the WS recipe) is
 * appended inline by `buildWsQuickstartStep` off the live broadcaster's
 * actual bind address, and omitted when the broadcaster isn't
 * listening — see task 0037.
 */
export const STATIC_QUICKSTART: readonly QuickstartStep[] = Object.freeze([
  Object.freeze({
    step: 1,
    goal: "Verify the service is alive and see what's configured",
    request: 'GET /health',
    expect:
      '200 ok / 503 degraded; body carries status, configured symbols, ' +
      'source.reason',
  }),
  Object.freeze({
    step: 2,
    goal: 'See every cached quote at once',
    request: 'GET /quotes',
    expect: '200; body { totalCached, quotes, source, degraded }',
  }),
  Object.freeze({
    step: 3,
    goal: 'Fetch a single symbol (substitute any from /health.symbols)',
    request: 'GET /quotes/AAPL',
    expect:
      "200 with quote envelope, or 404 { error: 'no-quote' } before " +
      'first tick',
  }),
  Object.freeze({
    step: 4,
    goal: 'Fetch a subset of cached symbols in one call',
    request: 'GET /quotes?symbols=AAPL,MSFT',
    expect:
      '200 with quotes for only the requested set; ' +
      'unmatched symbols listed in body.unmatched',
  }),
  Object.freeze({
    step: 5,
    goal: 'Wire into Grafana via a standard Prometheus scrape',
    request: 'GET /metrics',
    expect:
      '200 text/plain (version=0.0.4) with price_service_* series ' +
      '(info, uptime_seconds, cache_size, ingest_total, source_connected, ws_*)',
  }),
  Object.freeze({
    step: 6,
    goal: 'Fetch a single symbol with a freshness budget',
    request: 'GET /quotes/AAPL?maxAgeMs=30000',
    expect:
      "200 when cache age <= 30000ms; 503 body.error='stale-cache' " +
      'with cacheAge + maxAgeMs + Retry-After otherwise',
  }),
  Object.freeze({
    step: 7,
    goal:
      'Pull fresh + risk-accepted quotes for a watchlist with one ' +
      'freshness gate (task 0087)',
    request: 'GET /quotes/fresh/all?symbols=AAPL,MSFT&maxAgeMs=30000',
    expect:
      '200 quotes:[...] filtered to AAPL/MSFT and at most 30s old; body ' +
      'echoes requestedCount,matchedCount,unmatched?,maxAgeMs; 400 ' +
      "body.error='invalid-max-age-ms' when the gate value is malformed",
  }),
]) as readonly QuickstartStep[];

const WS_QUICKSTART_GOAL = 'Subscribe to live ticks';
const WS_QUICKSTART_EXPECT =
  'snapshot frame on connect, then quote frames per accepted tick';

/**
 * Build the alternative-recipe list for step 4 from a live WS URL.
 * `wscat` is the canonical recipe (Node-ecosystem WS-cli; published
 * via `npm install -g wscat`). `websocat` is the static-binary
 * fallback for non-Node environments. The third entry is a Node
 * one-liner for users who already have `npm install ws` available.
 *
 * Pulled out so unit tests can assert the recipes against the live
 * WS URL without rebuilding the body.
 */
export function buildWsQuickstartAlternatives(
  wsUrl: string,
): readonly string[] {
  return [
    `websocat ${wsUrl}`,
    `node -e "new (require('ws'))('${wsUrl}').on('message', m => console.log(m.toString()))"`,
  ];
}

/**
 * Assemble step 4 of the quickstart array from a live `WsAdvertisement`.
 * Centralised so the `request` field is always `wscat -c ${ws.url}` —
 * impossible to drift from `body.websocket.url` on the same response.
 *
 * Pre-task-0056 this shipped `CONNECT ${ws.url}` — an unparseable
 * pseudo-verb (CONNECT is HTTP's proxy-tunnel verb, not a WebSocket
 * client recipe). The new shape is paste-runnable: copy-and-run with
 * `wscat`, `websocat`, or the Node one-liner alternative; the verb
 * matches the affordance of steps 1–3 (which are paste-runnable
 * `curl /…` lines).
 */
export function buildWsQuickstartStep(
  ws: WsAdvertisement,
  step: number = STATIC_QUICKSTART.length + 1,
): QuickstartStep {
  return {
    step,
    goal: WS_QUICKSTART_GOAL,
    request: `wscat -c ${ws.url}`,
    alternatives: buildWsQuickstartAlternatives(ws.url),
    expect: WS_QUICKSTART_EXPECT,
  };
}

/**
 * Build the full quickstart array for a single discovery response.
 * When the broadcaster is bound, the WS recipe step is appended at
 * `STATIC_QUICKSTART.length + 1`; when it's not (`ws === null`),
 * only the static HTTP steps are returned. Pulled into a single
 * function so the `/` handler stays a one-liner and tests have a
 * stable seam to assert against.
 */
export function buildQuickstart(
  ws: WsAdvertisement | null,
): readonly QuickstartStep[] {
  const steps: QuickstartStep[] = [...STATIC_QUICKSTART];
  if (ws) steps.push(buildWsQuickstartStep(ws, STATIC_QUICKSTART.length + 1));
  return steps;
}
