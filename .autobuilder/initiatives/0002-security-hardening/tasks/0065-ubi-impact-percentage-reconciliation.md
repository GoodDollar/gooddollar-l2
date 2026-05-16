---
id: gooddollar-l2-ubi-impact-percentage-reconciliation
title: "UBI Impact — Reconcile 33.3% Displayed Ratio vs 20% Documented UBI Split (Acceptance Criteria #4)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, contracts, ubi, ubi-fee-routing, critical, data-loss, security-hardening, acceptance-criteria]
---

# UBI Impact — Reconcile 33.3% Displayed Ratio vs 20% Documented UBI Split

## Problem statement

The UBI Impact dashboard at `/ubi-impact` (live on
`https://goodswap.goodclaw.org/ubi-impact`) contains a direct
self-contradiction that breaks user trust and directly violates
**Acceptance Criteria #4** of the active initiative
(`0002-security-hardening`): "UBI 20% fee routing verified end-to-end".

Observed on the live deployment (screenshot
`/tmp/iter31-screenshots/ubi-impact.png`):

- The page header announces in plain text:
  **"20% of all protocol fees route to UBI — verified on-chain."**
- The same page, in the "Total Fees → UBI" `StatCard`, displays:
  **"33.3% → UBI"**

20% ≠ 33.3%. One of the two numbers is wrong. Either:

(a) the contract `UBIFeeSplitter.ubiBPS` (currently `2000` = 20%, see
`src/UBIFeeSplitter.sol:21`) is being bypassed by some protocol that
routes a different share of its fees, OR

(b) the keeper that calls
`UBIRevenueTracker.reportFees(protocolId, fees, ubi, txs)` is
reporting `fees` and `ubi` with a different definition than the
splitter's actual 20% rule (e.g. reporting only the
ubi+protocol+dapp residue as `fees`, or reporting `ubi` for two
buckets), OR

(c) the dashboard label "20%" is stale marketing copy and the actual
on-chain split is no longer 20%.

Frontend code path verified:
- `frontend/src/app/(app)/ubi-impact/page.tsx:273` →
  `sub={\`${dashboard.ubiPercentage.toFixed(1)}% → UBI\`}`
- `frontend/src/lib/useUBIImpact.ts:106` →
  `ubiPct = totalFees > 0n ? Number((totalUBI * 10000n) / totalFees) / 100 : 0`
- The hook reads `getDashboardData()` directly from
  `UBIRevenueTracker`, so the displayed 33.3% is a faithful
  reflection of `totalUBITracked / totalFeesTracked` from chain.

This is not a frontend display bug. The frontend is correctly
reporting whatever ratio exists on-chain. The discrepancy is between
what the dashboard *claims* (20%) and what the tracker *records*
(33.3%) and is therefore a **data integrity / trust issue**, not a
visual bug.

## User story

As a UBI participant or potential investor visiting
`/ubi-impact`, I want the headline "20% of all protocol fees route
to UBI" to match the actual percentage displayed in the dashboard
metrics, so that I can trust the dashboard's claim and verify the
project's promise of routing 20% of fees to UBI.

As a security engineer working on Acceptance Criteria #4 of the
`0002-security-hardening` initiative ("UBI 20% fee routing verified
end-to-end"), I need the on-chain `UBIRevenueTracker` numbers to
prove the 20% split is actually happening — not a different number.

## How it was found

iteration #31 product review, `visual-polish` strategy. Per the
mandatory pre-review step, every main page was loaded on the live
deploy (`https://goodswap.goodclaw.org/`) via `agent-browser` and
screenshotted to `/tmp/iter31-screenshots/`. Reviewing
`ubi-impact.png` revealed:

- Header text "20% of all protocol fees route to UBI" prominently
  displayed near the top of the page.
- "Total Fees → UBI" stat card showing `XXX G$` with the subtitle
  literally reading `33.3% → UBI`.

Code investigation traced the 33.3% to
`UBIRevenueTracker.getDashboardData()`, which returns
`totalUBITracked / totalFeesTracked`. These values are written by
`reportFees()` calls from an admin keeper. Since
`UBIFeeSplitter.ubiBPS = 2000`, the splitter itself routes exactly
20% to UBI on every `splitFee()` invocation. The 33.3% therefore
means either:

- a protocol bypasses `UBIFeeSplitter` and reports its own
  (non-20%) split via `reportFees`,
- the keeper double-counts UBI relative to fees, or
- a test fixture left bogus values in `totalFeesTracked` /
  `totalUBITracked`.

## Proposed UX

The dashboard must either:

1. **Make the number match the claim**: identify which protocol or
   keeper is reporting a non-20% ratio, fix it so that
   `totalUBITracked / totalFeesTracked` rounds to 20.0%, and verify
   end-to-end via the `cast send` integration tests already in the
   initiative scope (Acceptance Criteria #4); OR

2. **Make the claim match the number**: if the 33.3% is intentional
   (e.g. some protocols choose to route 33.3%), update the header
   copy to say "20%+ of all protocol fees route to UBI — average
   currently 33.3%" or similar, and document why.

Option (1) is strongly preferred because the initiative's
acceptance criterion specifically requires the 20% to be verified.

The fix must also include a script in `script/verify-ubi-split.sh`
(or extend the integration test in the initiative spec section 5)
that prints, after every protocol's `cast send` invocation, the
delta `(splitterUBI_after - splitterUBI_before)` and the delta
`(splitterFees_after - splitterFees_before)`, and asserts the
ratio is `0.20 ± 0.001`. That makes the "verified end-to-end"
language of Acceptance Criteria #4 literally true.

## Acceptance criteria

- [ ] Investigation note documents which value is correct (the 20%
      header copy or the 33.3% computed ratio) and why the other is
      wrong. Note attached to the task as `## Investigation`.
- [ ] If 33.3% is wrong: the offending keeper / protocol is
      patched so that `totalUBITracked * 5 ≈ totalFeesTracked`
      (i.e. the on-chain ratio is 20.0% ± 0.5%) after a clean
      tracker reset on the devnet.
- [ ] If 20% header is wrong: the header copy on
      `frontend/src/app/(app)/ubi-impact/page.tsx` is updated to
      accurately describe the actual split, with a `title=` and
      tooltip explaining the math.
- [ ] After the fix, the live `/ubi-impact` dashboard shows the
      same percentage in the header and in the "Total Fees → UBI"
      `StatCard` (within ±0.5% rounding tolerance).
- [ ] A verification script (`script/verify-ubi-split.sh` or
      similar) runs at least one `cast send` per protocol
      (GoodSwap, GoodPerps, GoodLend, GoodStable, GoodStocks,
      GoodPredict) and asserts the per-tx UBI share is 20% ± 1bps
      of the splitter fee.
- [ ] README.md "Security Hardening" section updated to note this
      reconciliation and link to the verification script. README
      "Updated:" date refreshed.
- [ ] Existing UBI tracker unit/integration tests pass; new
      ratio-assertion test added in `test/UBIRevenueTracker.t.sol`
      or `test/UBIFeeSplitter.t.sol`.

## Verification

- agent-browser regression: open
  `https://goodswap.goodclaw.org/ubi-impact` post-fix, screenshot,
  confirm header % and StatCard % match.
- `forge test --match-contract UBI` passes with new ratio assertion.
- `bash script/verify-ubi-split.sh` exits 0 after running through
  all 6 protocols on the local Anvil devnet.
- `npx -y react-doctor@latest . --verbose --diff` — score ≥ 75 on
  any touched frontend file; no new errors.

## Out of scope

- Changing the 20% target itself (it is a project policy decision,
  not a code decision — task is reconciliation, not redesign).
- Reworking the rest of the `/ubi-impact` dashboard layout.
- Adding new protocols or new dashboards.
- Anything in `src/UBIFeeSplitter.sol` beyond what is needed to
  enforce the 20% on the protocol(s) currently violating it (no
  refactor, no new admin functions).

## Overview (Planner)

The dashboard displays the on-chain ratio `totalUBITracked /
totalFeesTracked` from `UBIRevenueTracker.getDashboardData()` — currently
33.3%. The header copy claims 20%. The contract `UBIFeeSplitter.ubiBPS`
is fixed at `2000` (20%), so any tx that flows through `splitFee()`
*does* route exactly 20% to UBI. The 33.3% can only come from how the
keeper(s) call `reportFees(protocolId, fees, ubi, txs)` — most likely
they report `fees = ubi + protocol` (residue excluding `dapp`) instead
of the splitter's full `gross` fee, which yields ubi/(ubi+protocol) =
20/(20+40) = 33.3%.

This is therefore a **definition / accounting bug in
`UBIRevenueTracker`**, not a contract-split bug. The cleanest, lowest-
risk fix is to fix the tracker's reporting semantics so the ratio
matches the splitter's actual share, plus add an end-to-end on-chain
verification script.

## Research notes (Planner)

- `src/UBIFeeSplitter.sol:21` — `uint16 public ubiBPS = 2000;` (20%).
- `src/UBIFeeSplitter.sol` further splits into `protocolBPS` (default
  4000 = 40%) and `dappBPS` (default 4000 = 40%). On a 100-unit gross
  fee, the contract distributes 20 / 40 / 40.
- `src/UBIRevenueTracker.sol` (read in summary cycle):
  - `totalUBITracked` and `totalFeesTracked` are written by
    `reportFees(protocolId, fees, ubi, txs)`.
  - `getDashboardData()` returns the running `totalUBITracked` and
    `totalFeesTracked`. Frontend then computes
    `ubiPct = totalUBI * 10000n / totalFees / 100`.
- `backend/revenue-tracker/` is the most likely caller of
  `reportFees`. If it submits `fees = ubi + protocol` (i.e. the
  splitter's "non-dapp" residue, which equals 60 of the 100-unit
  gross), then `ubi/fees = 20/60 = 33.3%`. This matches the observed
  number to within rounding.
- Frontend code path:
  - `frontend/src/app/(app)/ubi-impact/page.tsx:273` consumes
    `dashboard.ubiPercentage.toFixed(1)`.
  - `frontend/src/lib/useUBIImpact.ts:106` computes the ratio.
- The frontend itself is not lying — it faithfully shows what the
  chain reports. So the fix is on the **reporter** side or on the
  **header copy** side, not in the React layer.

Sources verified locally:
- `src/UBIFeeSplitter.sol`
- `src/UBIRevenueTracker.sol`
- `frontend/src/lib/useUBIImpact.ts`
- `frontend/src/app/(app)/ubi-impact/page.tsx`
- `backend/revenue-tracker/` (directory exists per initiative spec).

## Assumptions (Planner)

- The 33.3% is being produced by `backend/revenue-tracker/` reporting
  `fees` as the non-dapp residue. This is the working hypothesis; the
  first plan step verifies it by querying both `getDashboardData()`
  *and* the splitter's internal accumulators, and by reading the
  service's `reportFees` invocation.
- The 20% policy in `UBIFeeSplitter.sol` is the source of truth and
  will NOT be changed in this task (per Out of scope).
- The verification script may run against the local Anvil devnet
  (chain id 42069, RPC `http://localhost:8545`) — the same one the
  initiative integration tests target.
- Resetting `totalUBITracked` / `totalFeesTracked` on devnet is
  acceptable; this is not a mainnet deployment.

## Architecture diagram

```mermaid
flowchart LR
    subgraph OnChain[On-chain]
        A[Protocol contract<br/>e.g. GoodSwap.swap] -->|charges fee| B[UBIFeeSplitter.splitFee]
        B -->|20%| U[UBI pool]
        B -->|40%| P[Protocol treasury]
        B -->|40%| D[dApp treasury]
    end
    subgraph Backend[Backend keeper]
        K[revenue-tracker service] -->|reportFees protocolId,<br/>fees, ubi, txs| T[UBIRevenueTracker]
    end
    subgraph Frontend[Frontend]
        T -->|getDashboardData| H[useUBIImpact hook]
        H -->|ubiPct| V[/ubi-impact page]
        V -. "20%" header copy .-> Trust[User trust]
        V -. "33.3%" StatCard .-> Trust
    end
    classDef bug fill:#fee,stroke:#f33;
    class K,T bug;
```

The bug surface is the `revenue-tracker` keeper → `UBIRevenueTracker`
edge: it reports `fees` and `ubi` with mismatched scopes. Frontend
just displays whatever the tracker reports.

## One-week decision

**YES** — one engineer can land this in ~2 working days.

Rationale:
- The diagnosis is mostly done (root cause hypothesised, code paths
  traced). The remaining work is: confirm the hypothesis on devnet,
  patch one keeper file, reset tracker state on devnet, add a Foundry
  test + a shell verification script, update README. None of these
  individually exceed a few hours.
- No new protocols, no new UI, no upgrades. All changes are inside
  one keeper (`backend/revenue-tracker/`), one Foundry test, one
  shell script, and a README date bump.

## Implementation plan

Phase 1 — Confirm the source of the 33.3% (~30 min):
1. From devnet, query
   `cast call $UBI_REVENUE_TRACKER "getDashboardData()"` and record
   `totalFeesTracked`, `totalUBITracked`.
2. Read `backend/revenue-tracker/index.{js,ts}` (or its main entry)
   and find the `reportFees(...)` invocation. Record the source of
   each argument (`fees`, `ubi`) — is `fees` the gross or the
   ubi+protocol residue?
3. Cross-check against `UBIFeeSplitter` event log: read the most
   recent `FeeSplit(gross, ubi, protocol, dapp)` events on Anvil and
   verify `ubi / gross = 0.20 ± epsilon`.
4. Write a one-paragraph `## Investigation` section at the bottom of
   THIS task file documenting the actual cause.

Phase 2 — Fix the keeper reporting semantics (~1 hour):
1. In `backend/revenue-tracker/`, change the `reportFees` call so
   `fees` passed to `UBIRevenueTracker.reportFees` is the **gross
   fee** that was charged by the protocol (i.e. the splitter's
   `gross` parameter), not the residue.
2. Keep `ubi` as the actual UBI share (`gross * 2000 / 10000`).
3. If the keeper currently subscribes to `FeeSplit` events, pull
   `gross` directly from the event payload.
4. Add a small assertion in the keeper:
   `assert(ubi * 5 === gross, 'UBI share != 20%')` — fail loudly if
   the splitter is somehow misconfigured.

Phase 3 — Reset tracker state on devnet (~15 min):
1. Add an admin-only `resetTotals()` helper to
   `script/reset-ubi-tracker.s.sol` (a *script*, NOT a contract
   change — uses `vm.store` if needed) or, if the tracker already
   has a clear-totals admin function, call it via cast.
2. Re-run a small set of protocol transactions and confirm
   `ubiPercentage` is now 20.0% ± 0.5%.

Phase 4 — Verification script (~1 hour):
1. Create `script/verify-ubi-split.sh` that:
   - Reads `.autobuilder/addresses.env`.
   - Records `splitterUBI_before = cast call $SPLITTER "totalUBIRouted()"`.
   - Runs one `cast send` per protocol (Swap, Perps, Lend, Stable,
     Stocks, Predict) — reuse the snippets in the initiative spec
     section 4.
   - Records `splitterUBI_after`, `splitterFees_after`.
   - Asserts `(splitterUBI_after - splitterUBI_before) * 5` is within
     1 wei of `(splitterFees_after - splitterFees_before)`.
   - Exits 0 on success, non-zero on failure.

Phase 5 — Tests (~1 hour):
1. Add `test/UBIRevenueTracker.t.sol::testReportFeesMaintains20PctRatio`
   that calls `reportFees` for a synthetic 100-unit gross / 20-unit
   UBI report and asserts the returned `ubiPercentage` is `2000` bps.
2. Add `test/UBIFeeSplitter.t.sol::testSplitsExactly20PctToUBI` if
   not already present — a fuzz test over `gross` values.

Phase 6 — README + frontend hygiene (~30 min):
1. Add a new `## Security Hardening` section to `README.md` listing
   "UBI 20% routing reconciled — keeper now reports gross fees;
   `/ubi-impact` displays 20.0% ± 0.5% verified via
   `script/verify-ubi-split.sh`."
2. Bump the README `Updated:` date.
3. (Optional) Add a `title=` tooltip on the `/ubi-impact` StatCard
   that explains "20% of gross protocol fees → UBI pool" so users
   can hover and see the math.
4. Do NOT add new pages or new widgets.

## Verification

(See existing `## Verification` section above — unchanged.)

## Investigation

(Filled in during Phase 1 of execution; reserved here.)
