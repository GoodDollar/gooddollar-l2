# @goodchain/etoro-client

TypeScript SDK wrapping eToro REST and WebSocket APIs for GoodChain.

Part of [Lane 1 — eToro live prices & demo hedging](../../docs/ETORO_GOODCHAIN_ADAPTER.md).
**Demo only** — `REAL_TRADING_ENABLED` is a source-level `const` fence in
[`src/auth.ts`](src/auth.ts); no real-money trading path exists.

## Install / test

```bash
npm install
npm run build      # tsc → dist/
npm test           # offline; no credentials required
npm run test:watch
npm run clean      # rm -rf dist
```

From the repo root: `npm run install:lane1` and `npm run test:lane1` cover all
four lane packages in one shot.

## Usage

```ts
import { createEtoroClient } from '@goodchain/etoro-client';

// Default mode = 'mock' when ETORO_MODE is unset.
const client = createEtoroClient();
console.log(client.getMode()); // 'mock'
```

Downstream lane packages depend on this SDK via
`"@goodchain/etoro-client": "file:../etoro-client"`.

## Modes

| `ETORO_MODE`     | HTTP base | Trading | Audit log |
|------------------|-----------|---------|-----------|
| `mock` (default) | none      | mock    | local     |
| `demo-readonly`  | live demo | refused | local     |
| `demo-trading`   | live demo | enabled (capped) | local |
| `real-disabled`  | live demo | refused (source-level fence) | local |

Unknown values throw `InvalidModeError` at construction. The full four-mode
matrix, error catalogue, and endpoint table live in the deep adapter doc:
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md).

## Env (read at construction)

| Var | Required for | Notes |
|-----|--------------|-------|
| `ETORO_MODE` | all | Default `mock`. Typos throw `InvalidModeError`. |
| `ETORO_DEMO_KEY` / `ETORO_DEMO_SECRET` / `ETORO_DEMO_USER_KEY` | demo modes | Sent as `x-api-key` / `x-user-key`. |
| `ETORO_USER_KEY` | `real-disabled` | Real-account user identifier (read-only surface). |
| `MAX_DEMO_ORDER_NOTIONAL_USD` / `MAX_DAILY_DEMO_NOTIONAL_USD` | `demo-trading` | Defaults `1000` / `10000`. `0` = "no orders allowed". |
| `ETORO_INSTRUMENT_OVERRIDES` | optional | JSON; pins `symbol → instrumentId`. |
| `ETORO_AUDIT_LOG_PATH` | optional | Default: `<cwd>/.etoro-audit/<mode>.log`. |
| `ETORO_LIVE_TESTS` | optional | Set to `1` to enable the live-integration suite. |

The full env contract is in
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md);
this table is orientation only.

## Where to go next

- Full lane contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md)
- Lane scripts: `npm run install:lane1`, `npm run test:lane1`
- Demo-hedge proof runbook: [`docs/runbooks/lane1-demo-hedge-proof.md`](../../docs/runbooks/lane1-demo-hedge-proof.md)
