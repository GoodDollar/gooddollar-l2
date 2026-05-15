---
id: fix-ubifeesplitter-good-dollar-binding
title: "Reconfigure UBIFeeSplitter to point at the current GDT"
parent: security-hardening-root
deps: []
split: false
depth: 1
planned: true
executed: true
executed_at: 2026-05-15T16:55:00Z
script: script/RebindUBIFeeSplitterGoodDollar.s.sol
tx_hash: 0x69f62cc8cfcc338a262a21fc94dffe5c960d6b41b60e5a344b593da8c40c7141
---

## Context

Task 0009 (`refresh-addresses-and-verify-onchain`) regenerated
`.autobuilder/addresses.env` and ran the new
`scripts/verify-onchain-integration.sh` against the live Anvil devnet
(chain 42069, RPC :8545). The resulting integration report
(`.autobuilder/initiatives/0002-security-hardening/integration-results.md`)
shows that **UBI fee accrual cannot be observed** because the live
`UBIFeeSplitter` is wired to a stale `goodDollar` address:

| Field                      | Value                                          |
|---------------------------|------------------------------------------------|
| `FEE_SPLITTER`            | `0x809d550fca64d94bd9f66e60752a544199cfac3d` |
| `FEE_SPLITTER.goodDollar()` | `0x5fbdb2315678afecb367f032d93f642f64180aa3` (DEAD) |
| Current `GDT`             | `0x8f86403a4de0bb5791fa46b8e795c547942fe4cf` (live) |
| `FEE_SPLITTER.admin()`    | `0xf39Fd6e51aad88F6F4ce6aB8827279cFFFb92266` (Anvil deployer) |

I confirmed live on-chain (current iteration) that:

1. `setGoodDollar(address)` exists on the deployed splitter — selector
   `0xc7888a6d` is present in the contract's bytecode.
2. The splitter's `admin()` is the Anvil deployer
   (`0xf39Fd6e51aad88F6F4ce6aB8827279cFFFb92266`), whose key is in
   `addresses.env` as `DEPLOYER_KEY`.
3. A dry-run `cast call --from <admin> setGoodDollar(<current GDT>)`
   returns `0x` (i.e. would not revert if sent as a transaction).

This is the simplest blocker on Acceptance Criterion #4 (UBI 33% fee
routing verified end-to-end) of the initiative, and it's pure config —
no Solidity or new deploys.

## Acceptance Criteria

1. A small Foundry script `script/FixUBIFeeSplitterGDT.s.sol` exists at
   the project root that:
   - Reads the splitter address from env `FEE_SPLITTER` (default to
     current devnet value if unset).
   - Reads target GDT from env `GD_TOKEN`.
   - Calls `IUBIFeeSplitter(splitter).setGoodDollar(gdToken)` from the
     deployer / admin private key (`PRIVATE_KEY` env, default to the
     Anvil deployer key already used by other deploy scripts).
   - Emits a console log of `before` and `after` `goodDollar()`.
2. After running the script against the live devnet, the live splitter
   returns `goodDollar() == 0x8f86403a4de0bb5791fa46b8e795c547942fe4cf`
   (current `GDT`).
3. The transaction receipt is saved to
   `.autobuilder/integration-receipts/_fix-ubifeesplitter-gdt.json` with
   `status: 0x1`.
4. `integration-results.md` is appended (NOT rewritten — existing content
   stays intact) with a "## 2026-05-15 — UBIFeeSplitter rebound to current
   GDT" entry that includes the tx hash and pre/post values.
5. `forge test` still passes (we are not modifying any production
   Solidity, only adding a deploy script).

## Implementation Notes

- The existing `IUBIFeeSplitter` interface lives in
  `src/interfaces/IUBIFeeSplitter.sol` — confirm it exposes
  `setGoodDollar(address)` and `goodDollar()`. If the interface file is
  missing the function, declare a minimal local interface inside the
  script (one function each) rather than editing the canonical interface.
- Reuse the env conventions of `script/RedeployGoodDollarToken.s.sol` for
  `PRIVATE_KEY` defaulting and `vm.envOr`.
- The script must be safe to re-run (idempotent): if
  `goodDollar() == GD_TOKEN` already, log "already correct" and exit 0
  without sending a transaction.
- Saving the receipt: after `forge script ... --broadcast`, parse the
  `broadcast/FixUBIFeeSplitterGDT.s.sol/42069/run-latest.json` to extract
  the tx hash, then `cast receipt <hash> --json` and pipe to the receipt
  file. Match the pattern used in `scripts/verify-onchain-integration.sh`.

## Non-Goals

- No changes to `UBIFeeSplitter.sol` itself — this is purely a deployed
  contract reconfiguration.
- Do not redeploy the splitter — its address is referenced by the live
  `UBIFeeHook` and other dApps; redeploying would invalidate them.
- Do not touch GoodSwap pools / GoodPerps vault — those are tracked by
  separate tasks (0011, 0012).

## Verification

```bash
cd /home/goodclaw/gooddollar-l2
source .autobuilder/addresses.env

# 1. Confirm pre-state
cast call $FEE_SPLITTER "goodDollar()(address)" --rpc-url $RPC
# Expect: 0x5fbdb2315678afecb367f032d93f642f64180aa3 (stale)

# 2. Run the fix script
forge script script/FixUBIFeeSplitterGDT.s.sol \
  --rpc-url $RPC --private-key $DEPLOYER_KEY --broadcast --legacy

# 3. Confirm post-state
cast call $FEE_SPLITTER "goodDollar()(address)" --rpc-url $RPC
# Expect: 0x8f86403a4de0bb5791fa46b8e795c547942fe4cf (current GDT)

# 4. Receipt file exists
ls -la .autobuilder/integration-receipts/_fix-ubifeesplitter-gdt.json

# 5. Tests still pass
forge test
```

## Planning (Step 2)

### Research

The `UBIFeeSplitter` ABI from
`broadcast/RedeployUBIAndLiFi.s.sol/42069/run-latest.json` shows its
constructor parameters and admin role. The `setGoodDollar(address)`
function is admin-gated. Bytecode of the live address contains the
function selector `0xc7888a6d` (verified via grep over `cast code`).

The Anvil deployer key (already in `addresses.env` as `DEPLOYER_KEY`) IS
the splitter admin — confirmed via
`cast call $FEE_SPLITTER "admin()(address)"` returning
`0xf39Fd6e51aad88F6F4ce6aB8827279cFFFb92266`, which equals
`vm.addr(DEPLOYER_KEY)`.

Existing precedent for "fix one config value" Foundry scripts:
`script/RedeployGoodDollarToken.s.sol` (small, env-driven, single-tx).
This new script will follow the same pattern.

### Architecture diagram

```
┌──────────────────────────┐
│ FixUBIFeeSplitterGDT.s.sol │
│  (forge script, ~40 LOC)   │
└─────────────┬─────────────┘
              │ vm.startBroadcast(DEPLOYER_KEY)
              ▼
┌──────────────────────────┐
│   UBIFeeSplitter (live)   │
│   0x809d…cfac3d           │
│   admin = deployer ✓     │
└─────────────┬─────────────┘
              │ setGoodDollar(0x8f86…4cf)
              ▼
       goodDollar = current GDT
              │
              ▼
┌──────────────────────────────────────────────┐
│ Future swap/perps txs → UBIFeeHook →         │
│   FEE_SPLITTER (now correctly wired) →       │
│   IERC20(GDT).transferFrom for 33% UBI fee   │
└──────────────────────────────────────────────┘
```

### One-week decision

YES — trivial. ~10 minutes total: write 40-line script (5 min), run
`forge script` (1 min), capture receipt + append results.md (3 min),
verify with `cast call` (1 min). No risk of cascading impact.

### Split

Not needed. Single-purpose, single-transaction.

### Implementation steps (for execute-task)

1. **Write `script/FixUBIFeeSplitterGDT.s.sol`** with:
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.20;
   import "forge-std/Script.sol";

   interface IUBIFeeSplitterMin {
       function admin() external view returns (address);
       function goodDollar() external view returns (address);
       function setGoodDollar(address) external;
   }

   contract FixUBIFeeSplitterGDT is Script {
       address constant SPLITTER_DEFAULT = 0x809d550fca64d94bd9f66e60752a544199cfac3d;
       address constant GDT_DEFAULT      = 0x8f86403a4de0bb5791fa46b8e795c547942fe4cf;

       function run() external {
           uint256 pk = vm.envOr("PRIVATE_KEY",
               uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
           address splitter = vm.envOr("FEE_SPLITTER", SPLITTER_DEFAULT);
           address gd = vm.envOr("GD_TOKEN", GDT_DEFAULT);

           IUBIFeeSplitterMin s = IUBIFeeSplitterMin(splitter);
           address before = s.goodDollar();
           console.log("FEE_SPLITTER:", splitter);
           console.log("admin       :", s.admin());
           console.log("before      :", before);
           console.log("target      :", gd);

           if (before == gd) {
               console.log("already correct, no tx sent");
               return;
           }

           vm.startBroadcast(pk);
           s.setGoodDollar(gd);
           vm.stopBroadcast();

           console.log("after       :", s.goodDollar());
       }
   }
   ```

2. **Run the script:**
   ```bash
   source .autobuilder/addresses.env
   forge script script/FixUBIFeeSplitterGDT.s.sol \
     --rpc-url $RPC --private-key $DEPLOYER_KEY --broadcast --legacy \
     2>&1 | tee /tmp/fix-splitter.log
   ```

3. **Capture the tx hash** from
   `broadcast/FixUBIFeeSplitterGDT.s.sol/42069/run-latest.json`
   (jq query: `.transactions[0].hash`), then:
   ```bash
   mkdir -p .autobuilder/integration-receipts
   cast receipt <HASH> --rpc-url $RPC --json \
     > .autobuilder/integration-receipts/_fix-ubifeesplitter-gdt.json
   ```

4. **Append to `integration-results.md`** a new section:
   ```markdown
   ## 2026-05-15 — UBIFeeSplitter rebound to current GDT

   - Splitter:    0x809d550fca64d94bd9f66e60752a544199cfac3d
   - goodDollar BEFORE: 0x5fbdb2315678afecb367f032d93f642f64180aa3 (dead)
   - goodDollar AFTER:  0x8f86403a4de0bb5791fa46b8e795c547942fe4cf (current GDT)
   - Tx: <hash>  | gasUsed: <n>  | status: 0x1
   - Receipt: .autobuilder/integration-receipts/_fix-ubifeesplitter-gdt.json
   ```

5. **Run `forge test`** to confirm no regression.

6. **Commit:**
   `chore(ubi): rebind UBIFeeSplitter.goodDollar to current GDT`

   Files staged:
   - `script/FixUBIFeeSplitterGDT.s.sol` (new)
   - `.autobuilder/integration-receipts/_fix-ubifeesplitter-gdt.json` (new)
   - `.autobuilder/initiatives/0002-security-hardening/integration-results.md` (modified)
   - `broadcast/FixUBIFeeSplitterGDT.s.sol/42069/run-latest.json` (auto)
