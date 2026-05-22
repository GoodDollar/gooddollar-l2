# RC coordinator report — GoodChain L2 RC 2026-05-22

**Lane:** `lane/coordinator-20260522`  
**Base:** `8035c1d5` (`release/goodchain-l2-rc-2026-05-22`)  
**Integration branch:** `lane/coordinator-20260522` (`8035c1d5` + 5 cherry-picks + coordinator report; tip = `git rev-parse HEAD`)  
**Policy:** No push. No main modification. No production/PM2 restarts.

---

## Verdict: **PARTIAL**

RC lane outputs are integrated cleanly with representative gates green, but **RC is not merge-ready**: the perps full on-chain E2E assertion still fails, full-suite E2E was not re-run to green, and security-deploy retains open production blockers (GOO-1846, live broadcast, claim migration).

---

## Commits integrated

| Source lane | Upstream commit | Coordinator cherry-pick | Notes |
|-------------|-----------------|---------------------------|-------|
| release-hygiene | `cb46cc67` | `8aba5d9c` | `docs/release/RC_RELEASE_HYGIENE_20260522.md`, `MAIN_DIRTY_STATUS.txt` |
| security-deploy | `67d0ce0c` | `9a7b9ace` | Foundry tests/docs, `DeploySecureGoodDollarTestnet.s.sol` |
| e2e-gate | `b4b6fa38` | `450e09d7` | Faucet burn/null/contract validation |
| e2e-server-stability | `db6f6914` | `bbfb2fda` | Playwright host/reuse, E2E server harness |
| e2e-failure-audit | `376d4a9f` | `96ac8e90` | `E2E_FAILURE_AUDIT_20260522.md` (report-only) |

**Cherry-pick order:** `cb46cc67` → `67d0ce0c` → `b4b6fa38` → `db6f6914` → `376d4a9f`  
**Conflicts:** none (all five applied cleanly).

---

## Commits / lanes skipped

| Lane / item | Reason |
|-------------|--------|
| **backend-health** | No code changes; gates already passed on base `8035c1d5`. |
| **main dirty tree** (per hygiene) | `frontend/.../perps/page.tsx`, `op-stack/addresses.json`, `DeployPerps.s.sol`, `testnet-guide.png`, agent markdown — classified DEFER/REVERT; not integrated on this branch. |
| **Full E2E gate re-run** | Prior full run: 499 passed, 7 skipped, 308 unexpected (305 server cascade). Not re-executed post-integration (time/risk); representative slices run instead. |
| **Live testnet deploy** | `forge script ... --broadcast` not run (security lane policy). |

---

## Gates run (coordinator workspace, post-integration)

| Gate | Result | Counts / detail |
|------|--------|-----------------|
| `git diff --check` | **PASS** | No whitespace/conflict markers |
| `forge test --match-contract GoodDollarTokenSecure` | **PASS** | 21 passed, 0 failed |
| `forge test --match-contract SecurityValidationTest` | **PASS** | 9 passed, 0 failed |
| `forge test --match-contract MultiOracleConsensusTest` | **PASS** | 10 passed, 0 failed |
| `forge test --match-contract StateMigrationTest` | **PASS** | 7 passed, 0 failed |
| `forge test --match-contract PerformanceValidationTest` | **PASS** | 8 passed, 0 failed |
| `cd frontend && npm run build:e2e:force` | **PASS** | `.next.e2e/` production build ready |
| Playwright `analytics.spec.ts` + `app-regression.spec.ts` (chromium + mobile-chrome) | **PASS** | **62 passed**, 0 failed |
| Playwright `perps-journey.spec.ts` (chromium) | **FAIL** (expected blocker) | **19 passed**, **1 failed** |

### Perps failure (active E2E blocker)

Test: `Perps full on-chain flow › opens a real market position through the UI with auto margin deposit`

- UI reaches `Order Placed!` within 90s.
- `readOpenTesterPositions()` does not return an open position (`isOpen && size > 0`) within 90s.
- Failure is **not** `ECONNREFUSED` / server cascade (server-stability lane fix verified on representative suites).

### Lane-reported gates (not re-run by coordinator)

| Gate | Lane-reported result |
|------|----------------------|
| Faucet `faucet-reliability.spec.ts` (chromium) | 10 passed, 1 skipped (`db6f6914` / `b4b6fa38`) |
| Original full E2E JSON (`e2e-gate`) | 499 passed, 7 skipped, 308 unexpected |

---

## Remaining blockers

### E2E (RC gate)

1. **Perps on-chain position assertion** — full flow in `e2e/perps-journey.spec.ts` fails after successful order UI; blocks RC green.
2. **Full Playwright suite** — not re-run to completion on coordinator HEAD; prior 308 unexpected dominated by server issues now believed fixed.

### Security / deploy (not RC merge blockers for app-only RC, but documented)

1. **GOO-1846** — `setMinter` contract-only restriction (`extcodesize`); tests document PASS for current behavior but ticket remains **open** for production policy.
2. **Live testnet broadcast** — `DeploySecureGoodDollarTestnet.s.sol` simulated only; no `--broadcast`.
3. **Claim `lastClaimTime` migration** — gap noted in `StateMigration.t.sol` / security lane (verify before mainnet migration).

### Release hygiene (main checkout, not on coordinator branch)

- Revert or replace bloated `docs/screenshots/testnet-guide.png`.
- Land `DeployPerps.s.sol` + `addresses.json` via dedicated devnet-addresses lane after redeploy validation.
- Land perps UI via `fix/e2e-perps-20260522` when E2E green.

---

## Recommendation

| Decision | Guidance |
|----------|----------|
| **Merge to RC / release** | **No-merge** for declaring RC green while perps full on-chain E2E fails and full suite is unverified. |
| **Merge coordinator integration branch** | **Conditional yes** for docs + hygiene manifest + E2E harness/faucet fixes + security Foundry artifacts — evidence-backed, no cherry-pick conflicts, representative gates pass. |
| **Do not claim RC green** | Per user rule and perps blocker above. |

### Next lane

**`lane/e2e-perps-onchain-20260522`** (or extend `fix/e2e-perps-20260522`):

- Debug why `readOpenTesterPositions()` stays empty after `Order Placed!` (indexer lag, wrong tester address, engine state, margin deposit path, or test expectation).
- Re-run `e2e/perps-journey.spec.ts` chromium to green, then optional full `app-regression` / full E2E gate.
- Coordinate with devnet address sync if RPC/contracts disagree with test helpers.

---

## Deliverable summary

| Field | Value |
|-------|-------|
| **Verdict** | **PARTIAL** |
| **Integration commit** | `25ad10d1` (`lane/coordinator-20260522` tip at gate time) |
| **Conflicts** | None |
| **Gates** | Foundry 55/55 on security suites + GoodDollarTokenSecure; build:e2e PASS; analytics+app-regression 62/62 PASS; perps 19/20 PASS (1 fail) |
| **Primary blocker** | Perps full on-chain open-position assertion |
| **RC green** | **No** |

## Perps follow-up integration

Added after the initial coordinator report:

- `cb225e16` / coordinator cherry-pick: perps E2E on-chain flow fix covering live collateral read, devnet G$ default, live fee splitter redeploy requirement, BTC/ETH market id alignment, and missing open-positions panel test id.

Follow-up gates run on coordinator after this commit:

- `git diff --check` — PASS
- `cd frontend && npm run build:e2e:force` — PASS
- `cd frontend && E2E_PROD_SERVER=1 npx playwright test e2e/perps-journey.spec.ts --project=chromium` — PASS, 20/20


Coordinator tip after perps follow-up: `3b4611a0` before this report update; perps code cherry-pick is `a031fb32` from lane commit `cb225e16`.
