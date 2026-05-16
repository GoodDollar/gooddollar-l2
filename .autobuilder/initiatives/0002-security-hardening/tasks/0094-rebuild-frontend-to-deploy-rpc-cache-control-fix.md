---
id: gooddollar-l2-rebuild-frontend-to-deploy-rpc-cache-control-fix
title: "CRITICAL — fresh-eyes user lands on /activity and sees a red 'Couldn't reach the chain RPC' banner because production still ships the pre-task-0091 frontend bundle (`Cache-Control: no-store` baked into `page-cabf2db9181fda32.js`)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

# CRITICAL — Re-deploy the frontend so the Cache-Control RPC fix from task 0091 actually reaches end users

## Problem statement

A first-time user who navigates to `https://goodswap.goodclaw.org` and clicks the
"Live Activity" link in the header lands on `/activity` and is greeted with a
giant red error banner:

```
Couldn't reach the chain RPC.
eth_blockNumber → https://rpc.goodclaw.org (Failed to fetch)
```

The header pulse next to "Live Activity" stays red ("Offline"), every block
bar is empty, and every tester ping shows "—". From a fresh-eyes perspective
the site looks broken on its very own "look at the chain" demo page — the page
the project links to as proof the chain is alive.

This is **not** a regression in the source code. The fix from task 0091
(`commit 7dc5319`) is present in `frontend/src/lib/rpc.ts`: the
`Cache-Control: no-store` request header has been removed and replaced with
the CORS-safe `cache: 'no-store'` `RequestInit` option. CI passed, the source
is correct.

The bug is that **production never rebuilt** after that source change:

| Artifact                                        | Timestamp / hash                      |
| ----------------------------------------------- | ------------------------------------- |
| `frontend/src/lib/rpc.ts`                       | last modified **2026-05-16 14:56:49** |
| commit `7dc5319` (task 0091)                    | **2026-05-16 14:59:39**               |
| `frontend/.next/BUILD_ID`                       | written **2026-05-16 14:13:59** (`RW3xVfH9YRqrZPBeRpb9r`) — **45 minutes BEFORE the fix** |
| `goodswap` PM2 process uptime                   | 97 minutes (last reload was at the same 14:13 build) |
| Production chunk `/_next/static/chunks/app/activity/page-cabf2db9181fda32.js` | still contains the literal string `"Cache-Control":"no-store"` |

So even though `git pull` on the prod box has the fixed `rpc.ts`, the live
PM2 process is serving a `.next/` directory that was compiled from
pre-fix source and bundled the broken header into the activity-page chunk.
Every browser that loads `/activity` therefore makes an `OPTIONS`
preflight to `rpc.goodclaw.org` with `Access-Control-Request-Headers:
cache-control,content-type` — which Caddy's CORS responder rejects, the
browser aborts the POST, and the page renders the red banner.

This affects every page that imports `rpcCall` from `@/lib/rpc`, not just
`/activity`. Per the 0091 commit message, that includes `lend`, `balances`,
`agents`, `sponsorship`, and the oracle UI — they are all silently broken in
production right now.

### Root cause: deploy pipeline gap

Task 0087 (`commit 3f5f181`) added a `postbuild` hook so that **whenever
`next build` runs**, PM2 is automatically reloaded and the bundle hash is
verified live. That mechanism works correctly — but it is only invoked if
someone actually triggers a build. The autobuilder loop only does
`git add && git commit` after each task; it does not run `npm run build`
or `npm run deploy` in `frontend/`. Task 0091's executor edited a `.ts`
source file, ran tests/lint, committed, and moved on — leaving disk
`.next/` and the live PM2 process pinned to the pre-fix bundle.

### How it was found

This iteration's review strategy is **fresh-eyes**: pretend you've never
seen this app before. The first thing such a user does is click the most
prominent header CTA. "Live Activity" is one of those CTAs. Loading
`/activity` in `agent-browser` (with `--ignore-https-errors` because the
local Caddy cert is self-signed) shows the red error banner immediately;
loading the same URL via `curl -sk` confirms the served chunk is the stale
`page-cabf2db9181fda32.js` that still embeds `"Cache-Control":"no-store"`.

```bash
$ curl -sk https://goodswap.goodclaw.org/_next/static/chunks/app/activity/page-cabf2db9181fda32.js | grep -o '"Cache-Control":"no-store"'
"Cache-Control":"no-store"
```

A first-time user has no way to know this is "just a deploy lag" — to them
the project's chain is offline.

## User story

As a brand-new visitor evaluating GoodDollar L2, I want the "Live Activity"
page (and every other page that talks to the RPC) to actually render real
on-chain data on my first visit, so that my first impression is "this chain
is live and the team ships" — not "this dashboard is broken".

## Proposed UX

1. Open `https://goodswap.goodclaw.org/activity` in a fresh browser.
2. The header pulse goes green ("Live") within ~1 second.
3. The block timeline renders bars for the latest blocks.
4. The 7 tester pings update with non-`—` values.
5. There is **no** red error banner anywhere on the page.
6. DevTools → Network → `eth_blockNumber` request to `rpc.goodclaw.org` is
   a single `POST` with HTTP 200 — **no failed `OPTIONS` preflight, no
   `Cache-Control` request header**.
7. The activity-page chunk URL is **not** `page-cabf2db9181fda32.js` any
   more — Next has rotated the hash to reflect the fixed source.

## Implementation plan

The class of bug here is "source fix landed but disk `.next/` and the live
PM2 process are stale". The repo already has the right tool for this:
`frontend/scripts/deploy.sh` (entry point: `npm run deploy`). It does
`npm ci → next build → pm2 reload goodswap --update-env → poll
http://localhost:3100/ → check-buildid-sync.mjs --strict`. Task 0087's
postbuild hook plus task 0060's deploy wrapper together guarantee that
once `next build` finishes successfully, the live process serves the new
bundle.

So the fix is simply: **run the supported deploy entry point.**

1. From `frontend/`, run `npm run deploy` (or, if `node_modules` is already
   coherent, `FRONTEND_DEPLOY_SKIP_CI=1 npm run deploy`).
2. Confirm `.next/BUILD_ID` rotated to a new value (i.e. no longer
   `RW3xVfH9YRqrZPBeRpb9r`).
3. Confirm the postbuild hook reported `pm2 reload goodswap` succeeded
   and `check-buildid-sync.mjs --strict` passed.
4. Curl the new activity-page chunk through Caddy and `grep` for
   `"Cache-Control":"no-store"`. Expected output: empty (no match).
5. Open `https://goodswap.goodclaw.org/activity` in `agent-browser` with
   `--ignore-https-errors` and assert the red error banner is gone and the
   header pulse reads "Live".

If `npm ci` is too slow / unsafe in the loop sandbox, fall back to
`FRONTEND_DEPLOY_SKIP_CI=1 npm run deploy` since the only thing that
actually changed since the last build is `src/lib/rpc.ts`.

## Architecture diagram

```mermaid
flowchart LR
    A[git commit 7dc5319<br/>fixes src/lib/rpc.ts] -->|pushed by loop| B[origin/main]
    B -->|git pull on prod| C[disk: rpc.ts FIXED]
    C -.->|never rebuilt| D[disk: .next/BUILD_ID stale<br/>RW3xVfH9YRqrZPBeRpb9r 14:13]
    D --> E[PM2 goodswap pid 3844695<br/>uptime 97m, last reload 14:13]
    E --> F[browser loads<br/>page-cabf2db9181fda32.js<br/>contains 'Cache-Control: no-store']
    F --> G[OPTIONS preflight to<br/>rpc.goodclaw.org REJECTED]
    G --> H[Failed to fetch<br/>red banner on /activity]

    subgraph FIX [This task]
      X[npm run deploy] --> Y[next build rotates BUILD_ID]
      Y --> Z[postbuild hook<br/>pm2 reload goodswap]
      Z --> W[check-buildid-sync.mjs --strict<br/>disk BUILD_ID == __NEXT_DATA__.buildId]
      W --> V[new activity chunk<br/>has cache: 'no-store' option only]
      V --> U[/activity loads green Live]
    end
```

## Acceptance criteria

- [ ] `npm run deploy` (or `FRONTEND_DEPLOY_SKIP_CI=1 npm run deploy`)
      completes successfully from `frontend/`. Build does not error.
- [ ] `frontend/.next/BUILD_ID` no longer equals `RW3xVfH9YRqrZPBeRpb9r`.
- [ ] `pm2 list` shows `goodswap` online with a fresh uptime (< 5 min) and
      `↺` count incremented by exactly 1 (the deploy reload).
- [ ] `check-buildid-sync.mjs --strict` passes (disk BUILD_ID matches the
      `__NEXT_DATA__.buildId` served at `http://localhost:3100/`).
- [ ] `curl -sk https://goodswap.goodclaw.org/_next/static/chunks/app/activity/page-*.js | grep -c '"Cache-Control":"no-store"'`
      returns `0` for the **new** activity chunk hash.
- [ ] `agent-browser open https://goodswap.goodclaw.org/activity`
      (with `AGENT_BROWSER_IGNORE_HTTPS_ERRORS=1`) shows the page in
      "Live" state (green pulse) and **no** red "Couldn't reach the chain
      RPC" banner. Page snapshot saved under `.autobuilder/review-screenshots/`.
- [ ] Browser DevTools (or equivalent: a manual `curl -X OPTIONS` to
      `rpc.goodclaw.org`) confirms the preflight is no longer triggered
      because the request now omits the non-safelisted `Cache-Control`
      header.
- [ ] No new test or lint regressions: `cd frontend && npm run lint` is
      clean (or the same as before — no NEW errors introduced by this
      task; we are not editing source).
- [ ] `react-doctor` score 75+ on the frontend after the deploy step
      (this task touches no React source, so the score should be
      unchanged from the previous task).

## Verification

1. Disk side:

   ```bash
   cd frontend
   FRONTEND_DEPLOY_SKIP_CI=1 npm run deploy
   cat .next/BUILD_ID                       # must NOT be RW3xVfH9YRqrZPBeRpb9r
   pm2 list | grep goodswap                  # must show fresh uptime
   ```

2. Live side:

   ```bash
   # find the new activity chunk hash and assert no Cache-Control header
   curl -sk https://goodswap.goodclaw.org/activity \
     | grep -oE '/_next/static/chunks/app/activity/page-[a-f0-9]+\.js' \
     | head -1 \
     | xargs -I{} curl -sk "https://goodswap.goodclaw.org{}" \
     | grep -c '"Cache-Control":"no-store"'                # expect 0
   ```

3. Browser side (must be done with agent-browser per skill rules):

   ```bash
   AGENT_BROWSER_IGNORE_HTTPS_ERRORS=1 \
     agent-browser open https://goodswap.goodclaw.org/activity \
       --screenshot /tmp/p48-activity-after.png \
       --ignore-https-errors
   ```

   Inspect `/tmp/p48-activity-after.png`: green "Live" pulse, no red
   banner, block timeline rendered.

4. Run `cd frontend && npx -y react-doctor@latest . --verbose --diff`
   and confirm the score is 75+. Since this task does not edit `.tsx`
   source, the score should match the prior baseline.

## Assumptions

- The autobuilder daemon runs on the same box that hosts the production
  PM2 `goodswap` app (uptime grep, BUILD_ID timestamp comparison, and
  the public chunk all corroborate this). The deploy must therefore be
  done in-place on this host — there is no separate staging hop.
- `frontend/node_modules` is already coherent with `package-lock.json`
  (the previous build at 14:13 succeeded). We can safely use
  `FRONTEND_DEPLOY_SKIP_CI=1` to skip the slow `npm ci` step. If the
  build fails because of a missing dep, drop the flag and retry.
- The Caddy CORS rules on `rpc.goodclaw.org` are unchanged from when
  task 0091 was written; they correctly accept POST requests but
  reject preflights that include `Cache-Control`. Our job is just to
  stop sending that header — which the rebuilt bundle will do.

## One-week decision

**YES — fits comfortably in a single iteration.** This task is a
prebuilt, well-tested deploy entry point (`npm run deploy`) plus a
handful of curl/agent-browser assertions. No source code is being
written. Estimated wall-clock time: 2–10 minutes (dominated by
`next build`, which historically takes ~60 seconds on this box).

## Out of scope

- Editing `frontend/src/lib/rpc.ts` or any other source file. The fix
  already exists and works — this task is purely a deploy/rollout fix.
- Changing the autobuilder loop to auto-deploy after every commit. That
  is the right long-term fix but introduces non-trivial risk (every
  failed build would block the loop). If we want to do it, file a
  separate task — for THIS iteration we just need production to be live.
- Touching the CORS configuration on `rpc.goodclaw.org`. The CORS rules
  there are correct; the bug was always on our side.
- Re-doing any work from task 0091. That task is `executed: true` and is
  LOCKED. We are only completing the deploy step that was missed.
- Backend services or Slither findings — those are separate threads in
  this initiative.
