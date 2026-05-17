# GoodDollar L2 — Testnet Readiness Gate: Next 50 Iterations

_Last updated: 2026-05-17 UTC._

This is the execution plan for the next autonomous autobuilder run. The goal is not more surface area; it is a public-testnet release candidate that real external testers can use, debug, and trust.

## Operating Rules

- Run through Cursor CLI with `claude-opus-4-7-thinking-high` unless explicitly changed for cost control.
- One meaningful task/commit per iteration whenever possible.
- Every 5 iterations: refresh `README.md`, `docs/TESTNET_README.md`, and architecture/doc links so GitHub always reflects current state.
- Every 10 iterations: run the full testnet gate and record evidence.
- Do not mark an iteration complete without named proof: command output, test artifact, screenshot, health JSON, transaction hash, or explicit blocker.
- Preserve canonical addresses from `op-stack/addresses.json`; no hardcoded browser fallbacks.
- Public URL behavior matters more than localhost behavior.

## Target End State After 50 Iterations

- `https://goodswap.goodclaw.org` is production-built, PM2-managed, and stable.
- Public RPC, explorer, faucet, status, and docs are live and linked from GitHub README.
- `/api/status` is 100% healthy or every intentionally disabled service is removed from the public health gate with documented reason.
- Faucet → first transaction → protocol action flows are testable by a new wallet.
- Swap, Perps, Predict, Lend, Stable, Stocks, Portfolio/Claim all have passing smoke/E2E coverage.
- UBI fee routing is verified with events/balances/tests and documented.
- README is comprehensive, with architecture links and diagrams of apps running on top of the chain.
- A reproducible testnet tag/release candidate can be cut.

## Iteration Plan

| Iter | Upgrade | End State | Tested / Proven |
|---:|---|---|---|
| 1 | Baseline inventory | Current services, ports, PM2 state, contracts, frontend routes, tests, and dirty git state are documented. | `git status`, PM2 status, `/api/status`, page checks, chain block, README gap list. |
| 2 | Health contract for testnet | Define what counts as green vs intentionally disabled; remove fake requirements. | New `scripts/testnet-health-gate.sh` failing only on true blockers. |
| 3 | Fix PM2/process hygiene | No stray `next dev` on production port; PM2 `goodswap` owns 3100. | `ss -ltnp`, `pm2 status goodswap`, live `/` 200. |
| 4 | Repair degraded status services I | Fix or disable `activity-reporter` and `harvest-keeper` status blockers. | `/api/status` improves; service logs clean. |
| 5 | README/doc checkpoint 1 | GitHub README links the plan, architecture doc, live URLs, and current health. | README refreshed and committed; link check passes. |
| 6 | Repair degraded status services II | Fix `revenue-tracker`, `indexer`, `monitor` health or document non-blocking mode. | `/api/status` reaches green or accepted-risk list. |
| 7 | Public RPC verification | Browser and backend use public RPC safely; no localhost-only assumptions in production. | CORS check, RPC blockNumber via public URL, frontend route smoke. |
| 8 | Explorer readiness | Explorer links from app/README resolve for core addresses and txs. | Explorer HTTP checks + at least one verified tx URL. |
| 9 | Faucet reliability | Faucet provides test ETH/G$ with rate limiting and useful errors. | API tests + Playwright faucet claim + balance change. |
| 10 | README/doc checkpoint 2 + gate | Docs reflect fixed infra and public onboarding. | `testnet-health-gate.sh`, README/docs refresh, live links. |
| 11 | Address registry freeze | One canonical address pipeline from deploy artifacts to frontend/backend/tests. | Regeneration script + diff guard + no stale addresses grep. |
| 12 | Frontend env freeze | Production bundle contains public URLs and canonical addresses only. | Build artifact grep + route smoke. |
| 13 | Wallet onboarding | Add network/get tokens/try first flow is clear from app and docs. | Playwright onboarding path + screenshot. |
| 14 | Testnet guide UX | `/testnet-guide` covers new user, dev, and tester flows. | Page screenshot + link checks. |
| 15 | README/doc checkpoint 3 | README includes app topology and chain/app diagrams. | README + `docs/ARCHITECTURE.md` updated. |
| 16 | Swap lane hardening | Swap happy path + dust/error path green on public-like env. | Playwright + on-chain balance/receipt proof. |
| 17 | Perps lane hardening | Open/close position with margin deposit works repeatably. | Playwright full-flow + on-chain position proof. |
| 18 | Predict lane hardening | Create/buy/portfolio or documented market flow works. | Playwright + CLOB/on-chain state proof. |
| 19 | Lend/Stable lane hardening | Supply/withdraw and mint/repay flows work or non-live states are explicit. | E2E + contract state proof. |
| 20 | README/doc checkpoint 4 + gate | Protocol lane status is current and visible. | README/docs refresh + testnet gate. |
| 21 | Stocks/portfolio lane hardening | Stocks and portfolio pages load, classify positions, no blank states. | Playwright lane + API/indexer proof. |
| 22 | UBI fee truth source | Canonical fee routing spec maps every protocol fee path. | `docs/UBI-FEE-ACCOUNTING.md` + tests list. |
| 23 | UBI event/accounting tests I | Swap/Perps fee routing proven by event or balance deltas. | Foundry/integration receipts. |
| 24 | UBI event/accounting tests II | Lend/Stable/Predict/Stocks fee routing proven. | Foundry/integration receipts. |
| 25 | README/doc checkpoint 5 | README explains fee routes and links accounting proof. | README/docs refresh + link check. |
| 26 | Analytics address book | Publish machine-readable labels, ABIs, protocol IDs, event signatures. | JSON artifact + validation script. |
| 27 | Internal analytics dashboard | Public/interim page shows tx counts, protocol activity, UBI fees, status. | Screenshot + API check. |
| 28 | Dune package | Dune/indexing request package ready even if chain indexing pending. | SQL/query pack + docs. |
| 29 | Feedback pipeline | Feedback button captures route, wallet, console/session context safely. | API tests + UI test. |
| 30 | README/doc checkpoint 6 + gate | Docs include analytics + feedback loops. | README/docs refresh + full gate. |
| 31 | Security gate refresh | Slither, Foundry, dependency audit status is current. | Fresh outputs archived. |
| 32 | Fuzz/invariant expansion | Critical perps/vault/UBI/accounting invariants covered. | `forge test` specific invariant proof. |
| 33 | Oracle risk controls | Stale/bad oracle behavior guarded and monitored. | Unit/integration tests + monitor health. |
| 34 | Caps and pause controls | Faucet, perps, bridge/utility caps documented and enforced. | Tests for over-limit rejection. |
| 35 | README/doc checkpoint 7 | README exposes security status and known risks. | README/docs refresh. |
| 36 | Ops runbooks I | RPC down, explorer down, frontend broken, service degraded runbooks. | `docs/runbooks/*.md` links. |
| 37 | Ops runbooks II | Faucet drained, sequencer stuck, stale oracle, indexer lag runbooks. | Drill commands documented. |
| 38 | Backup/restore plan | Chain/app/indexer backup and restore documented; staging dry-run if available. | Runbook + artifact list. |
| 39 | Deploy path hardening | One deploy command builds, reloads, checks BUILD_ID, verifies live routes. | `npm run deploy` or deploy script proof. |
| 40 | README/doc checkpoint 8 + gate | Ops/deploy docs linked and current. | README/docs refresh + full gate. |
| 41 | Load test baseline | RPC/frontend/faucet simple load profile documented. | Load script + results. |
| 42 | Tester onboarding pack | Alpha invite, checklist, known issues, feedback path finalized. | Docs + `/invite`/guide checks. |
| 43 | Public release notes draft | Testnet beta release notes list features, limits, risks, links. | `docs/releases/testnet-beta.md`. |
| 44 | Reproducible release tag prep | Version, addresses, build ID, commit SHA captured. | Release manifest generated. |
| 45 | README/doc checkpoint 9 | README ready for external testers. | README/docs refresh + link check. |
| 46 | Full E2E matrix | All app lanes run against public/live URL or testnet URL. | Playwright report archived. |
| 47 | Full contract/backend matrix | Foundry + service integration + health gate all green. | Logs archived. |
| 48 | Final visual/accessibility pass | Mobile/desktop screenshots, axe critical = 0, no runtime overlays. | Screenshot artifacts + axe report. |
| 49 | Release candidate decision | Any blockers classified: must-fix, accepted risk, or deferred. | Go/no-go checklist. |
| 50 | README/doc checkpoint 10 + RC | Testnet RC tag can be cut; README is comprehensive and GitHub-ready. | Final gate output, release manifest, docs index, tag recommendation. |

## Iteration Evidence

| Iter | Evidence | Runner |
|---:|---|---|
| 1 | [`docs/testnet/iter01-baseline.md`](testnet/iter01-baseline.md) | `scripts/testnet/iter01-baseline.sh` |
| 2 | [`docs/testnet/iter02-health-gate.md`](testnet/iter02-health-gate.md) (contract: [`docs/testnet/HEALTH-CONTRACT.md`](testnet/HEALTH-CONTRACT.md)) | `scripts/testnet/health-gate.sh` |

## README Checkpoint Requirements Every 5 Iterations

Each README refresh must include or update:

1. Current status and last refresh timestamp.
2. Live links: app, RPC, explorer, status, faucet, testnet guide, tests dashboard.
3. Architecture links: `docs/ARCHITECTURE.md`, `docs/TESTNET_README.md`, this plan, UBI fee accounting, runbooks.
4. App topology diagram showing Swap, Perps, Predict, Lend, Stable, Stocks, Bridge/Claim, Agents/AntSeed on top of GoodDollar L2.
5. Test evidence: latest health gate, Playwright, Foundry, service checks.
6. Known limitations and accepted risks.
7. How to reproduce/deploy from a clean checkout.

## Definition of Done

The sprint is complete only when a fresh operator can open GitHub, read the README, follow links to architecture and diagrams, run the gate commands, and understand exactly what is live, what is tested, what is risky, and how to launch the public testnet beta.
