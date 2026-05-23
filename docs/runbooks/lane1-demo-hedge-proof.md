# Lane 1 — produce a demo-hedge proof

Operator runbook for the artifact required by the
[`0007a-etoro-connectivity`](../../.autobuilder/initiatives/0007a-etoro-connectivity/spec.md)
"Overall Definition of Done": a written JSON proof emitted by
[`backend/hedge-engine/scripts/demo-proof.ts`](../../backend/hedge-engine/scripts/demo-proof.ts).

The runbook is a thin operator wrapper. The script is the source of truth;
this file documents the existing behavior, never redefines it. The deep
contract (env table, four-mode matrix, endpoints) lives in
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../ETORO_GOODCHAIN_ADAPTER.md).

**Sibling proof:** the lane's other DoD half (live eToro demo prices on
the L2 oracle) has its own runbook at
[`docs/runbooks/lane1-live-prices-on-chain.md`](./lane1-live-prices-on-chain.md).

## Prerequisites

- Valid eToro demo credentials: `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET`,
  `ETORO_DEMO_USER_KEY`. (`ETORO_DEMO_SECRET` is reserved for signed-trade
  follow-ups; keep it set.)
- A live JSON-RPC URL for the chain that hosts the risk engine.
- The deployed `RISK_ENGINE_ADDRESS`.
- The lane installed: `npm run install:lane1` from the repo root.
- A pinned eToro instrument id for `PROOF_SYMBOL` (`PROOF_INSTRUMENT_ID`).
  Resolve it once via:

  ```bash
  ETORO_MODE=demo-readonly \
  ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
  (cd backend/etoro-client && npm run resolve-instrument-id -- AAPL)
  ```

  Output is one TSV row per symbol —
  `<symbol>\t<instrumentId>\t<instrumentType>\t<displayName>` — copy
  the `instrumentId` (column 2) into `PROOF_INSTRUMENT_ID`.

  The proof script intentionally does not bootstrap the SDK's instrument
  resolver at runtime, so it remains independent of
  `/market-data/search` reachability once the value is pinned.

**Safety.** Both `ETORO_MODE=demo-trading` AND `HEDGE_TRADING_ENABLED=true`
are required — the script refuses to run otherwise. The source-level
`REAL_TRADING_ENABLED` `const` fence in
[`backend/etoro-client/src/auth.ts`](../../backend/etoro-client/src/auth.ts)
remains in force throughout. There is no real-money path.

## One-shot command

```bash
ETORO_MODE=demo-trading \
HEDGE_TRADING_ENABLED=true \
ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
RISK_ENGINE_ADDRESS=0x… RPC_URL=https://… \
PROOF_SYMBOL=AAPL PROOF_AMOUNT_USD=25 PROOF_INSTRUMENT_ID=INST-1001 \
node -r ts-node/register backend/hedge-engine/scripts/demo-proof.ts
```

`PROOF_AMOUNT_USD` is hard-clamped to `MAX_DEMO_ORDER_NOTIONAL_USD`
(default `1000`). The script can never move more than the configured per-order
cap regardless of what value is supplied.

## Expected output

A JSON file at:

```
.autobuilder/initiatives/0007a-etoro-connectivity/proofs/hedge-proof-<ISO>.json
```

containing (minimum):

- `orderId`, `symbol`, `side`, `amount`, `timestamp`, `mode`
- `before` and `after` snapshots, each with:
  - `onchainNetDelta`, `onchainBlockNumber`
  - `etoroPositions[]` (`positionId`, `symbol`, `side`, `amount`)
- `error` (only on failure — pre/post snapshots are still written so a
  post-mortem retains context).

`<ISO>` is the timestamp the script captured before issuing the open,
formatted with `:` and `.` replaced by `-`.

## Validation

- File exists at the documented path and parses as JSON.
- `mode === "demo-trading"` (matches the gate).
- `orderId` is non-empty when `error` is absent.
- `before.onchainBlockNumber` ≤ `after.onchainBlockNumber`.
- `amount <= MAX_DEMO_ORDER_NOTIONAL_USD` (clamp held).
- For the success case, the `etoroPositions[]` arrays differ by the new
  position id; for the failure case, the `error` string captures the
  thrown class name.

## Common failures and fixes

| Symptom (script log + proof JSON) | Cause | Fix |
|-----------------------------------|-------|-----|
| Exits 2 with `refusing to run: requires ETORO_MODE=demo-trading and HEDGE_TRADING_ENABLED=true` | Either env var unset or wrong | Set `ETORO_MODE=demo-trading` AND `HEDGE_TRADING_ENABLED=true`. |
| Exits 2 with `missing required env var: RISK_ENGINE_ADDRESS` / `RPC_URL` / `ETORO_DEMO_KEY` / `ETORO_DEMO_USER_KEY` / `PROOF_INSTRUMENT_ID` | Required env unset | Export the named variable (`RPC_URL=https://…` for the chain that hosts the risk engine). |
| Exits 2 with `invalid amount: <n>` | `PROOF_AMOUNT_USD` is non-numeric, ≤ 0, or NaN | Set `PROOF_AMOUNT_USD` to a positive number. |
| `error` field contains `RealTradingDisabledError` | SDK refused trading because `mode !== demo-trading` slipped through | Confirm `ETORO_MODE=demo-trading` reached the process. |
| `error` field contains `ReadOnlyAdapterError` | Adapter selector resolved the read-only sentinel — `HEDGE_TRADING_ENABLED` not exactly `'true'` | Set `HEDGE_TRADING_ENABLED=true` (string match — not `1`, `yes`). |
| `error` field contains `DemoCapExceededError` | Per-order or daily cap hit | Lower `PROOF_AMOUNT_USD`, or raise `MAX_DEMO_ORDER_NOTIONAL_USD` / `MAX_DAILY_DEMO_NOTIONAL_USD` (both default-bounded). |
| `error` field contains `InvalidOrderError` | Bad request shape (NaN amount, empty symbol, invalid side) | Re-issue with valid inputs; review the `field` / `reason` fields on the error. |
| `error` field contains `InvalidModeError` | `ETORO_MODE` typo | Use `mock`, `demo-readonly`, `demo-trading`, or `real-disabled`. |
| Empty `before`/`after` `etoroPositions` | No matching open position | Run on a symbol with a populated demo position, or seed one. |

Error class names are exported from
[`backend/etoro-client/src/errors.ts`](../../backend/etoro-client/src/errors.ts)
and
[`backend/hedge-engine/src/etoro-adapter.ts`](../../backend/hedge-engine/src/etoro-adapter.ts).
The names in this table match the classes thrown at runtime.

## Source

- Script: [`backend/hedge-engine/scripts/demo-proof.ts`](../../backend/hedge-engine/scripts/demo-proof.ts)
- Adapter selector: [`backend/hedge-engine/src/select-adapter.ts`](../../backend/hedge-engine/src/select-adapter.ts)
- Read-only sentinel: [`backend/hedge-engine/src/etoro-adapter.ts`](../../backend/hedge-engine/src/etoro-adapter.ts)
- SDK error catalogue: [`backend/etoro-client/src/errors.ts`](../../backend/etoro-client/src/errors.ts)
- Adapter doc: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../ETORO_GOODCHAIN_ADAPTER.md)
- Lane spec: [`.autobuilder/initiatives/0007a-etoro-connectivity/spec.md`](../../.autobuilder/initiatives/0007a-etoro-connectivity/spec.md)
