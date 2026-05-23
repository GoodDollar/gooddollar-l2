# @goodchain/hedge-engine

Off-chain hedge engine — maps GoodChain exposure to capped demo eToro hedge
orders, and ships the lane's demo-hedge proof script.

Part of [Lane 1 — eToro live prices & demo hedging](../../docs/ETORO_GOODCHAIN_ADAPTER.md).
**Demo only** — `REAL_TRADING_ENABLED` is a source-level `const` fence in
`@goodchain/etoro-client`'s [`src/auth.ts`](../etoro-client/src/auth.ts). The
hedge engine refuses to mutate eToro state unless `ETORO_MODE=demo-trading` AND
`HEDGE_TRADING_ENABLED=true` are both set; every other branch returns a
read-only sentinel adapter that throws `ReadOnlyAdapterError` on mutation.

## Install / test

```bash
npm install
npm run build      # tsc → dist/
npm test           # jest; offline
npm run test:watch
npm start          # node dist/index.js (uses ETORO_MODE + HEDGE_TRADING_ENABLED)
npm run clean      # rm -rf dist
```

From the repo root: `npm run install:lane1` / `npm run test:lane1`.

## Run locally

```bash
# Mock mode — no credentials required, in-process MockAdapter:
ETORO_MODE=mock npm start

# Demo-readonly — read on-chain exposure + eToro positions, no orders:
ETORO_MODE=demo-readonly \
  ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
  RPC_URL=https://… RISK_ENGINE_ADDRESS=0x… \
  npm start
```

Without `RISK_ENGINE_ADDRESS` the service stays bound on its health port but
the engine loop is disabled and reports `degraded` via `/health`.

## Endpoints

| Surface | Default port | Source |
|---------|--------------|--------|
| Health (`/health`) | `9106` | `process.env.HEALTH_PORT ?? HEDGE_ENGINE_PORT ?? '9106'` ([`src/index.ts`](src/index.ts)) |

## Env (this package)

| Var | Default | Notes |
|-----|---------|-------|
| `RISK_ENGINE_ADDRESS` | unset (= disabled) | On-chain risk engine address; required for the engine loop. |
| `HEDGE_TRADING_ENABLED` | `false` | Must be `'true'` AND `ETORO_MODE=demo-trading` to allow capped demo orders. |
| `HEDGE_SYMBOLS` | `DEFAULT_LANE_SYMBOLS` | Comma-separated subset. Unknown symbols degrade the service. |
| `HEDGE_INSTRUMENT_MAP` | unset | Operator override: `AAPL:INST-1001,BTC:INST-100100`. |
| `HEDGE_DELTA_THRESHOLD_USD` | `5000` | Re-hedge trigger by USD delta. |
| `HEDGE_DELTA_THRESHOLD_PCT` | `2` | Re-hedge trigger by percent delta. |
| `HEDGE_POLL_INTERVAL_MS` | `30000` | Reconcile-loop cadence. |
| `HEDGE_DRY_RUN` | `true` | Set `'false'` to allow capped demo orders. |
| `RPC_URL` | `http://localhost:8545` | JSON-RPC URL for `ExposureReader`. |
| `HEDGE_ENGINE_PORT` / `HEALTH_PORT` | `9106` | Health port override. |

SDK env (modes, credentials, caps) is read by `@goodchain/etoro-client`; the
canonical contract lives in
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md).

## Demo-hedge proof

The lane's "Definition of Done" artifact is produced by
[`scripts/demo-proof.ts`](scripts/demo-proof.ts). Operator runbook:
[`docs/runbooks/lane1-demo-hedge-proof.md`](../../docs/runbooks/lane1-demo-hedge-proof.md).

The script refuses to run unless `ETORO_MODE=demo-trading` AND
`HEDGE_TRADING_ENABLED=true`; output is written to
`.autobuilder/initiatives/0007a-etoro-connectivity/proofs/hedge-proof-<ISO>.json`.
`PROOF_AMOUNT_USD` is hard-clamped to `MAX_DEMO_ORDER_NOTIONAL_USD`.

## Where to go next

- Demo-hedge proof runbook: [`docs/runbooks/lane1-demo-hedge-proof.md`](../../docs/runbooks/lane1-demo-hedge-proof.md)
- Full lane contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md)
- SDK package: [`backend/etoro-client/README.md`](../etoro-client/README.md)
- Lane scripts: `npm run install:lane1`, `npm run test:lane1`
