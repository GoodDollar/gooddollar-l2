# Slither Security Report — GoodDollar L2

**Refreshed:** 2026-05-20
**Source evidence:** [`docs/security/iter31-security-gate.md`](security/iter31-security-gate.md) (iter31 refresh, commit `ed24979`, dated 2026-05-18)
**Tool:** Slither `v0.11.5`
**Build framework:** Foundry / `forge` `1.5.1-stable` (commit `b0a9dd9c`, 2025-12-22)
**Config:** [`slither.config.json`](../slither.config.json) — filters `lib/`, `node_modules/`, `frontend/`, `research/`, `test/`, `script/`; excludes `optimization`; includes `informational` / `low` / `medium` / `high`.
**Worktree commit at refresh:** `2d2a883`
**In-scope contract count (`src/`):** **69 `.sol` files** (verified via `find src -name '*.sol' | wc -l`).
**Slither analyzed-contract count (incl. selected `lib/` interfaces compiled through Foundry):** **128 contracts**.

---

## TL;DR

> **0 HIGH / 0 MEDIUM / 323 LOW / 228 INFORMATIONAL** — **551 total findings across 128 analyzed contracts**.
>
> Every previously-flagged HIGH/MEDIUM finding from the historical 2026-04-05 baseline has either been **fixed in production code across prior iterations** or **removed from scope by the now-canonical `slither.config.json` filter** (which excludes `lib/`, `script/`, `test/`, etc.). The rationale and per-bucket trace are documented in [`iter31-security-gate.md`](security/iter31-security-gate.md).
>
> The Foundry test suite is **green at the same commit**: [`docs/security/iter31/forge-test.txt`](security/iter31/forge-test.txt) records **1126 passed / 0 failed / 0 skipped** across 52 suites.
>
> For an error-handling and resilience view of the 354 LOW/INFO findings that fall under that axis (broken into 11 detectors, bucketed per `src/` area, with fix-now candidates and accept-and-document register), see [`docs/security/ERROR-HANDLING-TRIAGE.md`](security/ERROR-HANDLING-TRIAGE.md).

## Summary

| Severity      | Count |   Source                                                                                       |
|---------------|-------|------------------------------------------------------------------------------------------------|
| High          | **0** | [`iter31/slither.txt`](security/iter31/slither.txt) / [`iter31/slither.sarif`](security/iter31/slither.sarif) |
| Medium        | **0** | same                                                                                           |
| Low           | 323   | same                                                                                           |
| Informational | 228   | same                                                                                           |
| Optimization  | 0     | filtered by `slither.config.json` (`exclude_optimization: true`)                               |
| **TOTAL**     | **551** | —                                                                                            |

The 2026-04-05 historical baseline (30 HIGH / 148 MEDIUM / 344 LOW / 193 INFO / 32 OPT, 747 total across 110 contracts) is preserved unmodified at the bottom of this document under [Historical baseline (2026-04-05)](#historical-baseline-2026-04-05) for traceability and diff auditing.

---

## What changed since 2026-04-05

The HIGH/MEDIUM rows collapsed to zero through a combination of two effects, both documented in [`iter31-security-gate.md` §2](security/iter31-security-gate.md):

1. **Real fixes shipped in prior iterations.** Iters 26–30 of the testnet-readiness gate (and earlier security passes) closed every `arbitrary-send-erc20`, `arbitrary-send-eth`, `reentrancy-eth`, `unchecked-transfer`, and `weak-prng` finding called out in the historical baseline. See the bridge, lending, governance, swap, and yield contracts under `src/` for the audited primitives now in use (`ReentrancyGuard`, OpenZeppelin `SafeERC20`, explicit `success` checks on `.call{value:…}`).
2. **`slither.config.json` filtering reflects current scope.** The current config excludes `lib/`, `node_modules/`, `frontend/`, `research/`, `test/`, and `script/` — paths whose findings were historically counted but are not in the production contract surface. The filter list is reproduced verbatim from the live config above.

Iter 31 explicitly recommended (`§2. Comparison to project-context baseline`) that the canonical `docs/SLITHER-REPORT.md` be updated to retire the 30 HIGH / 148 MEDIUM headline. This document is that retirement.

---

## Remaining Low-impact findings (323) — per-detector evidence

All counts and contract paths below are sourced directly from [`docs/security/iter31/slither.txt`](security/iter31/slither.txt) (153 KB, 1827 lines) and cross-checked against [`docs/security/iter31/slither.sarif`](security/iter31/slither.sarif) (685 KB).

| Count | Detector                | Example contract                                                                                                              | Notes                                                                                              |
|-------|-------------------------|--------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| 97    | `timestamp`             | UBI / lending / perps / staking modules across `src/`                                                                          | `block.timestamp` used in comparisons — standard L2 pattern; PoS blocks are tightly aligned.       |
| 70    | `missing-zero-check`    | `src/GoodDollarToken.sol`, `src/bridge/FastWithdrawalLP.sol`, `src/lending/*`, `src/perps/*`, `src/predict/*`, `src/yield/*`   | Setters without `require(_addr != address(0))`. Triage candidate for the caps-and-pause sweep.     |
| 61    | `reentrancy-benign`     | `src/bridge/MultiChainBridge.sol`, `src/swap/LimitOrderBook.sol`, `src/yield/GoodVault.sol`                                    | Reentrancy without adverse external-state effect; each instance still needs a `ReentrancyGuard` review. |
| 33    | `reentrancy-events`     | `src/bridge/OptimismPortal.sol`, `src/bridge/FastWithdrawalLP.sol`, `src/swap/LimitOrderBook.sol`                              | Events emitted after external calls — cosmetic for off-chain consumers.                            |
| 22    | `calls-loop`            | bridge + swap modules                                                                                                          | External calls inside loops — gas DoS surface; fuzz-target candidate.                              |
| 19    | `events-access`         | `src/GoodDollarToken.sol::setIdentityOracle`, `src/UBIRevenueTracker.sol::transferAdmin`, `src/lending/InterestRateModel.sol::setAdmin`, `src/predict/MarketFactory.sol::setAdmin`, `src/stocks/PriceOracle.sol::setAdmin` | Access-control state changes emitted without an event — observability gap, not a vulnerability.    |
| 16    | `events-maths`          | `src/AgentRegistry.sol::setMaxAgents`, `src/UBIFeeSplitter.sol::setFeeSplit`, `src/bridge/L1StandardBridge.sol::setUBIFee`, `src/oracle/SwapPriceOracle.sol::setMaxDeviation`, `src/perps/PerpUBIFeeSplitter.sol::setFeeSplit` | Arithmetic state changes emitted without an event.                                                 |
| 5     | `shadowing-local`       | `src/governance/VoteEscrowedGD.sol` (the `delegate` local in `lock`, `increaseLock`, `extendLock`, `withdraw`, `earlyUnlock`) | Local variable shadows the `delegate(address)` function — readability only, not exploitable.       |

Full per-finding text dump: [`docs/security/iter31/slither.txt`](security/iter31/slither.txt). Programmatic / SARIF view: [`docs/security/iter31/slither.sarif`](security/iter31/slither.sarif).

---

## Remaining Informational findings (228) — per-detector evidence

| Count | Detector                  | Example contract                                                                                  | Notes                                                                                  |
|-------|---------------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| 148   | `naming-convention`       | many — `_paramName` style                                                                         | Style-only; pure mixedCase violations.                                                 |
| 29    | `missing-inheritance`     | misc.                                                                                              | Contracts implementing an interface without `is IFoo` formal declaration.              |
| 21    | `low-level-calls`         | `src/bridge/*`, `src/UBI*.sol`, `src/swap/*`, `src/governance/GoodTimelock.sol`, `src/yield/*`     | `address.call{...}` used intentionally for ETH transfer / refund / forward.            |
| 8     | `costly-loop`             | misc.                                                                                              | Storage reads inside loops.                                                            |
| 6     | `too-many-digits`         | misc.                                                                                              | Numeric literals like `1_000_000e18` flagged for readability.                          |
| 6     | `unindexed-event-address` | misc.                                                                                              | Address parameters in events not marked `indexed`.                                     |
| 4     | `assembly`                | `src/stocks/SyntheticAssetFactory.sol` (EIP-1167 clone)                                            | Intentional inline assembly use.                                                       |
| 2     | `cyclomatic-complexity`   | misc.                                                                                              | Large branching functions.                                                             |
| 2     | `dead-code`               | misc.                                                                                              | Unused functions.                                                                      |
| 2     | `solc-version`            | misc.                                                                                              | Compiler version range diagnostics.                                                    |

Each row is grouped from the corresponding `Detector: …` section in [`docs/security/iter31/slither.txt`](security/iter31/slither.txt). For programmatic diffing, prefer [`docs/security/iter31/slither.sarif`](security/iter31/slither.sarif).

---

## Cross-reference

- Iteration narrative + Foundry/npm-audit headline numbers: [`docs/security/iter31-security-gate.md`](security/iter31-security-gate.md).
- Foundry test summary (1126/1126 at iter31): [`docs/security/iter31/forge-test.txt`](security/iter31/forge-test.txt).
- Per-service `npm audit` JSON: [`docs/security/iter31/npm-audit-*.json`](security/iter31).
- Provenance matrix (in-scope contracts ↔ source origin ↔ audit status): forthcoming as part of task `0025-security-speckit-provenance-matrix` in initiative `0006-etoro-synthetic-stocks-100`.
- Consolidated Slither + Foundry + fuzz + invariant testing plan: forthcoming as part of task `0026-security-speckit-testing-plan` in initiative `0006-etoro-synthetic-stocks-100`.

---

## Refreshing this report

The numbers above were not regenerated for this refresh — they are sourced from the iter31 artifacts (commit `ed24979`, 2026-05-18) already committed under `docs/security/iter31/`. To regenerate from scratch:

```sh
# 0. Pin tooling.
slither --version          # expect 0.11.5
forge --version            # expect 1.5.1-stable (b0a9dd9c)

# 1. Verify the in-scope surface.
find src -name '*.sol' | wc -l   # currently 69

# 2. Rebuild Foundry artifacts cleanly.
forge clean
forge build

# 3. Run Slither against src/ with the canonical filter set.
slither . \
  --config-file slither.config.json \
  --json docs/security/iter31/slither.sarif \
  | tee docs/security/iter31/slither.txt

# 4. (Optional) Re-run the full Foundry suite to keep the green gate.
forge test --summary | tee docs/security/iter31/forge-test.txt
```

The artifacts (`slither.txt`, `slither.sarif`, `forge-test.txt`) should remain immutable for the iteration that produced them. New runs belong under a new `docs/security/iterNN/` directory; this top-level `SLITHER-REPORT.md` is then re-pointed to that new evidence path.

> A helper script (≤ 80 lines) wrapping the four commands above is a candidate for a follow-up task and is intentionally **not** part of this refresh. The lane's constraint forbids non-defensive Solidity changes, but a documentation-helper bash script remains optional future work and out of scope here.

---

## Historical baseline (2026-04-05)

> Preserved verbatim from the previous version of this file for traceability. The numbers below are **superseded** by the iter31 refresh above (2026-05-18). They are kept so that future reviewers can diff against the original headline and so that the rationale in the "What changed since 2026-04-05" section above can be independently audited.

<details>
<summary><strong>Click to expand — original SLITHER-REPORT.md as of 2026-04-05.</strong></summary>

```
# Slither Security Report — GoodDollar L2
**Date:** 2026-04-05
**Tool:** Slither v0.11.5
**Contracts:** 110 analyzed
**Total findings:** 747

## Summary
| Severity | Count |
|----------|-------|
| High | 30 |
| Medium | 148 |
| Low | 344 |
| Informational | 193 |
| Optimization | 32 |

## High Severity (30)

- **unchecked-transfer**: 16 finding(s)
- **arbitrary-send-erc20**: 7 finding(s)
- **arbitrary-send-eth**: 4 finding(s)
- **weak-prng**: 2 finding(s)
- **reentrancy-eth**: 1 finding(s)

## Key High Findings

### [arbitrary-send-erc20]
LendingStrategy.deposit(uint256) (src/yield/strategies/LendingStrategy.sol#81-89) uses arbitrary from in transferFrom: ! IERC20(asset).transferFrom(vault,address(this),amount) (src/yield/strategies/LendingStrategy.sol#83)

### [arbitrary-send-erc20]
GoodLendPool.flashLoan(address,uint256,address,bytes) (src/lending/GoodLendPool.sol#462-501) uses arbitrary from in transferFrom: ! IERC20(asset).transferFrom(receiver,reserve.gToken,amount + premium) (src/lending/GoodLendPool.sol#484)

### [arbitrary-send-erc20]
GoodLendPool.liquidate(address,address,address,uint256) (src/lending/GoodLendPool.sol#386-429) uses arbitrary from in transferFrom: ! IERC20(collateralAsset).transferFrom(collateralReserve.gToken,msg.sender,collateralToSeize) (src/lending/GoodLendPool.sol#423)

### [arbitrary-send-erc20]
GoodLendPool.flashLoan(address,uint256,address,bytes) (src/lending/GoodLendPool.sol#462-501) uses arbitrary from in transferFrom: ! IERC20(asset).transferFrom(reserve.gToken,receiver,amount) (src/lending/GoodLendPool.sol#475)

### [arbitrary-send-erc20]
StablecoinStrategy.deposit(uint256) (src/yield/strategies/StablecoinStrategy.sol#77-85) uses arbitrary from in transferFrom: ! IERC20(asset).transferFrom(vault,address(this),amount) (src/yield/strategies/StablecoinStrategy.sol#79)

### [arbitrary-send-erc20]
GoodLendPool._withdraw(address,uint256,address) (src/lending/GoodLendPool.sol#277-305) uses arbitrary from in transferFrom: ! IERC20(asset).transferFrom(reserve.gToken,to,amount) (src/lending/GoodLendPool.sol#294)

### [arbitrary-send-erc20]
GoodLendPool.borrow(address,uint256) (src/lending/GoodLendPool.sol#314-341) uses arbitrary from in transferFrom: ! IERC20(asset).transferFrom(reserve.gToken,msg.sender,amount) (src/lending/GoodLendPool.sol#331)

### [arbitrary-send-eth]
L1StandardBridge.finalizeETHWithdrawal(address,address,uint256,bytes) (src/bridge/L1StandardBridge.sol#96-107) sends eth to arbitrary user 	Dangerous calls: 	- (ok,None) = _to.call{value: _amount}() (src/bridge/L1StandardBridge.sol#103)

### [arbitrary-send-eth]
GoodTimelock.execute(address,uint256,bytes,bytes32) (src/governance/GoodTimelock.sol#198-228) sends eth to arbitrary user 	Dangerous calls: 	- (success,None) = target.call{value: value}(data) (src/governance/GoodTimelock.sol#224)

### [arbitrary-send-eth]
OptimismPortal.finalizeWithdrawalTransaction(bytes32,address,uint256) (src/bridge/OptimismPortal.sol#93-116) sends eth to arbitrary user 	Dangerous calls: 	- (feeOk,None) = ubiTreasury.call{value: fee}() (src/bridge/OptimismPortal.sol#108) 	- (ok,None) = _to.call{value: payout}() (src/bridge/Optimis

### [arbitrary-send-eth]
GoodTimelock.executeBatch(address[],uint256[],bytes[],bytes32) (src/governance/GoodTimelock.sol#166-195) sends eth to arbitrary user 	Dangerous calls: 	- (success,None) = targets[i].call{value: values[i]}(calldatas[i]) (src/governance/GoodTimelock.sol#190)

### [weak-prng]
VaultManager._rpow(uint256,uint256,uint256) (src/stable/VaultManager.sol#553-573) uses a weak PRNG: "n % 2 != 0 (src/stable/VaultManager.sol#565)"

### [weak-prng]
VaultManager._rpow(uint256,uint256,uint256) (src/stable/VaultManager.sol#553-573) uses a weak PRNG: "n % 2 != 0 (src/stable/VaultManager.sol#557)"

### [reentrancy-eth]
Reentrancy in FastWithdrawalLP.claimFastETHWithdrawal(uint256,address,bytes32) (src/bridge/FastWithdrawalLP.sol#235-278): 	External calls: 	- (ok,None) = to.call{value: netAmount}() (src/bridge/FastWithdrawalLP.sol#258) 	- (ok,None) = ubiPool.call{value: ubiFee}() (src/bridge/FastWithdrawalLP.sol#26

### [unchecked-transfer]
VoteEscrowedGD.earlyUnlock() (src/governance/VoteEscrowedGD.sol#169-196) ignores return value by gd.transfer(msg.sender,received) (src/governance/VoteEscrowedGD.sol#191)
```

</details>
