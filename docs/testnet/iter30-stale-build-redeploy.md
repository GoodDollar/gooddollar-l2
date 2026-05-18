# Iter 30 — Frontend Stale Production Build: Rebuild + Redeploy

**Task:** [`.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0041-iter30-rebuild-redeploy-frontend-stale-prod-build.md`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0041-iter30-rebuild-redeploy-frontend-stale-prod-build.md)
**Iteration:** 30 (README/doc checkpoint 6 + gate)
**Severity at discovery:** P0 — Critical (blocks gate)
**Status:** ✅ Resolved on production

---

## Problem

During the Iteration 30 product review surface sweep, the public deployment at
`https://goodswap.goodclaw.org` was found to be serving a **stale `.next` build**
that predated the Iteration 27, 28, and 29 commits by **~5 hours**:

| Artefact | Pre-deploy state | Source commit |
|---|---|---|
| `frontend/.next/BUILD_ID` | `Pt3Kt4lE_7e4DJhrE6NL-` | mtime `2026-05-18 04:57:19Z` |
| `frontend/.next/build-manifest.json` | last touched | mtime `2026-05-18 04:57:03Z` |
| `frontend/src/app/(app)/analytics/page.tsx` (iter27) | committed at | `7192926` — `2026-05-18 09:20:29Z` |
| `frontend/src/app/api/analytics/overview/route.ts` (iter27) | committed at | `7192926` — `2026-05-18 09:20:29Z` |
| `frontend/src/app/api/feedback/route.ts` (iter29) | committed at | `295f576` — `2026-05-18 09:56:40Z` |

The deployed `.next/server/app-paths-manifest.json` confirmed the regression
empirically — it contained **no entries** for `(app)/analytics/page` or
`/api/analytics/overview/route`, even though both source files had been
committed and were buildable locally (`.next.e2e/` had them).

This violated three Non-Negotiable Requirements from the initiative spec
(`docs/TESTNET-READINESS-50-ITERATIONS.md` / initiative `0004`):

- #1 — **Stabilize before adding features.** The doc-checkpoint iteration was
  about to claim coverage of features that were not actually reachable on the
  public URL.
- #6 — **Public URLs and production behavior matter more than localhost.**
- #8 — **Do not hide degraded services.** The `/analytics` route was returning
  HTTP 404 to real users.

## Resolution

`frontend/scripts/deploy.sh` is the canonical, atomic frontend deploy script:
`npm ci` → `npm run build` (which invokes `scripts/atomic-build.mjs`) →
`pm2 reload goodswap --update-env` → `scripts/check-buildid-sync.mjs --strict`.
The `check-buildid-sync.mjs` step is a regression guard added specifically for
this class of bug — it compares the disk `BUILD_ID` with the `buildId` field in
the live `__NEXT_DATA__` payload served by the running PM2 process and fails
loud if they drift.

```bash
cd /home/goodclaw/gooddollar-l2/frontend && npm run deploy
```

Runtime: 87.7 s. Exit code: 0. The script generated 28 static pages including
`/analytics` and the two new API routes, then reloaded PM2 with the new
`BUILD_ID` and verified sync.

## Pre-deploy evidence

```
$ git status --short
?? frontend/testing-infrastructure-analysis.md            # untracked, unrelated

$ git log -1 --format='%h %ai'                              # main
295f576 2026-05-18 09:56:40 +0000                          # iter29 commit

$ cat frontend/.next/BUILD_ID
Pt3Kt4lE_7e4DJhrE6NL-

$ stat -c '%y' frontend/.next/BUILD_ID frontend/.next/build-manifest.json
2026-05-18 04:57:19 +0000   BUILD_ID
2026-05-18 04:57:03 +0000   build-manifest.json

# app-paths-manifest entries for iter27/iter29 routes:
$ grep -E '(analytics|feedback)' frontend/.next/server/app-paths-manifest.json
  "/api/feedback/route": "app/api/feedback/route.js",
  "(app)/governance/analytics/page": "app/(app)/governance/analytics/page.js"
# ^ NOTE: "/api/analytics/overview/route" and "(app)/analytics/page" both ABSENT

$ pm2 jlist | jq '.[]|select(.name=="goodswap")|{status:.pm2_env.status, restarts:.pm2_env.restart_time}'
{ "status": "online", "restarts": 0 }                       # ~20.6 days uptime

$ curl -o /dev/null -s -w 'HTTP %{http_code}\n' https://goodswap.goodclaw.org/analytics
HTTP 404                                                    # ❌ iter27 route missing
$ curl -o /dev/null -s -w 'HTTP %{http_code}\n' https://goodswap.goodclaw.org/api/analytics/overview
HTTP 404                                                    # ❌ iter27 API missing
$ curl -o /dev/null -s -w 'HTTP %{http_code}\n' https://goodswap.goodclaw.org/
HTTP 200                                                    # ✅ root not regressed
```

## `npm run deploy` output (abridged)

```
> goodswap@0.0.0 build
> node scripts/atomic-build.mjs
...
✓ Generating static pages (28/28)
Route (app)                                Size     First Load JS
├ ƒ /analytics                             ...      ...           # ← iter27 reborn
├ ƒ /api/analytics/overview                0 B      0 B           # ← iter27 reborn
├ ƒ /api/feedback                          0 B      0 B           # ← iter29 schema
...
New disk BUILD_ID: 2B7N1PPQERYFbQMa_TQG-
...
[PM2] Applying action restartProcessId on app [goodswap](ids: [ 0 ])
[PM2] [goodswap](0) ✓
[deploy] verifying BUILD_ID sync...
OK — disk BUILD_ID matches live: 2B7N1PPQERYFbQMa_TQG-
```

Total: 87.7 s, exit 0.

## Post-deploy evidence

```
$ cat frontend/.next/BUILD_ID
2B7N1PPQERYFbQMa_TQG-                                       # ✅ rotated

$ stat -c '%y' frontend/.next/BUILD_ID frontend/.next/build-manifest.json
2026-05-18 10:14:24 +0000   BUILD_ID                        # ✅ fresh
2026-05-18 10:14:08 +0000   build-manifest.json

$ grep -E '(analytics|feedback)' frontend/.next/server/app-paths-manifest.json
  "/api/analytics/overview/route": "app/api/analytics/overview/route.js",
  "/api/feedback/route": "app/api/feedback/route.js",
  "(app)/analytics/page": "app/(app)/analytics/page.js",
  "(app)/governance/analytics/page": "app/(app)/governance/analytics/page.js"
# ✅ all four entries present

$ pm2 jlist | jq '.[]|select(.name=="goodswap")|{status:.pm2_env.status, restarts:.pm2_env.restart_time, pid:.pid}'
{ "status": "online", "restarts": 2, "pid": 612490 }        # +2 = postbuild + main reload

$ node scripts/check-buildid-sync.mjs --strict; echo "exit=$?"
OK — disk BUILD_ID matches live: 2B7N1PPQERYFbQMa_TQG-
exit=0
```

### Gate A — Public probes after redeploy

**A1 — `/analytics` (iter27 dashboard):**

```
$ curl -o /dev/null -s -w 'HTTP %{http_code}\n' https://goodswap.goodclaw.org/analytics
HTTP 200                                                    # ✅
```

**A2 — `/api/analytics/overview` (iter27 API):**

```
$ curl -sS https://goodswap.goodclaw.org/api/analytics/overview \
  | jq '{ok, panels:[.summary,.status,.indexer,.chain,.ubi]|map(.ok // (.|has("totalRoutes")))}'
{
  "ok": true,
  "panels": [ true, true, true, true, true ]
}
# Live block reported: 198,773 — status 12/12 healthy — 14 UBI routes
```

**A3 — `/api/feedback` (iter29 pipeline) — schema rejection on bad payload:**

```
$ curl -sS -X POST .../api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"type":"bug","description":"x","route":"/analytics", ...}'   # uses pre-iter29 field "route"
{"error":"pathname must be a string starting with /"}       HTTP 400
# ✅ Pre-iter29 handler would have accepted this — iter29 validator
#    now actively rejects malformed payloads.
```

**A3 — `/api/feedback` — happy path with redaction:**

```
$ curl -sS -X POST .../api/feedback -d '{"type":"bug",
    "description":"iter30 smoke — privkey 0x1111…1111 should be redacted",
    "pathname":"/analytics","wallet":null,"viewport":{"w":1920,"h":1080,"dpr":1},
    "sessionId":"iter30-smoke","buildSha":"2B7N1PPQERYFbQMa_TQG-",
    "recentConsole":[],"timestamp":"..."}'
{"ok":true}                                                 HTTP 200

$ tail -1 /home/goodclaw/gooddollar-l2/frontend/data/feedback.jsonl
{"receivedAt":"2026-05-18T10:16:24.071Z","ip":"152.70.55.73","type":"bug",
 "description":"iter30 prod redeploy smoke — privkey [REDACTED] should be redacted",
 "pathname":"/analytics","wallet":null,"viewport":{"w":1920,"h":1080,"dpr":1},
 "sessionId":"iter30-smoke","buildSha":"2B7N1PPQERYFbQMa_TQG-",
 "timestamp":"2026-05-18T10:16:24Z","recentConsole":[]}
# ✅ persisted to JSONL, ✅ 64-char privkey replaced with [REDACTED], ✅ IP captured
```

**A4 — BUILD_ID sync guard (`scripts/check-buildid-sync.mjs --strict`):** OK, exit 0.

## What changed in this commit

- Added `docs/testnet/iter30-stale-build-redeploy.md` (this file).
- Marked task `0041` `executed: true`.
- **No source-code changes.** The fix was operational: re-running the existing
  `frontend/scripts/deploy.sh` against an already-committed source tree.

The 5-hour build/deploy drift had no code-level root cause to patch — it was a
process gap (commits to `main` did not automatically trigger a redeploy). That
gap is tracked separately in the runbook recommendation at the bottom of this
file; closing it programmatically (e.g. a post-merge GitHub Action that calls
`frontend/scripts/deploy.sh`) is out of scope for iteration 30, which is a
documentation checkpoint.

## Runbook recommendation (not in this commit)

When merging frontend or API-route changes to `main`, run:

```bash
cd /home/goodclaw/gooddollar-l2/frontend && npm run deploy
```

Or set up CD that does the equivalent. The `check-buildid-sync.mjs --strict`
exit code makes it safe to gate on.

## References

- Task: `.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0041-iter30-rebuild-redeploy-frontend-stale-prod-build.md`
- Followup task (doc checkpoint): `0042-iter30-readme-doc-checkpoint-6-analytics-feedback.md`
- Deploy script: `frontend/scripts/deploy.sh`
- BUILD_ID sync guard: `frontend/scripts/check-buildid-sync.mjs`
- Initiative plan row: [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../TESTNET-READINESS-50-ITERATIONS.md) row 30
