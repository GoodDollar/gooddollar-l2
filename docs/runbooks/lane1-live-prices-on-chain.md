# Lane 1 — produce a live-prices-on-chain proof

Operator runbook for the **first** artifact named by the
[`0007a-etoro-connectivity`](../../.autobuilder/initiatives/0007a-etoro-connectivity/spec.md)
"Overall Definition of Done": eToro demo prices flowing through
[`backend/price-service`](../../backend/price-service/) and
[`backend/oracle-signer`](../../backend/oracle-signer/) onto
`StockOracleV2` on L2.

The runbook documents the existing behavior of the lane-1 services; it
never redefines them. The deep contract (env table, four-mode matrix,
endpoints) lives in
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../ETORO_GOODCHAIN_ADAPTER.md).

**Sibling proof:** the second DoD artifact (one capped demo open) has
its own runbook at
[`docs/runbooks/lane1-demo-hedge-proof.md`](./lane1-demo-hedge-proof.md).
The two are produced independently and can be run in either order.

## Prerequisites

- Valid eToro demo credentials: `ETORO_DEMO_KEY`, `ETORO_DEMO_SECRET`,
  `ETORO_DEMO_USER_KEY`. The mock smoke at the bottom of this runbook
  works without them.
- Lane installed: `npm run install:lane1` from the repo root.
- For the **on-chain leg** (Step 2 + Step 3): a JSON-RPC URL for the L2
  that hosts `StockOracleV2`, the deployed `STOCK_ORACLE_V2_ADDRESS`,
  and a funded `ORACLE_SIGNER_KEY`. Without all three the oracle-signer
  stays bound on its health port but reports `degraded` and submits no
  on-chain transactions — Steps 1 + the price-service half of the
  proof still complete.
- (Optional) [Foundry](https://book.getfoundry.sh/) for the `cast call`
  reader in Step 3. An ethers one-liner is shown as the fallback for
  operators without Foundry.

## Step 1 — boot price-service with live demo quotes

```bash
ETORO_MODE=demo-readonly \
ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
ORACLE_SYMBOLS=BTC,AAPL \
(cd backend/price-service && npm start)
```

Verification (in another terminal):

```bash
curl -s http://localhost:9300/health | jq .
# {
#   "status": "ok",
#   "freshQuotes": <≥1>,
#   "totalCached": <≥1>,
#   "configuredSymbols": 2,
#   "timestamp": <epoch ms>
# }

curl -s http://localhost:9300/quotes/BTC | jq '{mid,bid,ask,timestamp,stale,confidence}'
curl -s http://localhost:9300/quotes/AAPL | jq '{mid,bid,ask,timestamp,stale,confidence}'
# {
#   "mid": <positive number>,
#   "bid": <positive number>,
#   "ask": <positive number>,
#   "timestamp": <epoch ms>,
#   "stale": false,
#   "confidence": <0..1>
# }
```

A non-zero `mid` for at least one crypto (`BTC`) and one stock (`AAPL`)
is the first half of the
[`OFFICIAL_ETORO_API_PRICE_SOURCE.md`](../../.autobuilder/OFFICIAL_ETORO_API_PRICE_SOURCE.md)
"non-zero `rates[]`" proof — the price-service has normalized the eToro
demo rates payload and is serving it on `:9300`.

## Step 2 — boot oracle-signer with chain creds

```bash
ORACLE_SIGNER_KEY=… \
STOCK_ORACLE_V2_ADDRESS=0x… \
L2_RPC_URL=https://… \
ORACLE_SYMBOLS=BTC,AAPL \
(cd backend/oracle-signer && npm start)
```

Leaving `PRICE_SERVICE_URL` unset is correct — the default tracks the
price-service WS port (`ws://localhost:9301`).

Verification:

```bash
curl -s http://localhost:9107/health | jq .
# Live (with all three creds set):
#   {"status": "ok", "service": "oracle-signer", "uptime": <seconds>, "timestamp": <ISO>}
# Health-only (any of ORACLE_SIGNER_KEY / STOCK_ORACLE_V2_ADDRESS / L2_RPC_URL missing):
#   {"status": "degraded", "service": "oracle-signer", "uptime": <seconds>,
#    "timestamp": <ISO>, "mode": "disabled",
#    "reason": "ORACLE_SIGNER_KEY is not set; signer loop disabled"}
```

The signer subscribes to the price-service WS broadcaster, buffers
quotes per symbol, and at each `ORACLE_UPDATE_INTERVAL` tick (default
`5000` ms) submits a single batched `setPrice` transaction containing
every symbol whose mid moved more than `ORACLE_MIN_DEVIATION` bps
(default `10`) since the last submission.

Watch the signer's stdout — once a tick fires you'll see:

```
[oracle-signer] Update #1: <N> symbols, tx=0x…, gas=<n>, rtt=<ms>ms
```

## Step 3 — verify on-chain state

Once Step 2 has logged at least one `Update #N: …` line, read the
oracle directly with `cast` (Foundry):

```bash
cast call "$STOCK_ORACLE_V2_ADDRESS" \
  'getPrice(string)(uint256,uint256,uint8)' "BTC" \
  --rpc-url "$L2_RPC_URL"
# Returns: (price, timestamp, decimals)
#   price     — fixed-point integer scaled by `decimals`
#   timestamp — block timestamp the value was last set at
#   decimals  — usually 8 (oracle deploy default)
```

Or via ethers (no Foundry required):

```bash
node -e "
const { ethers } = require('ethers');
const abi = ['function getPrice(string) view returns (uint256,uint256,uint8)'];
const p = new ethers.JsonRpcProvider(process.env.L2_RPC_URL);
const c = new ethers.Contract(process.env.STOCK_ORACLE_V2_ADDRESS, abi, p);
c.getPrice('BTC').then(([price, ts, dec]) => {
  console.log('price=', price.toString(), 'ts=', ts.toString(), 'dec=', dec);
});
"
```

Expected: `price` is a positive integer that, when divided by
`10^decimals`, falls within `ORACLE_MIN_DEVIATION` bps of the
price-service `mid` from Step 1; `timestamp` advances on each
`ORACLE_UPDATE_INTERVAL` tick the signer batches.

If the call returns `(0, 0, 0)` the oracle has not been written yet for
that symbol — wait one `ORACLE_UPDATE_INTERVAL`, or check the signer's
stdout for a `Submission failed:` line.

## Common failures and fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/health` on `:9300` returns `503 {"status": "degraded"}` after 10 s | Mock mode produces fresh quotes within one tick; demo-readonly mode requires real demo creds and a brief auth round-trip. | Confirm `ETORO_MODE` and the three `ETORO_DEMO_*` env vars; run the price-service in `mock` mode first to isolate the eToro auth surface. |
| `/quotes/BTC` returns `404 {"error": "No quote for BTC"}` | `BTC` was filtered out of `ORACLE_SYMBOLS`, or the upstream eToro response didn't include it. | Confirm `ORACLE_SYMBOLS=BTC,AAPL` (or whatever you intend). Unknown symbols mark the service `degraded` via `SERVICE_HEALTH_STATUS`. |
| `/health` on `:9107` returns `"status": "degraded"` with `"reason": "ORACLE_SIGNER_KEY is not set; signer loop disabled"` | Health-only fallback — either `ORACLE_SIGNER_KEY`, `STOCK_ORACLE_V2_ADDRESS`, or `L2_RPC_URL` is unset. | Set all three. The signer's `loadConfig()` throws on missing `ORACLE_SIGNER_KEY` first; an empty `STOCK_ORACLE_V2_ADDRESS` boots but submissions fail at `tx.wait()`. |
| `cast call …` returns `(0, 0, 0)` | Oracle has not yet been written for that symbol. | Wait one `ORACLE_UPDATE_INTERVAL` (default 5 s); confirm the signer's stdout has a `[oracle-signer] Update #N: <N> symbols, tx=0x…` line. |
| `[oracle-signer] Submission failed: <reason>` repeats | RPC unreachable, signer key unfunded for gas, or `STOCK_ORACLE_V2_ADDRESS` mismatched. | Hit the RPC directly (`cast block-number --rpc-url $L2_RPC_URL`); confirm the signer's address (printed at boot under `[oracle-signer] Signer:`) holds gas; confirm `STOCK_ORACLE_V2_ADDRESS` is the deployed `StockOracleV2`. |

## Source / next

- Producer: [`backend/price-service/README.md`](../../backend/price-service/README.md)
  — REST `:9300`, WS `:9301`, env table.
- Consumer: [`backend/oracle-signer/README.md`](../../backend/oracle-signer/README.md)
  — health `:9107`, env table, upstream/downstream wiring.
- Sibling proof: [`docs/runbooks/lane1-demo-hedge-proof.md`](./lane1-demo-hedge-proof.md).
- Deep contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../ETORO_GOODCHAIN_ADAPTER.md).
- SDK error catalogue: [`backend/etoro-client/src/errors.ts`](../../backend/etoro-client/src/errors.ts).
- Lane spec: [`.autobuilder/initiatives/0007a-etoro-connectivity/spec.md`](../../.autobuilder/initiatives/0007a-etoro-connectivity/spec.md).

## Mock-mode dry run (no demo creds)

To smoke the verification commands offline:

```bash
ETORO_MODE=mock ORACLE_SYMBOLS=BTC,AAPL \
  (cd backend/price-service && npm start)
```

`MockEtoroSource` emits quotes within one tick, so each
`curl http://localhost:9300/quotes/<SYM>` returns a positive `mid`
immediately. The oracle-signer step requires real chain creds; without
them `/health` reports the documented `degraded` fallback above
(`reason: "ORACLE_SIGNER_KEY is not set; signer loop disabled"`) and
no on-chain submission is attempted.
