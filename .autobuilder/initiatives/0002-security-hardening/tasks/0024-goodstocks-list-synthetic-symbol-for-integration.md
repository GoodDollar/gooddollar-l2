---
id: goodstocks-list-synthetic-symbol-for-integration
title: "GoodStocks — List sAAPL synthetic so `mintSynthetic` produces a real on-chain receipt"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: false
executed: false
priority: P0
labels: [integration, goodstocks, on-chain-receipt, acceptance-criterion-3]
---

# GoodStocks — List a synthetic symbol so the integration verifier can mint

## Why this blocks the initiative

Initiative `0002-security-hardening` Acceptance Criterion #3 demands
real on-chain transactions across **all 6 protocols**. The current
auto-generated `.autobuilder/integration-results.md` shows GoodStocks
skipped:

| Protocol | Action | Tx | Status | Notes |
|----------|--------|----|--------|-------|
| GoodStocks | `mintSynthetic("sAAPL", 1)` | n/a | ⏭️ skipped | _no receipt — per-symbol listing must be deployed before mint; deferred to next iteration_ |

GoodStocks is a `SyntheticAssetFactory` (`$STOCKS` in
`.autobuilder/addresses.env`). `mintSynthetic(string symbol, uint256
amount)` only works for symbols that have been listed by an admin via
`listAsset(string symbol, …)`. The verifier currently jumps straight
to mint, so the call reverts and no receipt is written.

## Goal

Produce a real on-chain receipt for GoodStocks `mintSynthetic("sAAPL",
…)` on the Anvil devnet, so the renderer flips GoodStocks to ✅
success in `.autobuilder/integration-results.md`.

## Scope

1. Write a one-shot forge script (e.g.
   `script/ListGoodStocksSAAPL.s.sol`) that, against the live
   `SyntheticAssetFactory` at `$STOCKS`:
   - Calls `listAsset("sAAPL", <name>, <symbol>, <decimals>, <oracle or
     defaults>, <any other args required by the live ABI>)` using the
     admin key derived from `addresses.env`.
   - Logs the deployed synthetic token address (the `SyntheticAsset`
     ERC20) and the canonical symbol it was listed under.
   - Sanity-checks: subsequent `cast call $STOCKS "syntheticOf(string)"
     "sAAPL"` returns a non-zero address.
2. Persist the listed symbol + synthetic address (`S_AAPL_TOKEN`) in
   `.autobuilder/addresses.env` so the renderer and follow-up scripts
   can reference them.
3. Update `scripts/verify-onchain-integration.sh` so the GoodStocks
   block, after listing:
   - Approves `$GDT` (or whatever collateral `mintSynthetic` pulls — if
     the live ABI charges in G$ via the factory's collateral path, use
     `$GDT`) to `$STOCKS`.
   - Calls `mintSynthetic("sAAPL", 1e18)` and writes the resulting
     receipt to `.autobuilder/integration-receipts/GoodStocks.json`.
4. Re-run `scripts/render-integration-report.py` and confirm
   GoodStocks flips from `⏭️  skipped` to `✅ success` with a real tx
   hash and non-zero gas used.

## Non-Goals

- No additional symbols beyond sAAPL.
- No oracle integration changes (use existing oracle wiring from
  `DeployGoodStocks.s.sol` and whatever default the factory already
  expects).
- No frontend changes.
- No edits to executed task files.

## Acceptance Criteria

- `cast call $STOCKS "syntheticOf(string)" "sAAPL" --rpc-url
  http://localhost:8545` returns a non-zero address.
- `.autobuilder/integration-receipts/GoodStocks.json` exists with
  `status=0x1` and a non-zero `transactionHash`.
- `.autobuilder/integration-results.md`, after re-rendering, lists
  GoodStocks as ✅ success.
- `forge test` still passes 0 failures (no regressions in
  `test/stocks/*` suites).

## Source pointers

- `src/stocks/SyntheticAssetFactory.sol` — `listAsset`, `delistAsset`,
  `mintSynthetic`, `syntheticOf` (verify the exact getter / mapping
  name in source before scripting).
- `src/stocks/SyntheticAsset.sol` — ERC20 deployed by the factory per
  listed symbol.
- `script/DeployGoodStocks.s.sol` — existing factory deployment;
  re-use the same admin / oracle wiring it relies on.
- `scripts/verify-onchain-integration.sh` — current GoodStocks block
  (the one that currently reverts before mint).
- `scripts/render-integration-report.py` — consumer of the receipt JSON.
- `.autobuilder/addresses.env` — `STOCKS`, `GDT`,
  `COLLATERAL_VAULT` already defined.
- `.autobuilder/integration-results.md` — the live skip note.
