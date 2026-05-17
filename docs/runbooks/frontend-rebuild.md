# Runbook — Rebuild / Restore `goodswap.goodclaw.org`

> Tracking: [`0015-iter14-blocker-frontend-build-atomic-swap`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0015-iter14-blocker-frontend-build-atomic-swap.md)
>
> Touches:
> [`frontend/scripts/atomic-build.mjs`](../../frontend/scripts/atomic-build.mjs)
> · [`frontend/scripts/deploy.sh`](../../frontend/scripts/deploy.sh)
> · [`frontend/scripts/postbuild-reload-pm2.mjs`](../../frontend/scripts/postbuild-reload-pm2.mjs)
> · [`frontend/scripts/check-buildid-sync.mjs`](../../frontend/scripts/check-buildid-sync.mjs)
> · [`scripts/testnet/iter14-restore-goodswap.sh`](../../scripts/testnet/iter14-restore-goodswap.sh)

This runbook covers three operations on the public frontend:

1. **Routine rebuild** of the live PM2 app (deploys after a code change).
2. **Emergency restore** when the live site is serving 5xx on `/_next/static/*` (the iter 14 incident pattern).
3. **Manual diagnosis** when the site looks wrong and you do not yet know which of the failure modes is in play.

The frontend is a Next.js 14 app run under PM2 as the `goodswap` process on `localhost:3100`, fronted by Caddy at `https://goodswap.goodclaw.org`.

---

## TL;DR

| Situation | Command | Verifies |
| --- | --- | --- |
| Routine deploy from `frontend/` | `npm run deploy` | full pipeline: `npm ci` → atomic build → `pm2 reload` → `/` 200 → BUILD_ID drift check |
| Live site is serving 5xx static assets | `bash scripts/testnet/iter14-restore-goodswap.sh` | one-shot restore with build, manual reload, live asset HEAD probe, report |
| Suspect BUILD_ID drift only | `cd frontend && NEXT_LIVE_URL=https://goodswap.goodclaw.org/ node scripts/check-buildid-sync.mjs --strict` | disk BUILD_ID == live `__NEXT_DATA__.buildId` |
| Confirm what is on disk | `cat frontend/.next/BUILD_ID && ls frontend/.next/static/css/` | non-empty BUILD_ID, ≥ 1 CSS chunk |

Never run a bare `next build` against the live tree. Always go through `npm run build` (atomic wrapper) or `npm run deploy` (full pipeline).

---

## Background — why this is delicate

`next build` rewrites `.next/` in place. The PM2-managed `next start -p 3100` process reads `.next/BUILD_ID` once at boot and embeds it in every HTML response, along with `<link>` tags to hashed CSS bundles under `_next/static/css/<hash>.css`. Three failure modes follow:

1. **Stale BUILD_ID.** A successful `next build` rotates BUILD_ID and asset hashes; if PM2 is not reloaded, every page references CSS chunks the new build no longer ships ⇒ HTTP 5xx on every `/_next/static/css/*`.
2. **Partial build wipes BUILD_ID.** A `next build` that exits non-zero (OOM, lint failure, type error) can delete `.next/BUILD_ID` and parts of `.next/static/` while leaving the PM2 process running. The live process still serves HTML pointing at hashes that are no longer on disk ⇒ same symptom.
3. **Apparently green build with missing BUILD_ID.** Rare, but observed in iter 14: `next build` exited 0 yet `.next/BUILD_ID` was empty / absent. PM2 was reloaded against this poisoned `.next/`. Same symptom.

The `atomic-build.mjs` wrapper structurally prevents (2) and (3); `check-buildid-sync.mjs` and the `npm run deploy` pipeline prevent (1).

---

## 1. Routine rebuild (after a code change)

This is the only sanctioned path for deploying a code change. Do not run individual steps.

```bash
cd /home/goodclaw/gooddollar-l2/frontend
npm run deploy
```

What it does ([source](../../frontend/scripts/deploy.sh)):

1. `npm ci --no-audit --no-fund` — deterministic deps.
2. `npm run build` — invokes [`atomic-build.mjs`](../../frontend/scripts/atomic-build.mjs):
   - hardlink snapshot `.next/` → `.next.prev/` via `cp -al`,
   - run `node node_modules/next/dist/bin/next build`,
   - on success **and** non-empty `.next/BUILD_ID`, drop the snapshot,
   - on build failure or empty BUILD_ID, atomically restore the snapshot.
3. `npm run postbuild` (auto-triggered) — [`postbuild-reload-pm2.mjs`](../../frontend/scripts/postbuild-reload-pm2.mjs) reloads the PM2 app and health-checks `localhost:3100`.
4. `pm2 reload goodswap --update-env` (deploy script also runs this directly as belt-and-braces).
5. Poll `http://localhost:3100/` for HTTP 200 (30 attempts × 1s).
6. `check-buildid-sync.mjs --strict` — fails if disk BUILD_ID ≠ live `__NEXT_DATA__.buildId`.

Exit 0 means: rebuild produced a valid `.next/`, PM2 is serving from it, and HTML references match disk.

### Skipping pieces (operator only)

| Env var | Effect |
| --- | --- |
| `FRONTEND_DEPLOY_SKIP_CI=1` | Skip `npm ci`, reuse current `node_modules/`. Use only after a clean install in the same session. |
| `FRONTEND_DEPLOY_SKIP_BUILD=1` | Skip `npm run build`. Use only to force a fresh `pm2 reload` against the existing `.next/`. |
| `SKIP_PM2_RELOAD=1` | Skip the postbuild PM2 reload entirely. Used by the restore script; do not use during normal deploys. |
| `PM2_APP_NAME=…` | Override the PM2 app name (default `goodswap`). |
| `NEXT_LIVE_URL=…` | Override the URL polled for liveness and BUILD_ID drift (default `http://localhost:3100/`). |

---

## 2. Emergency restore — live `5xx` on static assets

Symptoms:

- `curl -sS -o /dev/null -w '%{http_code}' https://goodswap.goodclaw.org/` returns `200`,
- but the HTML it returns references `/_next/static/css/<hash>.css` and a `HEAD` on that URL returns `5xx` or content-type `text/html` instead of `text/css`,
- the browser console shows `Refused to apply style from … because its MIME type ('text/html') is not a supported stylesheet MIME type`.

This is the iter 14 outage pattern. Use the one-shot restore script — it never modifies the live PM2 process until a fresh `.next/` is proven good:

```bash
cd /home/goodclaw/gooddollar-l2
bash scripts/testnet/iter14-restore-goodswap.sh
```

What it does ([source](../../scripts/testnet/iter14-restore-goodswap.sh)):

1. Record current PM2 pid of `goodswap` (for the postmortem trail).
2. Run `SKIP_PM2_RELOAD=1 npm run build` inside `frontend/` — `atomic-build.mjs` snapshots and rebuilds without touching PM2.
3. Assert `.next/BUILD_ID` exists, is non-empty, and `.next/static/css/` has at least one `*.css` chunk. If either check fails, **abort without touching PM2**. Rollback already happened inside `atomic-build.mjs`.
4. `pm2 reload goodswap --update-env` and confirm a new pid.
5. Poll `https://goodswap.goodclaw.org/` for HTTP 200 (15s budget).
6. Pull the first `/_next/static/css/<hash>.css` URL from the live HTML and `HEAD` it — expect `200` and `content-type: text/css`. This is the assertion that would have caught iter 14 immediately.
7. Print a `GREEN` / `RED` verdict and write a full report to `docs/testnet/iter14-restore-goodswap.md`.

The script exits 0 only on `GREEN`. The report is safe to attach to a Paperclip incident or PR.

### If the restore script reports `RED`

Read the report — every section is annotated. Common patterns:

- **build: RED** — read the captured `next build` stderr from the report. Most often: type error, missing env var, or upstream API timeout during static generation. Fix the underlying issue and re-run.
- **assertions: RED (no BUILD_ID)** — `atomic-build.mjs` should have rolled back. Verify with `ls frontend/.next.prev/` — if it exists, manually restore: `cd frontend && rm -rf .next && mv .next.prev .next && pm2 reload goodswap --update-env`. If `.next.prev/` does not exist, you are in the first-time-build case; the only path forward is to fix the build.
- **pm2 reload: RED** — `pm2 list` to inspect, `pm2 logs goodswap --lines 200` for the cause. Usual suspects: port 3100 already bound, missing `node` in `pm2` PATH, ecosystem file moved.
- **live /: RED** — Caddy in front of PM2 is broken. Check `journalctl -u caddy --since '5 minutes ago'` and `ss -ltnp | grep :3100`.
- **live asset: RED** — PM2 reloaded but is still serving stale HTML. Force a second `pm2 reload goodswap --update-env`; if that does not help, `pm2 restart goodswap --update-env` (hard restart). If still red, the new `.next/` is missing the asset the live HTML wants — re-run the restore script (BUILD_ID rotation usually self-heals on the second pass).

---

## 3. Manual diagnosis (no automation)

When something looks wrong and you want to inspect by hand before running scripts.

```bash
# What does disk think the build is?
cat /home/goodclaw/gooddollar-l2/frontend/.next/BUILD_ID
ls /home/goodclaw/gooddollar-l2/frontend/.next/static/css/ | head -5

# What does the live PM2 process think the build is?
curl -sS https://goodswap.goodclaw.org/ \
  | grep -oE '(?:"buildId":"|buildId\\":\\")([^"\\]+)' \
  | head -1

# Strict drift check (combines both):
cd /home/goodclaw/gooddollar-l2/frontend && \
  NEXT_LIVE_URL=https://goodswap.goodclaw.org/ \
  node scripts/check-buildid-sync.mjs --strict

# What is the live HTML asking the browser to download?
curl -sS https://goodswap.goodclaw.org/ \
  | grep -oE '/_next/static/(css|chunks)/[^"]+' \
  | sort -u | head -10

# Does each of those assets actually load?
for asset in $(curl -sS https://goodswap.goodclaw.org/ \
    | grep -oE '/_next/static/(css|chunks)/[^"]+' | sort -u | head -10); do
  printf '%-80s ' "$asset"
  curl -sS -o /dev/null -w 'status=%{http_code} ct=%{content_type}\n' \
    "https://goodswap.goodclaw.org$asset"
done

# Pid and uptime of the PM2 process:
pm2 jlist | jq '.[] | select(.name=="goodswap") | {pid, uptime: .pm2_env.pm_uptime, restarts: .pm2_env.restart_time}'

# Tail PM2 logs:
pm2 logs goodswap --lines 200 --nostream
```

Decision matrix:

| Disk BUILD_ID | Live BUILD_ID | Assets HEAD 200? | Diagnosis | Action |
| --- | --- | --- | --- | --- |
| present | matches disk | yes | Healthy — investigate elsewhere | — |
| present | differs from disk | no | BUILD_ID drift (failure mode 1) | `pm2 reload goodswap --update-env` |
| missing/empty | (any) | no | Poisoned `.next/` (failure mode 2 or 3) | restore script (§ 2) |
| present | matches disk | no (`5xx`) | Live HTML references hashes not in `.next/static/` — partial build | restore script (§ 2) |

---

## 4. What never to do

- ❌ `cd frontend && npx next build` directly against the live tree. This bypasses `atomic-build.mjs` — no snapshot, no rollback. Use `npm run build` or `npm run deploy`.
- ❌ `pm2 restart goodswap` without first verifying `.next/BUILD_ID` is non-empty. A restart against a poisoned `.next/` reproduces iter 14 1:1.
- ❌ Manually `rm -rf .next` to "clean up". Run `npm run deploy` instead; it will rebuild from scratch atomically.
- ❌ Bypass the BUILD_ID drift check (`check-buildid-sync.mjs --strict`) in the deploy pipeline. It exists specifically because deploys fail silently otherwise.

---

## 5. Evidence trail

Every restore writes a timestamped report under `docs/testnet/iter14-restore-goodswap.md`. Every routine deploy emits its full log via `pm2 logs goodswap`. To re-prove site health after any operation:

```bash
for path in / /faucet /perps /portfolio /tests /testnet-guide; do
  printf '%-20s → %s\n' "$path" \
    "$(curl -sS -o /dev/null -w '%{http_code}' https://goodswap.goodclaw.org$path)"
done
```

All six paths must return `200`. This is the same assertion the Testnet Readiness Gate (initiative 0004) uses for its acceptance criteria.

---

## 6. Historical context

The iter 14 outage of May 17, 2026 sent every public page to a fully unstyled state for an extended window because a `next build` exited 0 while leaving `.next/BUILD_ID` empty and several `static/css/` chunks unwritten. PM2 was then reloaded against that poisoned `.next/`, and the live HTML referenced asset hashes that no longer existed. The structural fix is [`atomic-build.mjs`](../../frontend/scripts/atomic-build.mjs); the procedural fix is this runbook plus [`iter14-restore-goodswap.sh`](../../scripts/testnet/iter14-restore-goodswap.sh).
