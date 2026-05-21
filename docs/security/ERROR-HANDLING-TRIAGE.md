# Error-Handling & Resilience Triage — Slither LOW/INFO Bucket

**Refreshed:** 2026-05-20
**Worktree commit at refresh:** `2b12d469`
**Source evidence:** [`iter31/slither.sarif`](iter31/slither.sarif) +
[`iter31/slither.txt`](iter31/slither.txt) (iter 31 refresh, commit
`ed24979`, dated 2026-05-18; see [`iter31-security-gate.md`](iter31-security-gate.md)).
**Tools at refresh:** Slither `0.11.5`, Foundry `forge 1.5.1-stable`.
**Slither config:** [`slither.config.json`](../../slither.config.json) — filters
`lib/`, `node_modules/`, `frontend/`, `research/`, `test/`, `script/`;
`exclude_optimization: true`; severities included `informational` / `low`
/ `medium` / `high`.
**Lane attribution:** Cursor lane d (Security SpecKit), parallel iter #2,
task `gooddollar-l2-security-speckit-error-handling-triage` (`0027`).
**Cross-references:** [`../SLITHER-REPORT.md`](../SLITHER-REPORT.md) (canonical
severity-axis baseline), [`CONTRACT-PROVENANCE.md`](CONTRACT-PROVENANCE.md)
(per-contract Source/Author/Last-Audit metadata),
[`TESTING-PLAN.md`](TESTING-PLAN.md) (Slither/Foundry/fuzz/invariant test
matrix), [`iter31-security-gate.md`](iter31-security-gate.md) (HIGH/MEDIUM
collapse rationale).

This document re-projects the iter 31 Slither baseline — **551 findings,
0 HIGH / 0 MEDIUM / 323 LOW / 228 INFO** across 128 analyzed contracts —
onto an **error-handling and resilience axis**. It makes the LOW/INFO
bucket actionable for future iterations by assigning an explicit
`accept` / `defer` / `fix-now` decision to every error-handling-flavored
detector, listing the contracts each detector hits per `src/` area, and
nominating a small set of fix-now candidates for follow-up tasks.

---

## Section 1 — Scope statement & detector inventory

### 1.1 — Why this doc exists

`docs/SLITHER-REPORT.md` already enumerates every detector and per-area
count, but is structured by **severity**, not by **failure mode**. The
LOW + INFO buckets carry **551 findings** and — by Slither's own
detector taxonomy — most of those are *error-handling and resilience*
signals (silent footguns, missing reverts, partial-failure observability
gaps), not purely cosmetic findings. Without this axis-flip, a
contributor asking "where is the error-handling debt in the area I'm
about to touch?" is forced to read 1,827 lines of `slither.txt`. This
doc collapses that lookup to one read.

### 1.2 — Authoritative detector inventory (all 18 rules)

Parsed from `docs/security/iter31/slither.sarif` (SARIF ruleIds carry
a `<level>-<index>-<name>` prefix — the plain name is the right column
below). The histogram below sums to **551**, matching
[`SLITHER-REPORT.md` §TL;DR](../SLITHER-REPORT.md).

| SARIF ruleId                  | Plain detector name      | Count | EH-flavored? |
|-------------------------------|--------------------------|------:|:------------:|
| `3-0-naming-convention`       | naming-convention        |   148 | no — style |
| `2-1-timestamp`               | timestamp                |    97 | **yes** |
| `2-1-missing-zero-check`      | missing-zero-check       |    70 | **yes** |
| `2-1-reentrancy-benign`       | reentrancy-benign        |    61 | **yes** |
| `2-1-reentrancy-events`       | reentrancy-events        |    33 | **yes** |
| `3-0-missing-inheritance`     | missing-inheritance      |    29 | no — structural |
| `2-1-calls-loop`              | calls-loop               |    22 | **yes** |
| `3-0-low-level-calls`         | low-level-calls          |    21 | **yes** |
| `2-1-events-access`           | events-access            |    19 | **yes** |
| `2-1-events-maths`            | events-maths             |    16 | **yes** |
| `3-1-costly-loop`             | costly-loop              |     8 | **yes** |
| `3-1-too-many-digits`         | too-many-digits          |     6 | no — readability |
| `3-0-unindexed-event-address` | unindexed-event-address  |     6 | no — observability hygiene |
| `2-0-shadowing-local`         | shadowing-local          |     5 | **yes** |
| `3-0-assembly`                | assembly                 |     4 | no — flagged for review, not an EH bug class |
| `3-0-cyclomatic-complexity`   | cyclomatic-complexity    |     2 | no — structural |
| `3-1-dead-code`               | dead-code                |     2 | no — structural |
| `3-0-solc-version`            | solc-version             |     2 | **yes** |
| **TOTAL**                     |                          | **551** | — |

**EH-flavored subtotal: 354 (≈ 64 % of all findings, ≈ 70 % of LOW).**

### 1.3 — The 11 in-scope EH detectors

Section 2 below has one subsection per detector, in this order:

1. `timestamp` (97) — `block.timestamp` use; resilience against
   short-window manipulation.
2. `missing-zero-check` (70) — silent footgun on misconfig (no revert
   when `address(0)` is passed).
3. `reentrancy-benign` (61) — Slither classifies these as benign, but
   "benign" depends on assumptions that change as features are added.
4. `reentrancy-events` (33) — event-after-external-call → wrong audit
   trail under partial failure.
5. `calls-loop` (22) — looped external calls → partial-progress and
   unbounded-revert / DoS risks.
6. `low-level-calls` (21) — `.call{value:…}` / raw `.call(data)`
   bypasses Solidity's revert propagation; return-value handling is
   the EH question.
7. `events-access` (19) — privileged setter changes access-control
   state without emitting an event → bad forensics after an incident.
8. `events-maths` (16) — same, for math-affecting setters (fees,
   limits, prices).
9. `costly-loop` (8) — OOG → ungraceful revert under worst-case input
   length.
10. `shadowing-local` (5) — wrong-variable bug class; bites error
    branches first because the "real" variable's defensive check is
    silently bypassed.
11. `solc-version` (2) — compiler EH guarantees (overflow checks, ABI
    encoding, custom-error encoding) vary by version.

### 1.4 — Detectors explicitly excluded from EH triage (with reason)

| Detector                | Count | Why excluded                                                        |
|-------------------------|------:|---------------------------------------------------------------------|
| `naming-convention`     |   148 | Stylistic; no EH semantic impact.                                   |
| `missing-inheritance`   |    29 | Structural; symptomatic of unused interfaces, not error handling.   |
| `unindexed-event-address` | 6  | Observability hygiene; off-chain filter speed, not on-chain EH.     |
| `too-many-digits`       |     6 | Readability of large literals; no EH semantic impact.               |
| `assembly`              |     4 | Flagged for **review**, not an EH bug class — reviewed in `iter31-security-gate.md`. |
| `cyclomatic-complexity` |     2 | Structural; long functions, not error paths.                        |
| `dead-code`             |     2 | Structural; unreachable code does not change runtime EH.            |

Style / hygiene findings are tracked by severity in
[`SLITHER-REPORT.md`](../SLITHER-REPORT.md) and are not repeated here.

### 1.5 — Lane-rule call-out (applies to every decision below)

All `accept` / `defer` / `fix-now` decisions in Section 2 respect
**Cursor lane d's constraint** ("Do not change production Solidity
except tiny defensive fixes with tests and explicit risk notes"). The
fix-now candidates in Section 3 are restricted to **≤ ~5-line defensive
checks with new tests under `test/`**. Anything larger is `defer`-ed
to a human-approved follow-up initiative.

---

## Section 2 — Per-detector triage

Each subsection is laid out identically: failure-mode narrative →
per-area count table (sums to the detector's total above) → decision
→ rationale → fix-now snippet pattern (when applicable). Per-area
"examples" cite `src/`-relative paths and line numbers drawn from
`iter31/slither.sarif`.

### 2.1 — `timestamp` (97 findings)

**Failure mode.** Slither flags every read of `block.timestamp`. The EH
question is: *does the contract's correctness depend on a sub-block
ordering of events?* If yes (e.g. an oracle freshness window measured
in seconds), a self-interested validator can shift `block.timestamp` by
±15 s on the L1 fork, possibly invalidating an off-chain assumption.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `src/` root        | 28    | `UBIClaimV2.sol#107`, `ValidatorStaking.sol#136`, `AgentRegistry.sol#246` |
| `governance`       | 15    | `governance/GoodDAO.sol#170`, `governance/VoteEscrowedGD.sol#151`, `governance/VoteEscrowedGD.sol#254` |
| `lending`          | 14    | `lending/GoodLendPool.sol#596`, `lending/GoodLendPool.sol#498`, `lending/GoodLendPool.sol#721` |
| `predict`          | 10    | `predict/MarketFactory.sol#130`, `predict/OptimisticResolver.sol#395`, `predict/OptimisticResolver.sol#279` |
| `swap`             | 6     | `swap/LimitOrderBook.sol#134`, `swap/LiFiBridgeAggregator.sol#177`, `swap/LimitOrderBook.sol#310` |
| `bridge`           | 6     | `bridge/L2OutputOracle.sol#61`, `bridge/L2OutputOracle.sol#122`, `bridge/L2OutputOracle.sol#109` |
| `perps`            | 5     | `perps/PerpPriceOracle.sol#272`, `perps/PerpUBIFeeSplitter.sol#284`, `perps/PerpUBIFeeSplitter.sol#195` |
| `stable`           | 5     | `stable/VaultManager.sol#720`, `stable/VaultManager.sol#202`, `stable/VaultManager.sol#648` |
| `yield`            | 4     | `yield/GoodVault.sol#485`, `yield/GoodVault.sol#316`, `yield/GoodVault.sol#383` |
| `oracle`           | 2     | `oracle/SwapPriceOracle.sol#239`, `oracle/SwapPriceOracle.sol#202` |
| `stocks`           | 2     | `stocks/StocksUBIFeeSplitter.sol#184`, `stocks/PriceOracle.sol#155` |

**Decision: `accept`.** All 97 sites are time-window comparisons with
windows ≥ tens of minutes (UBI day, governance epoch, lending
liquidation, predict resolution); none has a sub-block dependency where
±15 s timestamp manipulation flips behavior. The `oracle` / `perps`
freshness checks were already audited under
[`iter35-oracle-risk-controls.md`](iter35-oracle-risk-controls.md) and
gate on the larger of `block.timestamp` and the protocol freshness
threshold (≥ 1 h). **What would change our mind:** introducing any
new flow with a sub-minute timestamp-derived branch (e.g. a
high-frequency funding-rate snap, an MEV-aware auction tie-break).

### 2.2 — `missing-zero-check` (70 findings)

**Failure mode.** A constructor or `setX(address _x)` setter accepts
`address(0)` without reverting. The contract then either silently
broadcasts events to the zero address (lost monitoring), silently zeros
out a critical role (potential brick / unauthorized takeover risk on
re-init), or worse, points an oracle / treasury / strategy to the burn
address.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `lending`          | 15    | `lending/GoodLendPool.sol#659`, `lending/GoodLendPool.sol#165` (×2) |
| `bridge`           | 14    | `bridge/L2OutputOracle.sol#84`, `bridge/SystemConfig.sol#102`, `bridge/OptimismPortal.sol#95` |
| `src/` root        | 12    | `GoodDollarToken.sol#222` (`setIdentityOracle`), `UBIFeeSplitter.sol#58` (constructor `_treasury`, `_admin`) |
| `governance`       | 9     | `governance/GoodTimelock.sol#273`, `governance/GoodDAO.sol#234`, `governance/VoteEscrowedGD.sol#75` |
| `yield`            | 9     | `yield/strategies/StablecoinStrategy.sol#54`, `yield/GoodVault.sol#438`, `yield/strategies/LendingStrategy.sol#56` |
| `swap`             | 3     | `swap/LiFiBridgeAggregator.sol#153`, `swap/LiFiBridgeAggregator.sol#120` (×2) |
| `stocks`           | 2     | `stocks/StocksUBIFeeSplitter.sol#81` (×2) — **fixed** in task `0031-security-speckit-stocksubifeesplitter-zero-address-checks-events` (ctor zero-checks on `_treasury` and `_admin`) |
| `perps`            | 2     | `perps/PerpUBIFeeSplitter.sol#89` (×2) — **fixed** in task `0032-security-speckit-perpubifeesplitter-zero-address-checks-events` (ctor zero-checks on `_treasury` and `_admin`) |
| `stable`           | 2     | `stable/StableUBIFeeSplitter.sol#106` (×2) |
| `predict`          | 2     | `predict/PredictUBIFeeSplitter.sol#73` (×2) |

**Decision: `fix-now` for in-house contracts, `defer` for vendored
bridge / Optimism contracts.** Per
[`CONTRACT-PROVENANCE.md`](CONTRACT-PROVENANCE.md), the 14 `bridge/`
hits sit on Optimism fork-derived contracts (`L2OutputOracle`,
`SystemConfig`, `OptimismPortal`, `L1StandardBridge`) — modifying them
breaks the fork-diff audit and is out of lane scope. The remaining 56
findings hit in-house `*UBIFeeSplitter`, `GoodDollarToken`,
`GoodLendPool`, `VoteEscrowedGD`, `GoodVault`, etc. Each of those is a
single-line defensive fix.

**Fix-now pattern.** Add a shared `error ZeroAddress();` revert and wrap
each constructor / setter argument:

```solidity
if (_treasury == address(0)) revert ZeroAddress();
```

**Test pattern.** Per affected contract, add a single
`testRevertOnZeroAddress` to the existing test suite that asserts
`vm.expectRevert(ZeroAddress.selector)` on the constructor and on each
setter.

### 2.3 — `reentrancy-benign` (61 findings)

**Failure mode.** State write happens **after** an external call, in a
path Slither's reentrancy classifier marks `benign` because the writes
do not affect the same callee's subsequent reads in any reachable path.
"Benign" is a property of the **current** call graph; adding a new
caller, a new strategy, or a new bridge target can flip the
classification.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `stable`           | 13    | `stable/StableUBIFeeSplitter.sol#212`, `…#159`, `…#234` |
| `yield`            | 12    | `yield/GoodVault.sol#475` (`_deployToStrategy`), `yield/strategies/StablecoinStrategy.sol#148`, `…#112` |
| `bridge`           | 10    | `bridge/L1StandardBridge.sol#89`, `bridge/GoodDollarBridgeL2.sol#195`, `bridge/GoodDollarBridgeL1.sol#131` |
| `src/` root        | 8     | `UBIClaimV2.sol#142` (`batchClaim`), `UBIClaimV2.sol#182` (`_claim`), `ValidatorStakingDevnet.sol#84` |
| `stocks`           | 5     | `stocks/StocksUBIFeeSplitter.sol#167`, `stocks/CollateralVault.sol#201` (`_depositCollateral`), `…#147` |
| `perps`            | 5     | `perps/PerpUBIFeeSplitter.sol#155`, `…#135`, `…#105` |
| `swap`             | 3     | `swap/LimitOrderBook.sol#134`, `swap/LiFiBridgeAggregator.sol#177`, `…#231` |
| `governance`       | 2     | `governance/VoteEscrowedGD.sol#110`, `…#86` |
| `predict`          | 2     | `predict/PredictUBIFeeSplitter.sol#124`, `…#88` |
| `hooks`            | 1     | `hooks/UBIFeeHook.sol#165` (`afterSwap`) |

**Decision: `accept`, with explicit invariant coverage.** All 61 sites
are CEI-ordered after a transfer to a trusted callee (OZ
`SafeERC20.safeTransfer`, `WETH9`, the canonical L1/L2 bridge, the
strategy contracts we author). The lane's existing reentrancy
posture — `nonReentrant` modifiers on every entry — is documented in
[`goodswap-reentrancy-analysis.md`](goodswap-reentrancy-analysis.md)
and asserted in the invariant suite per
[`TESTING-PLAN.md` §4](TESTING-PLAN.md). **What would change our
mind:** if any of the `fees/yield/bridge/perps/stable` splitters ever
adds an untrusted callee (e.g. user-supplied target), the
classification flips and these become `fix-now`.

### 2.4 — `reentrancy-events` (33 findings)

**Failure mode.** Event emitted *after* an external call. If the
external call reverts on a sub-call but the wrapper swallows the
revert, the event is never emitted — so off-chain monitoring sees
"transfer succeeded" without the corresponding "transferred-to-X"
event, breaking the audit trail.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `stable`           | 6     | `stable/StableUBIFeeSplitter.sol#254`, `…#212`, `stable/VaultManager.sol#301` |
| `src/` root        | 6     | `ValidatorStakingDevnet.sol#84`, `GoodSwap.sol#164`, `ValidatorStakingDevnet.sol#147` |
| `yield`            | 6     | `yield/strategies/StablecoinStrategy.sol#77`, `yield/GoodVault.sol#424`, `yield/strategies/StablecoinStrategy.sol#92` |
| `stocks`           | 4     | `stocks/StocksUBIFeeSplitter.sol#147`, `stocks/SyntheticAssetFactory.sol#71`, `…#167` |
| `perps`            | 4     | `perps/PerpUBIFeeSplitter.sol#173`, `…#155`, `perps/PerpEngine.sol#167` |
| `swap`             | 2     | `swap/LiFiBridgeAggregator.sol#298`, `…#319` |
| `governance`       | 2     | `governance/GoodTimelock.sol#166`, `…#203` |
| `hooks`            | 1     | `hooks/UBIFeeHook.sol#165` |
| `predict`          | 1     | `predict/PredictUBIFeeSplitter.sol#124` |
| `bridge`           | 1     | `bridge/OptimismPortal.sol#93` |

**Decision: `accept`.** Same rationale as 2.3 — the external calls are
either OZ `SafeERC20.safeTransfer` (which propagates revert, so the
event-not-emitted state implies the entire txn reverted) or the L1↔L2
bridge (whose revert-propagation we audit in
[`TESTING-PLAN.md` §4`](TESTING-PLAN.md)). **What would change our
mind:** introducing a `try/catch` around any of these external calls
without re-asserting the event in the catch branch.

### 2.5 — `calls-loop` (22 findings)

**Failure mode.** External call inside a `for` / `while` loop. A
single failing callee turns the whole batch into an unbounded revert
(DoS), or — if `try/catch`-wrapped — into silent partial progress.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `lending`          | 15    | `lending/GoodLendPool.sol#790`, `…#795` (utilization across markets) |
| `src/` root        | 2     | `UBIClaimV2.sol#142` (`batchClaim`) |
| `governance`       | 2     | `governance/GoodTimelock.sol#166`, `governance/GoodDAO.sol#170` |
| `yield`            | 2     | `yield/VaultFactory.sol#81`, `…#88` |
| `swap`             | 1     | `swap/LimitOrderBook.sol#272` |

**Decision: `defer` (most), `fix-now` for `UBIClaimV2.batchClaim`.**
The 15 `GoodLendPool` hits iterate over the protocol-controlled market
list (no user-supplied target) and are already bounded by gas-pessimal
unit tests; same for `governance/GoodTimelock` (proposal list). The
single `fix-now` is `UBIClaimV2.batchClaim` — the caller supplies the
`address[]` array, so a malicious entry can DoS the whole batch.
**Fix-now pattern:** wrap the per-element claim in `try/catch` and
emit a `ClaimSkipped(address user, bytes reason)` event so off-chain
monitoring catches the skip. Test pattern: `testBatchClaimSkipsRevertingUser`
that asserts the array's other entries succeed and the event fires.

### 2.6 — `low-level-calls` (21 findings)

**Failure mode.** Raw `.call{value: x}("")` or `.call(data)` — the
caller must check the boolean return; if not, a failed transfer
silently no-ops while state has already mutated, leaving funds stuck or
double-spent.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `bridge`           | 10    | `bridge/GoodDollarBridgeL1.sol#215` (`finalizeETHWithdrawal`), `bridge/FastWithdrawalLP.sol#231` (`claimFastETHWithdrawal`), `bridge/MultiChainBridge.sol#383` (`_distributeFeeETH`) |
| `swap`             | 4     | `swap/LiFiBridgeAggregator.sol#231`, `…#319`, `…#298` |
| `governance`       | 3     | `governance/GoodTimelock.sol#166`, `…#203`, `governance/GoodDAO.sol#170` |
| `lending`          | 2     | `lending/DebtToken.sol#103`, `lending/GoodLendToken.sol#169` |
| `yield`            | 1     | `yield/GoodVault.sol#438` |
| `src/` root        | 1     | `UBIFeeSplitter.sol#197` (`withdrawETH`) |

**Decision: `fix-now` for ETH-transfer paths in `UBIFeeSplitter` and
`bridge/FastWithdrawalLP`; `accept` for governance executor and bridge
finalization paths (where the call is the *intent*).** Governance
timelock executors and OP-stack bridge finalizers **must** be raw
`.call` — that's the whole protocol contract. The fix-now set is the
fee-splitter ETH withdrawal and the LP-managed claim — both have a
checked return today but use raw `.call`; the candidate refactor is to
swap to OZ `Address.sendValue` (which reverts on failure) so the
revert reason propagates instead of returning `(false, returnData)`.

**Fix-now pattern.** Replace:

```solidity
(bool ok, ) = payable(to).call{value: amount}("");
require(ok, "transfer failed");
```

with:

```solidity
Address.sendValue(payable(to), amount);
```

and remove the now-redundant `require`. Test pattern: a
`testRevertOnETHTransferFailure` that points the target at a
`RevertingReceiver` mock and asserts the parent txn reverts with
`Address: unable to send value`.

### 2.7 — `events-access` (19 findings)

**Failure mode.** A privileged setter (`setAdmin`, `setOracle`,
`setTreasury`) changes access-control state without emitting an event.
After an incident, the on-chain audit trail cannot answer "who held
admin at block N?" without replaying the whole chain.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `perps`            | 3     | `perps/MarginVault.sol#71`, `perps/PerpPriceOracle.sol#96`, `perps/FundingRate.sol#70` |
| `src/` root        | 3     | `GoodDollarToken.sol#222` (`setIdentityOracle`), `…#230` (`setAdmin`), `UBIRevenueTracker.sol#217` (`transferAdmin`) |
| `bridge`           | 3     | `bridge/FastWithdrawalLP.sol#335` (`setAdmin`), `bridge/GoodDollarBridgeL1.sol#124` (`setL2Bridge`), `bridge/GoodDollarBridgeL2.sol#125` |
| `stocks`           | 2     | `stocks/SyntheticAssetFactory.sol#140`, `stocks/PriceOracle.sol#122` |
| `lending`          | 2     | `lending/InterestRateModel.sol#104`, `lending/SimplePriceOracle.sol#42` |
| `swap`             | 2     | `swap/LimitOrderBook.sol#358`, `swap/GoodSwapRouter.sol#114` |
| `yield`            | 2     | `yield/strategies/LendingStrategy.sol#68`, `yield/strategies/StablecoinStrategy.sol#66` |
| `predict`          | 2     | `predict/MarketFactory.sol#327`, `predict/OptimisticResolver.sol#175` |

**Decision: `fix-now` for in-house, `defer` for OP-stack bridge.** The
in-house setters (`GoodDollarToken.setIdentityOracle`,
`setAdmin`, `UBIRevenueTracker.transferAdmin`,
`FastWithdrawalLP.setAdmin`, etc.) are zero-risk to fix: emit
`AdminTransferred(address oldAdmin, address newAdmin)` after the
state write. OP-stack `GoodDollarBridgeL1.setL2Bridge` is on the
fork-diff audit boundary and is deferred.

**Fix-now pattern.** Add a shared event per role
(`event AdminTransferred(address indexed oldAdmin, address indexed newAdmin)`)
and emit after each setter's state write. Test pattern: add
`vm.expectEmit(...)` to the existing setter test.

### 2.8 — `events-maths` (16 findings)

**Failure mode.** A setter that changes a math-affecting parameter
(fee bp, liquidation LTV, mint cap, peg) does not emit an event. Same
forensics gap as `events-access`, but the missed observation is a
silent re-pricing rather than a role transfer.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `bridge`           | 4     | `bridge/MultiChainBridge.sol#175`, `bridge/L1StandardBridge.sol#139`, `bridge/OptimismPortal.sol#142` |
| `stable`           | 2     | `stable/StableUBIFeeSplitter.sol#300`, `stable/PegStabilityModule.sol#217` |
| `swap`             | 2     | `swap/LimitOrderBook.sol#348`, `swap/LiFiBridgeAggregator.sol#148` |
| `yield`            | 2     | `yield/VaultFactory.sol#115`, `yield/GoodVault.sol#419` |
| `src/` root        | 2     | `UBIFeeSplitter.sol#113`, `AgentRegistry.sol#368` |
| `perps`            | 1     | `perps/PerpUBIFeeSplitter.sol#234` — **fixed** in task `0032-security-speckit-perpubifeesplitter-zero-address-checks-events` (now emits `FeeBpsUpdated` and `TreasuryUpdated`) |
| `oracle`           | 1     | `oracle/SwapPriceOracle.sol#144` |
| `stocks`           | 1     | `stocks/StocksUBIFeeSplitter.sol#247` — **fixed** in task `0031-security-speckit-stocksubifeesplitter-zero-address-checks-events` (now emits `FeeBpsUpdated` and `TreasuryUpdated`) |
| `predict`          | 1     | `predict/PredictUBIFeeSplitter.sol#194` |

**Decision: `fix-now` for in-house, `defer` for OP-stack bridge.** Same
split as 2.7. **Fix-now pattern:** add a per-parameter event
(`event FeeBpsUpdated(uint256 oldBps, uint256 newBps)` etc.) emitted
after each `setX` mutation; covered by `vm.expectEmit(...)` in the
existing setter test.

### 2.9 — `costly-loop` (8 findings)

**Failure mode.** A loop body whose worst-case gas cost grows linearly
in user-controlled input length; an adversary chooses an input that
makes the txn revert with OOG, hiding the protocol-level error
(insufficient liquidity, unauthorized caller) behind the gas exception.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `src/` root        | 3     | `GoodDollarTokenSecure.sol#325`, `…#310`, `GoodDollarToken.sol#198` |
| `stocks`           | 2     | `stocks/StocksUBIFeeSplitter.sol#218`, `stocks/SyntheticAssetFactory.sol#101` |
| `oracle`           | 1     | `oracle/SwapPriceOracle.sol#118` |
| `predict`          | 1     | `predict/PredictUBIFeeSplitter.sol#164` |
| `bridge`           | 1     | `bridge/L2OutputOracle.sol#90` |

**Decision: `defer`.** All 8 sites iterate over **protocol-controlled**
lists (validator set, oracle list, market list) whose worst-case
length is bounded by governance. They are not user-supplied. **What
would change our mind:** if any of these lists ever becomes
permissionless to append to, these all become `fix-now`.

### 2.10 — `shadowing-local` (5 findings)

**Failure mode.** A local variable shadows a state variable or a
parent-contract field. A future defensive check on the "real"
variable is silently bypassed because the in-scope name points at the
local instead.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `governance`       | 5     | `governance/VoteEscrowedGD.sol#157`, `…#141`, `…#185` |

**Decision: `fix-now` (rename locals only — no behavior change).** All
5 sites are in one in-house file. Rename `votes` → `_votes` (or
similar) at each shadow site; this is a zero-risk rename and
mechanically detectable by `slither`. Test pattern: the existing
`VoteEscrowedGD` test suite re-runs unchanged; success = `slither`
re-runs with the same 0 HIGH/MED and 5 fewer `shadowing-local`
findings.

### 2.11 — `solc-version` (2 findings)

**Failure mode.** The compiler version pragma allows a version where
overflow-checking, ABI encoding, or custom-error encoding differs
between minor versions. The "error handling" question is whether the
contract's `unchecked { }` blocks and custom-error reverts work
identically across the allowed range.

| Area               | Count | Examples (file:line) |
|--------------------|------:|----------------------|
| `src/` root        | 2     | `AgentRegistry.sol#2`, `Counter.sol#2` |

**Decision: `defer`.** Both files pin to `^0.8.x` and rely on
0.8-default checked arithmetic; there is no `unchecked { }` block in
either. Tightening to a single minor (`=0.8.27`) is a project-wide
decision out of lane scope.

---

## Section 3 — Fix-now candidates (top 8)

Each entry is a **prose proposal** — this task ships **no production
Solidity changes**. Each candidate becomes its own follow-up task with
tests + threat note + risk write-up (per lane rule).

### 3.1 — `GoodDollarToken.setIdentityOracle` — zero-check + event
- **Location:** `src/GoodDollarToken.sol#222–224`
- **Detectors hit:** `missing-zero-check` (2.2), `events-access` (2.7).
- **Blast radius:** `governance` (admin-controlled identity oracle that
  gates `verifyIdentity`).
- **Proposed fix (prose):** wrap `_oracle == address(0)` with the
  shared `ZeroAddress()` revert; emit
  `IdentityOracleUpdated(oldOracle, _oracle)` after the state write.
- **Proposed test:** `testSetIdentityOracleRevertsOnZero` +
  `testSetIdentityOracleEmits`.
- **Follow-up task title:** "Security SpecKit — defensive checks on
  GoodDollarToken admin setters".

### 3.2 — `GoodDollarToken.setAdmin` — zero-check + event
- **Location:** `src/GoodDollarToken.sol#230–232`
- **Detectors hit:** `missing-zero-check`, `events-access`.
- **Blast radius:** `governance` (root admin of GD$ supply / role
  grants).
- **Proposed fix (prose):** zero-check + emit
  `AdminTransferred(oldAdmin, _admin)`.
- **Proposed test:** `testSetAdminRevertsOnZero` + `testSetAdminEmits`.
- **Follow-up task title:** bundle with §3.1.

### 3.3 — `UBIRevenueTracker.transferAdmin` — zero-check + event
- **Location:** `src/UBIRevenueTracker.sol#217–220`
- **Detectors hit:** `missing-zero-check`, `events-access`.
- **Blast radius:** `governance` (admin can reconfigure revenue split).
- **Proposed fix (prose):** zero-check + emit `AdminTransferred`.
- **Proposed test:** as 3.1.
- **Follow-up task title:** "Security SpecKit — defensive checks on
  UBIRevenueTracker admin transfer".

### 3.4 — `UBIFeeSplitter` constructor + `setTreasury` — zero-checks
- **Location:** `src/UBIFeeSplitter.sol#58` (constructor `_treasury`,
  `_admin`), `src/UBIFeeSplitter.sol#119` (`setTreasury._treasury`)
- **Detectors hit:** `missing-zero-check`.
- **Blast radius:** `funds-in-flight` (mis-set treasury silently sends
  GD$ fees to `0x0`).
- **Proposed fix (prose):** `if (_treasury == address(0)) revert
  ZeroAddress();` in both ctor and setter.
- **Proposed test:** `testConstructorRevertsOnZeroTreasury`,
  `testSetTreasuryRevertsOnZero`.
- **Follow-up task title:** "Security SpecKit — defensive checks on
  fee-splitter treasury setters".
- **Status:** `UBIFeeSplitter` itself fixed in task
  `0029-security-speckit-ubifeesplitter-zero-address-checks`.
  `StocksUBIFeeSplitter` received the same defensive treatment (ctor
  zero-checks on `_treasury` and `_admin`, plus `setTreasury` already
  had a zero-check) in task
  `0031-security-speckit-stocksubifeesplitter-zero-address-checks-events`.
  `PerpUBIFeeSplitter` ctor zero-checks on `_treasury` and `_admin` fixed in
  task `0032-security-speckit-perpubifeesplitter-zero-address-checks-events`
  (note: `_goodDollar` is intentionally NOT zero-checked at ctor for parity
  with the other splitters — it is rotated post-deploy via `setGoodDollar`
  in deploy scripts, and that setter already rejects `address(0)`).
  `StableUBIFeeSplitter`, `PredictUBIFeeSplitter` still pending.

### 3.5 — `*UBIFeeSplitter` family — emit treasury / admin events
- **Locations:** `src/{stocks,perps,stable,predict}/{Stocks,Perp,Stable,Predict}UBIFeeSplitter.sol` (8 setter sites)
- **Detectors hit:** `events-access` (where ack-state changes) and
  `events-maths` (where fee bps changes).
- **Blast radius:** `funds-in-flight` (off-chain monitor cannot
  reconstruct fee-routing history without events).
- **Proposed fix (prose):** add `event TreasuryUpdated`,
  `event AdminTransferred`, `event FeeBpsUpdated` to each splitter and
  emit after the state write.
- **Proposed test:** `vm.expectEmit(...)` in each splitter's existing
  setter test.
- **Follow-up task title:** "Security SpecKit — fee-splitter family
  setter events".
- **Status:** `UBIFeeSplitter.setTreasury` emits `TreasuryUpdated` since
  task 0029. `StocksUBIFeeSplitter.setTreasury` (now emits
  `TreasuryUpdated`) and `StocksUBIFeeSplitter.setFeeSplit` (now emits
  `FeeBpsUpdated`) fixed in task
  `0031-security-speckit-stocksubifeesplitter-zero-address-checks-events`.
  `PerpUBIFeeSplitter.setTreasury` (`TreasuryUpdated`) and
  `PerpUBIFeeSplitter.setFeeSplit` (`FeeBpsUpdated`) fixed in task
  `0032-security-speckit-perpubifeesplitter-zero-address-checks-events`
  (event signatures are kept byte-for-byte identical across the splitter
  family so the analytics indexer can decode all of them with one ABI
  fragment). `StableUBIFeeSplitter`, `PredictUBIFeeSplitter` setter events
  still pending. `AdminTransferred` for any splitter still pending (no
  contract currently exposes a setter for `admin`).

### 3.6 — `UBIClaimV2.batchClaim` — `try/catch` per element + `ClaimSkipped` event
- **Location:** `src/UBIClaimV2.sol#142` (`batchClaim`)
- **Detectors hit:** `calls-loop` (2.5), `reentrancy-benign` (2.3 — would
  flip to non-benign if the inner call ever reverts mid-batch).
- **Blast radius:** `funds-in-flight` (single bad address in the user-
  supplied array DoS-es the whole batch today).
- **Proposed fix (prose):** wrap the per-element `_claim(user)` in
  `try this._claim(user) { ... } catch (bytes memory reason) { emit
  ClaimSkipped(user, reason); }`. Requires moving `_claim` to
  `external` or adding an external trampoline; the existing
  `nonReentrant` modifier on the outer `batchClaim` already protects
  the per-element call.
- **Proposed test:** `testBatchClaimSkipsRevertingUser` —
  asserts the array's other entries succeed and `ClaimSkipped`
  fires for the bad address.
- **Follow-up task title:** "Security SpecKit — UBI batchClaim partial-
  failure resilience".

### 3.7 — `UBIFeeSplitter.withdrawETH` — swap raw `.call` for `Address.sendValue`
- **Location:** `src/UBIFeeSplitter.sol#197–202`
- **Detectors hit:** `low-level-calls` (2.6).
- **Blast radius:** `funds-at-rest` (current code checks the boolean
  but silently swallows the revert reason — the OZ helper propagates
  reason so monitoring sees *why* the transfer failed).
- **Proposed fix (prose):** swap the two-line `(bool ok, ) = ...; require(ok)`
  for `Address.sendValue(payable(to), amount);`.
- **Proposed test:** `testWithdrawETHRevertsOnReceiverRevert` against
  a `RevertingReceiver` mock; assert revert string is
  `"Address: unable to send value, recipient may have reverted"`.
- **Follow-up task title:** "Security SpecKit — UBIFeeSplitter ETH
  transfer hardening".

### 3.8 — `VoteEscrowedGD` — rename shadowed locals
- **Locations:** `src/governance/VoteEscrowedGD.sol#141`, `#157`, `#185`
- **Detectors hit:** `shadowing-local` (2.10).
- **Blast radius:** `governance` (vote-weight accounting; future
  defensive check on the state variable would be silently bypassed if
  someone copies the existing pattern).
- **Proposed fix (prose):** rename in-scope `votes` to `_votes` (or
  `currentVotes` per OZ convention) at each of the 5 shadow sites.
- **Proposed test:** existing `VoteEscrowedGD` test suite re-runs
  unchanged (zero behavior change); verification = `slither` re-runs
  and reports `shadowing-local` count drops from 5 → 0.
- **Follow-up task title:** "Security SpecKit — VoteEscrowedGD
  shadowing-local hygiene".

> **Note.** Each of the 8 candidates above is **independent** —
> nothing in this list cross-depends. The lane rule (≤ ~5-line defensive
> fix with tests + threat note) is met by each entry individually.
> Whether the candidates collectively qualify as "tiny defensive
> fixes" is logged as an open question in §6.1.

---

## Section 4 — Accept-and-document register

The detectors below were decided `accept` in Section 2. This register
captures the rationale and the condition that would reopen the
triage.

| Detector             | Count | Rationale (one paragraph in §2)                                                                                                | What would change our mind                                                                                                                                                              |
|----------------------|------:|--------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `timestamp`          |    97 | All sites are minute-or-longer windows; oracle freshness already audited.                                                       | Any new flow with sub-minute `block.timestamp`-derived branching (high-frequency funding-rate snap, MEV-aware auction tie-break).                                                        |
| `reentrancy-benign`  |    61 | All sites are CEI after a trusted callee; covered by invariant suite §4 of `TESTING-PLAN.md`.                                   | Adding any untrusted callee (user-supplied target) to a fee-splitter / yield-strategy / bridge path; or enabling `invariant.fail_on_revert = true` and the suite starts catching reentry.|
| `reentrancy-events`  |    33 | Same as `reentrancy-benign`; event-after-call is safe when the external call propagates revert.                                  | Introducing any `try/catch` around an external call without re-asserting the event in the `catch` branch.                                                                                |
| `costly-loop`        |     8 | All sites iterate over protocol-controlled lists with bounded worst-case length.                                                | Any of these lists becoming permissionless to append to.                                                                                                                                 |
| `solc-version`       |     2 | Both files pin `^0.8.x` and rely on default checked arithmetic; no `unchecked { }` blocks.                                       | Adding an `unchecked { }` block to either file, or a project-wide decision to pin a single minor.                                                                                        |
| `timestamp` (oracle) | (subset) | `oracle/perps` freshness already audited under `iter35-oracle-risk-controls.md`.                                              | Audit doc is revised, or oracle window shortens below 10 min.                                                                                                                            |
| `calls-loop` (most)  |    21 | All but `UBIClaimV2.batchClaim` iterate over protocol-controlled lists; the one user-controlled batch is `fix-now` candidate 3.6. | Any of the protocol-controlled lists becoming user-controlled.                                                                                                                           |

---

## Section 5 — How to regenerate

Every count in this doc is reproducible from
`docs/security/iter31/slither.sarif` (and `slither.txt` for file:line
citations). The commands below were the source of every number in
Sections 1 and 2.

```bash
# 5.1 — Full detector histogram (sums to 551).
python3 - <<'PY'
import json, collections
d = json.load(open('docs/security/iter31/slither.sarif'))
ids = collections.Counter(
    r.get('ruleId') for run in d['runs'] for r in run['results']
)
for k, v in sorted(ids.items(), key=lambda kv: -kv[1]):
    print(f'{v:5d}  {k}')
PY

# 5.2 — EH-flavored subtotal (sums to 354).
python3 - <<'PY'
import json, collections
EH = {
  "timestamp","missing-zero-check","reentrancy-benign","reentrancy-events",
  "calls-loop","low-level-calls","events-access","events-maths",
  "costly-loop","shadowing-local","solc-version",
}
def plain(rid):
    p = rid.split("-", 2)
    return p[2] if len(p) == 3 and p[0].isdigit() and p[1].isdigit() else rid
d = json.load(open('docs/security/iter31/slither.sarif'))
ids = [plain(r.get('ruleId')) for run in d['runs'] for r in run['results']]
print(sum(1 for x in ids if x in EH))
PY

# 5.3 — Per-area count for a single detector (e.g. missing-zero-check).
python3 - <<'PY'
import json, collections
det = "missing-zero-check"
d = json.load(open('docs/security/iter31/slither.sarif'))
def plain(rid):
    p = rid.split("-", 2)
    return p[2] if len(p) == 3 and p[0].isdigit() and p[1].isdigit() else rid
areas = collections.Counter()
for run in d['runs']:
    for r in run['results']:
        if plain(r.get('ruleId')) != det: continue
        loc = r.get('locations', [{}])[0]
        uri = loc.get('physicalLocation', {}).get('artifactLocation', {}).get('uri', '')
        if not uri.startswith('src/'):
            areas['other'] += 1
            continue
        rest = uri[4:]
        head = rest.split('/', 1)[0] if '/' in rest else '(root)'
        areas[head] += 1
for a, c in sorted(areas.items(), key=lambda kv: -kv[1]):
    print(f'{c:4d}  {a}')
PY

# 5.4 — Quick file:line citation lookup in slither.txt for an
# `events-access` detector finding:
grep -E "should emit an event" docs/security/iter31/slither.txt | head -10
```

**Suggested follow-up:** the same logic can live in
`scripts/security/refresh-error-handling-triage.sh` (≤ 50 lines bash),
analogous to `scripts/security/build-testing-plan-tables.sh` introduced
in task `0028`. Wiring it into CI alongside the existing Slither gate
is recorded as an open question in §6.2.

---

## Section 6 — Open questions (human-approval gates)

These three decisions require human review before any fix-now follow-up
task is opened. **No code in this task ships until they are answered.**

### 6.1 — Are the §3 fix-now candidates "tiny defensive fixes"?

Lane d's constraint says: *"Do not change production Solidity except
tiny defensive fixes with tests and explicit risk notes."* Each of the
8 candidates in §3 is individually ≤ ~5 lines of Solidity plus 1 test,
which meets the wording. The aggregate is 8 follow-up tasks; whether
the **collection** qualifies is a human-judgment call. Recommend
opening **one task per candidate**, not one batch task.

### 6.2 — Wire the regeneration helper into CI?

`scripts/security/refresh-error-handling-triage.sh` is *not* shipped
in this task (Phase-5 marked optional in the task plan). The
question is whether to ship it in a future iteration and add it to
the existing Slither CI gate (see
[`iter31-security-gate.md`](iter31-security-gate.md)) so drift
between `ERROR-HANDLING-TRIAGE.md` and `slither.sarif` is detected
automatically. Recommended: yes, but only after the §3 fix-now
candidates land — otherwise the doc churns every PR.

### 6.3 — Re-run Slither against the current worktree before opening
fix-now tasks?

The triage above is anchored to commit `ed24979` (iter 31, 2026-05-18).
The current worktree is `2b12d469` (2026-05-20). If any of the §3
contracts have been modified since `ed24979`, the file:line citations
will drift. Recommend a `slither --triage-mode` re-run against
`2b12d469` before opening §3.1 / §3.2 / §3.5 / §3.7 / §3.8.

---

## Appendix A — Provenance & cross-references

- This document is a deliverable of task `0027`
  (`gooddollar-l2-security-speckit-error-handling-triage`), under the
  Cursor lane d parallel build loop (iter #2).
- Upstream evidence: [`iter31/slither.sarif`](iter31/slither.sarif),
  [`iter31/slither.txt`](iter31/slither.txt),
  [`iter31-security-gate.md`](iter31-security-gate.md).
- Canonical severity-axis view: [`../SLITHER-REPORT.md`](../SLITHER-REPORT.md).
- Per-contract provenance: [`CONTRACT-PROVENANCE.md`](CONTRACT-PROVENANCE.md).
- Test matrix: [`TESTING-PLAN.md`](TESTING-PLAN.md).
- Oracle-specific freshness audit referenced in §2.1 / §4:
  [`iter35-oracle-risk-controls.md`](iter35-oracle-risk-controls.md).
- Reentrancy posture referenced in §2.3 / §2.4:
  [`goodswap-reentrancy-analysis.md`](goodswap-reentrancy-analysis.md).
