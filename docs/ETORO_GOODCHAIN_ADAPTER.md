# eToro → GoodChain Price Adapter

This document describes the canonical eToro client SDK used by the GoodChain
price-service, oracle-signer, and hedge-engine lanes. It supersedes the
older `backend/stocks-keeper/src/etoro` skeleton — that path is kept for
compatibility but **all new code must consume `@goodchain/etoro-client`**
(under `backend/etoro-client/`).

## Lane-1 mode contract

The SDK exposes exactly four modes. There is no `sandbox` or `real` mode
under the lane-1 contract.

| Mode            | Market data | Trading            | Account API | Credentials | Base URLs |
|-----------------|-------------|--------------------|-------------|-------------|-----------|
| `mock`          | Deterministic in-process fake (`MockEtoroSource`) | Disabled (throws `RealTradingDisabledError`) | Disabled (throws `AccountUnavailableError`) | None | `mock://etoro.local` |
| `demo-readonly` | Live demo URLs | Disabled (throws `RealTradingDisabledError`) | Live | `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET`, `ETORO_DEMO_USER_KEY` | `public-api.etoro.com/api/v1` |
| `demo-trading`  | Live demo URLs | Enabled, capped by `DemoCapEnforcer` | Live | `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET`, `ETORO_DEMO_USER_KEY` | `public-api.etoro.com/api/v1` |
| `real-disabled` | Live demo URLs | Disabled by source-level fence | Live | `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET`, `ETORO_USER_KEY` | `public-api.etoro.com/api/v1` |

`AccountUnavailableError` is the read-side parallel of
`RealTradingDisabledError`: every `account.*` method (`getBalance`,
`getPositions`, `getPendingOrders`, `getPortfolioPnl`, `getMarginInfo`)
refuses up-front when `ETORO_MODE=mock`, writes one `PRE-CHECK`
audit line at `/mode-gate`, and never reaches the HTTP layer — so the
old cryptic `AxiosError: Unsupported protocol mock:` is gone.

`mock` is the default when `ETORO_MODE` is unset, so `npm test` and any
boot-up smoke can run without secrets.

### Source-level fence

`REAL_TRADING_ENABLED` is a `const` set to `false` in
`backend/etoro-client/src/auth.ts` and re-exported at the package root. It
is intentionally NOT readable from the environment. Any code path that
would route an order to a real eToro account must pass this fence.

To flip it requires:

1. A source change to `auth.ts`.
2. A new lane that goes through product review.
3. The autobuilder loop's safety policy explicitly authorizing the change.

Today the trading module phrases its check as:

```ts
if (mode === 'demo-trading' && REAL_TRADING_ENABLED === false) return;
throw new RealTradingDisabledError(action, mode);
```

Both clauses must be `true` for a demo trade to proceed; flipping
`REAL_TRADING_ENABLED` to `true` does NOT enable real-money trading on
any of the four documented modes — that requires a fifth mode.

## Environment variable contract

| Variable | Default | Required for | Notes |
|----------|---------|--------------|-------|
| `ETORO_MODE` | `mock` | All modes | Unknown values throw `InvalidModeError` at construction. Valid: `mock`, `demo-readonly`, `demo-trading`, `real-disabled`. Leave unset to default to `mock`. |
| `ETORO_DEMO_KEY` | — | demo-readonly, demo-trading, real-disabled | Demo API key. Sent on every request as `x-api-key`. |
| `ETORO_DEMO_SECRET` | — | demo-readonly, demo-trading, real-disabled | Demo API secret. Not transmitted; reserved for signed-trade follow-ups. |
| `ETORO_DEMO_USER_KEY` | — | demo-readonly, demo-trading | Demo user identifier. Sent on every request as `x-user-key`. For `real-disabled`, the SDK reads `ETORO_USER_KEY` instead. |
| `ETORO_USER_KEY` | — | real-disabled | Real-account user identifier. Same `x-user-key` semantics as `ETORO_DEMO_USER_KEY` but scoped to the read-only real surface. |
| `ETORO_DEMO_BASE_URL` | `https://public-api.etoro.com/api/v1` | optional | REST base URL. The default is the official public-api host; override only for staging environments. |
| `ETORO_DEMO_WS_URL` | `wss://streamer.etoro.com/sapi/demo` | optional | WebSocket URL. WS still uses the legacy streamer host; REST has migrated to `public-api`. |
| `MAX_DEMO_ORDER_NOTIONAL_USD` | `1000` | demo-trading | Per-order USD cap. |
| `MAX_DAILY_DEMO_NOTIONAL_USD` | `10000` | demo-trading | Cumulative daily USD cap (UTC bucket). |
| `ETORO_INSTRUMENT_OVERRIDES` | `{}` | optional | JSON object overriding the lane instrument map. |
| `ETORO_AUDIT_LOG_PATH` | resolved per below | optional | Explicit audit-log file path; bypasses default resolution. |

### Audit log path resolution

`AuditLogger` resolves its target file in priority order, falling through
when each tier is unavailable:

1. `EtoroClientConstructorConfig.auditLogPath` (constructor argument).
2. `ETORO_AUDIT_LOG_PATH` (env override).
3. `<process.cwd()>/.etoro-audit/<mode>.log` — skipped if `cwd` lives
   under any `node_modules` segment so audit evidence is never written
   into a directory that `npm install` will wipe.
4. `<os.tmpdir()>/etoro-audit/<mode>.log` — final fallback.

The resolved path is published on `EtoroClient.getSummary().auditLogPath`
and on the `mode-resolved` audit entry as `resolvedAuditLogPath`. When
audit writes fail (full disk, read-only mount, missing directory), the
SDK does NOT throw or silently drop the line: it increments
`getSummary().auditWriteFailures` and emits one
`[etoro-audit] write failed (n=N): <reason>` message to `stderr` per
60 s window.

## Endpoints

The SDK speaks to the following endpoints. All paths are relative to the
mode's base URL (mock URLs are dev-only sentinels and not actually opened).

### REST

All paths are relative to `public-api.etoro.com/api/v1`. The SDK is wired
to the **official eToro public API** per
`.autobuilder/OFFICIAL_ETORO_API_PRICE_SOURCE.md`; the legacy
`api.etoro.com/sapi/demo` host is no longer addressed.

| Method | Path | Module | Purpose |
|--------|------|--------|---------|
| GET    | `/market-data/search` | `InstrumentResolver#resolve` | Symbol → `instrumentId` lookup. Exact-match by `internalSymbolFull` / `symbol` (uppercase); fuzzy first results are NEVER accepted. 24h in-memory cache per `EtoroClient` instance. |
| GET    | `/market-data/instruments/rates` | `MarketDataModule#getQuotes` | Live bid/ask/`lastExecution` for a comma-separated `instrumentIds` list. Batched at 100 IDs per request. |
| GET    | `/market-data/candles` | `MarketDataModule#getCandles` | OHLCV candles. |
| POST   | `/trading/execution/demo/market-open-orders/by-amount` | `TradingModule#openPosition` (USD path) | Demo market open sized in USD notional. |
| POST   | `/trading/execution/demo/market-open-orders/by-units` | `TradingModule#openPosition` (units path) | Demo market open sized in unit count. Routed when `OrderRequest.units` is set. |
| POST   | `/trading/execution/demo/limit-orders` | `TradingModule#placeLimitOrder` | Demo limit/stop order. |
| POST   | `/trading/execution/demo/market-close-orders/by-amount` | `TradingModule#closePosition`, `partialClose` (USD) | Demo market close sized in USD. |
| POST   | `/trading/execution/demo/market-close-orders/by-units` | `TradingModule#partialClose` (units) | Demo market close sized in units. |
| DELETE | `/trading/info/demo/orders/:id` | `TradingModule#cancelOrder` | Cancel pending demo order. |
| GET    | `/trading/info/demo/orders/:id` | `TradingModule#getOrderStatus` | Status of single demo order. |
| GET    | `/trading/info/demo/positions` | `TradingModule#getOpenPositions` | All open demo positions. |
| GET    | `/trading/info/demo/history` | `TradingModule#getTradeHistory` | Filled / cancelled / expired demo trades. |
| GET    | `/account/balance` | `AccountModule#getBalance` | Equity + free margin. |
| GET    | `/account/positions` | `AccountModule#getPositions` | Account-side position view. |
| GET    | `/account/orders/pending` | `AccountModule#getPendingOrders` | Pending orders. |
| GET    | `/account/pnl` | `AccountModule#getPortfolioPnl` | Realized + unrealized P&L. |
| GET    | `/account/margin/:instrumentId` | `AccountModule#getMarginInfo` | Per-instrument margin. |

### Required headers

Every outbound request carries three headers via the SDK's axios
instance (set in `EtoroClient`'s constructor + a request interceptor):

| Header | Source | Notes |
|--------|--------|-------|
| `x-api-key` | `EtoroCredentials.apiKey` | Set as a default header at axios instance construction. |
| `x-user-key` | `EtoroCredentials.userKey` | Set as a default header at axios instance construction. |
| `x-request-id` | `requestIdFactory()` (defaults to `crypto.randomUUID()`) | Stamped fresh per request via an axios request interceptor; tests pin deterministic IDs by passing `requestIdFactory: () => 'req-N'` to `new EtoroClient(...)`. |

### Authentication

The official public API is header-based — there is no `/auth/login`
round-trip. `EtoroClient.authenticate()` is a no-op session-token
populate that returns the literal `'header-auth'` (or `'mock-token'`
under `mock` mode). It is retained so callers that gate on
`isAuthenticated()` keep working; outright removal is tracked as a
follow-up.

Response envelopes are not consistent across eToro responses; the SDK's
`extractArray` and `pickStr/pickNum/pickTimestamp` helpers tolerate a small
number of common shapes (`{data: []}`, `{instruments: []}`, `{rates: []}`,
etc.). When in doubt, the test fixtures in
`backend/etoro-client/src/__tests__/` are the source of truth for the
accepted shapes.

### Live-integration tests (opt-in)

`backend/etoro-client/src/__tests__/live-integration.test.ts` is the
lane's acceptance proof — it issues a real
`GET /market-data/instruments/rates` for BTC and AAPL and asserts
non-zero bid/ask after SDK normalization. It is **skipped by default**.

Enable it by setting all three env vars:

```bash
export ETORO_DEMO_KEY=<your-demo-api-key>
export ETORO_DEMO_USER_KEY=<your-demo-user-key>
export ETORO_LIVE_TESTS=1
cd backend/etoro-client && npm test -- live-integration
```

CI does not set `ETORO_LIVE_TESTS`, so the suite stays inert there;
local operators with valid demo credentials use it to confirm the SDK
reaches the official rates endpoint and produces a positive bid/ask
through the new normalization pipeline.

### WebSocket

- Single endpoint at `ETORO_DEMO_WS_URL` (default
  `wss://streamer.etoro.com/sapi/demo`).
- Subscribe: `{ "type": "subscribe", "symbols": ["BTC", "AAPL", ...] }`.
- Server messages may be a single quote object or an array of quote objects.
- Reconnect uses exponential backoff (1s → 30s) and falls back to REST
  polling on disconnect.
- The REST fallback emits exactly one listener call per fresh, currently
  subscribed, non-stale quote per tick. Cache replay from prior
  subscriptions is intentionally avoided so downstream consumers see
  the true update rate instead of the cache size.
- Quotes whose upstream payload omits every recognized name field
  (`symbol`, `ticker`, `instrumentSymbol`) are dropped before any cache
  write or listener fan-out — the SDK never fabricates a synthetic
  `UNKNOWN` symbol. Each drop bumps a counter (surfaced via
  `EtoroClient.getSummary().malformedQuotes` and
  `MarketDataModule.getMalformedQuoteCount()`) and emits one
  `normalizeQuote-malformed` audit line; the matching `console.error`
  heartbeat is throttled to ≤ 1 per 60 s.

### Malformed-list response visibility

Every list-returning SDK method routes its response body through a
single shared helper, `readListEnvelope`, which classifies the payload
as one of three outcomes: a raw array, an envelope keyed by one of
`LIST_ENVELOPE_KEYS`, or `malformed` (any 200-OK with a shape the SDK
does not recognize). Affected methods:

- `MarketDataModule#getInstruments`, `#getQuotes`, `#getCandles`
- `TradingModule#getOpenPositions`, `#getTradeHistory`
- `AccountModule#getPositions`, `#getPendingOrders`

When the outcome is `malformed`, the SDK:

1. Audit-logs one `<action>-malformed` line with `method: 'PARSE'`,
   `path: '<endpoint>'`, and `error: 'MalformedListResponse:
   <observedShape> keys=[<topLevelKeys>]'`.
2. Increments a per-action counter exposed via
   `<module>.getMalformedListResponseCount('<action>')` and
   `getMalformedListResponseCounts()`.
3. By default returns `[]` (preserving back-compat for price-service /
   hedge-engine which already treat empty as "no data").

Operators see the aggregate via `EtoroClient.getSummary()
.malformedListResponses` (the sum of all per-action counters across
modules). Strict-mode opt-in:
`new EtoroClient({ throwOnMalformedListResponse: true })` flips the
behavior to throw `MalformedListResponseError` instead of returning
`[]`, surfacing schema drift as an exception consumers can catch.

Adding a new envelope key to handle a future eToro rename is a
one-line edit to `LIST_ENVELOPE_KEYS` in
`backend/etoro-client/src/util/list-envelope.ts`.

### Stream-failure visibility

The four silent-swallow points on the streaming path now route through
a single `recordStreamFailure(kind, err)` pipeline. Each kind has its
own counter, audit-log action, and 60-second `console.error` throttle
clock — a parse-failure storm never silences an unrelated socket error.

| Kind              | Emitted from                                  | Audit `action`           |
| ----------------- | --------------------------------------------- | ------------------------ |
| `ws-construct`    | `new WebSocket(wsUrl)` throws synchronously   | `ws-construct-failed`    |
| `ws-parse`        | WS `message` frame is not parseable JSON      | `ws-parse-failed`        |
| `ws-error-event`  | WS socket emits an `error` event              | `ws-error-event`         |
| `rest-fallback`   | REST-fallback poll inside `setInterval` rejects | `rest-fallback-failed` |

All four lines use `method: 'PRE-CHECK'`, `path: '/market-data/stream'`,
and run the embedded error message through `maskTokens` so any long
ID-shaped substring is redacted before it lands in the audit log.

Operators consume the counters via
`EtoroClient.getSummary().streamFailures` (compact one-liner:
`ws-construct=N ws-parse=N ws-error=N rest-fallback=N`),
`MarketDataModule.getStreamFailureCounts()`, or
`MarketDataModule.getLastStreamError()` for the most recent failure
snapshot. The reconnect / `ws.close` / REST-poll cadence at the call
sites is unchanged — only the visibility is new.

## Demo cap enforcement

`DemoCapEnforcer` consults two limits before any order leaves the SDK:

- **Per-order**: order notional USD must be ≤ `MAX_DEMO_ORDER_NOTIONAL_USD`.
- **Daily**: running total of accepted orders for the current UTC day
  must, after the new order, be ≤ `MAX_DAILY_DEMO_NOTIONAL_USD`.

### Notional resolution (five-tier order)

The USD notional handed to the cap enforcer is resolved by
`TradingModule.computeNotional`, in this priority order:

1. **`notionalSizer(order)`** — operator-supplied sizing hook. Whatever
   it returns (finite, > 0) is used as-is.
2. **`order.price × order.amount`** — limit/stop orders only, using the
   operator-supplied price.
3. **`liveQuoteSource(symbol).mid × order.amount`** — the SDK's most
   recently cached quote, used only when the snapshot is fresher than
   `maxQuoteAgeMs` (default 60 s). The default `EtoroClient` wires this
   to `marketData.getCachedQuote`. Audit log records
   `notionalSource: 'live-quote'` and `quoteAgeMs`.
4. **`symbolReferencePriceUsd(symbol) × order.amount`** — degraded
   fallback against the hardcoded `INSTRUMENT_MAP.referencePriceUsd`
   constants. Audit log records `notionalSource: 'reference-fallback'`.
   These constants do NOT track the market — prefer tier 3 in production.
5. **Throw** `MissingNotionalError` — the SDK refuses to size an order
   against a unit count alone.

### Reference-drift guardrail

When `EtoroClientConstructorConfig.notional.maxReferenceDriftRatio` is
set, a fresh live quote that diverges from the reference price by more
than the ratio (absolute, `|live − ref| / ref`) is rejected with
`DemoCapExceededError({ cap: 'reference-drift' })` before any HTTP call.
The guardrail is opt-in — unset means "no second-guess" — and exists to
catch situations where the SDK has clearly lost its grip on the market
(stale feed, exchange halt, oracle drift) rather than silently letting
the live quote override the cap math.

Both `maxQuoteAgeMs` and `maxReferenceDriftRatio` are also accepted via
the constructor's `notional` slot. The audit log records `cap`,
`attempted`, `capLimit`, and `dailyTotal` on every refusal (never order
metadata).

The day bucket rolls at UTC midnight in-process. Process restart resets
the bucket; persistence is intentionally out of scope for this lane (see
`backend/etoro-client/src/cap-enforcer.ts`).

## Error taxonomy

Every typed error the SDK can throw at construction, configuration, or
trading time. Operators should be able to grep this single table to map
a thrown error name back to the module and constructor responsible.

| Error | Module | Thrown when |
|-------|--------|-------------|
| `InvalidModeError` | `auth.ts:resolveMode` | `ETORO_MODE` is set to anything other than `mock`, `demo-readonly`, `demo-trading`, or `real-disabled`. |
| `InvalidCapConfigError` | `auth.ts:loadDemoCapConfig` | `MAX_DEMO_ORDER_NOTIONAL_USD` or `MAX_DAILY_DEMO_NOTIONAL_USD` is non-numeric or negative. `0` is valid (= "no orders allowed"). |
| `InvalidInstrumentOverridesError` | `instruments.ts:loadInstrumentOverrides` | `ETORO_INSTRUMENT_OVERRIDES` JSON is malformed, references unknown symbols, or contains empty / non-positive fields. |
| `RealTradingDisabledError` | `trading.ts:assertTradingEnabled` | Any mutating method (`openPosition`, `placeLimitOrder`, `closePosition`, `partialClose`, `cancelOrder`) is invoked outside `demo-trading` mode. |
| `DemoCapExceededError` | `trading.ts:assertCapOk` / `assertReferenceDriftWithinBounds` | A `demo-trading` order would push the per-order or daily USD total over its configured cap, or its live quote diverges from the reference by more than `maxReferenceDriftRatio`. Carries `cap: 'per-order' \| 'daily' \| 'reference-drift'`. |
| `InvalidOrderError` | `trading.ts:validateOrder` | Pre-HTTP validation rejects an obviously invalid request (NaN amount, empty symbol, invalid side, bad time-in-force, etc.). |
| `MissingNotionalError` | `trading.ts:computeNotional` | A market order's USD notional cannot be resolved via any of the five resolver tiers (sizer / limit price / live quote / reference). |
| `TradingError` | `trading.ts:wrapError` | HTTP layer returned a structured error (`INSUFFICIENT_MARGIN`, `INSTRUMENT_UNAVAILABLE`, `MARKET_CLOSED`, `POSITION_NOT_FOUND`, `ORDER_NOT_FOUND`, etc.). |

This list mirrors the error re-exports in
`backend/etoro-client/src/index.ts`. If a future task adds a ninth typed
error, append a row here in the same commit.

## Instrument map (lane-1)

| Symbol | Asset class | Display name | Reference USD |
|--------|-------------|--------------|---------------|
| BTC    | crypto      | Bitcoin      | 60,000 |
| ETH    | crypto      | Ethereum     | 3,000 |
| SOL    | crypto      | Solana       | 150 |
| AAPL   | equity      | Apple Inc.   | 190 |
| TSLA   | equity      | Tesla, Inc.  | 250 |
| NVDA   | equity      | NVIDIA Corporation | 900 |
| META   | equity      | Meta Platforms, Inc. | 480 |
| SPY    | etf         | SPDR S&P 500 ETF | 540 |

The `etoroInstrumentId` for each symbol is a placeholder of the form
`ETORO-<SYMBOL>`. To swap in real partner-API IDs:

```bash
export ETORO_INSTRUMENT_OVERRIDES='{"BTC":{"etoroInstrumentId":"INST-100100"},"AAPL":{"etoroInstrumentId":"INST-1001"}}'
```

`loadInstrumentOverrides()` throws `InvalidInstrumentOverridesError` for
any malformed input: invalid JSON, non-object root, unknown symbol keys
(must be one of the eight lane symbols), empty-string IDs or display
names, or non-positive reference prices. The intent is that operators
notice configuration errors at deploy time rather than after the first
hedge silently uses placeholder IDs (see lane task #0006).
`applyInstrumentOverrides()` then merges the validated overrides with
`INSTRUMENT_MAP` to produce the runtime table.

### `DEFAULT_LANE_SYMBOLS` and the supplementary list

`backend/etoro-client/src/instruments.ts` exports two extra constants
that downstream services consume as the canonical default symbol set:

- `DEFAULT_LANE_SYMBOLS: LaneSymbol[]` — a mutable copy of
  `INSTRUMENT_SYMBOLS`. price-service's `DEFAULT_CONFIG.symbols`,
  oracle-signer's `ORACLE_SYMBOLS` fallback, and hedge-engine's
  `HEDGE_SYMBOLS` fallback all spread or join this constant. Adding a
  symbol means adding it to `INSTRUMENT_MAP` — every consumer picks it
  up automatically.
- `SUPPLEMENTARY_STOCK_SYMBOLS = ['MSFT', 'AMZN', 'GOOGL', 'QQQ', 'AMD']`
  — documentation-only. These are named in
  `OFFICIAL_ETORO_API_PRICE_SOURCE.md`'s "when available" list but are
  NOT in `INSTRUMENT_MAP` today, so the SDK cannot price or resolve
  them. Downstream defaults MUST NOT include them.

`partitionLaneSymbols(input)` returns `{ valid, unknown }`. Every
consumer runs the env-var-supplied symbol list through this helper at
startup; unknown symbols cause the service to write
`SERVICE_HEALTH_STATUS=degraded` and continue with the valid subset
(price-service degrades broadcaster; oracle-signer degrades publish set;
hedge-engine degrades hedge set).

## Hedge-engine adapter selection

`backend/hedge-engine/src/select-adapter.ts` is the one place that
decides which `EtoroAdapter` powers the hedge loop. The lane's runtime
fence (independent of `REAL_TRADING_ENABLED`) is the
`mode` + `HEDGE_TRADING_ENABLED` pair:

| `ETORO_MODE`     | `HEDGE_TRADING_ENABLED` | Adapter | Loop runs? |
|------------------|-------------------------|---------|------------|
| `mock`           | (any)                   | `createMockAdapter()` — deterministic `mock-<SYMBOL>-<n>` IDs, in-memory positions | yes |
| `demo-trading`   | `'true'`                | `createEtoroBackedAdapter(createEtoroClient())` — real demo orders | yes |
| `demo-trading`   | unset / anything else   | `createReadOnlyAdapter()` — throws `ReadOnlyAdapterError` on mutation | no (read-only) |
| `demo-readonly`  | (any)                   | `createReadOnlyAdapter()` | no (read-only) |
| `real-disabled`  | (any)                   | `createReadOnlyAdapter()` | no (read-only) |

`main()` only invokes `executor.executeAll` when `selection.readOnly`
is `false`; the read-only sentinel is a belt-and-suspenders second
line of defense — if a future code path bypasses the `readOnly` flag,
the adapter still refuses to issue orders at the HTTP boundary.

The placeholder `createPlaceholderAdapter()` that returned
`sim-<Date.now()>` IDs and an always-empty position book has been
deleted; mock semantics now live in the named, typed
`createMockAdapter()`.

### Demo-proof script

`backend/hedge-engine/scripts/demo-proof.ts` writes the lane's
"Overall Definition of Done" artifact (one capped demo open + before /
after on-chain and eToro snapshots) to
`.autobuilder/initiatives/0007a-etoro-connectivity/proofs/hedge-proof-<ISO>.json`.
It refuses to run unless `ETORO_MODE=demo-trading` and
`HEDGE_TRADING_ENABLED=true`.

```bash
ETORO_MODE=demo-trading \
HEDGE_TRADING_ENABLED=true \
ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
RISK_ENGINE_ADDRESS=0x… RPC_URL=https://… \
PROOF_SYMBOL=AAPL PROOF_AMOUNT_USD=25 PROOF_INSTRUMENT_ID=INST-1001 \
node -r ts-node/register backend/hedge-engine/scripts/demo-proof.ts
```

`PROOF_AMOUNT_USD` is hard-clamped to `MAX_DEMO_ORDER_NOTIONAL_USD`
(default 1000) so the script never moves more than the configured
per-order cap. Failures land in the proof artifact's `error` field so
post-mortems retain the pre/post snapshot even when the demo open
itself fails.

## Runbook — swap fake → real demo creds

1. Provision a demo API key/secret pair in eToro's partner portal.
2. Add to your `.env`:
   ```
   ETORO_MODE=demo-readonly
   ETORO_DEMO_KEY=<key>
   ETORO_DEMO_SECRET=<secret>
   ```
3. Run `node -e "require('./dist').createEtoroClient().getMode()"` —
   should print `demo-readonly`.
4. To enable demo trading: change `ETORO_MODE=demo-trading` and confirm
   `MAX_DEMO_ORDER_NOTIONAL_USD` and `MAX_DAILY_DEMO_NOTIONAL_USD` are
   set to safe values for your demo account.
5. Verify with the price-service smoke: live demo quotes flow into
   `backend/price-service` without code change because `MarketDataSource`
   is interface-stable across modes.

## Lane-1 quick start

From the repo root:

```bash
npm run install:lane1   # installs deps in 4 lane-1 backend packages
npm run test:lane1      # runs all four suites; halts on first failure
```

The install step is idempotent — re-running prints `[skip] <pkg>` for
any package whose `node_modules/.bin/jest` already exists. The test
step prefixes every line with `[<pkg>]` so CI logs stay diagnosable, and
exits with the failing package's exit code on first failure (printing a
trailing `[fail] <pkg> exited <N>` line).

The root `package.json` does NOT include the backend packages in its
`workspaces` array; the helper scripts (`scripts/install-lane1-backend.sh`,
`scripts/test-lane1-backend.sh`) walk the four lane-1 directories
explicitly so the existing `frontend` / `sdk` install semantics stay
unchanged. Adding a fifth lane-1 package later means editing the `PKGS`
array at the top of each script.

## Verification

- `cd backend/etoro-client && npm test` — full unit suite.
- `cd backend/price-service && npm test` — confirms `etoro-source.ts`
  still consumes the `MarketDataSource` interface unchanged.
- `cd backend/etoro-client && npm run build && node -e "require('./dist').createEtoroClient().getMode()"`
  → returns `mock` with no env set, no thrown errors, no secrets logged.

## Legacy adapter

The previous `backend/stocks-keeper/src/etoro` skeleton is retained for
historical reference but is **not** the canonical lane-1 path. New code
must use `@goodchain/etoro-client`.
