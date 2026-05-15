---
id: goodstable-wire-psm-collateral-for-integration
title: "GoodStable — Wire PSM/VaultManager collateral so depositCollateral produces a real on-chain receipt"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: false
executed: false
priority: P0
labels: [integration, goodstable, on-chain-receipt, acceptance-criterion-3]
---

# GoodStable — Wire PSM/VaultManager collateral so depositCollateral lands a receipt

## Why this blocks the initiative

Initiative `0002-security-hardening` Acceptance Criterion #3 demands
real on-chain transactions across **all 6 protocols**. The current
auto-generated `.autobuilder/integration-results.md` shows GoodStable
skipped:

| Protocol | Action | Tx | Status | Notes |
|----------|--------|----|--------|-------|
| GoodStable | `depositCollateral / mint gUSD` | n/a | ⏭️ skipped | _no receipt — PSM collateral wiring + collateral approval flow deferred to next iteration_ |

GoodStable is two coupled contracts: `VaultManager` (CDP-style
collateralised vaults) and `PegStabilityModule` (PSM swap path).
`scripts/verify-onchain-integration.sh` currently attempts to call
`depositCollateral(uint256)` directly on `$STABLE`, but the actual
deposit entry point lives on `VaultManager.depositCollateral(bytes32
ilk, uint256 amount)` (`src/stable/VaultManager.sol`).

Two things are missing:

1. The verifier does not approve / call `VaultManager` at `$VAULT_MANAGER`
   (the address already exists in `.autobuilder/addresses.env` —
   `0x3489745eff9525ccc3d8c648102fe2cf3485e228`).
2. No collateral `ilk` is guaranteed to be active in
   `CollateralRegistry` at `$COLLATERAL_REGISTRY` for the tester to
   actually deposit against.

## Goal

Produce a real on-chain receipt for GoodStable on the Anvil devnet
that the renderer can lift into ✅ success.

## Scope

1. Write a one-shot forge script (e.g.
   `script/SetupGoodStableCollateral.s.sol`) that, against the live
   `CollateralRegistry`, `VaultManager`, and `PegStabilityModule`:
   - Registers (or asserts already registered) a single `ilk`
     (`bytes32("GDT-A")` or `bytes32("ETH-A")`, whichever the deployer
     of `DeployGoodStable.s.sol` chose; resolve by reading
     `CollateralRegistry`) backed by an asset the tester actually
     holds — prefer `$GDT` so the same funded tester from
     `_setup-fund-tester.json` works.
   - Sets safe debt ceiling, liquidation ratio, stability fee parameters
     consistent with existing Foundry tests for `VaultManager`.
2. Update `scripts/verify-onchain-integration.sh` so the GoodStable
   block:
   - Approves `$GDT` to `$VAULT_MANAGER`.
   - Calls `VaultManager.depositCollateral(bytes32 ilk, uint256 amount)`
     with the registered `ilk` and a non-zero amount.
   - Optionally calls `mintGUSD` (or whatever the canonical follow-up
     entrypoint is named in the live ABI) to validate the full path.
   - Writes the resulting receipt to
     `.autobuilder/integration-receipts/GoodStable.json`.
3. Re-run `scripts/render-integration-report.py` and confirm GoodStable
   flips from `⏭️  skipped` to `✅ success` with a real tx hash, gas
   used, and a non-zero UBI-routed amount _if_ the PSM/VaultManager
   path emits a `Transfer` to the splitter; otherwise document the zero
   explicitly (same as GoodPerps deposit).

## Non-Goals

- No new collateral types beyond what is needed to land a single
  receipt.
- No frontend changes.
- No new PSM features (no new swap pairs, no new fee tiers).
- No edits to executed task files.

## Acceptance Criteria

- `cast call $COLLATERAL_REGISTRY "ilks(bytes32)" <ilk> --rpc-url
  http://localhost:8545` returns a non-zero / active configuration.
- `.autobuilder/integration-receipts/GoodStable.json` exists with
  `status=0x1` and a non-zero `transactionHash`.
- `.autobuilder/integration-results.md`, after re-rendering, lists
  GoodStable as ✅ success.
- `forge test` still passes 0 failures (no regressions in
  `test/stable/*` suites).

## Source pointers

- `src/stable/VaultManager.sol` — `depositCollateral`, `mintGUSD`,
  `ilks`, `urns` structures.
- `src/stable/PegStabilityModule.sol` — admin-only swap path; not the
  deposit entry point, but worth confirming PSM doesn't need to be
  paused/unpaused to satisfy the verifier.
- `src/stable/CollateralRegistry.sol` — ilk registration / config.
- `script/DeployGoodStable.s.sol` — existing deployment wiring; reuse
  the exact `ilk` it deploys with.
- `scripts/verify-onchain-integration.sh` — current GoodStable block
  (the one that currently reverts).
- `scripts/render-integration-report.py` — consumer of the receipt JSON.
- `.autobuilder/addresses.env` — `STABLE`, `VAULT_MANAGER`,
  `COLLATERAL_REGISTRY`, `PSM` already defined.
- `.autobuilder/integration-results.md` — the live skip note.
