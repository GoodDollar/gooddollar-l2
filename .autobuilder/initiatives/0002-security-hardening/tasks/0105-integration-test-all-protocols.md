---
id: gooddollar-l2-integration-test-all-protocols
title: "Integration Test — Execute Real On-Chain Transactions Across All 6 Protocols"
type: test
priority: P0
parent: gooddollar-l2
depends_on: []
planned: true
executed: true
---

# Integration Test — Execute Real On-Chain Transactions Across All 6 Protocols

## Problem
Acceptance criterion #3 requires real on-chain transactions executed across all 6 protocols (GoodSwap, GoodPerps, GoodLend, GoodStable, GoodStocks, GoodPredict) on the Anvil devnet. No integration test script exists yet.

## Research — Actual Contract Signatures

Source code inspection of each protocol contract:

| Protocol | Contract | Address Env Var | Function Signature |
|----------|----------|-----------------|-------------------|
| GoodSwap | GoodSwapRouter | `SWAP` | `swapExactTokensForTokens(uint256,uint256,address[],address,uint256)` |
| GoodPerps | MarginVault | `VAULT` | `deposit(uint256)` |
| GoodPerps | PerpEngine | `PERP` | `openPosition(uint256,uint256,bool,...)` |
| GoodLend | GoodLendPool | `LEND` | `supply(address,uint256)` |
| GoodStable | VaultManager | `VAULT_MANAGER` | `depositCollateral(bytes32,uint256)` — needs ilk key |
| GoodStocks | CollateralVault | `COLLATERAL_VAULT` | `depositCollateral(string,uint256)` then `mint(string,uint256)` |
| GoodPredict | MarketFactory | `MF` | `createMarket(string,uint256,address)` — needs `onlyMarketCreator` |

Key notes:
- GoodSwap router requires `path` array `[tokenIn, tokenOut]`, deadline, and `amountOutMin`.
- GoodStable uses `bytes32 ilk` keys, not ETH value. Need to query the CollateralRegistry for active ilks.
- GoodPredict `createMarket` requires `onlyMarketCreator` — use DEPLOYER_KEY (admin) or grant tester access.
- GoodStocks needs `depositCollateral` before `mint`, both using string ticker.
- All ERC20 interactions need `approve()` first.

## Architecture

```
scripts/integration-test.sh
├── Source .autobuilder/addresses.env
├── Helper: send_tx() — wraps cast send, checks status=1
├── 1. GoodSwap: approve GDT → swapExactTokensForTokens
├── 2. GoodPerps: approve GDT → deposit margin → openPosition
├── 3. GoodLend: approve GDT → supply
├── 4. GoodStable: approve GDT → depositCollateral (with ilk)
├── 5. GoodStocks: approve GDT → depositCollateral → mint
├── 6. GoodPredict: createMarket (with deployer key as admin)
└── Summary: pass/fail per protocol, exit code
```

Single bash file, <200 lines. Uses `cast send` and `cast call`. No external dependencies beyond Foundry.

## One-Week Decision
YES — this is a single script file, well under one week. No split needed.

## Implementation Plan

1. Create `scripts/integration-test.sh` with:
   - `send_tx()` helper that runs `cast send`, captures output, checks for "status: 1" (or uses `--json` + jq)
   - Protocol-specific test functions for each of the 6 protocols
   - Summary reporter at the end
   - Exit 0 only if all pass
2. Make it executable (`chmod +x`)
3. Run the script against the live Anvil devnet to verify all 6 protocols
4. Report results

## Acceptance Criteria
- [x] Script executes successfully with all 6 protocols returning status=1
- [x] Each protocol's core operation completes without revert
- [x] Script is idempotent and can be re-run

## Execution Notes
Existing `scripts/verify-onchain-integration.sh` already implements all requirements. Executed on 2026-05-16 — all 6 protocols returned `status=0x1`. JSON receipts saved to `.autobuilder/integration-receipts/`. Full report at `.autobuilder/integration-results.md`.
