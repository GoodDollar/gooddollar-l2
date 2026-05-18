# UBI Fee Accounting — Canonical Routing Spec

> **Status:** Iteration 22 of the [Testnet Readiness 50-iteration plan](TESTNET-READINESS-50-ITERATIONS.md).
>
> This document is the **single source of truth** for how every protocol on
> GoodDollar L2 routes a portion of its fees into the UBI pool. Future
> iterations 23 and 24 (Foundry/integration proofs) must match the paths
> declared here. Anything not listed here is **not** part of the public
> UBI fee gate.

---

## 1. Why this document exists

GoodDollar L2's defining property is that **every transaction funds UBI**.
The chain hosts six DeFi protocols today (Swap, Perps, Predict, Lend,
Stable, Stocks) plus one Uniswap V4 hook. Each one collects fees in a
different token, in a different unit, through a different code path, and
hands a slice to the UBI pool. Without a written truth source it is
impossible to:

- Prove to external testers that the "20% to UBI" claim is real.
- Wire up the analytics dashboard in iteration 27 against the correct
  events and addresses.
- Tell auditors (Phase 4) which call edges they need to verify.
- Decide whether a new protocol's fee path has gone live or is still a
  stub.

This file fills that gap. It is intentionally deduplicated against
`docs/ARCHITECTURE.md` (which describes the system) and the per-protocol
specs (which describe individual contracts); here we map only the
**fee → UBI** edges.

---

## 2. Canonical addresses

Addresses come from `op-stack/addresses.json` and must not be
hard-coded anywhere else (Non-Negotiable #7 in the initiative spec).

| Role | Contract | Address |
|---|---|---|
| UBI host token | `GoodDollarToken` (G$) | `0x8f86…fe4cf` |
| Generic splitter | `UBIFeeSplitter` | `0x809d…fac3d` |
| UBI claim sink | `UBIClaimV2` | `0x9d44…1688` |
| UBI revenue analytics | `UBIRevenueTracker` | `0xfd6f…c351` |
| Swap (Uniswap V4 hook) | `UBIFeeHook` | `0xD7aC…CD9A` |
| Swap (Li.Fi bridge) | `LiFiBridgeAggregator` | `0x1291…c274` |
| Perps engine | `PerpEngine` | `0x0848…ff2d` |
| Predict factory | `MarketFactory` | `0xfaA7…6CCE` |
| Stable PSM | `PegStabilityModule` | `0x9eb5…719b` |
| Stable vaults | `VaultManager` | `0x3489…e228` |
| Stocks vault | `CollateralVault` | `0x276c…77d3` |
| Lend pool | `GoodLendPool` | `0xcbea…47cc` |
| Stable token | `gUSD` | `0xed12…a961` |

> Truncation is for readability; the build uses the full 20-byte values
> directly from `addresses.json` via `scripts/refresh-addresses.py`.

---

## 3. Default fee split (the "20% truth")

The shared splitter, `UBIFeeSplitter`, splits in basis points:

| Slice | BPS | % | Destination |
|---|---|---|---|
| UBI | 2000 | **20.00%** | `GoodDollarToken.fundUBIPool(ubiShare)` |
| Protocol treasury | 1667 | 16.67% | `treasury` address |
| dApp (caller) | 6333 | 63.33% | `dAppRecipient` argument |

Source: [`src/UBIFeeSplitter.sol#L21-L82`](../src/UBIFeeSplitter.sol).

Governance can change the split via `setFeeSplit(_ubiBPS, _protocolBPS)`,
subject to `_ubiBPS + _protocolBPS <= 10000`. Any deployed split that
ever drops below 20% UBI **must** be flagged in the README's known-risks
section per Non-Negotiable #8.

### Token paths inside the splitter

- `splitFee(totalFee, dAppRecipient)` — for **G$**. Calls
  `goodDollarToken.fundUBIPool(ubiShare)` directly, so UBI receives a
  bookkeeping credit inside the token contract (not a separate
  ERC-20 transfer).
- `splitFeeToken(token, totalFee, dAppRecipient)` — for **other
  ERC-20s** (currently only `gUSD`). The token is `transferFrom`'d from
  the caller, then `transfer`'d to a designated UBI-funded recipient
  (the protocol treasury for non-G$).

### Specialised splitters

Each protocol can deploy an **enhanced** splitter that inherits from
`UBIFeeSplitter` and adds per-event tracking. They keep the same 20%
default and the same `splitFee` ABI, so any caller that talks to the
base splitter keeps working.

| Splitter | Adds tracking for |
|---|---|
| `PerpUBIFeeSplitter` | `splitTradingFee`, `splitFundingFee`, `splitLiquidationFee` |
| `StableUBIFeeSplitter` | `splitStabilityFee`, `splitMintingFee`, `splitLiquidationPenalty`, `splitGovernanceFee` |
| `PredictUBIFeeSplitter` | implements `IUBIFeeSplitterPredict`/`IUBIFeeSplitterResolver` |
| `StocksUBIFeeSplitter` | implements `IUBIFeeSplitter` with stocks-specific events |

`PegStabilityModule` and `VaultManager` use `try/catch` to attempt the
enhanced calls and fall back to plain `splitFeeToken`, so the spec
holds even if the deployed splitter is the base contract.

---

## 4. Per-protocol fee routes

The table below lists **every edge** that should produce a UBI credit.
Each row is one call site. Iterations 23–24 will attach a Foundry test
ID and an on-chain receipt to each row.

| # | Protocol | Trigger / fee source | Source contract | Fee token | Sink | Call edge |
|---|---|---|---|---|---|---|
| 1 | **Swap (V4)** | Uniswap V4 `afterSwap` hook collects a configurable BPS of output | `src/hooks/UBIFeeHook.sol` (`afterSwap` → L191-L203) | output token of the swap | `GoodDollarToken.fundUBIPool` | direct `IUBIPool(ubiPool).fundUBIPool(ubiShare)` — bypasses the generic splitter |
| 2 | **Swap (cross-chain)** | `bridge()` and `bridgeNative()` skim `ubiFeeRateBps = 10` (0.1%) of `srcAmount` | `src/swap/LiFiBridgeAggregator.sol` L192, L242 | source token (ERC-20 or native ETH) | `UBIFeeSplitter` address | direct `transfer` / `call{value: fee}` — splitter handles internal accounting |
| 3 | **Perps trading fee** | Open/close position fee | `src/perps/PerpEngine.sol` → `IFeeSplitterPerp(feeSplitter).splitFee()` | G$ | `PerpUBIFeeSplitter` → `fundUBIPool` | `splitFee` (base ABI) |
| 4 | **Perps funding fee** | Periodic funding payments | `PerpEngine` → `PerpUBIFeeSplitter.splitFundingFee` (enhanced) | G$ | UBI pool | `splitFundingFee` |
| 5 | **Perps liquidation fee** | Liquidator bounty share | `PerpEngine` → `PerpUBIFeeSplitter.splitLiquidationFee` | G$ | UBI pool | `splitLiquidationFee` |
| 6 | **Predict market creation** | Market factory fee on `createMarket` | `src/predict/MarketFactory.sol` L283 | G$ | `PredictUBIFeeSplitter` | `IUBIFeeSplitterPredict.splitFee` |
| 7 | **Predict resolver fee** | Optimistic resolution bond/fee | `src/predict/OptimisticResolver.sol` | G$ | `PredictUBIFeeSplitter` | `IUBIFeeSplitterResolver.splitFee` |
| 8 | **Lend reserve factor** | Interest accrual mints gTokens to treasury; treasury **must** be `UBIFeeSplitter` | `src/lending/GoodLendPool.sol` L555-L574 | gToken (e.g., gG$) | treasury = `UBIFeeSplitter` | `mintToTreasury(treasury, accrued, liquidityIndex)` |
| 9 | **Stable stability fee** | `VaultManager.drip()` mints gUSD on accrued fees | `src/stable/VaultManager.sol` L240-L260 | gUSD | `StableUBIFeeSplitter` | `splitFeeToken(gUSD, feeWAD, dApp)` |
| 10 | **Stable minting fee** | `PegStabilityModule.mint()` charges fee in gUSD | `src/stable/PegStabilityModule.sol` L270-L300 | gUSD | `StableUBIFeeSplitter` | `splitMintingFee` (enhanced) → fallback `splitFeeToken` |
| 11 | **Stable liquidation penalty** | Stability pool absorbs bad debt | `StableUBIFeeSplitter.splitLiquidationPenalty` | gUSD or G$ | UBI pool | `splitLiquidationPenalty` |
| 12 | **Stable governance fee** | Treasury-mandated fee (governance proposal) | `StableUBIFeeSplitter.splitGovernanceFee` | G$ | UBI pool | `splitGovernanceFee` |
| 13 | **Stocks trading fee** | Open/close synthetic stock position | `src/stocks/CollateralVault.sol` L307, L375 | G$ | `StocksUBIFeeSplitter` | `IUBIFeeSplitter.splitFee` |
| 14 | **Stocks liquidation remnant** | Remaining collateral after a liquidation auction | `src/stocks/CollateralVault.sol` L425-L431 | G$ | `StocksUBIFeeSplitter` | `IUBIFeeSplitter.splitFee` |

Routes 1 and 2 are **not** mediated by `UBIFeeSplitter.splitFee` — they
go directly into the UBI pool (V4) or to the splitter's raw balance
(Li.Fi). That is intentional: V4 callbacks are gas-sensitive and the
Li.Fi aggregator is upgrade-managed by the bridge keeper, so it skims
first and lets governance reconcile asynchronously. Both are still
covered by `UBIFeeHook.t.sol` and `LiFiBridgeAggregator.t.sol` for
correctness.

---

## 5. Routing diagram

```
                                  ┌────────────────────────┐
                                  │     UBIClaimV2         │
                                  │  (humans claim UBI)    │
                                  └──────────▲─────────────┘
                                             │ fundUBIPool / claim
              ┌──────────────────────────────┴──────────────────────────────┐
              │                  GoodDollarToken (G$)                       │
              │  internal UBI pool balance — credited via fundUBIPool()     │
              └─▲────────▲───────────▲─────────▲────────▲────────▲──────────┘
                │        │           │         │        │        │
        fundUBI │        │ splitFee  │ split-  │        │        │ split-
         (V4)   │        │  (G$)     │ FeeToken│        │        │ FeeToken
                │        │           │  (gUSD) │        │        │
        ┌───────┴───┐ ┌──┴────────┐ ┌─┴──────┐ │ ┌──────┴──────┐ │
        │ UBIFee-   │ │ Perp-     │ │Stable- │ │ │ Stocks-     │ │
        │ Hook      │ │ UBIFee-   │ │UBIFee- │ │ │ UBIFee-     │ │
        │ (V4 hook) │ │ Splitter  │ │Splitter│ │ │ Splitter    │ │
        └───────▲───┘ └──▲────────┘ └─▲──────┘ │ └──────▲──────┘ │
                │        │            │        │        │        │
       afterSwap│   splitFee/         │ split- │        │ split- │
                │   splitTrading/     │ FeeTkn │        │ Fee    │
                │   splitFunding/     │        │        │        │
                │   splitLiquidation  │        │        │        │
                │        │            │        │        │        │
        ┌───────┴───┐ ┌──┴────────┐ ┌─┴──────┐ │ ┌──────┴──────┐ │
        │ Uniswap   │ │ PerpEngine│ │Vault-  │ │ │ Collateral- │ │
        │ V4 Pools  │ │           │ │Manager │ │ │ Vault       │ │
        └───────────┘ └───────────┘ │+ PSM   │ │ │ (stocks)    │ │
                                    └────────┘ │ └─────────────┘ │
                                               │                 │
                                       ┌───────┴──────┐  ┌───────┴─────┐
                                       │ MarketFactory│  │ GoodLend-   │
                                       │ + Optimistic-│  │ Pool        │
                                       │ Resolver     │  │ (reserve    │
                                       │ (Predict)    │  │  factor →   │
                                       │   splitFee   │  │  treasury)  │
                                       └──────────────┘  └─────────────┘

                  ┌──────────────────────────────────────┐
                  │      LiFiBridgeAggregator            │
                  │      (skims 0.1% → splitter)         │
                  └────────────────┬─────────────────────┘
                                   │ raw transfer
                                   ▼
                         ┌──────────────────┐
                         │  UBIFeeSplitter  │  (generic)
                         └──────────────────┘
```

---

## 6. Tests list (existing coverage)

This is the input to iterations 23 and 24. All paths in §4 already have
**unit-level** coverage; "✅ unit" means the splitter ABI is tested,
"⏳ proof needed" means we still owe an integration proof that the
event/balance delta actually fires from the protocol's own entry point.

| # | Route | Unit test file | Integration test file | Status |
|---|---|---|---|---|
| 1 | Swap V4 (hook) | `test/UBIFeeHook.t.sol` | `test/integration/UBIFeeAccumulation.t.sol`, [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) | ✅ unit + ✅ integration proven (iter 23) |
| 2 | Swap Li.Fi bridge | `test/swap/LiFiBridgeAggregator.t.sol` | `test/integration/UBIFeeAccumulation.t.sol`, [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) | ✅ unit + ✅ integration proven (iter 23) |
| 3–5 | Perps (trading/funding/liquidation) | `test/PerpUBIFeeSplitter.t.sol`, `test/perps/GoodPerps.t.sol`, `test/perps/PerpEngine.fuzz.t.sol` | `test/integration/UBIFeeAccumulation.t.sol`, [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) | ✅ unit + ✅ integration proven (iter 23) |
| 6–7 | Predict (factory + resolver) | `test/predict/GoodPredict.t.sol`, `test/predict/OptimisticResolver.t.sol` | `test/integration/UBIFeeVerification.t.sol` | ⏳ proof needed (iter 24) |
| 8 | Lend reserve factor | `test/GoodLend.t.sol` | `test/integration/UBIFeeAccumulation.t.sol` | ⏳ proof needed (iter 24) |
| 9–12 | Stable (stability / minting / liquidation / governance) | `test/StableUBIFeeSplitter.t.sol`, `test/GoodStable.t.sol` | `test/integration/UBIFeeVerification.t.sol` | ⏳ proof needed (iter 24) |
| 13–14 | Stocks (trading + liquidation remnant) | `test/CollateralVault.t.sol`, `test/stocks/GoodStocks.t.sol` | `test/integration/UBIFeeVerification.t.sol` | ⏳ proof needed (iter 24) |
| — | Generic splitter | `test/UBIFeeSplitter.t.sol`, `test/UBIFeeSplitter.invariant.t.sol` | — | ✅ unit + invariant |
| — | Revenue tracker | `test/UBIRevenueTracker.t.sol` | — | ✅ unit |
| — | UBI claim sink | `test/UBIClaimV2.t.sol` | `test/integration/AllProtocols.t.sol` | ✅ unit + integration |
| — | Cross-protocol smoke | — | `test/integration/CrossProtocol.t.sol`, `test/integration/AllProtocols.t.sol` | ✅ |

### Known failing tests (already tracked)

These pre-existed iteration 22 and are tracked as their own tasks. They
do **not** block this iteration's truth-source goal because iteration 22
is purely documentation; they will be addressed in iteration 23/24
before the per-protocol proofs land.

- `gooddollar-l2-fix-goodperps-test-failures` — 18 GoodPerps test
  failures (`EvmError: Revert`).
- `gooddollar-l2-fix-ubi-fee-splitter-test-failures` — 9 UBI Fee
  Splitter test failures (gas overhead + arithmetic).
- `gooddollar-l2-fix-opstack-bridge-test` — OPStack bridge test
  authorization failure.

### Running the suite

```bash
# From repo root, isolated UBI-fee subset:
forge test --match-path 'test/UBIFeeSplitter*' -vv
forge test --match-path 'test/PerpUBIFeeSplitter*' -vv
forge test --match-path 'test/StableUBIFeeSplitter*' -vv
forge test --match-path 'test/UBIFeeHook*' -vv
forge test --match-path 'test/integration/UBIFee*' -vv
```

---

## 7. Verification commands (manual)

When in doubt, these one-liners confirm the wiring is live on devnet.

```bash
# 1. UBIFeeSplitter is registered as Lend pool treasury
cast call $(jq -r .contracts.GoodLendPool op-stack/addresses.json) \
  "treasury()(address)" --rpc-url https://rpc.goodclaw.org

# 2. PerpEngine points at PerpUBIFeeSplitter
cast call $(jq -r .contracts.PerpEngine op-stack/addresses.json) \
  "feeSplitter()(address)" --rpc-url https://rpc.goodclaw.org

# 3. LiFiBridgeAggregator points at the generic splitter
cast call $(jq -r .contracts.LiFiBridgeAggregator op-stack/addresses.json) \
  "ubiFeeSplitter()(address)" --rpc-url https://rpc.goodclaw.org

# 4. UBIFeeHook ubiPool is GoodDollarToken
cast call $(jq -r .contracts.UBIFeeHook op-stack/addresses.json) \
  "ubiPool()(address)" --rpc-url https://rpc.goodclaw.org

# 5. Default split is still 20% / 16.67%
cast call $(jq -r .contracts.UBIFeeSplitter op-stack/addresses.json) \
  "ubiBPS()(uint256)" --rpc-url https://rpc.goodclaw.org
cast call $(jq -r .contracts.UBIFeeSplitter op-stack/addresses.json) \
  "protocolBPS()(uint256)" --rpc-url https://rpc.goodclaw.org
```

---

## 8. Open gaps and TODOs (for iter 23–28)

1. **Live receipts.** Every route in §4 needs a captured devnet tx hash
   in iterations 23 and 24. The integration tests above already simulate
   the calls, but the public gate needs at least one real receipt per
   protocol.
2. **GoodLend treasury check.** `GoodLendPool.treasury` is *intended* to
   be `UBIFeeSplitter` but is mutable via `setTreasury`. Add a CI
   assertion in iteration 24 that compares the on-chain value to
   `addresses.json#contracts.UBIFeeSplitter`.
3. **Stable enhanced ABI.** `PegStabilityModule` and `VaultManager` both
   prefer `splitMintingFee` / `splitFeeToken` and fall back to the base
   ABI. Iteration 24 should assert that the *enhanced* path is the one
   that fires on devnet.
4. **Predict resolver event.** `OptimisticResolver` calls
   `IUBIFeeSplitterResolver.splitFee` but currently emits no
   protocol-side event. Add a `UBIShareForwarded` event in iteration 24
   or accept the splitter's own event as the source of truth.
5. **Analytics labels.** Iteration 26 will export
   `UBIRevenueTracker`-friendly labels for each call edge (`protocol`,
   `event`, `token`). The table in §4 is the input format.
6. **V4 hook BPS in production.** `UBIFeeHook.ubiFeeShareBPS` defaults
   to 2000 (20%) but is settable up to `MAX_FEE_BPS = 5000` (50%).
   Iteration 25 must surface the live value in the README so users
   never see a stealth change.

---

## 9. Change log

- **2026-05-18 — iter 22:** initial canonical spec written. No code
  changes; documentation only.
- **2026-05-18 — iter 23:** added integration proof for the five
  Swap/Perps UBI fee routes (rows 1, 2, 3–5). Proof file:
  [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol).
  See the "Iter 23 receipt" block below.

---

## 10. Iter 23 receipt — Swap + Perps integration proof

The five `⏳ proof needed (iter 23)` rows above have flipped to
`✅ integration proven (iter 23)`. One Foundry file proves each route
with **both** the source contract's exact event signature (via
qualified `Contract.Event` emit syntax so `vm.expectEmit` matches the
real topic0) **and** the post-call UBI sink balance delta. A sixth
cumulative test exercises all five routes in sequence and asserts the
aggregate `GoodDollarToken.ubiPool` + LiFi splitter balance + per-source
Perp accumulators all match the expected sum of UBI shares.

### Test file

[`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol)

### Routes covered

| # | Route | Event asserted | Balance delta asserted |
|---|---|---|---|
| 1 | `UBIFeeHook.afterSwap` (V4) | `UBIFeeHook.UBIFeeCollected(token, feeAmount, ubiShare, pool)` | `GoodDollarToken.ubiPool()` += `feeAmount × ubiFeeShareBPS / 10_000` |
| 2 | `LiFiBridgeAggregator.initiateSwap` (ERC-20 path) | `LiFiBridgeAggregator.UBIFeeCollected(swapId, token, fee)` | `MockERC20.balanceOf(ubiFeeSplitter)` += `amountIn × ubiFeeRateBps / 10_000` |
| 3 | `PerpUBIFeeSplitter.splitFee` (trading) | `PerpUBIFeeSplitter.FeeSplit(source, "trading", totalFee, ubi, protocol, dApp)` | `GoodDollarToken.ubiPool()` += `totalFee × ubiBPS / 10_000` |
| 4 | `PerpUBIFeeSplitter.splitFundingFee` | `PerpUBIFeeSplitter.FundingFeeSplit(marketId, totalFee, ubiShare)` | `GoodDollarToken.ubiPool()` += `totalFee × ubiBPS / 10_000` |
| 5 | `PerpUBIFeeSplitter.splitLiquidationFee` | `PerpUBIFeeSplitter.LiquidationUBI(liquidator, trader, totalFee, ubiShare)` | `GoodDollarToken.ubiPool()` += `totalFee × ubiBPS / 10_000` |

### Forge pass receipt

```
$ forge test --match-path 'test/integration/UBIFeeIntegrationProofSwapPerps*' -vv
Compiling 1 files with Solc 0.8.33
Solc 0.8.33 finished in 2.83s
Compiler run successful!

Ran 6 tests for test/integration/UBIFeeIntegrationProofSwapPerps.t.sol:UBIFeeIntegrationProofSwapPerps
[PASS] test_cumulative_allFiveRoutes_aggregateDeltasMatch() (gas: 809593)
[PASS] test_route1_swapV4Hook_emitsEventAndIncrementsUbiPool() (gas: 139366)
[PASS] test_route2_swapLiFi_emitsEventAndTransfersFeeToSplitter() (gas: 327303)
[PASS] test_route3_perpTrading_emitsFeeSplitAndIncrementsUbiPool() (gas: 161201)
[PASS] test_route4_perpFunding_emitsFundingFeeSplitAndIncrementsUbiPool() (gas: 201884)
[PASS] test_route5_perpLiquidation_emitsLiquidationUBIAndIncrementsUbiPool() (gas: 276564)
Suite result: ok. 6 passed; 0 failed; 0 skipped; finished in 2.70ms (4.96ms CPU time)

Ran 1 test suite in 7.36ms (2.70ms CPU time): 6 tests passed, 0 failed, 0 skipped (6 total tests)
```

### What remains (iter 24)

Rows 6–14 (Predict factory + resolver, Lend reserve factor, Stable
stability/minting/liquidation/governance, Stocks trading + liquidation
remnant) are still `⏳ proof needed (iter 24)`. They will land in a
sister file `test/integration/UBIFeeIntegrationProofRest.t.sol` using
the same shape: qualified-event `vm.expectEmit` plus balance-delta
assertions.
