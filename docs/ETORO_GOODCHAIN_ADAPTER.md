# eToro → GoodChain Price Adapter

This document describes the canonical eToro client SDK used by the GoodChain
price-service, oracle-signer, and hedge-engine lanes. It supersedes the
older `backend/stocks-keeper/src/etoro` skeleton — that path is kept for
compatibility but **all new code must consume `@goodchain/etoro-client`**
(under `backend/etoro-client/`).

## Lane-1 mode contract

The SDK exposes exactly four modes. There is no `sandbox` or `real` mode
under the lane-1 contract.

| Mode            | Market data | Trading            | Credentials | Base URLs |
|-----------------|-------------|--------------------|-------------|-----------|
| `mock`          | Deterministic in-process fake (`MockEtoroSource`) | Disabled (throws `RealTradingDisabledError`) | None | `mock://etoro.local` |
| `demo-readonly` | Live demo URLs | Disabled (throws `RealTradingDisabledError`) | `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET` | `api.etoro.com/sapi/demo` |
| `demo-trading`  | Live demo URLs | Enabled, capped by `DemoCapEnforcer` | `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET` | `api.etoro.com/sapi/demo` |
| `real-disabled` | Live demo URLs | Disabled by source-level fence | `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET` | `api.etoro.com/sapi/demo` |

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
| `ETORO_MODE` | `mock` | All modes | Unknown values fall back to `mock`. |
| `ETORO_DEMO_KEY` | — | demo-readonly, demo-trading, real-disabled | Demo API key. |
| `ETORO_DEMO_SECRET` | — | demo-readonly, demo-trading, real-disabled | Demo API secret. |
| `ETORO_DEMO_BASE_URL` | `https://api.etoro.com/sapi/demo` | optional | REST base URL. |
| `ETORO_DEMO_WS_URL` | `wss://streamer.etoro.com/sapi/demo` | optional | WebSocket URL. |
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

| Method | Path | Module | Purpose |
|--------|------|--------|---------|
| POST   | `/auth/login` | `index.ts#authenticate` | Bearer-token bootstrap. |
| GET    | `/api/v1/market-data/instruments` | `MarketDataModule#getInstruments` | Instrument metadata. |
| GET    | `/api/v1/market-data/quotes` | `MarketDataModule#getQuotes` | Snapshot quotes. |
| GET    | `/api/v1/market-data/candles` | `MarketDataModule#getCandles` | OHLCV candles. |
| POST   | `/trading/orders` | `TradingModule#openPosition`, `placeLimitOrder` | New market/limit/stop order. |
| DELETE | `/trading/orders/:id` | `TradingModule#cancelOrder` | Cancel pending order. |
| GET    | `/trading/orders/:id` | `TradingModule#getOrderStatus` | Status of single order. |
| POST   | `/trading/positions/:id/close` | `TradingModule#closePosition`, `partialClose` | Close (or partially close) position. |
| GET    | `/trading/positions` | `TradingModule#getOpenPositions` | All open positions. |
| GET    | `/trading/history` | `TradingModule#getTradeHistory` | Filled / cancelled / expired trades. |
| GET    | `/account/balance` | `AccountModule#getBalance` | Equity + free margin. |
| GET    | `/account/positions` | `AccountModule#getPositions` | Account-side position view. |
| GET    | `/account/orders/pending` | `AccountModule#getPendingOrders` | Pending orders. |
| GET    | `/account/pnl` | `AccountModule#getPortfolioPnl` | Realized + unrealized P&L. |
| GET    | `/account/margin/:instrumentId` | `AccountModule#getMarginInfo` | Per-instrument margin. |

Response envelopes are not consistent across eToro responses; the SDK's
`extractArray` and `pickStr/pickNum/pickTimestamp` helpers tolerate a small
number of common shapes (`{data: []}`, `{instruments: []}`, etc.). When in
doubt, the test fixtures in `backend/etoro-client/src/__tests__/` are the
source of truth for the accepted shapes.

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

`loadInstrumentOverrides()` parses the JSON safely (unknown symbols are
dropped, invalid types are dropped) and `applyInstrumentOverrides()` merges
the result with `INSTRUMENT_MAP` to produce the runtime table.

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
