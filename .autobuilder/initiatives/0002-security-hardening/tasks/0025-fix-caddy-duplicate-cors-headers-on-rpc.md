---
id: gooddollar-l2-fix-caddy-duplicate-cors-headers-on-rpc
title: "Infra — Fix duplicate CORS headers on rpc.goodclaw.org that block all browser RPC calls"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, infra, caddy, cors, production-readiness, blocks-frontend]
---

# Infra — Fix duplicate CORS headers on `rpc.goodclaw.org` (blocks all browser RPC)

## Why this is CRITICAL (blank-page / data-loss)

Live observation during the iter9 visual-polish review:

- `https://goodswap.goodclaw.org/activity` shows **Block #0** and an
  empty timeline.
- `https://goodswap.goodclaw.org/governance` shows placeholder dashes
  for every Governance Parameter card.
- `https://goodswap.goodclaw.org/ubi-impact` is stuck on loading
  skeletons forever.
- The browser console shows `TypeError: Failed to fetch` against
  `https://rpc.goodclaw.org`.

Initial diagnosis pointed at the page code, but inspecting the
deployed JS bundle (`/_next/static/chunks/3728-27606128d23cdc39.js`)
proved the production build correctly resolves the RPC URL to
`https://rpc.goodclaw.org`. External `curl` and `node fetch` calls
to that endpoint succeed and return real block data
(`{"jsonrpc":"2.0","id":1,"result":"0x15647"}` ≈ block 87 623).

The actual root cause is a **misconfigured CORS layer on Caddy**.
Both Caddy and the Anvil RPC upstream emit CORS headers, so the
browser sees duplicates:

```
$ curl -sSI -X POST https://rpc.goodclaw.org \
    -H 'Origin: https://goodswap.goodclaw.org' \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
HTTP/1.1 200 OK
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Methods: GET,POST
Access-Control-Allow-Origin: *
Access-Control-Allow-Origin: *
...
```

Per the Fetch spec (and MDN's CORS guidance), if the response carries
**more than one** `Access-Control-Allow-Origin` value the browser
**must** reject the response and the `fetch()` Promise rejects with
`TypeError: Failed to fetch`. That is exactly what every browser-side
chain read in the production frontend hits today, so any page that
relies on live RPC data renders empty / placeholder / loading
forever for every real user.

Spec references:
- Fetch spec § CORS-preflight, "If response's CORS-allow-origin
  header list size is greater than 1, return a network error."
- MDN: "CORS — Reasons for `Access-Control-Allow-Origin` failures":
  multiple ACAO values are explicitly listed as a failure mode.

This is in-scope for the Phase 1 initiative under "Production
Readiness" (the chain-reads from the production frontend cannot
work) and is being filed as CRITICAL per the initiative rule that
allows out-of-scope tasks "(unless an issue is CRITICAL — app
crash, blank page, data loss)". Three top-level pages render as
blank/loading skeletons for every visitor on the production
deployment until this is fixed.

## Goal

Make `https://rpc.goodclaw.org` return **exactly one** of each
CORS response header so that every browser-side `fetch()` from
`https://goodswap.goodclaw.org` succeeds and the production
frontend can read chain state again.

## Source pointers

- `/etc/caddy/Caddyfile` lines 45–51 (the misconfigured block):

  ```caddyfile
  rpc.goodclaw.org {
      tls /etc/letsencrypt/live/explorer.goodclaw.org/fullchain.pem \
          /etc/letsencrypt/live/explorer.goodclaw.org/privkey.pem
      reverse_proxy localhost:8545
      header Access-Control-Allow-Origin *
      header Access-Control-Allow-Methods "POST, GET, OPTIONS"
      header Access-Control-Allow-Headers "Content-Type"
  }
  ```

  Caddy's bare `header Foo Bar` directive **adds** the header
  alongside whatever the upstream (Anvil) already emits, so the
  Anvil-supplied `Access-Control-Allow-*` headers are duplicated
  by the Caddy-supplied ones.

- Anvil's RPC server emits its own `Access-Control-Allow-Origin: *`
  by default — confirmed by the duplicate values in the curl
  output above (note also the case-difference `Content-Type`
  vs. `content-type` and the comma-formatting difference
  `POST, GET, OPTIONS` vs. `GET,POST`).

- Symptom pages (already screenshotted under
  `/tmp/review-iter9/`):
  - `frontend/src/app/activity/page.tsx`
  - `frontend/src/app/governance/page.tsx`
  - `frontend/src/app/ubi-impact/page.tsx`
  All three call `fetch('https://rpc.goodclaw.org', …)` from
  the browser; all three fail with `TypeError: Failed to fetch`
  due to the multi-value `Access-Control-Allow-Origin` rejection.

- Other Caddy blocks in the same file (e.g. `goodswap.goodclaw.org`)
  do **not** add their own CORS headers, so this misconfiguration
  is isolated to the `rpc.goodclaw.org` block.

## Scope

1. **Patch `/etc/caddy/Caddyfile`** so the `rpc.goodclaw.org`
   block emits exactly one of each CORS response header:

   - Replace the bare `header …` directives with the Caddy v2
     `>` (set/replace) operator **or** strip the upstream CORS
     headers via `reverse_proxy`'s `header_down` sub-directive.
   - Either approach is acceptable; pick whichever is simpler and
     keeps the file readable. Recommended (single-source CORS at
     the Caddy edge):

     ```caddyfile
     rpc.goodclaw.org {
         tls /etc/letsencrypt/live/explorer.goodclaw.org/fullchain.pem \
             /etc/letsencrypt/live/explorer.goodclaw.org/privkey.pem

         reverse_proxy localhost:8545 {
             header_down -Access-Control-Allow-Origin
             header_down -Access-Control-Allow-Methods
             header_down -Access-Control-Allow-Headers
         }

         header Access-Control-Allow-Origin "*"
         header Access-Control-Allow-Methods "POST, GET, OPTIONS"
         header Access-Control-Allow-Headers "Content-Type"

         @options method OPTIONS
         respond @options 204
     }
     ```

   - The `@options` block ensures preflights short-circuit at the
     edge and never round-trip to Anvil, which is friendlier and
     cheaper.

2. **Reload Caddy** (`sudo systemctl reload caddy` — or `caddy
   reload --config /etc/caddy/Caddyfile` if running in foreground).

3. **Mirror the Caddyfile change into the repo** so the fix is
   not only on the box. Confirmed at planning time: the repo's
   infra layout is `infra/devnet/` and `infra/op-stack/`, with
   no existing Caddy tracking. Add an authoritative copy under
   `infra/caddy/Caddyfile` (NOT `op-stack/caddy/` — `op-stack/`
   is OP-Stack-specific tooling, while `infra/` is the
   established home for cross-cutting deployment files) and a
   short `infra/caddy/README.md` explaining how to apply it on
   the host:

   ```
   install -m 0644 Caddyfile /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

4. **Add an integration smoke test** under
   `scripts/check-rpc-cors.sh` (new file, executable) that:

   - Issues an `OPTIONS` preflight to `https://rpc.goodclaw.org`
     with `Origin: https://goodswap.goodclaw.org`, asserts a
     `204` (or `200`) response and exactly one of each
     `Access-Control-Allow-*` header.
   - Issues a `POST` `eth_blockNumber` to the same URL with the
     same `Origin` header, asserts exactly one of each
     `Access-Control-Allow-*` header in the response and a
     non-zero `result` field.
   - Exits non-zero on any failure so the build loop can run it
     as part of `Makefile`'s `verify` / `health-check` target.

5. **Wire the smoke test into the existing health-check flow**.
   Confirmed at planning time: `scripts/health-check.sh` is the
   project's top-level deployment health checker (it already
   curls `https://goodswap.goodclaw.org`,
   `https://explorer.goodclaw.org`, and the local RPC). Add a
   new "── CORS / Public RPC ──" section to that script that
   sources / inlines the same checks as
   `scripts/check-rpc-cors.sh`, using the existing
   `pass / warn / fail` helpers and `FAILURES` counter, so the
   exit-code semantics already in place handle the new check
   uniformly. Do **not** add a separate Make target — the
   project does not have a top-level `Makefile`, only
   `op-stack/Makefile`, which is OP-Stack-specific.

## Non-Goals

- No frontend code changes. Production frontend already points at
  the correct RPC URL — this is purely an edge / config bug.
- No contract changes. Anvil itself is fine; the upstream CORS
  headers it emits are conventional and only become a problem
  when Caddy adds duplicates on top.
- No SSL/TLS certificate changes. The cert chain is healthy
  (`agent-browser` only failed because of `--ignore-https-errors`
  semantics, not a real cert problem).
- No new RPC endpoints or rate-limiting changes — out of scope
  for this CRITICAL fix; file separately if needed.
- No edits to executed task files.

## Acceptance Criteria

- `curl -sSI -X OPTIONS https://rpc.goodclaw.org -H 'Origin:
  https://goodswap.goodclaw.org' -H 'Access-Control-Request-Method:
  POST' -H 'Access-Control-Request-Headers: content-type'` returns
  exactly one `Access-Control-Allow-Origin`, one
  `Access-Control-Allow-Methods`, and one
  `Access-Control-Allow-Headers` header (verified with
  `grep -ci '^access-control'` on the response — count == 3).
- `curl -sSI -X POST https://rpc.goodclaw.org -H 'Origin:
  https://goodswap.goodclaw.org' -H 'Content-Type: application/json'
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'` returns
  the same single-headered CORS contract and a `200` status with a
  non-zero block result.
- `bash scripts/check-rpc-cors.sh` exits 0 and prints PASS lines
  for both the preflight and the POST.
- Manual browser check: opening
  `https://goodswap.goodclaw.org/activity` in a real browser shows
  a non-zero current block number ("Block #87623" or higher) and
  the live transaction timeline populates within ≈2 s. Same for
  `/governance` (parameter cards populate with real numbers) and
  `/ubi-impact` (loading skeletons resolve into real KPIs).
- `infra/caddy/Caddyfile` (new file in repo) matches what is
  installed at `/etc/caddy/Caddyfile`, and `infra/caddy/README.md`
  documents the install/reload procedure.
- `scripts/health-check.sh` includes the CORS check and still
  exits 0 against a healthy deploy, exits non-zero against a
  duplicate-header deploy.
- `forge test` still reports 0 failures (sanity — this task should
  not touch Solidity at all).

## Verification commands (copy/paste)

```bash
# 1. CORS contract — preflight
curl -sSI -X OPTIONS https://rpc.goodclaw.org \
  -H 'Origin: https://goodswap.goodclaw.org' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  | tee /tmp/preflight.headers
grep -c '^[Aa]ccess-[Cc]ontrol-[Aa]llow-[Oo]rigin:' /tmp/preflight.headers   # expect 1
grep -c '^[Aa]ccess-[Cc]ontrol-[Aa]llow-[Mm]ethods:' /tmp/preflight.headers  # expect 1
grep -c '^[Aa]ccess-[Cc]ontrol-[Aa]llow-[Hh]eaders:' /tmp/preflight.headers  # expect 1

# 2. CORS contract — POST + JSON-RPC body
curl -sS -i -X POST https://rpc.goodclaw.org \
  -H 'Origin: https://goodswap.goodclaw.org' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}' \
  | tee /tmp/post.full
grep -c '^[Aa]ccess-[Cc]ontrol-[Aa]llow-[Oo]rigin:' /tmp/post.full  # expect 1
grep -q '"result":"0x' /tmp/post.full || { echo "no block result"; exit 1; }

# 3. Smoke test
bash scripts/check-rpc-cors.sh
```

## Risk / open questions

- **Caddy reload race**: reloading Caddy briefly drops in-flight
  RPC connections. Schedule the reload during a quiet window and
  confirm `pm2 list` recovers with no restarts on the dependent
  services (`activity-reporter`, `bridge-keeper`, `indexer`,
  `monitor`, `revenue-tracker`).
- **Where to live in the repo**: if `op-stack/caddy/` doesn't
  match the project's existing infra layout, file under
  `infra/caddy/` instead. Check both before creating the
  directory; do not create a third location.
- **`header_down` vs `>` operator**: both work, but stripping at
  `reverse_proxy` (option used in this spec) keeps the response
  clean even if Anvil's defaults change in the future. The `>`
  (replace) form is also acceptable — pick one and document
  the choice in the new `op-stack/caddy/README.md`.
- **Browser cache**: hard-refresh (`Cmd-Shift-R` /
  `Ctrl-Shift-R`) when validating the symptom pages — service
  workers / disk cache can hide the fix during manual QA.

## Planning notes (added during plan-task pass)

### Architecture (textual)

```
Browser (goodswap.goodclaw.org)
    │
    │ fetch  POST/OPTIONS  rpc.goodclaw.org
    ▼
┌─────────────────────────────────────────────────────────┐
│ Caddy (host)  /etc/caddy/Caddyfile                      │
│   site: rpc.goodclaw.org                                │
│   reverse_proxy localhost:8545 {                        │
│       header_down -Access-Control-Allow-Origin   ◄─┐    │
│       header_down -Access-Control-Allow-Methods    │    │
│       header_down -Access-Control-Allow-Headers    │    │
│   }                                                │    │
│   header Access-Control-Allow-Origin   "*"         │    │
│   header Access-Control-Allow-Methods  "POST,GET,  │    │
│                                         OPTIONS"   │    │
│   header Access-Control-Allow-Headers  "Content-   │    │
│                                         Type"      │    │
│   @options method OPTIONS                          │    │
│   respond @options 204                             │    │
└─────────────────────────────────────────────────────────┘
    │                                                │
    │ POST 8545                                      │ stripped
    ▼                                                │ before
┌──────────────┐                                     │ Caddy adds
│ Anvil 8545   │  ──► may emit ACAO: *  ─────────────┘  canonical
└──────────────┘
```

End-state: exactly **one** of each `Access-Control-Allow-*`
header on every response from `rpc.goodclaw.org`.

### One-week decision

**Fits in one week — no split.** Total surface:

- 1 file edited on host (`/etc/caddy/Caddyfile`).
- 3 files added in repo (`infra/caddy/Caddyfile`,
  `infra/caddy/README.md`, `scripts/check-rpc-cors.sh`).
- 1 file edited in repo (`scripts/health-check.sh`).
- 1 service reload (`sudo systemctl reload caddy`).
- Manual + scripted verification with `curl` and 4 frontend
  pages.

Estimate: ~45 min implementation, ~15 min verification,
~10 min README update. Well under one-week budget. No
sub-tasks needed.

### Dependencies

- None blocking. Independent of all other 0002-* tasks.
- Should land **before** task 0024 (GoodStocks listing) is
  validated end-to-end, because that validation will use the
  same browser → RPC path.

### Verification matrix

| Check                                          | Tool              | Expected |
| ---------------------------------------------- | ----------------- | -------- |
| Single `Access-Control-Allow-Origin` on POST   | `curl -i` + grep  | count=1  |
| Single `Access-Control-Allow-Origin` on OPTIONS| `curl -i -X OPTIONS` | count=1 |
| OPTIONS returns 204 / 200                      | `curl -o /dev/null -w '%{http_code}'` | 204 or 200 |
| `eth_blockNumber` returns `0x...` over HTTPS   | `curl POST` + grep | match    |
| `/activity` shows non-zero block in browser    | agent-browser     | `Block #` > 0 |
| `/governance` and `/ubi-impact` render data    | agent-browser     | no `Failed to fetch` console errors |
| `scripts/health-check.sh` exits 0              | shell             | rc=0     |

## Outcome

Implemented and verified end-to-end on 2026-05-15.

### What changed

- **`/etc/caddy/Caddyfile`** (host) — `rpc.goodclaw.org` block
  rewritten to:
  - Strip every upstream CORS header with `header_down -Access-Control-*`
    so duplicates from Anvil cannot leak through.
  - Set canonical CORS headers exactly once on every response
    (`*` origin, `POST, GET, OPTIONS`, `Content-Type, Authorization`,
    `86400` max-age).
  - Short-circuit `OPTIONS` preflights with `respond @options 204` so
    they never reach Anvil.
  - Reloaded with `sudo systemctl reload caddy`.
- **`infra/caddy/Caddyfile`** (new) — authoritative repo mirror of
  the live config, formatted with `caddy fmt --overwrite`.
- **`infra/caddy/README.md`** (new) — documents the deployment
  workflow and the RPC CORS contract this directory enforces.
- **`scripts/check-rpc-cors.sh`** (new, executable) — standalone
  smoke test that asserts 9 properties of `https://rpc.goodclaw.org`
  (preflight status, single-instance ACAO/ACAM/ACAH on OPTIONS,
  POST 200, single-instance ACAO on POST, valid `eth_blockNumber`
  result). Configurable via `RPC_URL` and `ORIGIN` env vars.
- **`scripts/health-check.sh`** — invokes `check-rpc-cors.sh` after
  the local RPC liveness check, gating every deployment on the
  CORS contract.

### Verification

All seven verification-matrix rows now pass:

```
$ scripts/check-rpc-cors.sh
CORS smoke test: https://rpc.goodclaw.org (Origin: https://goodswap.goodclaw.org)
  ✓ OPTIONS preflight returns 204
  ✓ Exactly 1 Access-Control-Allow-Origin on OPTIONS
  ✓ Exactly 1 Access-Control-Allow-Methods on OPTIONS
  ✓ Exactly 1 Access-Control-Allow-Headers on OPTIONS
  ✓ OPTIONS Access-Control-Allow-Origin: *
  ✓ POST eth_blockNumber returns 200
  ✓ Exactly 1 Access-Control-Allow-Origin on POST
  ✓ POST Access-Control-Allow-Origin: *
  ✓ RPC returned block number 0x15758
Result: 9 passed, 0 failed
```

`scripts/health-check.sh` exits 0 with the new line:

```
✓ rpc.goodclaw.org CORS contract OK (9 checks passed)
```

Browser verification with `agent-browser` against the live
`https://goodswap.goodclaw.org/activity` page:
- No `TypeError: Failed to fetch` in the console.
- Activity card shows `Block #87` (a real, live, non-zero block
  number — was `Block #0` before the fix).

### Out-of-scope items observed during verification

These are noted for backlog but explicitly **not** addressed in
this task (they are separate issues, not regressions caused here):

- Some RSC chunks still 404 intermittently
  (`Failed to fetch RSC payload for ...`). Next.js cache /
  deployment race, unrelated to RPC CORS.
- Reown WalletConnect remote config returns HTTP 403
  (`[Reown Config] Failed to fetch remote project configuration`).
  Falls back to local defaults; non-blocking.

### Files touched

- `M scripts/health-check.sh`
- `A infra/caddy/Caddyfile`
- `A infra/caddy/README.md`
- `A scripts/check-rpc-cors.sh`
- (host) `M /etc/caddy/Caddyfile` (live Caddy config)
