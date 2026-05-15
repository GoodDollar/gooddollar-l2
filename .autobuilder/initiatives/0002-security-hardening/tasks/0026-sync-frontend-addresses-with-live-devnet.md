---
id: gooddollar-l2-sync-frontend-addresses-with-live-devnet
title: "Frontend — Sync contract addresses with live devnet (op-stack/addresses.json + refresh script)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, frontend, devnet, addresses, blocks-frontend, production-readiness]
---

# Frontend — Sync contract addresses with live devnet

## Why this is CRITICAL (blank-page / data-loss)

After the iter9 Caddy/CORS fix (task 0025) the home `/` and `/activity`
pages started rendering live data again. But during iter10's mandatory
visual sweep four top-level dashboards still show
**"Unable to load dashboard data. Is the devnet running?"** for every
visitor:

- `https://goodswap.goodclaw.org/ubi-impact`
- `https://goodswap.goodclaw.org/governance`
- `https://goodswap.goodclaw.org/stable`
- `https://goodswap.goodclaw.org/explore`

The devnet is healthy: `cast call` against the canonical addresses in
`.autobuilder/addresses.env` returns real data (e.g.
`UBI_REVENUE_TRACKER.protocolCount() = 7`). The reason the frontend
sees nothing is that **`frontend/src/lib/devnet.ts` is calling stale
contract addresses** — the addresses it imports from
`op-stack/addresses.json` were last refreshed `2026-04-05`, but the
chain has been redeployed several times since then (last refresh of
`addresses.env` was `2026-05-15 17:08:06`).

Concrete address mismatches today (frontend → live devnet):

| Symbol               | `frontend/src/lib/devnet.ts`           | `.autobuilder/addresses.env`                  | Status |
|----------------------|----------------------------------------|-----------------------------------------------|--------|
| `GoodDollarToken`    | `0x36C02dA8…`                          | `0x8f86403a…` (`GDT`)                         | stale  |
| `UBIFeeSplitter`     | `0x3abBB0D6…`                          | `0x809d550fca…` (`FEE_SPLITTER`)              | stale  |
| `MarketFactory`      | `0x74ef2B06…`                          | `0x02df3a3f…` (`MF`)                          | stale  |
| `PerpEngine`         | `0x021DBfF4…`                          | `0x084815d1…` (`PERP`)                        | stale  |
| `MarginVault`        | `0xb22c2552…`                          | `0x82bbaa3b…` (`VAULT`)                       | stale  |
| `GoodLendPool`       | `0x49fd2be6…`                          | `0xcbeaf3bd…` (`LEND`)                        | stale  |
| `gUSD`               | `0x5D42EbDb…`                          | `0xed12be40…` (`GUSD`)                        | stale  |
| `VaultManager`       | `0xAb7b4C59…`                          | `0x3489745e…` (`VAULT_MANAGER`)               | stale  |
| `PegStabilityModule` | `0x821f3361…`                          | `0x9eb52339…` (`PSM`)                         | stale  |
| `GoodDAO`            | `0x9A86494B…`                          | `0x8198f5d8…` (`GOOD_DAO`)                    | stale  |
| `VoteEscrowedGD`     | `0x8B64968F…`                          | `0x36b58f5c…` (`VE_GD`)                       | stale  |
| `UBIRevenueTracker`  | `0x021DBfF4…` (== old `PerpEngine`!)   | `0xfd6f7a6a…` (`UBI_REVENUE_TRACKER`)         | **wrong contract** |
| `GoodSwapRouter`     | `0x975cDd86…`                          | `0x975cdd86…` (`SWAP`)                        | OK     |

Note the worst case: the frontend's `UBIRevenueTracker` address is the
**same address as the old `PerpEngine`**, so `useDashboardData()` is
literally calling the wrong contract. Any call that happens to hit
empty bytecode or a mismatched function selector reverts with
`execution reverted, data: "0x"`, which the wagmi wrapper surfaces as
the generic "Unable to load dashboard data" banner used by every
broken page.

This is in-scope for the Phase 1 initiative under "Production
Readiness" (chain-reads from the production frontend cannot work),
and is being filed as CRITICAL per the initiative rule that allows
out-of-scope tasks "(unless an issue is CRITICAL — app crash, blank
page, data loss)". Four top-level pages render as broken dashboards
for every visitor on the production deployment until this is fixed.

## Goal

Eliminate the "Unable to load dashboard data" banner on `/ubi-impact`,
`/governance`, `/stable`, and `/explore` by making the frontend point
at the **same canonical addresses** the rest of the project uses
(those in `.autobuilder/addresses.env`), and prevent the drift from
recurring by having `scripts/refresh-addresses.py` also update
`op-stack/addresses.json` whenever it regenerates `addresses.env`.

## Source pointers

- `frontend/src/lib/devnet.ts` (lines ~34–137):
  All addresses currently come either from `op-stack/addresses.json`
  (`rawAddresses.contracts.*`) or are hardcoded inline.
  This file is the single source of truth for the wagmi hooks under
  `frontend/src/lib/use*.ts`.
- `op-stack/addresses.json`:
  `_comment` says "updated 2026-04-05" — months of redeployments are
  missing.
- `.autobuilder/addresses.env`:
  Canonical, regenerated automatically by
  `scripts/refresh-addresses.py` from the most recent broadcast
  artefacts. **This file is the truth.**
- `scripts/refresh-addresses.py`:
  Already walks `broadcast/*.s.sol/<chain_id>/run-latest.json` and
  verifies `eth_getCode`. Today it only writes `addresses.env`; we
  also need it to write `op-stack/addresses.json`.

## Out of scope

- Fixing `UBIRevenueTracker.feeSplitter` itself — even after the
  frontend points at the correct tracker (`0xfd6f7a6a…`), its
  on-chain `feeSplitter` field still points at a code-less address
  and `getDashboardData()` will revert. That is task **0027**
  (`reconfigure-ubirevenuetracker-feesplitter`) and runs after this
  one. This task only fixes the address-routing layer.
- Slither / contract security work (covered by the initiative spec
  but executed in other tasks).
- OP Stack migration (Phase 2).

## Acceptance Criteria

1. `op-stack/addresses.json` has its `contracts` map regenerated to
   match `.autobuilder/addresses.env` for every overlapping symbol.
   In particular the following must update to the live values:
   `GoodDollarToken`, `UBIFeeSplitter`, `MarketFactory`, `PerpEngine`,
   `MarginVault`, `GoodLendPool`, `gUSD`, `VaultManager`,
   `PegStabilityModule`, `GoodDAO`, `VoteEscrowedGD`,
   `CollateralVault`, `CollateralRegistry`, `StabilityPool`,
   `FundingRate`, `PerpPriceOracle`, `SwapPriceOracle`,
   `ValidatorStaking`, `UBIClaimV2`, `UBIFeeHook`,
   `LiFiBridgeAggregator`, `SyntheticAssetFactory`,
   `StocksPriceOracle`. Symbols with no matching entry in
   `addresses.env` are left untouched.
   The file's `_comment` is updated to reflect the new sync
   timestamp and the source of truth.
2. `frontend/src/lib/devnet.ts` is updated so:
   - `UBIRevenueTracker` is set to the live address from
     `addresses.env` (`UBI_REVENUE_TRACKER`) and is **not** the same
     as `PerpEngine` anymore.
   - The hardcoded `UBIFeeSplitter` / `GoodDAO` /
     `VoteEscrowedGD` lines (and any other live-deploy contracts that
     drift from `addresses.env`) point at the canonical values.
     If they continue to be sourced from `rawAddresses.contracts.*`,
     that's fine **as long as** those values are now the canonical
     ones after step 1.
3. `scripts/refresh-addresses.py` is extended so that each successful
   run writes both `.autobuilder/addresses.env` **and**
   `op-stack/addresses.json` (preserving the JSON's existing keys
   like `chain_id`, `chain_name`, `rpc_url`, `explorer_url`, `admin`,
   `sequencer`, `batcher`, `proposer`). Symbols absent from the
   refresh map are preserved.
4. After the change, calling
   `cast call $UBI_REVENUE_TRACKER "protocolCount()(uint256)"`
   from the frontend's perspective (i.e. the address now in
   `CONTRACTS.UBIRevenueTracker`) returns `7` against the live RPC.
5. After the change, all four dashboards (`/ubi-impact`,
   `/governance`, `/stable`, `/explore`) **either** render real data
   **or**, if `getDashboardData()` still reverts because of task
   0027, render with the new addresses but without changing the
   "Unable to load dashboard data" copy. (The semantic fix of the
   tracker's internal pointer is the next task.)
6. `frontend` continues to type-check and build:
   `cd frontend && npm run typecheck && npm run build` succeed.
7. `scripts/refresh-addresses.py` continues to exit 0 against the
   live RPC: `python3 scripts/refresh-addresses.py --rpc
   http://localhost:8545 --chain-id 42069` succeeds and the
   resulting `op-stack/addresses.json` is byte-identical on a second
   run (idempotent).

## Definition of Done

- `frontend/src/lib/devnet.ts` and `op-stack/addresses.json` agree
  with `.autobuilder/addresses.env` on every overlapping symbol.
- `scripts/refresh-addresses.py` updates both files on every run.
- All four broken dashboards stop attributing the failure to the
  frontend's address layer (verified via `agent-browser snapshot` and
  via direct `cast call` to `CONTRACTS.UBIRevenueTracker`).
- README.md "Updated:" date and stats refreshed per the initiative
  policy.

## Verification

```bash
# 1. Refresh and check idempotence
python3 scripts/refresh-addresses.py --rpc http://localhost:8545 --chain-id 42069
git diff op-stack/addresses.json   # diff visible
python3 scripts/refresh-addresses.py --rpc http://localhost:8545 --chain-id 42069
git diff op-stack/addresses.json   # no further diff (idempotent)

# 2. Frontend type-check & build
( cd frontend && npm run typecheck && npm run build )

# 3. Confirm UBIRevenueTracker now resolves to a real, distinct contract
node -e "const { CONTRACTS } = require('./frontend/.next/standalone/.../devnet.js') /* OR */;
         console.log('check')"
# (Equivalent: open frontend/src/lib/devnet.ts and grep for the address.)

# 4. Live RPC sanity
source .autobuilder/addresses.env
cast call $UBI_REVENUE_TRACKER "protocolCount()(uint256)" --rpc-url $RPC
# Expect: 7
```

## Notes for the implementer

- The whole point of this task is *reconciliation*; resist the
  temptation to also redeploy contracts here. The deployments are
  fine — only the JSON copy is stale.
- `op-stack/addresses.json` may contain extra keys
  (`CollateralVault_WRONG_GDT`, `AgentRegistry`, etc.) that the
  refresh script does not know about. Keep them; only overwrite the
  ones that are in the symbol map.
- `gUSD` lives under both `gUSD` (lowercase g) in JSON and `GUSD`
  in the env. Map them carefully so we don't drop the JSON key name
  every script run.
- `UBIClaimV2` in `op-stack/addresses.json` is currently set to the
  same address as `FEE_SPLITTER` in `addresses.env`
  (`0x809d550f…`). That suggests the JSON's `UBIClaimV2` value was
  already wrong at refresh time. The refresh script's symbol map
  separates `UBIClaimV2` (`UBI_CLAIM`) from `UBIFeeSplitter`
  (`FEE_SPLITTER`), so this task should fix that drift too.
