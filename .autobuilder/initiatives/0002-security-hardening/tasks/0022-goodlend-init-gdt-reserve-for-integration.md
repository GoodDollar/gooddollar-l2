---
id: goodlend-init-gdt-reserve-for-integration
title: "GoodLend — Initialize GDT reserve so `supply(GDT)` produces a real on-chain receipt"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: false
executed: false
priority: P0
labels: [integration, goodlend, on-chain-receipt, acceptance-criterion-3]
---

# GoodLend — Initialize GDT reserve so the integration verifier stops skipping

## Why this blocks the initiative

Initiative `0002-security-hardening` Acceptance Criterion #3 is _"Real
on-chain transactions executed across all 6 protocols"_. The current
auto-generated `.autobuilder/integration-results.md` shows GoodLend
explicitly skipped:

| Protocol | Action | Tx | Status | Notes |
|----------|--------|----|--------|-------|
| GoodLend | `supply(GDT, 5 GDT)` | n/a | ⏭️ skipped | _no receipt — `supply()` reverted because GDT reserve is not initialised on the redeployed pool_ |

`scripts/verify-onchain-integration.sh` calls
`cast send $LEND "supply(address,uint256)" $GDT 5e18 …` against
`GoodLendPool` (`src/lending/GoodLendPool.sol`). `supply()` requires
`reserves[asset].isActive`, which is only set inside `initReserve(...)`.

`script/DeployGoodLend.s.sol` only initialises USDC and WETH reserves
(`script/DeployGoodLend.s.sol:87-108`). There is no GDT reserve, so the
`cast send` always reverts before any state changes, no receipt JSON is
written, and the renderer reports GoodLend as skipped.

Until this is fixed, this initiative cannot satisfy its own Definition
of Done bullet: _"Transaction receipts prove all 6 protocols execute
on-chain"_.

## Goal

Produce a real on-chain receipt for GoodLend `supply(GDT, …)` on the
Anvil devnet, end-to-end, so the renderer marks GoodLend as ✅ success
in `.autobuilder/integration-results.md`.

## Scope

1. Write a one-shot forge script (e.g. `script/InitGoodLendGDTReserve.s.sol`)
   that, against the already-deployed `GoodLendPool` at
   `$LEND` from `.autobuilder/addresses.env`:
   - Deploys a `GoodLendToken` (gGDT) and a `DebtToken` (dGDT) bound to
     the live `$GDT`.
   - Calls `pool.initReserve(GDT, gGDT, dGDT, reserveFactorBPS, ltvBPS,
     liqThresholdBPS, liqBonusBPS, supplyCap, borrowCap, 18)` using
     conservative parameters (e.g. 20% reserve factor, 75% LTV, 82% liq
     threshold, 5% liq bonus, supply/borrow caps sized for devnet).
   - Logs the new gGDT/dGDT addresses.
2. Persist the new addresses (`G_GDT`, `D_GDT`) in
   `.autobuilder/addresses.env` so future scripts and the renderer can
   reference them.
3. Update `scripts/verify-onchain-integration.sh` so that, after the
   reserve exists, it:
   - Approves `$GDT` to `$LEND` from the tester key.
   - Calls `supply(address,uint256)` and writes the resulting receipt
     JSON to `.autobuilder/integration-receipts/GoodLend.json`.
4. Re-run the renderer (`scripts/render-integration-report.py`) and
   verify `.autobuilder/integration-results.md` flips GoodLend from
   `⏭️  skipped` to `✅ success` with a real tx hash + gas used.

## Non-Goals

- No new lending features, no new asset classes, no UI work.
- No protocol-level security fixes — this is purely the on-chain setup
  needed to satisfy AC #3 for GoodLend.
- No changes to USDC/WETH reserves.

## Acceptance Criteria

- `cast call $LEND "getReserveData(address)" $GDT --rpc-url
  http://localhost:8545` returns a struct with `isActive=true`.
- `.autobuilder/integration-receipts/GoodLend.json` exists with
  `status=0x1` and a non-zero `transactionHash`.
- `.autobuilder/integration-results.md`, after re-rendering, lists
  GoodLend as ✅ success with non-zero `gasUsed`.
- `forge test` still passes 0 failures (no regressions in lending
  tests).

## Source pointers

- `src/lending/GoodLendPool.sol` — `initReserve` at line 174, `supply`
  at lines 221 / 231.
- `script/DeployGoodLend.s.sol` — existing USDC + WETH init pattern at
  lines 65–108.
- `scripts/verify-onchain-integration.sh` — current GoodLend block (the
  one that currently reverts).
- `scripts/render-integration-report.py` — consumer of the receipt JSON.
- `.autobuilder/addresses.env` — `GDT` and `LEND` already defined.
- `.autobuilder/integration-results.md` — the live skip note.
