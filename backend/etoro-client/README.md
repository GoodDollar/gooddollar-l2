# @goodchain/etoro-client

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


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

## Operator scripts

### Resolve instrument IDs

When you need a pinned eToro `instrumentId` to populate
`PROOF_INSTRUMENT_ID` (for the demo-hedge proof) or
`ETORO_INSTRUMENT_OVERRIDES` / `HEDGE_INSTRUMENT_MAP` (for operator
pins on lane symbols), the SDK ships a one-shot resolver that uses the
official `/market-data/search` endpoint:

```bash
ETORO_MODE=demo-readonly \
  ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
  npm run resolve-instrument-id -- AAPL BTC
```

Output is one TSV row per symbol —
`<symbol>\t<instrumentId>\t<instrumentType>\t<displayName>`:

```
AAPL	INST-1001	Stock	Apple Inc.
BTC	INST-100100	CryptoCurrency	Bitcoin
```

Mock mode is refused by design (exit 2) — printing deterministic
placeholders would defeat the lane's purpose. Secrets are never echoed.
Source: [`scripts/resolve-instrument-id.ts`](scripts/resolve-instrument-id.ts);
behavior contract: [`src/__tests__/resolve-instrument-id.script.test.ts`](src/__tests__/resolve-instrument-id.script.test.ts).

## Where to go next

- Full lane contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md)
- Lane scripts: `npm run install:lane1`, `npm run test:lane1`
- Demo-hedge proof runbook: [`docs/runbooks/lane1-demo-hedge-proof.md`](../../docs/runbooks/lane1-demo-hedge-proof.md)
- Resolve eToro instrument IDs: `npm run resolve-instrument-id` — see [Operator scripts](#operator-scripts) above.
- Rotate demo credentials: `./scripts/rotate-etoro-keys.sh demo` (repo root) — refuses any non-demo mode per `REAL_TRADING_ENABLED=false`.
