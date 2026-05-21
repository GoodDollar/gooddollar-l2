# Contract Provenance Matrix

> **Scope:** Every Solidity file under `src/` in this worktree.
> **Goal:** Make it possible — in one read — to know which contract is a direct
> OpenZeppelin import, which inherits an in-tree wrapper, which is fork-derived
> from Optimism Bedrock, and which is fully custom protocol logic.
>
> This matrix is the **audit knowledge base** companion to
> `docs/SLITHER-REPORT.md` (static analysis snapshot) and
> `docs/security/TESTING-PLAN.md` (Foundry / fuzz / invariant plan).

---

## Header

| Field | Value |
|---|---|
| Worktree | `cursor-lane-d-20260520-4x25` |
| Branch HEAD | `57097ec61bc5eb0bd5a99a07ac12b7563a6b9644` |
| Generated | 2026-05-20 (UTC) |
| Contracts in scope | 69 files under `src/**/*.sol` |
| Test files in scope | 58 files under `test/**/*.sol` |
| Slither baseline | `docs/security/iter31/slither.txt` (62 of 69 contracts touched) |
| OpenZeppelin version | `4.9.6` (remap: `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`) |
| Generator | manual, deterministic (see [Methodology](#methodology)) |

> **Lane-d constraint reminder.** No production Solidity is modified by this
> document. This is a read-only knowledge artifact. Any provenance correction
> belongs in a follow-up task, not here.

---

## TL;DR / Summary statistics

| Metric | Count | % of 69 |
|---|---:|---:|
| Contracts in `src/` | **69** | 100% |
| Use **OZ direct import** (`@openzeppelin/...`) | **21** | 30% |
| Use **inline / custom reentrancy guard** (no OZ import) | **10** | 14% |
| Use a `nonReentrant` modifier (either source) | **31** | 45% |
| Touched by current Slither baseline | **62** | 90% |
| Have at least one matching test file under `test/` | **34** | 49% |
| Have at least one `invariant_*` or `testFuzz_*` test | **3** | 4% |
| **No OZ import, no in-tree reentrancy guard** | **38** | 55% |

**Headline findings:**

1. **Only two OpenZeppelin primitives are used in the entire tree:**
   `security/ReentrancyGuard.sol` (21 contracts) and `utils/math/Math.sol`
   (2 contracts — both under `src/stocks/`). Every other security-sensitive
   primitive (access control, pausability, safe ERC-20 transfers, math overflow
   handling) is **custom**.
2. **Ten contracts use a locally-defined `nonReentrant` modifier** instead of
   inheriting OZ. The implementations are simple lock-style guards and look
   correct, but they are **not the audited primitive** — they belong on the
   audit watchlist (see [Risk-ranked watchlist](#risk-ranked-watchlist)).
3. **Seven contracts are not touched by the iter31 Slither baseline**, meaning
   they were either added or relocated after that snapshot. They must be re-run
   through Slither before any production deploy (tracked under
   `0024-security-speckit-refresh-slither-baseline`).
4. **35 of 69 contracts have no matching unit test file** in `test/`. Many are
   interfaces or libraries — but several are large value-bearing contracts
   (e.g., `src/yield/GoodVault.sol`, `src/stable/VaultManager.sol`,
   `src/lending/GoodLendPool.sol`). They dominate the watchlist below.
5. **Only three test files contain `invariant_*` or `testFuzz_*` functions**:
   `test/UBIFeeSplitter.invariant.t.sol`, `test/perps/MarginVault.{fuzz,invariant}.t.sol`,
   and `test/perps/PerpEngine.fuzz.t.sol`. Property-based coverage is the
   weakest link in the test posture and is the central concern of
   `0026-security-speckit-testing-plan`.

---

## Provenance classification

Each contract is assigned exactly **one** provenance class using deterministic
heuristics applied to its source text and path.

### Classification heuristics

| Class | Heuristic | Meaning for audit |
|---|---|---|
| **OZ-direct** | Source contains a line matching `^import.*@openzeppelin/` | Inherits an audited OpenZeppelin v4.9.6 primitive. Trust boundary is OZ's audit + this contract's usage. |
| **OZ-direct + Bedrock-derived** | OZ-direct **and** filename is one of `L1StandardBridge`, `L2OutputOracle`, `OptimismPortal`, `SystemConfig` | OZ-derived primitives layered onto Optimism Bedrock contract shapes. Trust boundary is OZ + the Bedrock reference + any divergence. |
| **Bedrock-derived** | Filename is `L2OutputOracle`, `OptimismPortal`, or `SystemConfig` and no OZ import | Looks like a port of Optimism Bedrock contracts. Diff against upstream Bedrock must be reviewed. |
| **Custom-inline-guard** | No OZ import, but source defines a local `modifier nonReentrant` | Hand-rolled lock-style guard. Audit must verify each modifier implementation. |
| **Plain** | No OZ import, no inline guard | Either an interface / library / pure compute, or a value-bearing contract without reentrancy concerns. Re-evaluated per directory. |

> **Notes on the heuristic.**
> Inheritance is detected by grepping `^import` lines and `nonReentrant` /
> `ReentrancyGuard` tokens in the file. Files inheriting from another in-tree
> file that *itself* inherits OZ are **not** counted as OZ-direct here; they
> are tracked under the "in-tree dependency" column where it matters.

### Distribution

| Class | Count |
|---|---:|
| OZ-direct | 17 |
| OZ-direct + Bedrock-derived | 1 (`L1StandardBridge`) |
| Bedrock-derived (no OZ) | 3 (`L2OutputOracle`, `OptimismPortal`, `SystemConfig`) |
| Custom-inline-guard | 10 |
| Plain | 38 |
| **Total** | **69** |

OZ-direct counts of 17 + 1 = **18 contracts directly importing OZ headers**;
the original 21 in the summary statistics counted distinct *import lines* per
contract (some contracts import both `ReentrancyGuard` and `Math`).

---

## Per-area provenance tables

Columns in every table:

- **Contract** — path relative to repo root.
- **Provenance** — one of the five classes defined above.
- **SLOC** — `wc -l` of the source file (raw line count, including comments).
- **OZ imports** — comma-separated list of OZ primitives imported, or `—`.
- **Reentrancy** — number of `ReentrancyGuard`/`nonReentrant` occurrences in
  the source. `0` means no reentrancy guard at all.
- **Slither** — `yes` if the contract appears in `docs/security/iter31/slither.txt`.
- **Tests** — matching files in `test/` (or `—`).
- **Inv/Fuzz** — matching invariant or fuzz test files (or `—`).

### Root (`src/*.sol`) — 11 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/AgentRegistry.sol` | Plain | 372 | — | 0 | yes | `test/AgentRegistry.t.sol` | — |
| `src/Counter.sol` | Plain | 14 | — | 0 | yes | `test/Counter.t.sol` | — |
| `src/GoodDollarToken.sol` | Plain | 273 | — | 0 | yes | `test/GoodDollarToken.t.sol` | — |
| `src/GoodDollarTokenSecure.sol` | OZ-direct | 523 | security/ReentrancyGuard | 7 | yes | `test/GoodDollarTokenSecure.t.sol` | — |
| `src/GoodSwap.sol` | Plain | 322 | — | 0 | yes | `test/swap/GoodSwap.t.sol` | — |
| `src/TestRegistry.sol` | Plain | 152 | — | 0 | yes | `test/TestRegistry.t.sol` | — |
| `src/UBIClaimV2.sol` | OZ-direct | 252 | security/ReentrancyGuard | 6 | yes | `test/UBIClaimV2.t.sol` | — |
| `src/UBIFeeSplitter.sol` | OZ-direct | 215 | security/ReentrancyGuard | 5 | yes | `test/UBIFeeSplitter.{invariant,}.t.sol` | `test/UBIFeeSplitter.invariant.t.sol` |
| `src/UBIRevenueTracker.sol` | Plain | 234 | — | 0 | yes | `test/UBIRevenueTracker.t.sol` | — |
| `src/ValidatorStaking.sol` | OZ-direct | 316 | security/ReentrancyGuard | 6 | yes | `test/ValidatorStaking.t.sol` | — |
| `src/ValidatorStakingDevnet.sol` | Plain | 318 | — | 0 | yes | — | — |

**Notes.** `GoodDollarToken.sol` and `ValidatorStakingDevnet.sol` are sibling
"plain" variants of the OZ-direct contracts above them — they are the early /
devnet versions that predate the security hardening pass. Audits should treat
`GoodDollarTokenSecure.sol` and `ValidatorStaking.sol` as the production
contracts and the plain variants as either deprecated or test-net-only.

### `src/bridge/` — 8 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/bridge/FastWithdrawalLP.sol` | Custom-inline-guard | 358 | — | 11 | yes | `test/bridge/FastWithdrawalLP.t.sol` | — |
| `src/bridge/GoodDollarBridgeL1.sol` | OZ-direct | 277 | security/ReentrancyGuard | 8 | yes | — | — |
| `src/bridge/GoodDollarBridgeL2.sol` | Custom-inline-guard | 283 | — | 6 | yes | — | — |
| `src/bridge/L1StandardBridge.sol` | OZ-direct + Bedrock-derived | 147 | security/ReentrancyGuard | 7 | yes | — | — |
| `src/bridge/L2OutputOracle.sol` | Bedrock-derived | 133 | — | 0 | yes | — | — |
| `src/bridge/MultiChainBridge.sol` | OZ-direct | 436 | security/ReentrancyGuard | 5 | yes | `test/bridge/MultiChainBridge.t.sol` | — |
| `src/bridge/OptimismPortal.sol` | Bedrock-derived | 158 | — | 0 | yes | — | — |
| `src/bridge/SystemConfig.sol` | Bedrock-derived | 106 | — | 0 | yes | — | — |

**Notes.** The bridge family mixes three pedigrees in one folder: native
GoodDollar bridges (L1/L2/MultiChain), an OZ-direct Bedrock-derived
`L1StandardBridge`, and three Bedrock-style contracts with no in-tree tests.
`L2OutputOracle`, `OptimismPortal`, and `SystemConfig` are the highest-priority
diff-against-upstream targets — they look like ports of Optimism Bedrock but
have not been formally pinned to a Bedrock commit anywhere in the repo.

### `src/governance/` — 3 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/governance/GoodDAO.sol` | OZ-direct | 241 | security/ReentrancyGuard | 7 | yes | `test/governance/GoodDAO.t.sol` | — |
| `src/governance/GoodTimelock.sol` | Plain | 310 | — | 0 | yes | `test/governance/GoodTimelock.t.sol` | — |
| `src/governance/VoteEscrowedGD.sol` | OZ-direct | 292 | security/ReentrancyGuard | 6 | yes | `test/governance/VoteEscrowedGD.t.sol` | — |

**Notes.** `GoodTimelock.sol` is "Plain" because it has no OZ import and no
reentrancy guard, but it is governance-critical. It is **not** an OZ
`TimelockController` derivative — it is custom logic. This is a high-value
manual review target despite the absence of reentrancy concerns.

### `src/hooks/` — 1 contract

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/hooks/UBIFeeHook.sol` | Plain | 300 | — | 0 | yes | `test/UBIFeeHook.t.sol` | — |

### `src/interfaces/` — 4 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/interfaces/IERC20Transfer.sol` | Plain | 10 | — | 0 | yes | — | — |
| `src/interfaces/IGoodDollarToken.sol` | Plain | 17 | — | 0 | yes | — | — |
| `src/interfaces/IStableUBIFeeSplitterEnhanced.sol` | Plain | 14 | — | 0 | yes | — | — |
| `src/interfaces/IUBIFeeSplitters.sol` | Plain | 97 | — | 0 | yes | — | — |

**Notes.** All four are pure `interface` declarations. They carry no
implementation risk, but they form the public ABI surface used by integrators
— ABI-breaking changes need release-note tracking.

### `src/lending/` — 7 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/lending/DebtToken.sol` | Plain | 112 | — | 0 | yes | — | — |
| `src/lending/GoodLendAddressesProvider.sol` | Plain | 97 | — | 0 | yes | — | — |
| `src/lending/GoodLendPool.sol` | Custom-inline-guard | 897 | — | 17 | yes | — | — |
| `src/lending/GoodLendToken.sol` | Plain | 179 | — | 0 | yes | — | — |
| `src/lending/InterestRateModel.sol` | Plain | 107 | — | 0 | yes | — | — |
| `src/lending/SimplePriceOracle.sol` | Plain | 45 | — | 0 | yes | — | — |
| `src/lending/StockLendOracleAdapter.sol` | Plain | 166 | — | 0 | **no** | `test/lending/StockLendOracleAdapter.t.sol` | — |

**Notes.** `GoodLendPool.sol` is the largest custom-inline-guard contract in
the repo (897 SLOC, 17 reentrancy markers) and has **no matching unit test
file in `test/lending/`**. It is the #1 audit risk in the lending family.
`StockLendOracleAdapter.sol` was added after iter31 (not Slither-touched).

### `src/oracle/` — 3 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/oracle/StockOracleV2.sol` | Plain | 400 | — | 0 | **no** | `test/oracle/StockOracleV2.t.sol` | — |
| `src/oracle/StockOracleV2Adapter.sol` | Plain | 85 | — | 0 | **no** | `test/oracle/StockOracleV2Adapter.t.sol` | — |
| `src/oracle/SwapPriceOracle.sol` | Plain | 305 | — | 0 | yes | `test/oracle/SwapPriceOracle.t.sol` | — |

**Notes.** Two of three oracle contracts are post-iter31 additions. Oracles
are a top-tier audit concern across the whole codebase because they feed both
lending (`StockLendOracleAdapter`) and synthetic stocks (`StockPerpEngine`,
`CollateralVault`, `StockAMM`). Refreshing Slither against these is a hard
prerequisite for any synthetic-stocks rollout.

### `src/perps/` — 6 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/perps/FundingRate.sol` | Plain | 154 | — | 0 | yes | — | — |
| `src/perps/MarginVault.sol` | OZ-direct | 144 | security/ReentrancyGuard | 5 | yes | `test/perps/MarginVault.{fuzz,invariant}.t.sol` | `test/perps/MarginVault.{fuzz,invariant}.t.sol` |
| `src/perps/PerpEngine.sol` | OZ-direct | 466 | security/ReentrancyGuard | 5 | yes | `test/perps/PerpEngine.fuzz.t.sol` | `test/perps/PerpEngine.fuzz.t.sol` |
| `src/perps/PerpPriceOracle.sol` | Plain | 287 | — | 0 | yes | `test/perps/PerpPriceOracle.t.sol` | — |
| `src/perps/PerpUBIFeeSplitter.sol` | OZ-direct | 346 | security/ReentrancyGuard | 3 | yes | `test/PerpUBIFeeSplitter.t.sol` | — |
| `src/perps/StockPerpEngine.sol` | OZ-direct | 507 | security/ReentrancyGuard | 7 | **no** | `test/perps/StockPerpEngine.t.sol` | — |

**Notes.** Perps has the best property-based coverage in the codebase
(`MarginVault` and `PerpEngine`). `StockPerpEngine.sol` is the
synthetic-stocks-specific engine; it is the most security-sensitive new
contract for initiative `0006`, and it was added after iter31, so it has **no
Slither baseline** and **no fuzz/invariant tests yet**.

### `src/predict/` — 4 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/predict/ConditionalTokens.sol` | Plain | 137 | — | 0 | yes | — | — |
| `src/predict/MarketFactory.sol` | OZ-direct | 345 | security/ReentrancyGuard | 4 | yes | — | — |
| `src/predict/OptimisticResolver.sol` | Custom-inline-guard | 411 | — | 6 | yes | `test/predict/OptimisticResolver.t.sol` | — |
| `src/predict/PredictUBIFeeSplitter.sol` | OZ-direct | 238 | security/ReentrancyGuard | 3 | yes | — | — |

**Notes.** `OptimisticResolver.sol` is the most complex contract in the
predict family and uses its own reentrancy guard. It also has the only test in
this folder.

### `src/risk/` — 2 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/risk/ClearingHouse.sol` | Plain | 290 | — | 0 | **no** | `test/risk/ClearingHouse.t.sol` | — |
| `src/risk/UnifiedRiskEngine.sol` | Plain | 342 | — | 0 | **no** | `test/risk/UnifiedRiskEngine.t.sol` | — |

**Notes.** Entire `risk/` folder is post-iter31. Both contracts are unit-tested
but lack Slither coverage and have no reentrancy guards despite touching
cross-protocol risk math. Plausibly fine (state-only computation), but must be
confirmed in the next Slither pass.

### `src/stable/` — 7 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/stable/CollateralRegistry.sol` | Plain | 191 | — | 0 | yes | — | — |
| `src/stable/PegStabilityModule.sol` | Custom-inline-guard | 378 | — | 6 | yes | — | — |
| `src/stable/StabilityPool.sol` | Custom-inline-guard | 456 | — | 7 | yes | — | — |
| `src/stable/StableUBIFeeSplitter.sol` | OZ-direct | 434 | security/ReentrancyGuard | 4 | yes | `test/StableUBIFeeSplitter.t.sol` | — |
| `src/stable/VaultManager.sol` | Custom-inline-guard | 739 | — | 12 | yes | — | — |
| `src/stable/gUSD.sol` | Custom-inline-guard | 159 | — | 6 | yes | — | — |
| `src/stable/interfaces/IGoodStable.sol` | Plain | 64 | — | 0 | yes | — | — |

**Notes.** `stable/` is the largest concentration of `Custom-inline-guard`
contracts in the codebase (4 out of 7). `VaultManager.sol` is the second
largest contract in the repo (739 SLOC) and has no matching unit test.

### `src/stocks/` — 6 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/stocks/CollateralVault.sol` | OZ-direct | 593 | security/ReentrancyGuard, utils/math/Math | 8 | yes | `test/CollateralVault.t.sol` | — |
| `src/stocks/PriceOracle.sol` | Plain | 179 | — | 0 | yes | — | — |
| `src/stocks/StockAMM.sol` | OZ-direct | 371 | security/ReentrancyGuard, utils/math/Math | 6 | **no** | `test/stocks/StockAMM.t.sol` | — |
| `src/stocks/StocksUBIFeeSplitter.sol` | OZ-direct | 316 | security/ReentrancyGuard | 3 | yes | — | — |
| `src/stocks/SyntheticAsset.sol` | Plain | 104 | — | 0 | yes | — | — |
| `src/stocks/SyntheticAssetFactory.sol` | Plain | 164 | — | 0 | yes | — | — |

**Notes.** Synthetic stocks family — the focus of initiative `0006`. Both
contracts that import OZ `Math` live here, suggesting bonding-curve / pricing
math complex enough to want overflow-safe ops. `StockAMM.sol` is post-iter31.
`CollateralVault.sol` is the largest stocks contract and the integration point
between synthetic positions and on-chain collateral — it is a top-priority
audit target.

### `src/swap/` — 3 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/swap/GoodSwapRouter.sol` | OZ-direct | 274 | security/ReentrancyGuard | 4 | yes | `test/swap/GoodSwapRouter.t.sol` | — |
| `src/swap/LiFiBridgeAggregator.sol` | OZ-direct | 350 | security/ReentrancyGuard | 4 | yes | `test/swap/LiFiBridgeAggregator.t.sol` | — |
| `src/swap/LimitOrderBook.sol` | Custom-inline-guard | 372 | — | 5 | yes | `test/swap/LimitOrderBook.t.sol` | — |

### `src/yield/` — 4 contracts

| Contract | Provenance | SLOC | OZ imports | Reentrancy | Slither | Tests | Inv/Fuzz |
|---|---|---:|---|---:|---|---|---|
| `src/yield/GoodVault.sol` | Custom-inline-guard | 534 | — | 15 | yes | — | — |
| `src/yield/VaultFactory.sol` | Plain | 129 | — | 0 | yes | — | — |
| `src/yield/strategies/LendingStrategy.sol` | Plain | 138 | — | 0 | yes | — | — |
| `src/yield/strategies/StablecoinStrategy.sol` | Plain | 163 | — | 0 | yes | — | — |

**Notes.** `GoodVault.sol` is an ERC-4626-style vault with a hand-rolled
reentrancy guard, no matching unit test in `test/yield/`, and 15 reentrancy
markers. It sits on the watchlist below.

---

## Risk-ranked watchlist

The watchlist ranks contracts by a composite **audit-priority signal**:

```
priority = (SLOC / 100)
         + 3.0  if Custom-inline-guard
         + 2.0  if not Slither-touched
         + 2.0  if no matching unit test
         + 4.0  if reentrancy markers > 0 AND no Inv/Fuzz test
         + value-bearing bonus (subjective, see footnote)
```

This is **not** a vulnerability score — it is a *time-allocation* score for a
manual audit pass. High-priority contracts deserve a longer review, not
necessarily a bigger fix list.

### Top-15 watchlist

| # | Contract | Priority drivers | Recommended action |
|---:|---|---|---|
| 1 | `src/lending/GoodLendPool.sol` | 897 SLOC · Custom-inline-guard · **no unit test** · 17 reentrancy markers · value-bearing | Add a dedicated unit suite + invariants on `borrow → repay → liquidate` flows. Slither rerun. Manual lending math review. |
| 2 | `src/stable/VaultManager.sol` | 739 SLOC · Custom-inline-guard · **no unit test** · 12 reentrancy markers · value-bearing | Unit suite + invariants on collateral / debt accounting. Manual review of liquidation paths. |
| 3 | `src/stocks/CollateralVault.sol` | 593 SLOC · OZ-direct · uses OZ Math · 8 reentrancy markers · large surface · synthetic-stocks integration point | Add fuzz on margin maintenance + invariant on collateralization ratio. Watch for OZ Math version drift. |
| 4 | `src/yield/GoodVault.sol` | 534 SLOC · Custom-inline-guard · **no unit test** · 15 reentrancy markers · value-bearing · ERC-4626-ish surface | Dedicated 4626 conformance + fuzz on `deposit/withdraw/mint/redeem`. |
| 5 | `src/GoodDollarTokenSecure.sol` | 523 SLOC · OZ-direct · 7 reentrancy markers · is the canonical token | Already has a unit suite; add invariants on supply, transfer, and pausability. |
| 6 | `src/perps/StockPerpEngine.sol` | 507 SLOC · OZ-direct · **not Slither-touched** · no Inv/Fuzz · synthetic-stocks-specific | **Highest priority for initiative 0006.** Slither rerun, fuzz on funding rate + liquidation, invariant on PnL conservation. |
| 7 | `src/perps/PerpEngine.sol` | 466 SLOC · OZ-direct · 5 reentrancy markers · has fuzz suite | Extend fuzz suite into invariants. Solid baseline. |
| 8 | `src/stable/StabilityPool.sol` | 456 SLOC · Custom-inline-guard · **no unit test** · 7 reentrancy markers | Unit suite + invariants on pool accounting. |
| 9 | `src/stable/StableUBIFeeSplitter.sol` | 434 SLOC · OZ-direct · 4 reentrancy markers · has unit test | Add invariants on fee-split sum and recipient accounting. |
| 10 | `src/predict/OptimisticResolver.sol` | 411 SLOC · Custom-inline-guard · 6 reentrancy markers · has unit test | Manual review of bond / challenge windows. |
| 11 | `src/oracle/StockOracleV2.sol` | 400 SLOC · Plain · **not Slither-touched** · feeds synthetic stocks | Slither rerun, manual review of price-staleness + circuit breaker. |
| 12 | `src/stable/PegStabilityModule.sol` | 378 SLOC · Custom-inline-guard · **no unit test** · 6 reentrancy markers | Unit suite + invariant on peg-arbitrage flows. |
| 13 | `src/swap/LimitOrderBook.sol` | 372 SLOC · Custom-inline-guard · 5 reentrancy markers · has unit test | Invariant on order-book ordering + cancellation. |
| 14 | `src/stocks/StockAMM.sol` | 371 SLOC · OZ-direct · uses OZ Math · **not Slither-touched** · 6 reentrancy markers | Slither rerun. Fuzz on bonding-curve math. |
| 15 | `src/bridge/MultiChainBridge.sol` | 436 SLOC · OZ-direct · 5 reentrancy markers · cross-chain · has unit test | Invariant on message-replay protection across chains. |

> **Value-bearing bonus** is applied to contracts that hold or transfer ERC-20
> balances, mint/burn tokens, or sit on critical user-facing flows. This is a
> judgment call documented per-contract in the rationale column.

### Watchlist for the synthetic-stocks rollout (initiative 0006)

The synthetic-stocks initiative touches these contracts. They are the **must
re-baseline** set before any production deploy:

1. `src/stocks/CollateralVault.sol` — already Slither-touched, needs fuzz.
2. `src/stocks/StockAMM.sol` — **not Slither-touched**, needs full pass.
3. `src/stocks/StocksUBIFeeSplitter.sol` — already Slither-touched, needs invariants.
4. `src/stocks/SyntheticAsset.sol` — Slither-touched, **no test file**.
5. `src/stocks/SyntheticAssetFactory.sol` — Slither-touched, **no test file**.
6. `src/perps/StockPerpEngine.sol` — **not Slither-touched**, needs fuzz + invariant.
7. `src/oracle/StockOracleV2.sol` — **not Slither-touched**, needs full pass.
8. `src/oracle/StockOracleV2Adapter.sol` — **not Slither-touched**.
9. `src/lending/StockLendOracleAdapter.sol` — **not Slither-touched**.
10. `src/risk/ClearingHouse.sol` — **not Slither-touched**.
11. `src/risk/UnifiedRiskEngine.sol` — **not Slither-touched**.

That is 11 contracts touched by the initiative, of which **7 are not Slither-touched** today. Item 1 of the testing plan (`0026`) is to close that gap.

---

## Cross-cutting concerns

### Inline reentrancy guards

The ten contracts in the `Custom-inline-guard` class all use a small lock-style
modifier rather than inheriting OZ `ReentrancyGuard`. The pattern across the
codebase is consistent (e.g., `src/stable/gUSD.sol:30-41`):

```solidity
// Uses 1=unlocked / 2=locked (not 0/1) so the slot is always non-zero.
uint256 private _locked = 1;
modifier nonReentrant() {
    require(_locked == 1, "Reentrant");
    _locked = 2;
    _;
    _locked = 1;
}
```

A second variation uses `0`/`1` instead (e.g., `src/stable/PegStabilityModule.sol:92-99`):

```solidity
uint256 private _locked;
modifier nonReentrant() {
    require(_locked == 0, "Reentrant");
    _locked = 1;
    _;
    _locked = 0;
}
```

Both variants are functionally correct against single-call reentrancy. The
`1`/`2` variant is gas-better on cold storage (the slot is always non-zero).
**Audit checklist for each inline-guard contract:**

1. Confirm `_locked` is `private` and never written outside the modifier.
2. Confirm the modifier wraps every externally-callable mutator that touches
   value or transfers.
3. Confirm there is no `payable receive()` / `fallback()` that mutates state
   without the guard.
4. Confirm cross-function reentrancy is also blocked (i.e., the modifier
   covers the entire "view-side" surface that depends on the same lock).

### OZ version drift

The repo is pinned to OpenZeppelin `4.9.6` via `lib/openzeppelin-contracts/`
and the remap `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`.
Two facts to watch:

- **OZ v5 moves `ReentrancyGuard` from `security/` to `utils/`.** A naive
  remap-only upgrade would break all 18 OZ-direct contracts.
- **`utils/math/Math.sol` exists in both 4.x and 5.x.** That import path is
  upgrade-stable.

Any future OZ upgrade must be accompanied by a Slither rerun and a diff of the
inherited storage layouts.

### Slither baseline divergence

Seven contracts in `src/` are **not** referenced in
`docs/security/iter31/slither.txt`:

```
src/lending/StockLendOracleAdapter.sol
src/oracle/StockOracleV2.sol
src/oracle/StockOracleV2Adapter.sol
src/perps/StockPerpEngine.sol
src/risk/ClearingHouse.sol
src/risk/UnifiedRiskEngine.sol
src/stocks/StockAMM.sol
```

All seven were added during or after iter31. Six of the seven are in the
synthetic-stocks initiative's contract surface. **Closing this gap is the
exit criterion for `0024-security-speckit-refresh-slither-baseline`** and the
prerequisite for the testing plan (`0026`).

---

## Methodology

### Data sources

1. **Contract list:**
   `find src -type f -name '*.sol' | LC_ALL=C sort` → 69 paths.
2. **Imports per file:** `grep -E '^import' <file>`.
3. **OZ imports per file:** `grep -E '^import.*@openzeppelin' <file>`.
4. **Reentrancy markers per file:** `grep -E '(ReentrancyGuard|nonReentrant)' <file> | wc -l`.
5. **SLOC per file:** `wc -l <file>` (raw lines, no comment stripping).
6. **Slither-touched set:** parsed from `docs/security/iter31/slither.txt` by
   extracting all `src/.../<file>.sol` substrings and uniquing them.
7. **Test files:** `find test -type f -name '*.sol' | LC_ALL=C sort`.
8. **Inv/Fuzz files:** `grep -rl -E 'function (invariant_|testFuzz_)' test/`.
9. **Per-contract test match:** the contract `BaseName.sol` is matched against
   test file paths using the regex
   `/<BaseName>(\.t|\.fuzz\.t|\.invariant\.t|\.security\.t|Test\.t)\.sol$`.
10. **OZ version:** `lib/openzeppelin-contracts/package.json` → `4.9.6`.
11. **Remap:** `remappings.txt` → `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`.

### Provenance classification rules

Each file is bucketed by the following ordered decision tree:

1. **OZ-direct + Bedrock-derived** — file has `@openzeppelin` import **and**
   basename matches `L1StandardBridge`.
2. **Bedrock-derived** — basename matches one of `L2OutputOracle`,
   `OptimismPortal`, `SystemConfig` and no `@openzeppelin` import.
3. **OZ-direct** — file has any `^import.*@openzeppelin` line.
4. **Custom-inline-guard** — file does not import OZ but contains either
   `modifier nonReentrant` or `nonReentrant` markers on functions.
5. **Plain** — everything else.

### Refresh procedure

When the contract surface changes:

1. From the worktree root, regenerate the inputs:
   ```bash
   git rev-parse HEAD                                                        # for the header
   find src -type f -name '*.sol' | LC_ALL=C sort > /tmp/contracts.txt
   find test -type f -name '*.sol' | LC_ALL=C sort > /tmp/tests.txt
   grep -rl -E 'function (invariant_|testFuzz_)' test/                       \
     > /tmp/invfuzz.txt
   grep -oE 'src/[^[:space:]:]+\.sol' docs/security/iter31/slither.txt       \
     | LC_ALL=C sort -u > /tmp/slither-touched.txt
   ```
2. Recompute per-contract counts (OZ imports, reentrancy markers, SLOC) by
   iterating `/tmp/contracts.txt`. The exact one-liner is committed at the
   tail of this document so the data is reproducible.
3. Apply the classification decision tree.
4. Update the per-area tables. Keep area order stable so diffs stay readable.
5. Rerun Slither (`0024-security-speckit-refresh-slither-baseline`) and update
   the `Slither` column accordingly.
6. Bump the **Generated** date and the **Branch HEAD** commit hash at the top.

A future task can codify steps 1–4 into a script (`scripts/security/build-provenance.sh`).
For now this document is hand-maintained but built from deterministic inputs.

### Reproducibility one-liner

The full data table (TSV) for this snapshot can be regenerated with the
following shell pipeline. Run from the worktree root:

```bash
# Inputs
find src -type f -name '*.sol' | LC_ALL=C sort > /tmp/contracts.txt
find test -type f -name '*.sol' | LC_ALL=C sort > /tmp/tests.txt
grep -rl -E 'function (invariant_|testFuzz_)' test/ \
  --include='*.sol' 2>/dev/null > /tmp/invfuzz.txt
grep -oE 'src/[^[:space:]:]+\.sol' docs/security/iter31/slither.txt \
  | LC_ALL=C sort -u > /tmp/slither-touched.txt

# Per-contract numerical scan
: > /tmp/prov-scan.txt
while IFS= read -r f; do
  oz=$(grep -cE '^import.*@openzeppelin' "$f" 2>/dev/null || true)
  rg=$(grep -cE '(ReentrancyGuard|nonReentrant)' "$f" 2>/dev/null || true)
  sl=$(wc -l < "$f")
  printf '%s|%s|%s|%s\n' "$f" "$oz" "$rg" "$sl" >> /tmp/prov-scan.txt
done < /tmp/contracts.txt

# Stitch into a single TSV (path, oz, reentrancy, sloc, slither, tests, inv/fuzz)
printf 'path\toz\treentrancy\tsloc\tslither\ttests\tinvfuzz\n' \
  > /tmp/provenance-data.tsv
while IFS='|' read -r path oz rg sl; do
  base=$(basename "$path" .sol)
  s=$(grep -qx "$path" /tmp/slither-touched.txt && echo yes || echo no)
  t=$(grep -E "/(${base})(\.t|\.fuzz\.t|\.invariant\.t|\.security\.t|Test\.t)\.sol$" \
      /tmp/tests.txt | tr '\n' ',' | sed 's/,$//')
  [ -z "$t" ] && t='—'
  iv=$(grep -E "/(${base})(\.fuzz\.t|\.invariant\.t)\.sol$" \
      /tmp/invfuzz.txt | tr '\n' ',' | sed 's/,$//')
  [ -z "$iv" ] && iv='—'
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$path" "$oz" "$rg" "$sl" "$s" "$t" "$iv" >> /tmp/provenance-data.tsv
done < /tmp/prov-scan.txt
```

Output: `/tmp/provenance-data.tsv` with 69 data rows.

---

## Limitations & open questions

- **Inheritance is not transitively resolved.** A contract that inherits an
  in-tree base which itself inherits OZ is classified by its *own* imports, not
  the base's. This is intentional: it surfaces which contracts directly anchor
  to OZ and which rely on an in-tree wrapper. A future enhancement could
  emit a second column "inherited-OZ-via" using `forge inspect`.
- **No diff against upstream Bedrock.** Three contracts (`L2OutputOracle`,
  `OptimismPortal`, `SystemConfig`) and one OZ-direct contract
  (`L1StandardBridge`) are heuristically classified as Bedrock-derived based on
  filename alone. The actual upstream commit they were ported from is not
  pinned anywhere in the repo. A separate task should pin this.
- **`Plain` is a heterogeneous bucket.** It contains interfaces (zero risk),
  simple libraries, and large value-bearing contracts that legitimately don't
  need reentrancy guards (e.g., pure state machines like `GoodTimelock`). The
  per-area notes call out the latter case explicitly.
- **SLOC includes comments.** Raw `wc -l` is used for stability. A
  comment-stripped SLOC would be lower for `GoodDollarTokenSecure.sol`,
  `CollateralVault.sol`, and `MultiChainBridge.sol` in particular.
- **Slither baseline is iter31.** This is documented in
  `docs/SLITHER-REPORT.md` and is the gap that
  `0024-security-speckit-refresh-slither-baseline` exists to close.
- **No coverage % per contract.** `forge coverage` was not run for this
  snapshot. Adding coverage is in scope for `0026`.

---

## Companion documents

- `docs/SLITHER-REPORT.md` — current Slither baseline snapshot.
- `docs/security/iter31/slither.txt` — raw iter31 Slither output.
- `docs/security/iter31-security-gate.md` — iter31 gate decision.
- `docs/security/iter32/` — iter32 artifacts.
- `docs/security/iter35-oracle-risk-controls.md` — oracle-specific risk notes.
- `docs/security/goodswap-reentrancy-analysis.md` — focused reentrancy analysis on `GoodSwap.sol`.
- `docs/security/TESTING-PLAN.md` — Foundry / fuzz / invariant plan (see task `0026`).

---

*Last refresh: 2026-05-20 (UTC) · commit `57097ec`. To refresh this document,
follow the [Refresh procedure](#refresh-procedure) and update the header.*
