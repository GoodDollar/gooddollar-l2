# Security SpecKit — Consolidated Testing Plan

**Status:** v1 — recovery deliverable for task `0028` (the missing artifact
from `0026`).
**Lane:** Security SpecKit (cursor-lane-d, iter #2).
**Date generated:** 2026-05-20.
**Repo commit at generation:** `6a75afe8d057edea21f58e91b8778df9fff03d0b`.
**Tool versions:**

- `forge --version` → `forge Version: 1.5.1-stable` (commit
  `b0a9dd9ceda36f63e2326ce530c10e6916f4b8a2`).
- `slither --version` → `0.11.5`.
- Both tools present in the executor's environment at generation time. If
  re-running in an environment that lacks them, replace the relevant
  baseline figures and explicitly record "tool unavailable in this
  environment" rather than silently dropping the section.

**Scope:** Consolidated map of what is and isn't covered by automated
security testing across all 69 production contracts under `src/`. Pure
documentation; no production Solidity, no `foundry.toml`, and no test
files are modified by this commit.

**Sibling docs:**

- `docs/SLITHER-REPORT.md` — current Slither baseline narrative (task
  `0024`).
- `docs/security/CONTRACT-PROVENANCE.md` — provenance + watchlist
  (task `0025`).
- `docs/security/iter31/` — raw Slither outputs (sarif + txt).
- `docs/SECURITY-AUDIT.md` — top-level audit summary (cross-linked).
- `.autobuilder/initiatives/0006-etoro-synthetic-stocks-100/tasks/0026-security-speckit-testing-plan.md`
  — locked spec this file implements.

---

## Section 1 — Tooling baseline

### 1.1 Static analysis (Slither)

- Authoritative baseline: [`docs/SLITHER-REPORT.md`](../SLITHER-REPORT.md)
  (iter31, **0 HIGH / 0 MEDIUM / 323 LOW / 228 INFORMATIONAL**).
- Raw outputs:
  - [`docs/security/iter31/slither.sarif`](./iter31/slither.sarif)
  - [`docs/security/iter31/slither.txt`](./iter31/slither.txt)
- Slither config: [`slither.config.json`](../../slither.config.json)
  (filters `lib/|node_modules/|frontend/|research/|test/|script/`,
  excludes optimization findings only).
- Re-run command: `slither . --config-file slither.config.json`.

### 1.2 Foundry config & fuzz/invariant defaults

The current [`foundry.toml`](../../foundry.toml) contains **only** a
`[profile.default]` block:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

via_ir = true
optimizer = true
optimizer_runs = 200
```

**There are no `[fuzz]` or `[invariant]` blocks.** The runner therefore
uses Foundry's built-in defaults. For `forge` `1.5.1-stable` those are:

| Knob | Default | Notes |
| --- | --- | --- |
| `fuzz.runs` | `256` | Per fuzz test case. |
| `fuzz.max_test_rejects` | `65536` | Reverts before a fuzz test fails. |
| `fuzz.seed` | unset (random) | Non-reproducible by default. |
| `invariant.runs` | `256` | Per invariant. |
| `invariant.depth` | `500` | Calls per run. |
| `invariant.fail_on_revert` | `false` | Reverts are not failures. |
| `invariant.call_override` | `false` | Off. |
| `invariant.dictionary_weight` | `80` | Mutation dictionary weight. |
| `invariant.include_storage` | `true` | Storage values in dict. |
| `invariant.include_push_bytes` | `true` | Push immediates in dict. |

Pinning these explicitly is **out of scope** for this task and is
recommended as a follow-up in Section 6.

### 1.3 Coverage baseline

- Headline figure from [`docs/SECURITY-AUDIT.md`](../SECURITY-AUDIT.md):
  **68.66 % line coverage** (as of an earlier commit — the audit doc
  does not currently pin its own snapshot hash).
- Re-running `forge coverage` with `via_ir = true` triggers
  stack-too-deep on several contracts. Use the workaround documented in
  `foundry.toml`:

  ```bash
  forge coverage --ir-minimum --report summary
  forge coverage --ir-minimum --report lcov
  ```

- Refresh queued: a future task should re-run coverage against the
  current commit and update both this section and `SECURITY-AUDIT.md`.

---

## Section 2 — Current coverage inventory

The two tables in this section are mechanically reconcilable with the
file system. Drift detection helper:
[`scripts/security/build-testing-plan-tables.sh`](../../scripts/security/build-testing-plan-tables.sh)
(see Section 5).

### Section 2A — Per-test-file inventory (58 rows)

`Kind` is derived from the filename suffix where applicable
(`*.invariant.t.sol` → invariant, `*.fuzz.t.sol` → fuzz) and otherwise
from `grep` for `function (invariant_|testFuzz_)`. A file may have
multiple kinds; the cell lists all that apply.

| Test file | Targets (best-guess contract under `src/`) | Kind |
| --- | --- | --- |
| test/AgentRegistry.t.sol | src/AgentRegistry.sol | unit |
| test/CollateralVault.t.sol | src/stocks/CollateralVault.sol | unit |
| test/Counter.t.sol | src/Counter.sol | unit, fuzz |
| test/GoodDollarBridge.t.sol | src/bridge/GoodDollarBridgeL1.sol, src/bridge/GoodDollarBridgeL2.sol | unit |
| test/GoodDollarToken.t.sol | src/GoodDollarToken.sol | unit |
| test/GoodDollarTokenSecure.t.sol | src/GoodDollarTokenSecure.sol | unit |
| test/GoodLend.t.sol | src/lending/GoodLendPool.sol, src/lending/GoodLendToken.sol, src/lending/DebtToken.sol | unit |
| test/GoodPool.t.sol | src/lending/GoodLendPool.sol, src/lending/InterestRateModel.sol | unit |
| test/GoodStable.t.sol | src/stable/* (gUSD, VaultManager, StabilityPool, PegStabilityModule, CollateralRegistry, StableUBIFeeSplitter) | unit |
| test/GoodYield.t.sol | src/yield/GoodVault.sol, src/yield/VaultFactory.sol | unit |
| test/GoodYieldStrategies.t.sol | src/yield/strategies/LendingStrategy.sol, src/yield/strategies/StablecoinStrategy.sol | unit |
| test/PerpUBIFeeSplitter.t.sol | src/perps/PerpUBIFeeSplitter.sol | unit |
| test/StableUBIFeeSplitter.t.sol | src/stable/StableUBIFeeSplitter.sol | unit |
| test/TestRegistry.t.sol | src/TestRegistry.sol | unit, fuzz |
| test/UBIClaimV2.t.sol | src/UBIClaimV2.sol | unit |
| test/UBIFeeHook.t.sol | src/hooks/UBIFeeHook.sol | unit, fuzz |
| test/UBIFeeSplitter.invariant.t.sol | src/UBIFeeSplitter.sol | invariant, fuzz |
| test/UBIFeeSplitter.t.sol | src/UBIFeeSplitter.sol | unit |
| test/UBIRevenueTracker.t.sol | src/UBIRevenueTracker.sol | unit, fuzz |
| test/ValidatorStaking.t.sol | src/ValidatorStaking.sol | unit |
| test/YieldStrategies.t.sol | src/yield/strategies/LendingStrategy.sol, src/yield/strategies/StablecoinStrategy.sol | unit |
| test/bridge/FastWithdrawalLP.t.sol | src/bridge/FastWithdrawalLP.sol | unit |
| test/bridge/MultiChainBridge.t.sol | src/bridge/MultiChainBridge.sol | unit |
| test/bridge/OPStack.t.sol | src/bridge/OptimismPortal.sol, src/bridge/L1StandardBridge.sol, src/bridge/L2OutputOracle.sol, src/bridge/SystemConfig.sol | unit |
| test/bridge/OPStackMigration.t.sol | src/bridge/L1StandardBridge.sol, src/bridge/OptimismPortal.sol (migration path) | unit |
| test/governance/GoodDAO.t.sol | src/governance/GoodDAO.sol | unit |
| test/governance/GoodTimelock.t.sol | src/governance/GoodTimelock.sol | unit |
| test/governance/VoteEscrowedGD.t.sol | src/governance/VoteEscrowedGD.sol | unit |
| test/handlers/MarginVaultHandler.sol | src/perps/MarginVault.sol (invariant harness) | harness |
| test/handlers/UBIFeeSplitterHandler.sol | src/UBIFeeSplitter.sol (invariant harness) | harness |
| test/integration/AllProtocols.t.sol | cross-cutting: full UBI + protocol matrix | integration |
| test/integration/CrossProtocol.t.sol | cross-cutting: UBI fee path across protocols | integration, fuzz |
| test/integration/OracleVerification.t.sol | src/lending/SimplePriceOracle.sol, src/oracle/*, src/perps/PerpPriceOracle.sol | integration |
| test/integration/UBIFeeAccumulation.t.sol | src/UBIFeeSplitter.sol, src/UBIRevenueTracker.sol, all `*UBIFeeSplitter.sol` | integration, fuzz |
| test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol | src/predict/PredictUBIFeeSplitter.sol, src/lending/* (via fee path), src/stable/StableUBIFeeSplitter.sol, src/stocks/StocksUBIFeeSplitter.sol | integration |
| test/integration/UBIFeeIntegrationProofSwapPerps.t.sol | src/GoodSwap.sol (UBI fee path), src/perps/PerpUBIFeeSplitter.sol | integration |
| test/integration/UBIFeeVerification.t.sol | src/UBIFeeSplitter.sol + all area splitters | integration, fuzz |
| test/lending/StockLendOracleAdapter.t.sol | src/lending/StockLendOracleAdapter.sol | unit |
| test/oracle/StockOracleV2.t.sol | src/oracle/StockOracleV2.sol | unit |
| test/oracle/StockOracleV2Adapter.t.sol | src/oracle/StockOracleV2Adapter.sol | unit |
| test/oracle/SwapPriceOracle.t.sol | src/oracle/SwapPriceOracle.sol | unit |
| test/perps/GoodPerps.t.sol | src/perps/PerpEngine.sol, src/perps/FundingRate.sol, src/perps/PerpPriceOracle.sol | unit |
| test/perps/MarginVault.fuzz.t.sol | src/perps/MarginVault.sol | fuzz |
| test/perps/MarginVault.invariant.t.sol | src/perps/MarginVault.sol | invariant |
| test/perps/PerpEngine.fuzz.t.sol | src/perps/PerpEngine.sol | fuzz |
| test/perps/PerpPriceOracle.t.sol | src/perps/PerpPriceOracle.sol | unit |
| test/perps/StockPerpEngine.t.sol | src/perps/StockPerpEngine.sol | unit |
| test/predict/GoodPredict.t.sol | src/predict/ConditionalTokens.sol, src/predict/MarketFactory.sol, src/predict/OptimisticResolver.sol, src/predict/PredictUBIFeeSplitter.sol | unit |
| test/predict/OptimisticResolver.t.sol | src/predict/OptimisticResolver.sol | unit |
| test/risk/ClearingHouse.t.sol | src/risk/ClearingHouse.sol | unit |
| test/risk/UnifiedRiskEngine.t.sol | src/risk/UnifiedRiskEngine.sol | unit |
| test/stocks/GoodStocks.t.sol | src/stocks/SyntheticAsset.sol, src/stocks/SyntheticAssetFactory.sol, src/stocks/StockAMM.sol, src/stocks/PriceOracle.sol, src/stocks/StocksUBIFeeSplitter.sol | unit |
| test/stocks/GoodStocksV2Integration.t.sol | src/stocks/* (integration path) | integration |
| test/stocks/StockAMM.t.sol | src/stocks/StockAMM.sol | unit |
| test/swap/GoodSwap.t.sol | src/GoodSwap.sol | unit |
| test/swap/GoodSwapRouter.t.sol | src/swap/GoodSwapRouter.sol | unit |
| test/swap/LiFiBridgeAggregator.t.sol | src/swap/LiFiBridgeAggregator.sol | unit |
| test/swap/LimitOrderBook.t.sol | src/swap/LimitOrderBook.sol | unit |

**Reconciliation (Section 2A):**

- Row count: **58** (matches `find test -name '*.sol' -type f | wc -l`).
- Files containing `function invariant_`: 2
  (`test/UBIFeeSplitter.invariant.t.sol`,
  `test/perps/MarginVault.invariant.t.sol`).
- Files containing `function testFuzz_`: 10 (Counter, TestRegistry,
  UBIFeeHook, UBIFeeSplitter.invariant, UBIRevenueTracker,
  integration/CrossProtocol, integration/UBIFeeAccumulation,
  integration/UBIFeeVerification, perps/MarginVault.fuzz,
  perps/PerpEngine.fuzz).
- Two `test/handlers/*.sol` files are invariant harnesses, not standalone
  test files; they have no `test_` or `invariant_` entry points of their
  own and are exercised by the corresponding `*.invariant.t.sol` files.

### Section 2B — Per-contract inventory (69 rows)

"Has unit tests?" is `yes` whenever at least one test file targets the
contract by name match or by including its name in a top-level
`forge test` matrix. "Has fuzz tests?" is `yes` if the contract appears
in (or is exercised by) one of the 10 `testFuzz_` files listed in
Section 2A — this includes the UBI fee-chain splitters covered by the
three integration fuzz files. "Has invariant tests?" is `yes` only for
contracts directly targeted by one of the 2 `invariant_` files.
Interface-only files under `src/interfaces/` and
`src/stable/interfaces/` are marked `n/a` across the board.

| Contract | Area | Has unit tests? | Has fuzz tests? | Has invariant tests? |
| --- | --- | --- | --- | --- |
| src/AgentRegistry.sol | root | yes | no | no |
| src/Counter.sol | root | yes | yes | no |
| src/GoodDollarToken.sol | root | yes | no | no |
| src/GoodDollarTokenSecure.sol | root | yes | no | no |
| src/GoodSwap.sol | root | yes | no | no |
| src/TestRegistry.sol | root | yes | yes | no |
| src/UBIClaimV2.sol | root | yes | yes | no |
| src/UBIFeeSplitter.sol | root | yes | yes | yes |
| src/UBIRevenueTracker.sol | root | yes | yes | no |
| src/ValidatorStaking.sol | root | yes | no | no |
| src/ValidatorStakingDevnet.sol | root | no | no | no |
| src/bridge/FastWithdrawalLP.sol | bridge | yes | no | no |
| src/bridge/GoodDollarBridgeL1.sol | bridge | yes | no | no |
| src/bridge/GoodDollarBridgeL2.sol | bridge | yes | no | no |
| src/bridge/L1StandardBridge.sol | bridge | yes | no | no |
| src/bridge/L2OutputOracle.sol | bridge | yes | no | no |
| src/bridge/MultiChainBridge.sol | bridge | yes | no | no |
| src/bridge/OptimismPortal.sol | bridge | yes | no | no |
| src/bridge/SystemConfig.sol | bridge | yes | no | no |
| src/governance/GoodDAO.sol | governance | yes | no | no |
| src/governance/GoodTimelock.sol | governance | yes | no | no |
| src/governance/VoteEscrowedGD.sol | governance | yes | no | no |
| src/hooks/UBIFeeHook.sol | hooks | yes | yes | no |
| src/interfaces/IERC20Transfer.sol | interfaces | n/a | n/a | n/a |
| src/interfaces/IGoodDollarToken.sol | interfaces | n/a | n/a | n/a |
| src/interfaces/IStableUBIFeeSplitterEnhanced.sol | interfaces | n/a | n/a | n/a |
| src/interfaces/IUBIFeeSplitters.sol | interfaces | n/a | n/a | n/a |
| src/lending/DebtToken.sol | lending | yes | no | no |
| src/lending/GoodLendAddressesProvider.sol | lending | yes | no | no |
| src/lending/GoodLendPool.sol | lending | yes | no | no |
| src/lending/GoodLendToken.sol | lending | yes | no | no |
| src/lending/InterestRateModel.sol | lending | yes | no | no |
| src/lending/SimplePriceOracle.sol | lending | yes | no | no |
| src/lending/StockLendOracleAdapter.sol | lending | yes | no | no |
| src/oracle/StockOracleV2.sol | oracle | yes | no | no |
| src/oracle/StockOracleV2Adapter.sol | oracle | yes | no | no |
| src/oracle/SwapPriceOracle.sol | oracle | yes | no | no |
| src/perps/FundingRate.sol | perps | yes | no | no |
| src/perps/MarginVault.sol | perps | yes | yes | yes |
| src/perps/PerpEngine.sol | perps | yes | yes | no |
| src/perps/PerpPriceOracle.sol | perps | yes | no | no |
| src/perps/PerpUBIFeeSplitter.sol | perps | yes | yes | no |
| src/perps/StockPerpEngine.sol | perps | yes | no | no |
| src/predict/ConditionalTokens.sol | predict | yes | no | no |
| src/predict/MarketFactory.sol | predict | yes | no | no |
| src/predict/OptimisticResolver.sol | predict | yes | no | no |
| src/predict/PredictUBIFeeSplitter.sol | predict | yes | yes | no |
| src/risk/ClearingHouse.sol | risk | yes | no | no |
| src/risk/UnifiedRiskEngine.sol | risk | yes | no | no |
| src/stable/CollateralRegistry.sol | stable | yes | no | no |
| src/stable/PegStabilityModule.sol | stable | yes | no | no |
| src/stable/StabilityPool.sol | stable | yes | no | no |
| src/stable/StableUBIFeeSplitter.sol | stable | yes | yes | no |
| src/stable/VaultManager.sol | stable | yes | no | no |
| src/stable/gUSD.sol | stable | yes | no | no |
| src/stable/interfaces/IGoodStable.sol | stable | n/a | n/a | n/a |
| src/stocks/CollateralVault.sol | stocks | yes | no | no |
| src/stocks/PriceOracle.sol | stocks | yes | no | no |
| src/stocks/StockAMM.sol | stocks | yes | no | no |
| src/stocks/StocksUBIFeeSplitter.sol | stocks | yes | yes | no |
| src/stocks/SyntheticAsset.sol | stocks | yes | no | no |
| src/stocks/SyntheticAssetFactory.sol | stocks | yes | no | no |
| src/swap/GoodSwapRouter.sol | swap | yes | no | no |
| src/swap/LiFiBridgeAggregator.sol | swap | yes | no | no |
| src/swap/LimitOrderBook.sol | swap | yes | no | no |
| src/yield/GoodVault.sol | yield | yes | no | no |
| src/yield/VaultFactory.sol | yield | yes | no | no |
| src/yield/strategies/LendingStrategy.sol | yield | yes | no | no |
| src/yield/strategies/StablecoinStrategy.sol | yield | yes | no | no |

**Reconciliation (Section 2B):**

- Row count: **69** (matches `find src -name '*.sol' -type f | wc -l`).
- Rows with `Has invariant tests? = yes`: **2** (`UBIFeeSplitter`,
  `MarginVault`) — equals `grep -l 'function invariant_' test/...` count.
- Rows with `Has fuzz tests? = yes`: **12** (`Counter`, `TestRegistry`,
  `UBIClaimV2`, `UBIFeeSplitter`, `UBIRevenueTracker`, `UBIFeeHook`,
  `MarginVault`, `PerpEngine`, `PerpUBIFeeSplitter`,
  `PredictUBIFeeSplitter`, `StableUBIFeeSplitter`,
  `StocksUBIFeeSplitter`). This is `≥ 10` (the fuzz-file count) and
  `≤` the unique-contract upper bound implied by integration fuzz files
  (which touch many additional contracts not credited above to keep the
  signal honest).
- Interface-only files marked `n/a` (8 such rows: 4 in
  `src/interfaces/` plus 1 in `src/stable/interfaces/` — total 5
  interface files marked `n/a`).

---

## Section 3 — Gap analysis & prioritization

Five highest-priority contracts that handle user funds or critical
protocol state but have **no fuzz and no invariant coverage today**.
Cross-link: see the "Risk-ranked watchlist" and "Watchlist for the
synthetic-stocks rollout" sections of
[`docs/security/CONTRACT-PROVENANCE.md`](./CONTRACT-PROVENANCE.md) for
the broader prioritization context.

### 3.1 `src/lending/GoodLendPool.sol`

Borrow/repay/liquidate engine; holds collateral and debt accounting for
the entire lending stack. Today exercised only by unit tests in
`test/GoodLend.t.sol` and `test/GoodPool.t.sol`. **Proposed invariants
(prose):** total accounted debt ≤ total accounted collateral × oracle
LTV at all times; for every liquidated borrower, post-liquidation
health factor ≥ 1.0 within one block of the trigger; interest accrual
is monotonically non-decreasing per `(user, market)` pair; sum of all
GoodLendToken balances always equals the pool's recorded `totalSupply`
plus protocol fees; no path mints GoodLendTokens without a matching
underlying deposit. **Fuzz targets to add:** repay flows under partial
balances and rounding-down edge cases, liquidator profitability across
oracle jitter, interest-rate jumps across utilization kinks.

### 3.2 `src/stable/VaultManager.sol`

Issues `gUSD` against collateral; the failure mode is unbacked stable
issuance — i.e. silent insolvency. Today covered only by integration
unit tests in `test/GoodStable.t.sol`. **Proposed invariants:** total
`gUSD` supply ≤ Σ(collateral value × per-collateral LTV) under the
current oracle reading; opening a vault never decreases system
collateralization ratio; closing a vault never leaves orphan debt;
`PegStabilityModule` swap never trades at a rate worse than `1.0 ± fee`
unless the system collateralization ratio breaches the documented
threshold; for every emergency-pause toggle, no state-changing entry
point succeeds while paused. **Fuzz targets to add:** sequence of
mint/burn/liquidate calls across non-zero `borrowFee`,
`liquidationPenalty`, and oracle update interleavings.

### 3.3 `src/stocks/SyntheticAssetFactory.sol` and
`src/stocks/CollateralVault.sol`

The synthetic-stocks rollout this initiative is built around. The
factory is the privileged mint surface; the vault is the per-asset
collateral keeper. Today covered only by unit tests
(`test/stocks/GoodStocks.t.sol`, `test/CollateralVault.t.sol`).
**Proposed invariants:** for every synthetic asset, `totalSupply` is
fully backed by `CollateralVault` collateral marked-to-oracle at the
configured collateralization ratio; factory deployments are
idempotent per `(symbol, oracle)` tuple; only the configured
`SyntheticAssetFactory` may call `SyntheticAsset.mint` /
`SyntheticAsset.burn`; redemption never lets a user withdraw more
collateral than their position warrants under the most recent oracle
update; `StockAMM` swap fees route to `StocksUBIFeeSplitter` such that
the fee chain's `Section 2B` integration coverage continues to hold.
**Fuzz targets to add:** mint/redeem under stale-oracle deltas, mass
liquidations during configured rebalancing windows, factory upgrade
paths (when introduced).

### 3.4 `src/risk/UnifiedRiskEngine.sol`

Cross-protocol margin/PnL aggregator. Today exercised only by unit
tests (`test/risk/UnifiedRiskEngine.t.sol`,
`test/risk/ClearingHouse.t.sol`) — no fuzz, no invariant. Because it
sees positions across `perps`, `stocks`, and (eventually) `predict`,
a logic flaw here can silently approve withdrawals that should be
blocked. **Proposed invariants:** aggregated equity is monotone in
each component when other components are held constant; total equity
across the system equals the sum of per-account equities (no creation
or destruction in aggregation); a position that the per-protocol
engine considers liquidatable is always considered at-risk by the
unified engine; no path lets `ClearingHouse` settle a trade against
collateral the unified engine does not see. **Fuzz targets to add:**
randomized sequences of cross-protocol opens/closes with oracle drift
and partial fills.

### 3.5 `src/oracle/StockOracleV2.sol`

Pyth-fed stock prices feeding `stocks`, `perps/StockPerpEngine`, and
the `lending/StockLendOracleAdapter` bridge. Today only unit-tested
(`test/oracle/StockOracleV2.t.sol`,
`test/oracle/StockOracleV2Adapter.t.sol`). Oracle staleness or
manipulation here propagates to every consumer; the SECURITY-AUDIT
"Must Fix" list explicitly flags oracle staleness checks. **Proposed
invariants:** every consumer-facing read either returns a fresh price
or reverts (no silent zero / silent stale value); the staleness
threshold for each consumer is `≥` that consumer's documented
liquidation latency budget; circuit-breaker activation propagates
synchronously to dependent contracts in the same transaction; price
deviations beyond `±N%` between consecutive blocks trigger the
configured `risk` engine path. **Fuzz targets to add:** randomized
adversarial price streams (gaps, deltas, sign flips), heartbeat
violations, and Pyth `update` race conditions with consumer reads.

---

## Section 4 — Threat-and-invariant notes per area

Exactly **13** subsections: 12 area directories plus one
`root / cross-cutting` group covering the 11 contracts at `src/*.sol`.
`src/interfaces/` is excluded (interface definitions only — see
provenance matrix).

### bridge

**Threat summary:** Cross-domain message paths (OP Stack
`L1StandardBridge`, `OptimismPortal`, `L2OutputOracle`, `SystemConfig`)
plus app-level bridges (`GoodDollarBridgeL1/L2`, `MultiChainBridge`,
`FastWithdrawalLP`). Highest blast radius in the repo: stuck/forged
withdrawals, replay across chains, missing reentrancy guards on hot
paths flagged by SECURITY-AUDIT (`OptimismPortal`, `L1StandardBridge`,
`MultiChainBridge`). Today: unit-only coverage; no fuzz, no invariant.

- Total bridged value out (L1) equals total bridged value in (L2) plus
  in-flight messages plus admin-controlled deposits.
- A finalized withdrawal cannot be re-finalized for the same
  `(messageNonce, sender, target)` triple.
- `FastWithdrawalLP` LP cannot withdraw underwater (LP underlying
  reserves ≥ pending fast-withdrawal liabilities).
- `MultiChainBridge` rate-limiter never permits more than the
  configured per-window flow regardless of caller ordering.
- `SystemConfig` config changes propagate atomically; no consumer
  reads a half-updated config inside the same block.

### governance

**Threat summary:** `GoodDAO` (governor), `GoodTimelock` (delay),
`VoteEscrowedGD` (ve-style voting power). Failure modes: proposal
front-running, weight inflation via reentrant lock/unlock, timelock
bypass via privileged role. Today: unit-only coverage.

- Sum of `VoteEscrowedGD` voting weights equals the
  contract-internal accounting total at the start and end of every
  block.
- A proposal cannot execute before its timelock ETA under any caller
  permission combination.
- `GoodDAO` quorum is monotone in total voting supply across the
  proposal lifecycle.
- Cancelling a proposal does not refund any state changes already
  applied by partial execution paths.

### hooks

**Threat summary:** `UBIFeeHook` is the Uniswap v4 hook entry point
into the UBI fee chain. Today: dedicated fuzz file
(`test/UBIFeeHook.t.sol`). No invariant. Failure modes: hook re-entry,
incorrect fee accounting under multi-swap-in-one-tx, or hook
permission drift after a pool upgrade.

- Total hook-collected fee per pool equals Σ(per-swap fee) for every
  pool over any block range.
- Hook never allows a swap to settle without paying the configured
  protocol fee bps.
- Hook callbacks are idempotent within a single pool callback context
  (no double-charge on `beforeSwap` + `afterSwap`).

### lending

**Threat summary:** `GoodLendPool` plus `DebtToken`, `GoodLendToken`,
`InterestRateModel`, `SimplePriceOracle`, `GoodLendAddressesProvider`,
`StockLendOracleAdapter`. Today: unit-only coverage. The pool itself
is the largest funds-handling contract in this area; see Section 3.1
for proposed invariants.

- Σ(DebtToken supply) = pool's tracked total borrowed at all times.
- Σ(GoodLendToken supply) = pool's tracked total deposits + accrued
  protocol fees at all times.
- `InterestRateModel` slope is non-decreasing across utilization
  kinks.
- Oracle staleness ≥ documented threshold ⇒ borrow/redeem reverts
  rather than transacts at the stale price.

### oracle

**Threat summary:** `StockOracleV2` (Pyth feed), `StockOracleV2Adapter`
(consumer-facing wrapper), `SwapPriceOracle` (TWAP / spot for `swap`).
Today: unit-only coverage. See Section 3.5 for `StockOracleV2`
proposed invariants.

- For each adapter, the price returned to a consumer is within the
  configured staleness window or the call reverts.
- For `SwapPriceOracle`, TWAP cannot be moved by more than `X%` per
  block by a single sandwich-attack-shaped trade sequence.
- Per-consumer staleness thresholds are `≥` that consumer's
  liquidation latency budget (cross-link to `risk` area).

### perps

**Threat summary:** `MarginVault`, `PerpEngine`, `FundingRate`,
`PerpPriceOracle`, `PerpUBIFeeSplitter`, `StockPerpEngine`. Today the
best-covered area: dedicated fuzz files for `MarginVault` and
`PerpEngine`, plus a `MarginVault` invariant file with a handler under
`test/handlers/`. Failure modes: under-margined positions, liquidation
griefing, funding-rate manipulation, fee-splitter under-collection.

- Σ(per-trader margin) = vault's tracked total at all times
  (already targeted by `MarginVault.invariant.t.sol`).
- Open interest long = open interest short for every active market
  (parity invariant) at the end of every block.
- For every closed position, realized PnL equals (mark − entry) ×
  size, modulo rounding, with funding payments accounted separately.
- `FundingRate` never moves further per block than the documented cap
  even under adversarial price streams.
- `PerpUBIFeeSplitter` distribution adds up to the configured shares
  (already covered indirectly by integration fuzz tests).

### predict

**Threat summary:** `ConditionalTokens`, `MarketFactory`,
`OptimisticResolver`, `PredictUBIFeeSplitter`. Today: unit-only
coverage on the core contracts plus integration fuzz coverage on the
fee splitter via `test/integration/UBIFeeIntegrationProof...`.
Failure modes: bonded resolution griefing, double-resolve, conditional
token under/over-issuance.

- Σ(outcome token supply) per question equals total collateral
  deposited at all times (CTF invariant).
- A resolved question cannot be re-resolved or re-bonded.
- `OptimisticResolver` bond escalation is monotone non-decreasing per
  dispute round.
- `PredictUBIFeeSplitter` distribution conserves value end-to-end
  (already covered by the integration fuzz path).

### risk

**Threat summary:** `ClearingHouse`, `UnifiedRiskEngine`. Today:
unit-only coverage. See Section 3.4 for `UnifiedRiskEngine` proposed
invariants.

- For every account, `UnifiedRiskEngine.health(account)` is the sum
  of per-protocol healths, weighted by configured collateral types.
- A `ClearingHouse.settle()` for a trade must update the unified
  engine's view of both counterparties in the same transaction.
- No path lets a withdrawal occur while the unified engine reports
  `health < liquidationThreshold`.

### stable

**Threat summary:** `VaultManager`, `StabilityPool`,
`PegStabilityModule`, `CollateralRegistry`, `gUSD`,
`StableUBIFeeSplitter`. Today: unit-only on core contracts; fuzz on
the fee splitter via integration. See Section 3.2 for `VaultManager`
proposed invariants. Failure modes: silent unbacked `gUSD`, PSM
breaking peg, stability pool liquidation accounting drift.

- gUSD totalSupply ≤ Σ(collateral oracle value × per-collateral LTV).
- PSM swap rate stays inside `[1 − fee, 1 + fee]` under all calls,
  except during documented emergency states.
- `StabilityPool` deposits + earnings = withdrawable balance per
  depositor at all times (no implicit dilution).
- `CollateralRegistry` add/remove never strands existing collateral.

### stocks

**Threat summary:** `SyntheticAssetFactory`, `SyntheticAsset`,
`CollateralVault`, `StockAMM`, `PriceOracle`, `StocksUBIFeeSplitter`.
Today: unit-only on core contracts; fuzz on the fee splitter via
integration. See Section 3.3 for proposed invariants on the factory
and vault. Failure modes: unauthorized mint, oracle desync between
`StockAMM` and `CollateralVault`, fee siphoning during rebalance
windows.

- Only `SyntheticAssetFactory` (or its documented role-holder) can
  call `SyntheticAsset.mint`/`burn`.
- `CollateralVault` collateral marked-to-oracle ≥ Σ(SyntheticAsset
  totalSupply × current price) × required CR.
- `StockAMM` swap fee always routes to `StocksUBIFeeSplitter`; total
  fee collected per epoch matches integration test expectations.

### swap

**Threat summary:** `GoodSwapRouter`, `LiFiBridgeAggregator`,
`LimitOrderBook` (plus the root-level `GoodSwap.sol`). Today:
unit-only coverage. Failure modes: router slippage bypass, aggregator
spoofed quote, limit-order replay, sandwich exposure on hook-mediated
swaps.

- Every router fill respects the caller's `minAmountOut` regardless
  of bridge/path choice.
- `LimitOrderBook` order ID is unique and cannot be replayed across
  fills.
- `LiFiBridgeAggregator` does not move funds beyond the
  caller-approved allowance.
- Cross-pool swap fee routing matches `UBIFeeHook` accounting (links
  this area to the `hooks` invariants).

### yield

**Threat summary:** `GoodVault`, `VaultFactory`, `LendingStrategy`,
`StablecoinStrategy`. Today: unit-only coverage. Failure modes:
share-price manipulation during deposit/withdraw race, strategy
losses silently socialized, factory misconfiguration.

- Share price `pricePerShare` is monotone non-decreasing absent
  realized strategy loss; on realized loss the change is reflected
  atomically in the same block.
- `VaultFactory` deployments are deterministic per `(asset, strategy,
  salt)` and cannot collide.
- Strategies cannot withdraw more underlying than the vault recorded
  as deployed to that strategy.
- Σ(per-user shares) = vault.totalSupply at all times.

### root / cross-cutting

**Threat summary:** 11 contracts directly under `src/`: `AgentRegistry`,
`Counter`, `GoodDollarToken`, `GoodDollarTokenSecure`, `GoodSwap`,
`TestRegistry`, `UBIClaimV2`, `UBIFeeSplitter`, `UBIRevenueTracker`,
`ValidatorStaking`, `ValidatorStakingDevnet`. Mix of token logic
(`GoodDollarToken*`), UBI accounting (`UBIClaimV2`, `UBIFeeSplitter`,
`UBIRevenueTracker`), staking (`ValidatorStaking*`), and registries.
Today: `UBIFeeSplitter` has dedicated invariant + fuzz coverage;
`UBIRevenueTracker`, `UBIClaimV2`, `Counter`, and `TestRegistry` have
fuzz coverage; the rest are unit-only.

- `GoodDollarTokenSecure` ERC-20 invariants (totalSupply = Σ
  balances; transfer conserves balance; allowance never goes
  negative) hold under sequenced approvals + permit + transferFrom.
- `UBIClaimV2` per-user claimed total monotonically increases and
  cannot exceed the schedule maximum.
- `UBIRevenueTracker` accumulator equals Σ inputs from upstream
  splitters across blocks (cross-link to integration UBI fuzz).
- `UBIFeeSplitter` distribution shares sum to 100 % and are conserved
  across all push paths (already targeted by
  `UBIFeeSplitter.invariant.t.sol`).
- `ValidatorStaking` total stake equals Σ per-validator stake and
  cannot drift via slash/withdraw races.
- `AgentRegistry` cannot register the same agent twice for the same
  scope; deregistration is monotone.
- `ValidatorStakingDevnet` is devnet-only: should never appear in a
  mainnet deployment manifest. **No test coverage today** — flagged
  in Section 2B.

---

## Section 5 — How to run

Copy-paste-able commands. Replace tool-availability fallbacks with the
actual versions captured in Section 1.

### Foundry — fuzz

```bash
forge test --match-test testFuzz_
```

### Foundry — invariant

```bash
forge test --match-test invariant_
```

### Foundry — coverage (uses `--ir-minimum` workaround)

```bash
forge coverage --ir-minimum --report summary
forge coverage --ir-minimum --report lcov
```

### Slither

```bash
slither . --config-file slither.config.json
```

### Drift-detection helper

```bash
bash scripts/security/build-testing-plan-tables.sh
```

Prints the four headline totals
(`src_sol_count`, `test_sol_count`, `invariant_files_count`,
`fuzz_files_count`). Exit code `0` on success. Use after any change
under `src/` or `test/` to detect doc drift before opening a PR.

### Re-running this doc's verification grep checks

```bash
test -f docs/security/TESTING-PLAN.md && echo "exists"
grep -c '^| test/' docs/security/TESTING-PLAN.md           # ≥ 58
grep -c '^| src/' docs/security/TESTING-PLAN.md            # ≥ 69
awk '/^## Section 4/{flag=1;next} /^## /{flag=0} flag && /^### /' \
  docs/security/TESTING-PLAN.md | wc -l                    # = 13
```

---

## Section 6 — Open questions / human-approval gates

These are explicit asks of a human reviewer before the next iteration
extends or pins anything described above.

1. **Net-new invariants under `test/`** — The lane forbids net-new
   *production* Solidity under `src/`; however, the lane is specifically
   chartered to grow the test suite. Confirm that writing the prose
   invariants in Section 3 as concrete `invariant_*` harnesses under
   `test/` is in-scope for follow-up iterations. Default reading: yes.

2. **Pinning `[fuzz]` / `[invariant]` blocks in `foundry.toml`** —
   Section 1.2 documents that no such blocks exist. A separate small
   task should pin them so that fuzz/invariant runs are reproducible
   (`fuzz.seed`, `fuzz.runs`, `invariant.runs`, `invariant.depth`).
   Defer to human approval because changing the runner's defaults can
   change CI duration and CI green-status semantics in flight.

3. **Coverage refresh cadence** — The 68.66 % figure in Section 1.3 is
   stale (it predates this commit). Should the next iteration re-run
   `forge coverage --ir-minimum --report lcov`, attach the
   timestamped summary under `docs/security/iter-N/`, and refresh
   Section 1.3?

4. **Treatment of `ValidatorStakingDevnet.sol`** — Section 4 (`root /
   cross-cutting`) flags it as devnet-only and uncovered. Either: (a)
   document a deployment-time exclusion list that explicitly removes
   devnet-only contracts from mainnet manifests; or (b) add minimal
   unit coverage so it stops being an audit blind spot. Picking is a
   product call.

5. **Integration fuzz attribution** — Section 2B credits
   `UBIClaimV2`, `PerpUBIFeeSplitter`, `PredictUBIFeeSplitter`,
   `StableUBIFeeSplitter`, and `StocksUBIFeeSplitter` with fuzz
   coverage via integration fuzz files. If a human reviewer prefers a
   stricter definition (`testFuzz_` directly on the contract under
   test), drop those five back to `no` and the dedicated-fuzz count
   collapses to 7. The current liberal count keeps the lower-bound
   acceptance criterion (`≥ 10`) satisfied either way thanks to the
   `UBIFeeSplitter` invariant file also containing `testFuzz_`.

---

*Generated by lane d, iter #2. Drift-detect with
`scripts/security/build-testing-plan-tables.sh`. Sibling docs:
`docs/SLITHER-REPORT.md`, `docs/security/CONTRACT-PROVENANCE.md`.*
