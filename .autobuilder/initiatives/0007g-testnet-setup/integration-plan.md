# Lane 7 — Integration Plan + Blocker List

_Pure analysis output for task `0002-inventory-and-integration-plan`. Read-only
classification of each lane head against the lane-7 worktree
(HEAD = `3bb4dff2`, on top of main `86e73194`)._

All six lane heads share merge base `86e7319419166af8e29ddae6b5eeef0b2a32eb45`
with HEAD (verified via `git merge-base HEAD <sha>`).

## Conflict-risk surface for lane 7

Lane-7 worktree's only tracked changes from main are:

- `.autobuilder/` (initiative bootstrap + plan files)
- `.gitignore` (loop-infra additions)
- `.cursor/mcp.json` is **gitignored on this branch** (working-copy preserved
  with the eToro API docs MCP entry)

**Lane 7 has NOT modified `backend/`, `frontend/`, `scripts/`, `docs/`, or
`contracts/`.** Any lane head touching those paths therefore carries low
direct conflict risk against lane 7. Conflict risk is computed pairwise
between lane heads only, not against lane 7.

## Per-lane assessment

### Lane 1 — `6b99f069` (47 commits ahead)

- **Subject:** `0028: register price-service in backend/ecosystem.config.js`
- **Diff at the head commit:**
  ```
  backend/README.md              |  3 ++-
  backend/ecosystem.config.js    | 14 ++++++++++++++
  scripts/check-pm2-ecosystem.js | 40 ++++++++++++++++++++++++++++++++++++++++
  scripts/test-lane1-backend.sh  |  3 +++
  4 files changed, 59 insertions(+), 1 deletion(-)
  ```
- **Cumulative footprint vs main (top files, lockfiles excluded):**
  `.env.example` (+58), `backend/etoro-client/**` (auth + cap-enforcer +
  audit logger), `backend/price-service/**` (bootstrap + tests),
  `backend/ecosystem.config.js` (+16/-2 cumulative), `package.json` (+4/-2).
  75 files, +9.7k / −854 cumulative.
- **Conflict risk:** `low`. Cherry-picking only the head SHA touches just the
  4 files above — a pure additive PM2 entry plus a small smoke check.
  Lane 7 does not modify `backend/ecosystem.config.js` or `scripts/`.
- **Dirty / blockers:** none flagged. The cumulative tree's
  `backend/etoro-client/**` and `backend/price-service/**` work is already
  on lane-7 HEAD via the existing in-tree files (the lane-7 worktree
  inherits them from main / earlier integration). Cherry-picking the **head
  commit only** is intentional — we do not reapply 47 commits' worth of
  history.
- **Real-trading fence audit:** the new `price-service` entry sets
  `ETORO_MODE: pick('ETORO_MODE','mock')` but does **not** set
  `REAL_TRADING_ENABLED=false` explicitly. Per task 0004 acceptance #6 this
  is patched as a follow-up commit on top of the cherry-pick.
- **Batch assignment:** **batch 1** (this iteration: task `0004`).
- **Integration order rationale:** lane 1 first because it adds the
  PM2-supervised `price-service` that lane-7's smoke (task 0005) and
  status-aggregator probe assume to exist.

### Lane 2 — `ee8ead66` (44 commits ahead)

- **Subject:** `0038 price-service: align ENDPOINT_CATALOG responseShape strings to timestamp/timestampIso wire`
- **Cumulative footprint vs main (lockfiles excluded):** mostly
  `backend/price-service/src/**` (server + tests + audit logger +
  source-status + ws-broadcaster). 39 files, +7.1k / −70 cumulative. Adds
  `pm2-ecosystem.config.js` at the repo root (lane-2-only ad-hoc PM2 file
  — collides conceptually with lane 1's canonical
  `backend/ecosystem.config.js` registration).
- **Conflict risk:** `medium`. Lane 1's head already touches
  `backend/ecosystem.config.js`, while lane 2 introduces a separate
  top-level `pm2-ecosystem.config.js`. They do not collide on the same file
  but their PM2 stories diverge — lane 1 is the canonical path.
- **Dirty / blockers:**
  - Spec says `backend/price-service/src/__tests__/server-symbol-not-configured-suggestions.test.ts`
    is the failing test (`APLE` expected `didYouMean: AAPL` but got
    `undefined`). **The file is not present in lane 2's tree at the head
    SHA**, so the failing test is either (a) on a sibling lane-2 commit
    that didn't make it to the head, or (b) a planned regression test that
    hasn't been committed. Either way the spec's named blocker still
    applies — lane 2 does not advertise a clean head with the
    didYouMean fix landed.
  - Test runner: `cd backend/price-service && npm test` (jest). Use
    `--testPathPattern=symbol-not-configured-suggestions` to reproduce
    once the file lands.
- **Batch assignment:** **BLOCKED — dirty tests**. Defer until lane 2
  ships a clean head with the didYouMean test passing.

### Lane 3 — `94de9037` (38 commits ahead)

- **Subject:** `0031: surface oracle provenance in status badge`
- **Cumulative footprint vs main (lockfiles excluded):** primarily
  `frontend/src/lib/**` (oracle provenance helpers, page-visibility hook,
  rebalance-status cache) and `frontend/src/components/__tests__/**`
  (incl. `OracleStatusBadge.test.tsx`). Also adds
  `scripts/testnet/lane3-mock-price-source.mjs` and
  `scripts/testnet/lane3-oracle-publishing-smoke.sh`. 101 files, +8.0k /
  −1.3k cumulative.
- **Conflict risk:** `medium`. Touches `frontend/` heavily; collides
  with lane 6 (`frontend/src/components/proof/PipelineFlowDiagram.tsx`) and
  lane 4 / 5 frontend changes if cherry-picked together. Adds two new
  scripts under `scripts/testnet/` (`lane3-*.{mjs,sh}`) — does **not**
  modify `health-gate.sh`, so no contract collision.
- **Dirty / blockers:**
  - Spec says `frontend/src/components/__tests__/OracleStatusBadge.test.tsx`
    has failing provenance/block-link expectations. Test file is
    confirmed present at the lane-3 head. Reproducer (when frontend test
    runner exists): `cd frontend && npx vitest run OracleStatusBadge`.
- **Batch assignment:** **BLOCKED — dirty tests**. Defer until lane 3
  fixes the provenance/block-link expectations.

### Lane 4 — `5b120e67` (26 commits ahead)

- **Subject:** `0023: keep ticker chart spot price aligned with oracle badge age`
- **Cumulative footprint vs main:** ~1.9M lines of insertions, dominated by
  generated `.next.runtime-dev/dev/**` build artifacts (1693 files). The
  *source* changes are concentrated in `frontend/src/lib/**`
  (`useAttributedPrice`, `usePerpsPriceSources`, `priceSource`, etc.) plus
  `frontend/src/lib/__tests__/**`. Source-only diff is small and tightly
  scoped to the price-pipeline UI.
- **Conflict risk:** `medium-to-high`. The `.next.runtime-dev/**` artifacts
  are committed build output and would cherry-pick a stale build into
  lane 7. They likely conflict with lane 5/6's similarly-committed build
  output. Source files share `frontend/src/lib/` namespace with lane 3 and
  lane 5 (e.g. `usePriceServiceStatus.ts`).
- **Dirty / blockers:** none flagged in the spec. Has not been validated
  against lane 6 cherry-pick conflicts.
- **Batch assignment:** **batch 2 (next iteration)**. Defer pending
  build-artifact cleanup story (commit a `.gitignore` for
  `frontend/.next.runtime-dev/**` first, or strip those files from a
  rebased lane-4 head before integrating).

### Lane 5 — `60919c44` (44 commits ahead)

- **Subject:** `0036: in-app hedge proof viewer page`
- **Cumulative footprint vs main:** ~1.7M lines inserted, dominated by
  generated `.next.runtime-dev/**` artifacts (1366 files). Source
  changes: `frontend/src/app/api/hedge/proof/latest/**`,
  `frontend/src/app/api/hedge/status/**`,
  `frontend/src/components/HedgeStatusCard.tsx` (1074 lines on its own —
  flag for size review per the thermo-nuclear gate before integration),
  `frontend/src/lib/{format-notional,hedge-error,hedge-proof,usePollWhileVisible}.ts`,
  plus `backend/hedge-engine/src/__tests__/{cap-enforcer,circuit-breakers}.test.ts`
  and `backend/etoro-client/src/{auth,types}.ts` adjustments.
- **Conflict risk:** `high`. Single-file `HedgeStatusCard.tsx` lands at
  1k+ lines; combined with lane 4's `frontend/src/lib/**` changes the
  surface area is large. Build artifacts compound the risk.
- **Dirty / blockers:** none flagged in the spec. Pending architectural
  review of `HedgeStatusCard.tsx` size before integration.
- **Batch assignment:** **batch 2 (next iteration)**. Sequence after
  lane 4 to bound conflict surface.

### Lane 6 — `de7a4b44` (36 commits ahead)

- **Subject:** `0031: cover pipeline flow diagram state colors`
- **Diff at the head commit:**
  ```
  frontend/src/components/proof/PipelineFlowDiagram.tsx        | 67 +++++++++++++---------
  frontend/src/components/proof/__tests__/PipelineFlowDiagram.test.tsx | 50 ++++++++++++++++
  2 files changed, 89 insertions(+), 28 deletions(-)
  ```
- **Cumulative footprint vs main:** ~1.9M lines inserted, dominated by
  generated build artifacts (same shape as lanes 4/5). Source diff at the
  head commit is minimal and isolated to the pipeline-diagram component
  + test.
- **Conflict risk:** `low`. Cherry-picking only the head SHA touches just
  the two files above. Frontend-only, no backend collision with lane 1.
  No `.next.runtime-dev/**` files in the head commit itself (those landed
  on earlier lane-6 commits we are NOT cherry-picking).
- **Dirty / blockers:** none flagged in the spec.
- **Test runner:** the `frontend` workspace has no `npm test` script —
  vitest is in `devDependencies`. Targeted run:
  `cd frontend && npx vitest run components/proof/PipelineFlowDiagram`.
- **Batch assignment:** **batch 1** (this iteration: task `0004`).
- **Integration order rationale:** apply after lane 1 because lane 1 is
  the higher-value backend change; lane 6 is independent frontend test
  coverage.

## Batch summary

| lane | head      | risk         | batch                  | reason                                                         |
|------|-----------|--------------|------------------------|----------------------------------------------------------------|
| 1    | `6b99f069`| low          | **batch 1 (0004)**     | adds price-service PM2 entry; required by 0005 smoke           |
| 2    | `ee8ead66`| medium       | **BLOCKED — dirty**    | didYouMean failing test not yet landed clean                   |
| 3    | `94de9037`| medium       | **BLOCKED — dirty**    | OracleStatusBadge provenance test failing                      |
| 4    | `5b120e67`| medium/high  | **batch 2 (next iter)**| pending build-artifact cleanup; large frontend surface         |
| 5    | `60919c44`| high         | **batch 2 (next iter)**| HedgeStatusCard sprawl + build-artifact cleanup                |
| 6    | `de7a4b44`| low          | **batch 1 (0004)**     | small head commit, frontend-only, no collision with lane 1     |

**Integration order in batch 1:** lane 1 first, then lane 6. Both are
single-commit cherry-picks with `git cherry-pick -x` to preserve archaeology.

## Blocker list

Every named blocker that prevents a lane from joining batch 1, with a
reproducer where one exists.

1. **Lane 2 — `server-symbol-not-configured-suggestions` failing test.**
   - Owning lane: 2.
   - Symptom (per spec): `APLE` expected `didYouMean: AAPL` but got
     `undefined`.
   - File status: not present at lane-2 head `ee8ead66` — either a planned
     regression test that hasn't shipped, or a sibling commit not promoted
     to head. Lane 2 still does not advertise a clean fix.
   - Reproducer (once landed): `cd backend/price-service && npm test --
     --testPathPattern=server-symbol-not-configured-suggestions`.

2. **Lane 3 — `OracleStatusBadge.test.tsx` failing provenance / block-link
   expectations.**
   - Owning lane: 3.
   - File: `frontend/src/components/__tests__/OracleStatusBadge.test.tsx`
     (confirmed present at lane-3 head).
   - Reproducer: `cd frontend && npx vitest run components/__tests__/OracleStatusBadge`.

3. **Lanes 4 / 5 / 6 — committed build artifacts under
   `frontend/.next.runtime-dev/**`.**
   - Owning lanes: 4, 5, 6 (lane 6 only on non-head ancestors, head commit
     itself is clean, so this only blocks `git diff` archaeology, not
     batch-1 cherry-picks).
   - Reproducer: `git diff --stat 86e73194..<sha> -- frontend/.next.runtime-dev`
     shows the artifact bulk.
   - Mitigation for batch 2: rebase lanes 4 and 5 to drop the
     `.next.runtime-dev` paths or add a top-level `.gitignore` rule before
     re-tagging clean heads.

4. **Lane 5 — `frontend/src/components/HedgeStatusCard.tsx` is 1074 lines
   in a single file.**
   - Owning lane: 5.
   - Source: lane head's diff stat (1074 insertions in that single file).
   - Mitigation: split before integration per the thermo-nuclear file-size
     gate; the lane 7 cherry-pick task should not paper over a 1k-line
     single component.

5. **Lane 1 — `price-service` PM2 entry omits explicit
   `REAL_TRADING_ENABLED=false`.**
   - Owning lane: 1 (head commit).
   - Source: `git show 6b99f069 -- backend/ecosystem.config.js` shows
     `ETORO_MODE` default `mock` but no `REAL_TRADING_ENABLED`.
   - Mitigation: task 0004 acceptance #6 — append a follow-up commit on
     top of the cherry-pick that sets `REAL_TRADING_ENABLED=false`
     explicitly on the new entry.
