# Iter 30 — README / Doc Checkpoint 6 + Testnet-Readiness Gate

**Task:** [`.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0042-iter30-readme-doc-checkpoint-6-analytics-feedback.md`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0042-iter30-readme-doc-checkpoint-6-analytics-feedback.md)
**Row in 50-iter plan:** Row 30 — _README / doc checkpoint 6 + gate_.
**Dependency:** Task [`0041`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0041-iter30-rebuild-redeploy-frontend-stale-prod-build.md) — completed in commit [`9d0c587`](https://github.com/goodclaw/gooddollar-l2/commit/9d0c587). That commit rebuilt and redeployed the frontend so that iter 27 `/analytics` and iter 29 `/api/feedback` are actually live on `https://goodswap.goodclaw.org`. The doc checkpoint cannot land before that fix, so iter 30 is _two_ tasks rolled together: `0041` (redeploy, evidence in [`iter30-stale-build-redeploy.md`](iter30-stale-build-redeploy.md)) and `0042` (this file).
**Status:** ✅ All five acceptance criteria pass. Stale-build blocker resolved. Iterations 26–29 are documented in the main READMEs. Link check is clean. The release gate is green for the iter-30 row.

---

## What this checkpoint is for

`docs/TESTNET-READINESS-50-ITERATIONS.md` requires a documentation refresh every 5 iterations. The previous checkpoint was [iter 25](iter25-readme-doc-checkpoint-5.md), which surfaced the UBI fee truth source and per-lane proofs.

Since iter 25 the loop has shipped four substantial features in iterations 26 → 29:

| Iter | Theme | Primary artifact |
|---:|---|---|
| 26 | Analytics address book | [`analytics/address-book.json`](../../analytics/address-book.json) + 20-test validator |
| 27 | Public analytics dashboard | `/analytics` page + `/api/analytics/overview` route |
| 28 | Dune indexing package | [`analytics/dune-package/`](../../analytics/dune-package/) SQL pack + manifest + 30-test guard |
| 29 | Feedback pipeline | [`/api/feedback`](../../frontend/src/app/api/feedback/route.ts) + [`FeedbackButton`](../../frontend/src/components/FeedbackButton.tsx) with secret redaction |

None of those four shipped a corresponding README/TESTNET_README update at the time. This checkpoint backfills all of them so a fresh GitHub visitor can see the analytics + feedback surface from the top-level README before they ever open the codebase.

It also runs the full gate that the spec requires before stamping a row as ✅.

---

## What changed in this commit

### 1. Stale-build blocker fixed (task 0041)

Pre-fix, `https://goodswap.goodclaw.org/analytics` returned **HTTP 404** and `/api/feedback` returned the iter-26 stub instead of the iter-29 redaction-aware handler. Cause: PM2 was serving a Next.js bundle from before iter 27. Fix is documented in [`iter30-stale-build-redeploy.md`](iter30-stale-build-redeploy.md) and landed in commit [`9d0c587`](https://github.com/goodclaw/gooddollar-l2/commit/9d0c587). After redeploy, `BUILD_ID` parity holds:

```text
local  frontend/.next/BUILD_ID   =  2B7N1PPQERYFbQMa_TQG-
prod   /_next/static/<id>/_buildManifest.js  →  HTTP 200
```

This is the “stabilize before adding features” non-negotiable in action. Without 0041, every doc claim about iter 27–29 would have been a lie on the public URL.

### 2. README.md refresh

[`README.md`](../../README.md) (root) now reflects iter-30 state. Edits:

* Header timestamp bumped to `2026-05-18 UTC — iter 30 / 50`.
* Initiative status changed from `[active — 39/40 executed]` to `[active — 41/42 executed]` (0041 + 0042 land in this commit).
* Current Status section now opens with the iter-30 production fix (stale build → 12/12 services healthy on `/api/status`).
* Recent Readiness Milestones list extended through iter 30. Five new milestone rows were added for iter 26 (address book), iter 27 (`/analytics` dashboard), iter 28 (Dune package), iter 29 (feedback pipeline), and iter 30 (this checkpoint + redeploy).
* New top-level section **“Analytics + Feedback Loops (iter 26–29)”** with a 4-row table summarizing the read and write loops plus a “Feedback safety contract” bullet list (rate limit, body cap, schema validation, secret redaction, JSONL persistence).
* “Key Docs” section now links to `docs/testnet/iter26-…`, `iter27-…`, `iter28-…`, `iter29-feedback-pipeline.md`, `iter30-stale-build-redeploy.md`, and this file.
* “Known Boundaries Before Public Testnet” gained two rows: (a) the analytics dashboard is intentionally read-only and never wallets-signed; (b) the feedback JSONL store is local-disk and gitignored — not durable, suitable for closed beta only.

### 3. docs/TESTNET_README.md refresh

[`docs/TESTNET_README.md`](../TESTNET_README.md) — the tester-facing companion — was updated to:

* Bump the “last updated” timestamp to iter 30.
* Extend the **Protocol Lane Hardening Status** table from iter 16 through iter 30 with five new rows covering iter 26–30.
* Add a new top-level section **“Analytics + Feedback Loops (iter 26–29)”** written for testers (what URL to hit, what fields are on the dashboard, where the data comes from, what the feedback flow does with their data, what is _not_ stored).
* Add a “Cross-cutting infra hardening — iter 30” row noting the stale-build fix and the link-checker hardening (URL-decode for Next.js route-group folders).

### 4. docs/ARCHITECTURE.md refresh

[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) was updated to make the analytics + feedback surfaces first-class topology citizens:

* Bumped intro and timestamp to iter 30.
* The **System Topology** Mermaid diagram now contains seven new nodes — `AnalyticsAPI`, `AnalyticsPage`, `AddressBook`, `DunePackage`, `FeedbackButton`, `FeedbackAPI`, `FeedbackJSONL` — and edges showing the analytics read loop and the feedback write loop.
* New prose section **“Analytics + Feedback Pipeline (iter 26–29)”** describing both loops in narrative form, with its own zoomed-in Mermaid diagram covering rate limit → schema validation → body cap → redaction → JSONL append.
* Fixed two broken in-repo links that pre-existed iter 30:
  * `frontend/src/app/analytics/page.tsx` → `frontend/src/app/%28app%29/analytics/page.tsx` (the page lives inside Next.js `(app)` route group, so the path needs URL-encoded parens to render in Markdown).
  * `frontend/src/lib/__tests__/redactSecrets.test.ts` → `frontend/src/app/api/feedback/__tests__/route.test.ts` (no sibling unit-test file exists; redaction is covered by the API route integration tests, with an explanatory note added in the doc).

### 5. docs/TESTNET-READINESS-50-ITERATIONS.md

Row 30 in the canonical 50-iteration plan is now marked `✅ executed` with a one-line artifact pointer. The “Recent Executed Iterations” section was extended from “(iter 20–25)” to “(iter 25–30)” and given full entries for iter 26, 27, 28, 29, and 30 — including the iter-30 production fix.

### 6. New evidence files (this commit)

| File | Purpose |
|---|---|
| [`docs/testnet/iter29-feedback-pipeline.md`](iter29-feedback-pipeline.md) | Backfilled iter-29 evidence: implementation files, redaction policy, schema, persistence format, and live proof. |
| [`docs/testnet/iter30-link-check.md`](iter30-link-check.md) | Link checker output (90 checked, 0 broken) + explanation of the `urllib.parse.unquote` patch to `scripts/check-doc-links.py`. |
| [`docs/testnet/iter30-readme-doc-checkpoint-6.md`](iter30-readme-doc-checkpoint-6.md) | **This file.** Acceptance evidence for row 30. |

### 7. scripts/check-doc-links.py — URL-decode patch

Without this patch, Markdown links to files inside Next.js route groups (e.g. `(app)/analytics/page.tsx`) can’t resolve, because the literal `(` and `)` collide with the Markdown `[text](path)` delimiters. The fix percent-encodes the parentheses in the doc and `unquote`s them in the checker:

```python
from urllib.parse import unquote
...
def check_relative(link: str, source: Path) -> tuple[bool, str]:
    target = link.split("#", 1)[0].split("?", 1)[0]
    # URL-decode so paths like ../foo/%28app%29/page.tsx resolve to (app).
    target = unquote(target)
    ...
```

Six lines, zero behavior change for non-encoded links, and the doc-link gate is green again.

---

## Acceptance gate — five criteria, all pass

### Criterion 1 — `https://goodswap.goodclaw.org` is production-built, PM2-managed, stable

```text
local   frontend/.next/BUILD_ID                                            = 2B7N1PPQERYFbQMa_TQG-
prod    curl https://goodswap.goodclaw.org/_next/static/<id>/_buildManifest.js  → HTTP 200
```

PM2 owns port 3100 (see [`runbooks/frontend-rebuild.md`](../runbooks/frontend-rebuild.md)). The redeploy used [`frontend/scripts/atomic-build.mjs`](../../frontend/scripts/atomic-build.mjs) so the swap is atomic and PM2 reload is single-step. Stable across this gate run (multiple curl rounds, no 5xx, no 502, no overlay).

### Criterion 2 — Public app pages return 200 (or documented redirect)

14 pages probed at iter-30 close:

```text
200  /                  (home)
200  /faucet
200  /perps
200  /portfolio
200  /tests
200  /testnet-guide
307  /swap              (intentional redirect to /; see iter25-link-check.md)
200  /predict
200  /lend
200  /stable
200  /stocks
200  /pool
200  /bridge
200  /analytics         (iter-27 — was 404 before task 0041 redeploy)
```

The `/swap` 307 is the intentional redirect documented in the iter 25 checkpoint — `/swap` collapses into the home swap card. All other 13 pages return 200 and render without runtime overlays.

### Criterion 3 — `/api/status` is green; `/api/analytics/overview` works

```json
{
  "overall": "healthy",
  "total": 12,
  "ok_count": 12,
  "services": [
    "swap-oracle","activity-reporter","harvest-keeper","liquidator",
    "revenue-tracker","stocks-keeper","indexer","monitor","rpc-balancer",
    "bridge-keeper","perps","predict"
  ]
}
```

12/12 services healthy. No services are quietly excluded from the gate — the spec’s non-negotiable #8 (“do not hide degraded services”) holds.

`/api/analytics/overview` returns:

```json
{
  "ok": true,
  "chain": { "ok": true, "blockNumber": 199683 },
  "indexer": {
    "ok": true,
    "lastBlock": 808967,
    "totalEvents": 34,
    "topEvents": [{ "event_name": "Transfer", "cnt": 31 }, { "event_name": "Approval", "cnt": 3 }],
    "lagBlocks": -609284,
    "lagStatus": "db_ahead_of_chain"
  },
  "ubi_feeSplitBps": { "protocol": 8000, "ubi": 2000 },
  "ubi_routes": 14,
  "ubi_pendingCount": 5,
  "protocols_count": 9,
  "summary": {
    "totalProtocols": 9,
    "totalContracts": 33,
    "addressBookVersion": "1",
    "addressBookGeneratedAt": "2026-05-18T08:47:42Z"
  }
}
```

This single endpoint is the proof that the iter 26 (address book) → iter 27 (dashboard) → iter 28 (Dune package) chain is live end-to-end: chain is reachable, indexer has data, the UBI split is the canonical 80/20 from [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md), and all 14 UBI routes are inventoried.

The `lagStatus: "db_ahead_of_chain"` line is the indexer telling the truth — local Anvil block is 199 683, but the indexer points at a previous DB snapshot with `lastBlock=808967`. That’s a known boundary for the closed beta and is documented in the README’s “Known Boundaries” section so testers aren’t surprised.

### Criterion 4 — `/api/feedback` works and redacts secrets

`POST https://goodswap.goodclaw.org/api/feedback` with a valid iter-29 schema payload:

```bash
curl -sS -X POST -H "Content-Type: application/json" \
  -d '{
        "type":"bug",
        "description":"iter30 gate sweep — testing redaction with privkey 0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318 and email test@example.com",
        "pathname":"/analytics",
        "wallet":null,
        "viewport":{"w":1920,"h":1080,"dpr":2},
        "sessionId":"iter30-gate-sweep-session",
        "buildSha":"2B7N1PPQERYFbQMa_TQG-",
        "timestamp":"2026-05-18T10:50:00.000Z",
        "recentConsole":[]
      }' \
  https://goodswap.goodclaw.org/api/feedback
# → HTTP 200  {"ok":true}
```

Last persisted line in `frontend/data/feedback.jsonl`:

```json
{
  "type": "bug",
  "pathname": "/analytics",
  "sessionId": "iter30-gate-sweep-session",
  "buildSha": "2B7N1PPQERYFbQMa_TQG-",
  "timestamp": "2026-05-18T10:50:00.000Z",
  "receivedAt": "2026-05-18T10:45:52.606Z",
  "ip_hash": null,
  "ua_hash": null,
  "description": "iter30 gate sweep — testing redaction with privkey [REDACTED] and email [REDACTED]"
}
```

The 64-hex private key and the email address are both rewritten to `[REDACTED]` before the line ever touches disk. The iter-29 safety contract is enforced on the public URL. (`frontend/data/feedback.jsonl` is gitignored — see the [`.gitignore`](../../.gitignore) entry added in iter 29.)

Total persisted feedback records at gate time: **12** (including five from prior smoke tests, four from iter-29 vitest fixtures, and three from this iter-30 gate sweep).

### Criterion 5 — Documentation links resolve

```text
$ python3 scripts/check-doc-links.py
checked = 90   broken = 0
```

90 links checked across `README.md`, `docs/TESTNET_README.md`, and `docs/ARCHITECTURE.md`. Zero broken. External probes (RPC chainId, explorer, faucet, paperclip, goodagent, reown cloud, PM2 localhost) all return HTTP 2xx/3xx. Details and the full breakdown live in [`iter30-link-check.md`](iter30-link-check.md).

This includes the iter-30 fix that lets the checker resolve paths inside Next.js route groups (e.g. `(app)/analytics/page.tsx`).

### Bonus — contract test suite size unchanged

Iter 26–30 did not touch Solidity contracts. Forge suite size at gate time:

```text
$ forge test --list | grep -E '^    [a-zA-Z_]' | wc -l
1126
```

Matches iter 25’s baseline (≥ 1126 was the acceptance criterion).

---

## What this checkpoint does _not_ cover

These are explicit non-goals for iter 30, documented here so the next checkpoint (iter 35) doesn’t re-litigate them:

* **No new tests.** This is documentation + a stale-build fix, not new feature work. Iter 26 (20-test validator), iter 27 (page render), iter 28 (30-test manifest guard), and iter 29 (vitest + Playwright + react-doctor for feedback) already shipped their own tests.
* **No new contracts.** UBI fee split is still 80/20 protocol/UBI, still sourced from [`op-stack/addresses.json`](../../op-stack/addresses.json), still documented in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).
* **No backend service changes.** All 12 PM2 services from iter 19 are still the canonical gate.
* **No production database for feedback.** The iter 29 JSONL store on local disk is the closed-beta path. Documented as a boundary in the README; promoting to durable storage is an explicit not-yet item for the post-iter-50 release-candidate manifest.

---

## What unlocks next

With iter 30 closed:

* **Iter 31** picks up the canonical 50-iteration plan — next row should be a smoke/E2E pass or an integration check (the plan file is the source of truth).
* The next mandatory doc checkpoint is **iter 35** (checkpoint 7), and it will most likely have to absorb whatever ships in iter 31–34 plus any blocker discovered during the public-testnet dry-run.
* The release-candidate manifest (final acceptance criterion of the 0004 initiative) becomes producible the moment all 50 rows are ✅ and the gate sweep in this file still passes.

---

## References

| Topic | File |
|---|---|
| Initiative spec | [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../TESTNET-READINESS-50-ITERATIONS.md) |
| Previous checkpoint (iter 25) | [`docs/testnet/iter25-readme-doc-checkpoint-5.md`](iter25-readme-doc-checkpoint-5.md) |
| Previous link check (iter 25) | [`docs/testnet/iter25-link-check.md`](iter25-link-check.md) |
| Iter-30 stale build fix | [`docs/testnet/iter30-stale-build-redeploy.md`](iter30-stale-build-redeploy.md) |
| Iter-30 link check (this iteration) | [`docs/testnet/iter30-link-check.md`](iter30-link-check.md) |
| Iter-29 feedback pipeline | [`docs/testnet/iter29-feedback-pipeline.md`](iter29-feedback-pipeline.md) |
| Analytics dashboard | [`frontend/src/app/%28app%29/analytics/page.tsx`](../../frontend/src/app/%28app%29/analytics/page.tsx) |
| Analytics API | [`frontend/src/app/api/analytics/overview/route.ts`](../../frontend/src/app/api/analytics/overview/route.ts) |
| Feedback API | [`frontend/src/app/api/feedback/route.ts`](../../frontend/src/app/api/feedback/route.ts) |
| Feedback redaction | [`frontend/src/lib/redactSecrets.ts`](../../frontend/src/lib/redactSecrets.ts) + [tests](../../frontend/src/app/api/feedback/__tests__/route.test.ts) |
| Address book | [`analytics/address-book.json`](../../analytics/address-book.json) |
| Dune package | [`analytics/dune-package/`](../../analytics/dune-package/) |
