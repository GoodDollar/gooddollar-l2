# `infra/caddy` — Authoritative Caddy configuration

This directory holds the **source of truth** for the Caddy web server
running on the host that serves all `*.goodclaw.org` services
(goodswap, rpc, explorer, paperclip, etc.).

The live file on the host is `/etc/caddy/Caddyfile`. It MUST match
`infra/caddy/Caddyfile` in this repo. Any change made directly on the
host without updating this file will be considered drift and overwritten.

## Why this exists

Until 2026‑05‑15, `/etc/caddy/Caddyfile` was hand-edited on the host
and not tracked anywhere. That caused the
`Access-Control-Allow-Origin` duplication on `rpc.goodclaw.org` that
broke the browser at `goodswap.goodclaw.org` for several days
(see task `0025-fix-caddy-duplicate-cors-headers-on-rpc.md`).

Tracking the file in git lets us:

- review changes in PRs,
- diff against the live file,
- ship a CORS smoke test (`scripts/check-rpc-cors.sh`) that the
  deployment health check (`scripts/health-check.sh`) runs every time.

## Deploy a change

```bash
# 1. Edit infra/caddy/Caddyfile here in the repo and commit.
# 2. Validate the new config with caddy itself:
caddy validate --config infra/caddy/Caddyfile

# 3. Install it onto the host (root-owned, world-readable):
sudo install -m 0644 -o root -g root \
  infra/caddy/Caddyfile /etc/caddy/Caddyfile

# 4. Reload caddy (no downtime):
sudo systemctl reload caddy

# 5. Run the deployment health check (includes CORS smoke test):
./scripts/health-check.sh
```

## Drift detection

To check whether the live file matches the repo:

```bash
sudo diff -u infra/caddy/Caddyfile /etc/caddy/Caddyfile
```

Empty output means in sync. Any output means someone edited the host
directly — bring the change back into the repo before reloading.

## RPC CORS contract

`rpc.goodclaw.org` MUST satisfy:

| Property                                   | Required value         |
| ------------------------------------------ | ---------------------- |
| `Access-Control-Allow-Origin` count        | exactly **1**          |
| `Access-Control-Allow-Origin` value        | `*`                    |
| `Access-Control-Allow-Methods` count       | exactly **1**          |
| `Access-Control-Allow-Methods` includes    | `POST`, `GET`, `OPTIONS` |
| `Access-Control-Allow-Headers` count       | exactly **1**          |
| `Access-Control-Allow-Headers` includes    | `Content-Type`         |
| `OPTIONS /` HTTP status                    | `204` (or `200`)       |

These are enforced by `scripts/check-rpc-cors.sh`. If you change the
`rpc.goodclaw.org` block in the Caddyfile, re-run that script.
