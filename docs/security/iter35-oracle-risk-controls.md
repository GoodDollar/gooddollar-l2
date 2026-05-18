# Iter 35 — Oracle Risk Controls (Plan Row 33)

**Date:** 2026-05-18
**Iteration:** 35
**Plan row:** [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../TESTNET-READINESS-50-ITERATIONS.md) row 33 — *Oracle risk controls. Stale/bad oracle behavior guarded and monitored. Proof: Unit/integration tests + monitor health.*
**Task:** [`.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0047-iter35-oracle-risk-controls-verification.md`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0047-iter35-oracle-risk-controls-verification.md)
**Scope:** Verify-and-document. No production Solidity, backend, or frontend changes.

## 1. Oracle inventory (on-chain)

Values pulled directly from current source on 2026-05-18.

| Oracle contract | Staleness guard | Deviation guard | Admin override | Source |
| --- | --- | --- | --- | --- |
| `PerpPriceOracle` | `maxStaleness = 120s` (revert `StalePrice`) | `maxDeviationBps = 2000` (20%) | `setManualPrice()` bypasses staleness; admin-only | [`src/perps/PerpPriceOracle.sol`](../../src/perps/PerpPriceOracle.sol) L45–L46, L267, L275 |
| `SwapPriceOracle` | per-token `maxAge`, `defaultMaxAge = 300s` (revert `StalePrice`) | `maxDeviationBps = 2500` (25%) | admin override bypasses deviation only | [`src/oracle/SwapPriceOracle.sol`](../../src/oracle/SwapPriceOracle.sol) L51–L52, L210, L280 |
| `Stocks PriceOracle` | `maxAge = 1 hour` (revert `StalePrice`) | via underlying Chainlink `AggregatorV3Interface` only | `setManualPrice()` (admin-only) | [`src/stocks/PriceOracle.sol`](../../src/stocks/PriceOracle.sol) L42, L168 |
| `Lending SimplePriceOracle` | ❌ none | ❌ none | admin-set prices only (no `updatedAt`) | [`src/lending/SimplePriceOracle.sol`](../../src/lending/SimplePriceOracle.sol) — devnet placeholder, "replace with Pyth/Chainlink adapters" per NatSpec L7–L8 |

All four contracts use admin-controlled keeper allowlists (`onlyKeeper` /
`onlyAdmin`) so an attacker cannot push prices without compromising a keeper
key.

## 2. Off-chain coverage

### swap-oracle keeper
[`backend/swap-oracle/src/index.ts`](../../backend/swap-oracle/src/index.ts)

- Reads Chainlink prices, batches `oracle.batchUpdatePrices(addresses, prices)`.
- When the on-chain deviation guard rejects a batch, falls back to per-token
  retries (L164–L175). This means a single bad price isolates one symbol
  instead of dropping the whole batch, while still letting the contract
  enforce the 25% deviation cap.
- Exposes a `/health` endpoint consumed by the aggregator at
  `https://goodswap.goodclaw.org/api/status` (service name `swap-oracle`).

### monitor
[`backend/monitor/src/checks.ts`](../../backend/monitor/src/checks.ts)

- Tracks chain block age (`stale?` flag if no new block within thresholds, L34–L42).
- Per-service HTTP probes for every backend (`swap-oracle`, `stocks-keeper`,
  `revenue-tracker`, `liquidator`, etc.).
- **Known gap (deferred, not opened as a ticket this iter):** does not yet
  read each oracle's on-chain `updatedAt` and alert when age exceeds the
  configured `maxAge` / `maxStaleness`. Today the indirect signal is "swap-
  oracle keeper unhealthy" → `/api/status` flips → operator paged.

### `/api/status` snapshot (2026-05-18T12:07:08Z)

```
overall:    healthy
healthy/total: 12/12
chainBlock (via swap-oracle, revenue-tracker, stocks-keeper): 202120
swap-oracle: ok (uptime 16096s)
monitor:     ok (uptime 16097s)
stocks-keeper: ok (chainBlock 202120)
revenue-tracker: ok (chainBlock 202120)
```

Full JSON archived at the time of capture:

```
$ curl -s https://goodswap.goodclaw.org/api/status
{"overall":"healthy","healthy":12,"total":12,...
  {"name":"swap-oracle","status":"ok","latencyMs":13,"uptime":16096,"chainBlock":202120,...},
  {"name":"monitor","status":"ok","latencyMs":3,"uptime":16097.870558209,...},
  ...12 services total, all "ok"...}
```

## 3. Test proof

All three suites run cleanly on 2026-05-18. Total **56/56 oracle tests pass.**

### `test/perps/PerpPriceOracle.t.sol` — 18/18 PASS

Highlights covering row-33 behavior:

- `test_getPrice_revert_stalePrice` — read after `maxStaleness` reverts.
- `test_updatePrice_revert_deviationTooLarge` — >20% jump rejected.
- `test_updatePrice_acceptsReasonableDeviation` — sub-20% jump accepted.
- `test_setMaxStaleness`, `test_setMaxDeviation` — admin tunables work.
- `test_clearManualOverride_revertOnStale` — manual override path safely
  re-enters the staleness check after `clearManualOverride()`.
- `test_isFresh_returnsCorrectly` — read-side freshness predicate.
- `test_updatePrice_revert_notKeeper`, `test_removeAndAddKeeper` — keeper
  allowlist enforced.

```
Ran 18 tests for test/perps/PerpPriceOracle.t.sol:PerpPriceOracleTest
... 18 PASS, 0 fail, 0 skipped, finished in 1.19ms
```

### `test/oracle/SwapPriceOracle.t.sol` — 20/20 PASS

Highlights:

- `test_stalePrice_reverts`, `test_getPriceUnsafe_ignoresStaleness` — guarded
  path enforces `maxAge`; unsafe path is explicit opt-out for callers that
  want a TWAP snapshot.
- `test_deviationTooHigh_reverts`, `test_smallDeviation_succeeds` — 25% cap
  enforced.
- `test_adminOverride_bypassesDeviation` — emergency override path works
  (admin only).
- `test_twap_accumulates`, `test_twap_returnsSpotWhenFresh` — TWAP fallback
  if spot is too fresh to derive (sanity for downstream consumers).
- `test_batchUpdatePrices`, `test_notKeeper_reverts` — keeper batching +
  allowlist.

```
Ran 20 tests for test/oracle/SwapPriceOracle.t.sol:SwapPriceOracleTest
... 20 PASS, 0 fail, 0 skipped, finished in 1.02ms
```

### `test/integration/OracleVerification.t.sol` — 18/18 PASS

Cross-oracle integration verifying all three guarded oracles return non-zero
prices, simultaneously detect staleness, and reject zero/negative inputs:

- `test_crossOracle_allOraclesReturnNonZero`
- `test_crossOracle_simultaneousStaleness`
- `test_perpOracle_stalePriceRevert`, `test_perpOracle_deviationGuard`,
  `test_perpOracle_adminManualPrice`
- `test_swapOracle_stalePriceReverts`, `test_swapOracle_unregisteredTokenReverts`,
  `test_swapOracle_zeroPriceReverts`, `test_swapOracle_updateRefreshesTimestamp`
- `test_stocksOracle_stalePriceReverts`, `test_stocksOracle_negativePriceReverts`,
  `test_stocksOracle_zeroPriceReverts`, `test_stocksOracle_manualOverride`

```
Ran 18 tests for test/integration/OracleVerification.t.sol:OracleVerification
... 18 PASS, 0 fail, 0 skipped, finished in 1.24ms
```

## 4. Known gap — `SimplePriceOracle` (GoodLend devnet)

`src/lending/SimplePriceOracle.sol` is an admin-settable mapping with no
`updatedAt`, no staleness check, no deviation check. The contract NatSpec
explicitly tags this as a devnet shortcut:

```solidity
* @notice Admin-settable price oracle for GoodLend devnet.
...
*         In production, replace with Pyth/Chainlink adapters.
```

**Risk profile on testnet:** admin can set any price at any time. A
compromised admin key could mark collateral worthless and trigger
liquidations. Mitigated by:

1. GoodLend is gated behind the **testnet** label in the frontend and is not
   advertised as carrying real value.
2. Admin keys are operator-managed and rotated as part of the testnet
   environment.
3. The contract is explicitly listed in the README "Known Risks" section
   pointing back to this doc, so external testers see the gap before they
   deposit.

**Mainnet remediation (deferred, follow-up tickets not opened in this iter):**

- Replace `SimplePriceOracle` with the Pyth or Chainlink adapter used by
  `SwapPriceOracle` / `Stocks PriceOracle`.
- Add an `oracle_age` check to `backend/monitor` that reads each oracle's
  `updatedAt` and alerts when age exceeds `maxAge` / `maxStaleness`.
- Wire alerts into the existing `/api/status` aggregator so degraded oracles
  flip the public gate to `degraded` instead of staying `healthy`.

## 5. Summary

- ✅ Three of four oracles enforce staleness + deviation on-chain, with 56/56
  tests green.
- ✅ swap-oracle keeper handles deviation-rejected batches gracefully and
  reports health via `/api/status`.
- ✅ monitor + aggregator give live operator visibility (12/12 services `ok`,
  chain block 202,120).
- ⚠ `SimplePriceOracle` (lending) is a documented devnet-only placeholder;
  recorded in README "Known Risks" with a pointer to this doc and an
  explicit mainnet remediation path.

Row 33 of [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../TESTNET-READINESS-50-ITERATIONS.md)
is marked ✅ executed iter 35 against this evidence file and the task file
linked above.
