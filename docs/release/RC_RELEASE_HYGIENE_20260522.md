# RC release hygiene manifest — 2026-05-22

**Lane:** `lane/release-hygiene-20260522`  
**Base:** `main` @ merge-base `39c9d727`  
**Source:** dirty tree copied from main checkout (`MAIN_DIRTY_STATUS.txt`; full patch local only — `MAIN_DIRTY_DIFF.patch` ~3.2 MB, mostly PNG binary)  
**Policy:** Do not push from this lane. Do not revert/delete files in the main checkout.

---

## Executive summary

| Verdict | Count |
|---------|------:|
| **INCLUDE** (land via dedicated lane, not this hygiene commit) | 2 file groups |
| **DEFER** | 9 paths |
| **REVERT** (on main before RC merge) | 1 path |

**RC merge surface today:** Lane branch is clean aside from coordinator docs. All product dirty files remain **uncommitted** on this lane by design; land them through the recommended lanes below after review.

**Blockers found:** Four new Solidity test files fail `forge build` (Unicode `✅` in `console.log`). Three agent-generated deployment markdown files overstate readiness. `testnet-guide.png` grew 3.2× with no linked frontend diff.

**Secrets:** No `.env` or production keys. Anvil/Foundry dev defaults only (`0xac0974…`, `0xf39Fd6…`) — same pattern as existing `DeployPerps.s.sol`.

---

## Per-file classification

| Path | Status | Recommendation | Rationale |
|------|--------|----------------|-----------|
| `frontend/src/app/(app)/perps/page.tsx` | Modified | **DEFER** → `fix/e2e-perps-20260522` | Mobile chart `hidden lg:block` + `data-testid="open-positions-panel"` match `frontend/e2e/perps-journey.spec.ts`. Overlaps committed work on `fix/e2e-perps-20260522` (`9b93f2fd`). Land there, not raw into RC. |
| `op-stack/addresses.json` | Modified | **DEFER** → devnet-addresses lane | Local refresh (`localhost:8545`, 2026-05-22). Only **perps** entries changed (`FundingRate`, `MarginVault`, `PerpPriceOracle`, `PerpEngine`). Core token rows already Anvil-canonical. Ephemeral after next redeploy. |
| `script/DeployPerps.s.sol` | Modified | **INCLUDE** (with `addresses.json`) | **Fixes stale defaults:** HEAD had `GD_TOKEN`/`FEE_SPLITTER` (`0x36C02…`, `0x3abBB…`) out of sync with `addresses.json` (`0x5FbDB…`, `0xDc64…`). Dirty constants match JSON. Commit atomically after redeploy validation. |
| `docs/screenshots/testnet-guide.png` | Modified | **REVERT** on main | 676 KB → 2.2 MB (~3.2×). No `testnet-guide` page diff in dirty tree. Risk: accidental uncompressed capture. Re-capture optimized PNG if UI actually changed. |
| `DEPLOYMENT_READINESS_REPORT.md` | Untracked | **DEFER** | Agent narrative; asserts "100% READY". Not RC evidence. Archive under `docs/security/` or drop. |
| `SECURITY_VALIDATION_CHECKLIST.md` | Untracked | **DEFER** | Duplicates existing `docs/security/TESTING-PLAN.md` / tracked audit docs. Review offline; do not merge checklist-as-source-of-truth without human sign-off. |
| `TESTNET_DEPLOYMENT_SUMMARY.md` | Untracked | **DEFER** | Same as above; redundant with readiness report. |
| `script/DeploySecureGoodDollarTestnet.s.sol` | Untracked | **DEFER** → `lane/security-deploy-20260522` | Valid script shape; imports existing `GoodDollarTokenSecure.sol`. Anvil admin/oracle addresses + `vm.envOr` Anvil key #0. Land with security lane after test fixes. |
| `test/SecurityValidation.t.sol` | Untracked | **DEFER** (fix first) | Does not compile: Unicode in `console.log`. Overlaps `test/GoodDollarTokenSecure.t.sol` (tracked). Merge/dedupe before include. |
| `test/MultiOracleConsensus.t.sol` | Untracked | **DEFER** (fix first) | Same compile error. |
| `test/StateMigration.t.sol` | Untracked | **DEFER** (fix first) | Same compile error. |
| `test/PerformanceValidation.t.sol` | Untracked | **DEFER** (fix first) | Same compile error. |
| `MAIN_DIRTY_STATUS.txt` | Untracked | **INCLUDE** (this lane) | Coordinator snapshot of main `git status`. |
| `MAIN_DIRTY_DIFF.patch` | Untracked | **DEFER** (local only) | 3.2 MB binary-heavy; not committed to avoid repo bloat. Available in lane workspace. |

---

## Address & secret audit

### Stale / inconsistent (fixed in dirty tree, not on HEAD)

| Location | HEAD (stale) | Dirty (local devnet) | Notes |
|----------|--------------|----------------------|-------|
| `DeployPerps.s.sol` `GD_TOKEN_DEFAULT` | `0x36C02dA8…` | `0x5FbDB231…` | Matches `addresses.json` `GoodDollarToken` |
| `DeployPerps.s.sol` `FEE_SPLITTER_DEFAULT` | `0x3abBB0D6…` | `0xDc64a140…` | Matches `addresses.json` `UBIFeeSplitter` |
| Perps contracts in `addresses.json` | `0x4ee6…`, `0xbec4…`, `0x1720…`, `0xd843…` | `0x8233…`, `0x6b99…`, `0xf978…`, `0xba6b…` | Post–perps redeploy on local Anvil |

### Acceptable dev-only material (not secrets for RC)

- `vm.envOr("PRIVATE_KEY", 0xac0974…)` in deploy scripts — Foundry Anvil account #0; present on HEAD `DeployPerps`.
- `DeploySecureGoodDollarTestnet.s.sol` / docs cite `0xf39Fd6…`, `0x709979…`, etc. — standard Anvil accounts #0–#4.
- `op-stack/addresses.json` `admin` / `sequencer` / `batcher` / `proposer` → `0xf39Fd6…` — devnet metadata.

### No findings

- No private keys beyond public Anvil defaults.
- No API tokens, mnemonics, or `.env` files in the dirty set.

---

## Recommended RC commit grouping

Land **after** hygiene review; order matters for CI/E2E.

| Group | Branch / lane | Files | Prerequisite |
|-------|---------------|-------|--------------|
| **G1 — E2E perps UI** | `fix/e2e-perps-20260522` | `frontend/src/app/(app)/perps/page.tsx` (+ any subtitle copy on that branch) | `frontend/e2e/perps-journey.spec.ts` green |
| **G2 — Devnet deploy sync** | New: `fix/devnet-perps-addresses-20260522` | `op-stack/addresses.json`, `script/DeployPerps.s.sol` | Confirm redeploy on shared devnet; run `scripts/refresh-addresses.py` on canonical RPC |
| **G3 — Security deploy** | `lane/security-deploy-20260522` | `script/DeploySecureGoodDollarTestnet.s.sol`, four `test/*.t.sol` (after dedupe + ASCII `console.log`) | `forge test --match-contract GoodDollarTokenSecure` green |
| **G4 — Docs hygiene** | This lane only | `docs/release/RC_RELEASE_HYGIENE_20260522.md`, `MAIN_DIRTY_STATUS.txt` | None |
| **G5 — Revert on main** | Coordinator / main | `docs/screenshots/testnet-guide.png` | `git restore` unless visual QA approves new asset |

**Do not bundle** G1 + G2 + G3 in one RC PR — unrelated concerns (UI vs perps redeploy vs GDT secure token).

---

## Verification performed (this lane)

```text
forge build   → FAIL on untracked tests (Unicode in console.log)
git diff HEAD → 4 modified paths, 12 insertions / 11 deletions (text)
PNG           → 676188 → 2199447 bytes
```

Tracked `test/GoodDollarTokenSecure.t.sol` already covers `GoodDollarTokenSecure`; new suites are additive only after compile fix and deduplication review.

---

## Coordinator actions

1. **Revert** `testnet-guide.png` on main unless docs owner confirms intentional screenshot update.
2. **Cherry-pick / merge** G1 from `fix/e2e-perps-20260522` before RC cut.
3. **Hold** agent markdown trio out of RC; use existing `docs/security/*` and human sign-off.
4. **Run** `scripts/refresh-addresses.py` on the RC devnet RPC before merging G2 so `addresses.json` is not hand-edited.
5. **Fix** Unicode in new tests before G3.

---

*Generated by release-hygiene lane. Evidence: `MAIN_DIRTY_STATUS.txt` (committed); `MAIN_DIRTY_DIFF.patch` (local, not committed).*
