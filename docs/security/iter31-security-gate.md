# Iter 31 — Security Gate Refresh

**Date:** 2026-05-18
**Commit:** `ed24979`
**Initiative:** [`0004-testnet-readiness-gate`](../../.autobuilder/initiatives/0004-testnet-readiness-gate)
**Task:** [`0043-iter31-security-gate-refresh`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0043-iter31-security-gate-refresh.md)
**Plan row:** `docs/TESTNET-READINESS-50-ITERATIONS.md` row 31 — *Security gate refresh — Slither, Foundry, dependency audit status is current. Proof: Fresh outputs archived.*

---

## TL;DR

| Gate | Status | Headline number |
| --- | --- | --- |
| Foundry tests | ✅ green | **1126 passed / 0 failed / 0 skipped** across 52 suites |
| Slither static analysis | ⚠ no High/Medium, only Low + Info | **0 High / 0 Medium / 323 Low / 228 Informational** (551 total across 128 contracts) |
| `npm audit` (root) | ⚠ next.js + transitive deps | 11 total (0 critical / 4 high / 1 moderate / 6 low) |
| `npm audit` (frontend) | ⚠ same lockfile as root | 11 total (identical — shared workspace) |
| `npm audit` (backend × 13) | ⚠ 2 services flagged | 9 total (0 critical / 1 high / 8 moderate / 0 low) across `perps`, `predict`, `rpc-balancer` |

**Crucially:** the project-context block in the initiative spec still claims **"30 HIGH / 148 MEDIUM Slither findings"** as the May 2026 baseline. The fresh run shows **0 HIGH / 0 MEDIUM** — every previously-tagged HIGH/MEDIUM has either been fixed in prior iterations or filtered out by the current `slither.config.json`. The stale figure should be retired from the project context block at the iter 35 doc checkpoint.

---

## Tool versions

| Tool | Version |
| --- | --- |
| Slither | `0.11.5` |
| Foundry / forge | `1.5.1-stable` (commit `b0a9dd9c`, 2025-12-22) |
| Node | `v22.22.1` |
| npm | `10.9.4` |

---

## 1. Foundry — `forge test --summary`

**Result: 1126 / 1126 passed across 52 suites. Zero failures, zero skipped.**

- Raw output: [`iter31/forge-test.txt`](iter31/forge-test.txt) (81 KB)
- Suite count: 52
- Total pass: 1126
- Total fail: 0
- Total skip: 0

Largest suites (sampled from the summary table):

| Suite | Tests |
| --- | --- |
| `LimitOrderBookTest` | 28 |
| `LiFiBridgeAggregatorTest` | 11 |
| (full table in raw output) | — |

This is the first time row 31 captures a complete `forge test --summary` artifact at this scope, and it locks the green baseline that iters 32–34 must preserve while they add fuzz / invariant / oracle / caps-and-pause work.

---

## 2. Slither — full static analysis of `src/`

**Result: 551 findings across 128 contracts, 96 detectors. Zero High / Zero Medium impact.**

- Raw text: [`iter31/slither.txt`](iter31/slither.txt) (153 KB, 1827 lines)
- Raw SARIF: [`iter31/slither.sarif`](iter31/slither.sarif) (685 KB)
- Config: [`slither.config.json`](../../slither.config.json) — Foundry compile framework, filters `lib/`, `node_modules/`, `frontend/`, `research/`, `test/`, `script/`.

### Severity histogram (per Slither SARIF rule-ID prefix)

| Impact | Count |
| --- | --- |
| High | **0** |
| Medium | **0** |
| Low | **323** |
| Informational | **228** |
| Optimization | 0 |
| **TOTAL** | **551** |

### Low-impact findings (323) — breakdown by detector

| Count | Detector | Notes |
| --- | --- | --- |
| 97 | `timestamp` | `block.timestamp` used for comparisons; standard L2 pattern, low risk because PoS blocks are tightly aligned. |
| 70 | `missing-zero-check` | Setter functions that don't check `address(0)`. Triage candidate for iter 32–34. |
| 61 | `reentrancy-benign` | Reentrancy that doesn't affect external state in adverse ways. Each instance still warrants a `ReentrancyGuard` review. |
| 33 | `reentrancy-events` | Events emitted after external calls. Cosmetic for off-chain consumers but should be normalised. |
| 22 | `calls-loop` | External calls inside loops — gas DoS surface. Worth a fuzz target in iter 32. |
| 19 | `events-access` | Access-control changes without an event. Observability gap, not a vuln. |
| 16 | `events-maths` | Arithmetic state changes without an event. |
| 5 | `shadowing-local` | Local variable shadowing function arguments — readability, not exploit. |

### Informational findings (228) — breakdown by detector

| Count | Detector | Notes |
| --- | --- | --- |
| 148 | `naming-convention` | `_paramName` style violations of mixedCase. Cosmetic. |
| 29 | `missing-inheritance` | Interfaces not formally declared via `is IFoo`. |
| 21 | `low-level-calls` | `address.call{...}` used for ETH transfer in bridge/UBI/LP/governance/timelock/swap/yield surfaces. Each one is intentional (refund / pay / forward) but should be audited individually. |
| 8 | `costly-loop` | Storage reads inside loops. |
| 6 | `too-many-digits` | Numeric literals like `1_000_000e18` flagged for readability. |
| 6 | `unindexed-event-address` | Address parameters in events not marked `indexed`. |
| 4 | `assembly` | Inline assembly use (e.g. EIP-1167 clone in `SyntheticAssetFactory`). |
| 2 | `cyclomatic-complexity` | Large branching functions. |
| 2 | `dead-code` | Unused functions. |
| 2 | `solc-version` | Compiler version range pragma diagnostics. |

### Comparison to project-context baseline

The initiative spec's project-context block (under "Current State (May 2026)") states:

> Security: 30 HIGH / 148 MEDIUM Slither findings

The fresh Slither run produces **0 HIGH / 0 MEDIUM**, with the 148 figure now matching exactly the `naming-convention` Informational bucket, not a Medium bucket. This indicates either:

1. The 30 HIGH and 148 MEDIUM figures were derived from an earlier run without `slither.config.json` filtering, **or**
2. The earlier categorisation used the legacy Slither severity scheme (where some informational issues were reported as Medium).

Either way, the stale figure is now demonstrably wrong against the current `src/` surface and the current `slither.config.json`. **Recommendation:** Iter 35 (doc refresh / status checkpoint) updates the project-context block to read "0 HIGH / 0 MEDIUM / 323 LOW / 228 INFO".

---

## 3. Dependency audit — `npm audit --json`

Captured for **15 surfaces**: top-level repo, `frontend/`, and all 13 `backend/*` services that have a `package-lock.json`.

### Root (top-level)

- Raw: [`iter31/npm-audit-root.json`](iter31/npm-audit-root.json) (14 KB)
- Counts: 0 critical / **4 high** / **1 moderate** / 6 low — **11 total**

| Severity | Package | Root cause |
| --- | --- | --- |
| high | `glob` | `glob CLI: Command injection via -c/--cmd executes matches with shell:true` (CWE-78). Pulled in via `@next/eslint-plugin-next` → `eslint-config-next`. Dev/lint only. |
| high | `@next/eslint-plugin-next` | Transitively pins vulnerable `glob`. Dev/lint only. |
| high | `eslint-config-next` | Same chain. Dev/lint only. |
| high | `next` | "Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components" + "Image Optimizer remotePatterns DoS" (CWE-400/CWE-502/CWE-770). Production-relevant — recommend bumping in iter 32 alongside fuzz/invariant. |
| moderate | `postcss` | XSS via unescaped `</style>` in CSS stringify output (CWE-79). Build-tool only. |

### Frontend (`frontend/`)

- Raw: [`iter31/npm-audit-frontend.json`](iter31/npm-audit-frontend.json) (14 KB)
- Counts: **identical to root** (0 / 4 / 1 / 6 / 11). Shared workspace lockfile.

### Backend services (13)

Service-by-service `npm audit --json` captured to [`iter31/npm-audit-backend-*.json`](iter31/) (one file per service).

| Service | Critical | High | Moderate | Low | Notes |
| --- | --- | --- | --- | --- | --- |
| `activity-reporter` | 0 | 0 | 0 | 0 | clean |
| `bridge-keeper` | 0 | 0 | 0 | 0 | clean |
| `harvest-keeper` | 0 | 0 | 0 | 0 | clean |
| `indexer` | 0 | 0 | 0 | 0 | clean |
| `liquidator` | 0 | 0 | 0 | 0 | clean |
| `monitor` | 0 | 0 | 0 | 0 | clean |
| `perps` | 0 | **1** | **1** | 0 | `axios` SSRF (CWE-441/918) + `follow-redirects` cross-domain auth header leak (CWE-200). Production-relevant. |
| `predict` | 0 | 0 | **6** | 0 | Vitest toolchain (`vite`, `vite-node`, `vitest`, `@vitest/mocker`, `esbuild`, `postcss`). Dev/test only. |
| `revenue-tracker` | 0 | 0 | 0 | 0 | clean |
| `rpc-balancer` | 0 | 0 | **1** | 0 | `follow-redirects` cross-domain auth header leak (CWE-200). |
| `status-aggregator` | 0 | 0 | 0 | 0 | clean |
| `stocks-keeper` | 0 | 0 | 0 | 0 | clean |
| `swap-oracle` | 0 | 0 | 0 | 0 | clean |
| **BACKEND TOTAL** | **0** | **1** | **8** | **0** | — |

### Headline dependency risks (production-relevant)

1. **`next` (root + frontend)** — High. DoS via Image Optimizer + RSC deserialization. Bump `next` to the latest patched 14.x line.
2. **`axios` in `backend/perps`** — High. NO_PROXY hostname normalisation SSRF + cloud-metadata exfiltration via header injection. Bump `axios` to the patched line.
3. **`follow-redirects` in `backend/perps` + `backend/rpc-balancer`** — Moderate. Cross-domain auth header leak. Bump `follow-redirects` to ≥ patched line.

The remaining items are dev/lint/test toolchain only (`glob`, `postcss`, the `predict` vitest chain) and do not ship to production.

---

## 4. Recommendations for iter 32–34

This evidence doc is the input for the next three security-themed iterations:

- **Iter 32 (Fuzz / invariant pass).** Pick the highest-leverage Slither Low findings as fuzz targets:
  - `reentrancy-benign` (61) + `reentrancy-events` (33) in `UBIFeeSplitter`, `FastWithdrawalLP`, `MultiChainBridge`, `OptimismPortal`, `GoodDAO/Timelock`, `LiFiBridgeAggregator`, `LimitOrderBook`, `GoodVault`. Treat each as an invariant target rather than a Slither suppression.
  - `calls-loop` (22) in bridge + swap modules — gas DoS fuzz targets.
- **Iter 33 (Oracle dependency hardening).** No Slither finding is currently tagged Medium against oracle code, but `events-access` (19) + `events-maths` (16) coverage across oracle setters should be backed by event regressions. Pyth adapter (`OracleAdapter*.sol`) is the natural fuzz/invariant pair.
- **Iter 34 (Caps + pause sweep).** The 70 `missing-zero-check` findings overlap heavily with setter functions that should also gain rate-limited caps and circuit-breaker pause hooks. Address them as a single sweep, then re-run iter-31's gates to confirm the count drops and the test suite stays green.
- **Iter 32 also — dependency bumps.** `next`, `axios`, `follow-redirects` are the three production-relevant bumps. Do them ahead of the iter 35 doc checkpoint.

---

## 5. Artifacts inventory

All raw outputs live under [`docs/security/iter31/`](iter31/) (committed for iter 31, immutable from iter 32 onwards):

| File | Size | Purpose |
| --- | --- | --- |
| `iter31/forge-test.txt` | 81 KB | Full forge test --summary table. |
| `iter31/slither.txt` | 153 KB | Human-readable Slither output. |
| `iter31/slither.sarif` | 685 KB | SARIF JSON for programmatic diffing. |
| `iter31/npm-audit-root.json` | 14 KB | Top-level `npm audit --json`. |
| `iter31/npm-audit-frontend.json` | 14 KB | Frontend `npm audit --json`. |
| `iter31/npm-audit-backend-*.json` | 360 B – 9.8 KB | One JSON per backend service. |

These artifacts are the named proof for row 31 of the 50-iteration plan and the baseline diff target for iters 32–34.
