# Lane 6 — QA Gate Checklist

The Lane 6 QA gate proves, in a single repeatable run, that the **live-prices
& demo-hedge pipeline** is alive end-to-end and that real trading is
hard-disabled at every layer.

This document is the human-facing companion to
`scripts/release/lane6-qa-gate.sh`. The script runs the same sequence
non-interactively; this document is what a reviewer steps through to sign
the release.

---

## Purpose

A release tag is acceptable for Lane 6 only when **all** of the following
are simultaneously true on a clean checkout:

1. The hardcoded `REAL_TRADING_ENABLED` literal in `backend/etoro-client/src/safety.ts`
   is `false` (compile-time, not env-driven).
2. The eToro client and hedge-engine pass their unit tests.
3. The integration harness (`backend/qa-harness`) proves the
   eToro → price-service → oracle → chain → hedge pipeline against a
   hermetic mock-eToro + anvil environment.
4. A dry-run demo hedge writes a valid `HedgeProof` JSON artifact.
5. The frontend builds, serves, and `/live-prices-proof` renders with the
   safety banner reporting `REAL_TRADING_ENABLED = false` on both sides.

Failure of any of the above is a release-blocker.

---

## Prerequisites

- Node.js 20+ and `npm` 10+
- `jq`, `curl`, `rsync` on PATH
- `forge` (Foundry) — used by the qa-harness to deploy `StockOracleV2` to
  an anvil local chain. Anvil ships with Foundry; verify with `anvil --version`.
- ~3 minutes of CI budget on a clean checkout.

No eToro credentials are required — the gate is fully hermetic and uses
`axios-mock-adapter` to mock the eToro REST surface.

---

## One-shot run

```bash
./scripts/release/lane6-qa-gate.sh
```

Expected final line on success:

```
OK lane6-qa-gate passed (run-id=20260523T133022Z-12345, evidence=qa-proof/evidence/20260523T133022Z-12345)
```

Optional env:

| Variable           | Default | Effect                                                          |
| ------------------ | ------- | --------------------------------------------------------------- |
| `PORT`             | `3126`  | Port used for the frontend smoke step.                          |
| `SKIP_FRONTEND`    | unset   | When `=1`, skips step 6 (frontend build + curl).                |
| `QUIET`            | unset   | When `=1`, suppress per-step subprocess output to the terminal. |

---

## Spec mapping

Each step of the gate maps to one or more Lane 6 spec assertions and to
the evidence file the script writes under `qa-proof/evidence/<run-id>/`.

| # | Step                                         | Spec assertion(s)                                                                          | Evidence file                                |
| - | -------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 0 | preflight build etoro-client                 | (build precondition for steps 1–2)                                                         | `00-build-etoro-client.log`                  |
| 1 | safety constant `REAL_TRADING_ENABLED`       | "No real trading possible — hardcoded fence, not env"                                      | `01-safety-constant.log`                     |
| 2 | etoro-client jest                            | Auth flow + demo notional caps reject orders + `RealTradingDisabledError` in real mode     | `02-etoro-client-tests.log`                  |
| 3 | hedge-engine jest                            | Hedge dry-run never sends real orders; `HedgeProof` schema is correct                      | `03-hedge-engine-tests.log`                  |
| 4 | qa-harness integration                       | Cadence/freshness, stale-rejection, oracle on-chain tx lands, frontend reads chain, hedge  | `04-qa-harness.log` + `qa-harness/`          |
| 5 | hedge demo dry-run + proof                   | A `HedgeProof` JSON artifact is produced with before/after exposure + `dryRun=true`        | `05-hedge-demo.log` + `hedge-proof.json`     |
| 6 | frontend build + `/live-prices-proof` smoke  | Visible proof page renders; safety banner asserts `REAL_TRADING_ENABLED = false` on render | `06-frontend-smoke.log` + `proof-page.html` |

The qa-harness sub-evidence (per-check JSON entries from
`backend/qa-harness/src/evidence.ts`) is copied into
`qa-proof/evidence/<run-id>/qa-harness/` so reviewers can drill into each
sub-check without leaving the run dir.

---

## Manual verification

After the script prints `OK lane6-qa-gate passed …`, perform a final
human spot-check:

1. With the frontend dev server still running (`npm run dev` in
   `frontend/`), open <http://localhost:3000/live-prices-proof>.
2. Confirm the **Safety banner** shows the green "Safe" pill and the
   line `REAL_TRADING_ENABLED = false on both sides`.
3. Confirm the **Live Quotes panel** lists at least one symbol with a
   fresh (non-stale) age badge.
4. Confirm the **On-chain Oracle panel** lists tickers with prices and
   `Updated` timestamps within the last few minutes (or the panel
   surfaces a degraded message — no silent blanks).
5. Confirm the **Recent Oracle Updates panel** shows at least one tx
   hash (and the hash links to the configured block explorer).
6. Confirm the **Last Demo Hedge panel** shows the proof card with
   `dry-run` badge, `real trading: false`, and matching before/after
   netDelta.

Any of these checks failing is a release-blocker even if the script
exited 0 — they catch UI regressions the script cannot see.

---

## RC manifest snippet

Paste the following into the release-please config / RC ticket under the
`lane: 6` entry. Replace `<run-id>` with the actual run id from the gate
output.

```yaml
lane: 6
name: live-prices & demo-hedge
status: green
evidence:
  gate-script: scripts/release/lane6-qa-gate.sh
  gate-run-id: <run-id>
  proof-page: /live-prices-proof
  hedge-proof: qa-proof/hedges/latest.json
  qa-harness-summary: qa-proof/evidence/<run-id>/qa-harness/<run-id>/summary.json
safety:
  real-trading-enabled: false
  enforcement: hardcoded literal in backend/etoro-client/src/safety.ts
  modes-allowed: [sandbox, demo, dry-run]
```

---

## Rollback

If the live eToro source degrades after release and the proof page begins
to show persistent stale or degraded states:

1. Stop the price-service (`pm2 stop price-service`).
2. Unset eToro env in the price-service ecosystem entry:
   `unset ETORO_API_KEY ETORO_API_SECRET ETORO_BASE_URL ETORO_MODE`.
3. Set `ORACLE_SYMBOLS=""` for the oracle-signer so it stops submitting
   stale prices.
4. The frontend falls back to the static seed prices from
   `frontend/src/lib/stockData.ts` (see `useStockPrices.ts` —
   `FALLBACK_PRICES`).

The fallback is intentionally always available — `useStockPrices` never
trusts the on-chain oracle unconditionally. No code change is needed to
roll back.

---

## Exit codes

| Code | Meaning                                                      | Example causes                                                                |
| ---- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `0`  | All steps passed.                                            | —                                                                             |
| `1`  | A test or runtime check failed (logical failure).            | Jest red, harness assertion mismatch, frontend smoke missing expected markers |
| `2`  | Setup / environment precondition failed (cannot start gate). | `jq`/`curl`/`rsync`/`forge` not on PATH; ports already in use                 |

Reviewers should triage `2` separately from `1`: `2` typically means the
gate is unrepresentative (rerun in a clean shell), while `1` is a real
regression that must be diagnosed before the release tag.
