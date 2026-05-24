# @goodchain/price-service

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


Lane 2 of the eToro live-price pipeline. Ingests eToro market data
through the lane-1 eToro client, applies risk filters (staleness,
spread, asset-class session rules, TWAP deviation), caches the latest
quote per symbol, and exposes both a REST API and a WebSocket
broadcaster for downstream consumers (lane 3 oracle-signer, lane 5
frontend).

## Ports

| Port | Protocol  | Env var                  | Default |
| ---- | --------- | ------------------------ | ------- |
| 9300 | HTTP REST | `PRICE_SERVICE_PORT`     | `9300`  |
| 9301 | WebSocket | `PRICE_SERVICE_WS_PORT`  | `9301`  |

Unset or invalid env vars fall through to the defaults so tests do not
need to set them.

## Endpoints

- `GET /health` — service health + (when stats are wired) `ingested`,
  `rejected`, `acceptanceRatio` (number in `[0,1]` or `null` on cold
  start) and `acceptanceRatioStatus` (`'ok'` | `'no-data'`).
- `GET /quotes` — every cached quote with `spread`, `spreadPct`,
  `cacheAge`, `filterAccepted`, `filterReason`.
- `GET /quotes/:symbol` — single symbol.
- `GET /quotes/fresh/all` — only quotes that are non-stale and accepted.
- `GET /status/quotes` — per-symbol last-update age, session state,
  confidence.
- `GET /audit/stats` — `{ ingested, rejected, byReason,
  acceptanceRatio, acceptanceRatioStatus, firstAt, lastAt,
  writeErrors, bufferedDrops, timestamp }`. `acceptanceRatio` is
  `null` and `acceptanceRatioStatus` is `'no-data'` until the first
  tick lands. `bufferedDrops` rises when the audit log can't keep up
  with ingestion and oldest lines are shed (see "Audit log").

## Env

| Env var                  | Default                     | Purpose                                   |
| ------------------------ | --------------------------- | ----------------------------------------- |
| `ETORO_MODE`             | `sandbox`                   | Forces the eToro client to demo mode.     |
| `REAL_TRADING_ENABLED`   | `false`                     | Belt-and-braces. Price service never reads it to enable trading. |
| `PRICE_SERVICE_PORT`     | `9300`                      | REST port.                                |
| `PRICE_SERVICE_WS_PORT`  | `9301`                      | WebSocket broadcaster port.               |
| `ORACLE_SYMBOLS`         | `DEFAULT_CONFIG.symbols`    | Comma-separated symbols to subscribe to.  |
| `PRICE_AUDIT_LOG_PATH`   | `<pkg>/audit.log`           | JSONL audit log path.                     |
| `GOODPRICE_CWD`          | derived from PM2 config dir | Override PM2 `cwd` for portable installs. |

## Audit log

Every accepted and rejected quote is appended as one JSON line to
`PRICE_AUDIT_LOG_PATH` (default `backend/price-service/audit.log`).
Schema:

```json
{
  "timestamp": "2026-05-23T12:34:56.789Z",
  "accepted": true,
  "reason": "stale: quote age 12000ms exceeds threshold 10000ms",
  "quote": { "symbol": "AAPL", "bid": 189.5, "ask": 189.6, ... }
}
```

The logger writes to a single append-mode `WriteStream` opened on the
first record, so `record()` never blocks the Node event loop on disk
I/O. An in-memory queue (capped at 10 000 lines by default) absorbs
bursts when the kernel falls behind; if the cap is exceeded while the
stream is backpressured, the oldest queued lines are dropped and
`bufferedDrops` increments — recent forensic detail wins over ten-
minute-old ticks. Stream errors (full disk, unwritable path) bump
`writeErrors` instead. Both counters are exposed in-memory via
`/audit/stats`, so consumers do not have to read the file.

## PM2

The price-service is supervised by the repo-root `pm2-ecosystem.config.js`
as the `goodprice` app. To start it on its own:

```bash
cd backend/price-service
npm install
npm run build
pm2 start ../../pm2-ecosystem.config.js --only goodprice
```

`cwd` resolves to `backend/price-service` relative to the PM2 config
file by default; set `GOODPRICE_CWD` to point elsewhere (e.g. a deployed
build directory) if needed.

## Safety invariants

- `ETORO_MODE=sandbox` and `REAL_TRADING_ENABLED=false` are hardcoded in
  the PM2 entry. The price-service does not itself trade; these are
  belt-and-braces for the embedded eToro client.
- There is no env var or code path that can enable real-money trading.
  Risk filters reject obviously bad quotes; everything else is logged.
- The audit log only records quote fields — quotes never carry API keys
  or other secrets.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Run locally without PM2:

```bash
PRICE_AUDIT_LOG_PATH=/tmp/price-audit.log \
  PRICE_SERVICE_PORT=9300 PRICE_SERVICE_WS_PORT=9301 \
  npm run dev
```
