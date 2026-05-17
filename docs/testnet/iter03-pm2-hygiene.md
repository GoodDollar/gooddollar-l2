# Iter 3 — PM2 / process hygiene for `goodswap`

**Scope row:** Iter 3 of `docs/TESTNET-READINESS-50-ITERATIONS.md` — _"No
stray `next dev` on production port; PM2 `goodswap` owns 3100."_

**Task:** `.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0004-iter03-pm2-process-hygiene.md`

---

## Before

The `goodswap` Next.js frontend was running, but had been started
ad-hoc — outside `backend/ecosystem.config.js`:

```
pm2 jlist | jq '.[] | select(.name=="goodswap") | {
  pm_exec_path, args, restarts:.pm2_env.restart_time,
  key_set:(.pm2_env.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY|length>0)
}'
{
  "pm_exec_path": "/usr/bin/npx",
  "args": ["next", "start", "-p", "3100"],
  "restarts": 4407,
  "key_set": false
}
```

That entry inherited PM2 defaults — no `min_uptime`, no
`max_memory_restart`, no env vars, no production hardening — and ran
through `/usr/bin/npx` so every restart re-resolved the `next` binary
into an ephemeral `~/.npm/_npx/...` directory.

Symptoms in the logs:

```
Error: Failed to find Server Action "abcd...". This request might be
from an older or newer deployment.
```

Root cause: with no `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` set, Next 14
generates a fresh action ID on every `next build`. Any client bundle
that was built before the most recent rebuild crashes the moment it
fires a server action. The restart counter climbed past 4,400 before
this iteration.

## Change

1. Pinned `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (32-byte hex) into
   `.autobuilder/addresses.env` (gitignored). This freezes the
   server-action IDs across rebuilds.
2. Added a `goodswap` entry to `backend/ecosystem.config.js` that:
   - `cwd = frontend/`,
   - `script = node_modules/.bin/next` (repo-root, since the workspace
     hoists `next` there) — no `npx` shim,
   - `args = start -p 3100`,
   - `env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` from `addresses.env`,
   - `min_uptime: '30s'`, `max_memory_restart: '1G'`,
     `kill_timeout: 10000`, `node_args: '--max-old-space-size=896'`.
3. Cutover: `pm2 delete goodswap` → `pm2 startOrReload
   backend/ecosystem.config.js --only goodswap --update-env`. A fresh
   `next build` was required to produce `.next/BUILD_ID` before the
   first clean boot.

No code under `frontend/` was changed.

## After

```
pm2 jlist | jq '.[] | select(.name=="goodswap") | {
  pm_exec_path, exec_interpreter, args,
  status:.pm2_env.status,
  restarts:.pm2_env.restart_time,
  unstable:.pm2_env.unstable_restarts,
  key_set:(.pm2_env.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY|length>0),
  pid, mem_mb:((.monit.memory/1024/1024)|floor)
}'
{
  "pm_exec_path": "/home/goodclaw/gooddollar-l2/node_modules/.bin/next",
  "exec_interpreter": "/usr/bin/node",
  "args": ["start", "-p", "3100"],
  "status": "online",
  "restarts": 0,
  "unstable": 0,
  "key_set": true,
  "pid": 2573604,
  "mem_mb": 130
}

ss -ltnp 2>/dev/null | grep ':3100 '
LISTEN 0 511 *:3100 *:* users:(("next-server (v1",pid=2573604,fd=23))

# Public probes (via Caddy):
/              -> 200
/faucet        -> 200
/perps         -> 200
/portfolio     -> 200
/tests         -> 200
/testnet-guide -> 200
/api/status    -> 200

# Server-action error count in goodswap logs since cutover:
0

# BUILD_ID (matches client bundles served):
M1463Ol1a56RdNJpnXNt9
```

`scripts/testnet/health-gate.sh` (iter 2 deliverable) still exits 0:

```
==========================================
  Testnet health gate — verdict: GREEN-with-warnings
  exit code: 0
  blockers:  0
  warnings:  5
==========================================
```

The 5 warnings are pre-existing, intentionally excluded services
documented in `docs/testnet/HEALTH-CONTRACT.md` (iter 2 scope). Iter 3
does not regress the gate.

## Acceptance — checklist

- [x] `pm_exec_path` is `node_modules/.bin/next`, not `/usr/bin/npx`.
- [x] `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` env is a non-empty string.
- [x] `restart_time = 0` and `unstable_restarts = 0` after cutover.
- [x] `ss -ltnp` shows port 3100 owned by the PM2-supervised
      `next-server`.
- [x] `curl https://goodswap.goodclaw.org/` → `HTTP/2 200`, every
      public route 200.
- [x] Zero `Failed to find Server Action` errors in `pm2 logs goodswap`
      since cutover.
- [x] `scripts/testnet/health-gate.sh` still exits 0.

## Rollback

```
pm2 delete goodswap
pm2 start npx --name goodswap --cwd /home/goodclaw/gooddollar-l2/frontend \
  -- next start -p 3100
pm2 save
```

(Returns to the pre-iter-3 ad-hoc behaviour. The pinned key in
`addresses.env` is harmless if left in place; remove it only if the
rotate behaviour is intentionally desired.)

## Follow-ups (out of scope here)

- Iter 4 — fix `loadDotenv` inline-comment handling so the three red
  backend services (`activity-reporter`, `harvest-keeper`,
  `revenue-tracker`) can be brought back into the gate.
- Iter 6 — repair `indexer` / `monitor` degraded status.
