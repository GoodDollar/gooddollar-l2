---
id: gooddollar-l2-reconfigure-ubirevenuetracker-feesplitter-pointer
title: "On-chain — Reconfigure UBIRevenueTracker.feeSplitter so getDashboardData stops reverting"
parent: gooddollar-l2
deps: [gooddollar-l2-sync-frontend-addresses-with-live-devnet]
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, on-chain, ubi-revenue-tracker, fee-splitter, blocks-frontend, production-readiness]
---

# On-chain — Reconfigure `UBIRevenueTracker.feeSplitter`

## Why this is CRITICAL (blank-page / data-loss)

Even after task 0026 makes the frontend point at the *correct*
`UBIRevenueTracker` (`0xfd6f7a6a…`), the page
`https://goodswap.goodclaw.org/ubi-impact` still cannot render
because the wagmi hook `useDashboardData()` calls
`getDashboardData()`, and **that call reverts on-chain**:

```
$ cast call $UBI_REVENUE_TRACKER "getDashboardData()" --rpc-url $RPC
Error: server returned an error response: error code 3:
execution reverted, data: "0x"
```

The reason is visible in `src/UBIRevenueTracker.sol`:
`getDashboardData()` calls `feeSplitter.totalFeesCollected()` and
`feeSplitter.totalUBIFunded()` on its internal `feeSplitter`
state variable. That variable currently points at
`0xC0BF43A4Ca27e0976195E6661b099742f10507e5`, which has **no code**
on the live devnet:

```
$ cast call $UBI_REVENUE_TRACKER "feeSplitter()(address)" --rpc-url $RPC
0xC0BF43A4Ca27e0976195E6661b099742f10507e5

$ cast code 0xC0BF43A4Ca27e0976195E6661b099742f10507e5 --rpc-url $RPC
0x
```

The canonical, live `UBIFeeSplitter` from `.autobuilder/addresses.env`
is `0x809d550fca64d94bd9f66e60752a544199cfac3d` and **does** have
code:

```
$ cast code 0x809d550fca64d94bd9f66e60752a544199cfac3d --rpc-url $RPC
0x6080604052... (real bytecode)
```

So the tracker is misconfigured: it was deployed with a fee-splitter
address that pointed at an older deployment's slot which has since
been overwritten. The frontend can do nothing on its own to fix this
— the call has to come from on-chain admin.

`UBIRevenueTracker.admin()` returns
`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`, which is anvil
account #0 (matching `DEPLOYER_KEY`
`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
in `.autobuilder/addresses.env`), and the contract exposes
`setFeeSplitter(address)` with `onlyAdmin`:

```
function setFeeSplitter(address _feeSplitter) external onlyAdmin {
    require(_feeSplitter != address(0), "zero address");
    feeSplitter = IUBIFeeSplitterStats(_feeSplitter);
}
```

So one signed `cast send` transaction will repair this for good.

This is in-scope for the Phase 1 initiative under "Production
Readiness" / "Verify UBI Fee Routing" (the public UBI Impact
dashboard cannot render without it), and is being filed as CRITICAL
per the initiative rule that allows out-of-scope tasks "(unless an
issue is CRITICAL — app crash, blank page, data loss)".

## Goal

Repair the on-chain configuration of the canonical
`UBIRevenueTracker` so that `getDashboardData()` stops reverting
and the `/ubi-impact` page renders real data.

## Source pointers

- `src/UBIRevenueTracker.sol` lines 70–80 (`onlyAdmin`),
  100–135 (`getDashboardData`), 217–225 (`transferAdmin`,
  `setFeeSplitter`).
- `.autobuilder/addresses.env`:
  - `UBI_REVENUE_TRACKER=0xfd6f7a6a5c21a3f503ebae7a473639974379c351`
  - `FEE_SPLITTER=0x809d550fca64d94bd9f66e60752a544199cfac3d`
  - `DEPLOYER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
  - `RPC=http://localhost:8545`
- The on-chain admin (`UBI_REVENUE_TRACKER.admin()`) =
  `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` =
  the address derived from `DEPLOYER_KEY`.

## Out of scope

- Address-routing in the frontend (task 0026 — this task assumes
  0026 has merged so we know we're poking the same tracker the UI
  reads from).
- Re-deploying the tracker. No bytecode change is required; this is
  a configuration repair, not a redeploy.
- Slither / contract security work.

## Acceptance Criteria

1. A new repo script
   `scripts/repair-ubi-revenue-tracker-feesplitter.sh` is added that:
   - Loads `.autobuilder/addresses.env`.
   - Reads the current `feeSplitter` pointer and prints the before
     value.
   - Sends `setFeeSplitter(FEE_SPLITTER)` from `DEPLOYER_KEY` to
     `UBI_REVENUE_TRACKER` using `cast send` against `RPC`.
   - Reads `feeSplitter` again and prints the after value.
   - Calls `getDashboardData()` and asserts it does not revert
     (the script exits non-zero if it does).
   - Is idempotent: running it twice is a no-op on the second run
     except for the second `cast call`.
2. The script is invoked once during this task's execution against
   the live devnet so that `feeSplitter()` returns
   `0x809d550fca64d94bd9f66e60752a544199cfac3d` after the task
   commit.
3. After the call:
   ```
   cast call $UBI_REVENUE_TRACKER "getDashboardData()" --rpc-url $RPC
   ```
   returns a real ABI-encoded tuple and exits 0 — no
   `execution reverted, data: "0x"`.
4. `https://goodswap.goodclaw.org/ubi-impact`, captured via
   `agent-browser snapshot`, no longer shows
   "Unable to load dashboard data. Is the devnet running?" — it
   either shows the dashboard cards with real numbers or, if the
   tracker has zero historical data, the empty-state with the
   actual `protocolCount = 7` registered protocols (no error
   banner).
5. A regression test is added under `test/UBIRevenueTracker.*` that
   instantiates the tracker with a non-code address and asserts
   that the admin can repair it via `setFeeSplitter`. (This catches
   the same bug class going forward; a unit test in the existing
   tracker test file is acceptable.)
6. `forge test` continues to pass overall.
7. README.md "Updated:" date and the "Security Hardening" section
   are refreshed per the initiative policy, noting the on-chain
   repair.

## Definition of Done

- `feeSplitter` on `UBI_REVENUE_TRACKER` equals `FEE_SPLITTER` from
  `addresses.env`.
- `getDashboardData()` no longer reverts on the live devnet.
- `/ubi-impact` no longer shows the "Unable to load dashboard
  data" banner.
- The repair is reproducible via a committed shell script.

## Verification

```bash
source .autobuilder/addresses.env

# Before
cast call $UBI_REVENUE_TRACKER "feeSplitter()(address)" --rpc-url $RPC
# 0xC0BF43A4Ca27e0976195E6661b099742f10507e5  (broken)

bash scripts/repair-ubi-revenue-tracker-feesplitter.sh

# After
cast call $UBI_REVENUE_TRACKER "feeSplitter()(address)" --rpc-url $RPC
# 0x809d550fca64d94bd9f66e60752a544199cfac3d  (fixed)

cast call $UBI_REVENUE_TRACKER "getDashboardData()" --rpc-url $RPC
# real ABI-encoded tuple, no revert

# Browser snapshot
agent-browser --session iter10 --ignore-https-errors \
  snapshot https://goodswap.goodclaw.org/ubi-impact
# expect: no "Unable to load dashboard data" banner
```

## Notes for the implementer

- This task assumes 0026 has already merged. If the frontend still
  uses the stale tracker address, fixing the canonical tracker
  on-chain will be invisible to the UI.
- `setFeeSplitter` is `onlyAdmin`. The admin is anvil account #0,
  whose private key is the project-wide `DEPLOYER_KEY` in
  `.autobuilder/addresses.env`. Do not invent a new key.
- This is a **configuration repair**, not a redeploy. Resist the
  temptation to redeploy `UBIRevenueTracker` here — that would
  invalidate the addresses task 0026 just synced.
- If a future deployment script wants to wire `feeSplitter`
  correctly at construction time, that's a separate, lower-priority
  cleanup and out of scope here.
