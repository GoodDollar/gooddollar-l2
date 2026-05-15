---
id: fix-middleware-evalerror-crashes-next-start
title: "Middleware — EvalError 'Code generation from strings disallowed' crashes every page in next start production (CRITICAL: site-wide 500)"
parent: gooddollar-l2
deps: [defer-web3-vendor-on-landing-page]
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, frontend, regression, middleware, edge-runtime, blank-page, performance]
---

# Middleware — EvalError crashes every route in `next start`

## Why this is CRITICAL

After running `npm run build && pm2 restart goodswap` (where the
`goodswap` PM2 entry runs `next start -p 3100`), **every** request to
the production server crashes with HTTP 500. Affected routes include
`/`, `/governance`, `/perps`, `/lend`, `/predict`, `/swap`, `/stable`,
`/stocks`, `/explore`, and all others — i.e., the entire site is down
in production mode.

PM2 logs show the same error on every request:

```
EvalError: Code generation from strings disallowed for this context
    at evalmachine.<anonymous>:5:9
    at runScript (.../next/dist/server/web/sandbox/context.js:281:24)
    at getModuleContext (.../next/dist/server/web/sandbox/context.js:222:31)
    at runWithTaggedErrors (.../next/dist/server/web/sandbox/sandbox.js:67:62)
```

This was uncovered while smoke-testing task 0020
(defer-web3-vendor-on-landing-page) and is independent of that work
— it is a pre-existing crash that has been masking site behaviour any
time `next start` was used. `next dev` is not affected because the
dev sandbox has `codeGeneration.strings: true`, but production sets
`codeGeneration: undefined`, which V8 treats as "disallow `eval` and
`new Function`".

## Root cause

`frontend/src/middleware.ts` registers a Next.js middleware that
matches **all non-static routes** (matcher includes
`'/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'`). On every
matched request, Next loads the middleware bundle inside its Edge
Runtime sandbox.

In Next.js 14.2.35 the Edge Runtime sandbox is created by
`node_modules/next/dist/server/web/sandbox/context.js`:

```js
codeGeneration:
  process.env.NODE_ENV !== "production"
    ? { strings: true, wasm: true }
    : undefined,
```

In production this means V8 forbids `eval`/`new Function`. However,
Next's middleware loader itself uses `eval` to evaluate the bundled
middleware module (see `runScript` → `evalmachine.<anonymous>`).
So **any** middleware fails to load on Node 22.x in production mode,
and every matched request returns a 500 with no body rendered.

We do not need this middleware:

- There are **no `/api/*` route handlers** in this app
  (`grep -rE "['\"]/?api/" src/` only finds two `fetch('/api/...')`
  calls in client-side error reporters that quietly fail when the
  endpoint 404s — there is no server route to rate-limit).
- All non-`/api/` branches of the middleware just return
  `NextResponse.next()` — i.e., they are no-ops.
- The i18n branch is intentionally disabled with a comment.

So the entire middleware is dead weight that crashes the server.

## Fix

1. **Delete `frontend/src/middleware.ts`** so Next.js never spins up
   the Edge Runtime sandbox in production.
2. **Preserve the rate-limit logic as a Node-runtime helper** at
   `frontend/src/lib/rateLimit.ts` so it can be re-added in front of
   any future API route handler without re-introducing the Edge
   Runtime crash. The helper exposes a single `checkRateLimit(ip)`
   function plus `getRealIp(req)` for use inside `route.ts` files.
3. **Add a regression test** at
   `frontend/scripts/check-middleware-absent.mjs` that fails the
   build if `src/middleware.ts` re-appears, with a comment pointing
   at this task and explaining the EvalError limitation. Wire it into
   `npm run check:landing-bundle`'s sibling slot (`check:no-edge-middleware`)
   and call both from a new `npm run check:perf` script so future
   builds catch regressions automatically.

When we eventually need real middleware (auth, rate limiting at the
edge, etc.), we should either:

- Pin to a Next.js version where the Edge sandbox does not crash on
  Node 22, **or**
- Move the logic into a Cloudflare Worker / nginx layer in front of
  Next.

## Acceptance criteria

- `frontend/src/middleware.ts` no longer exists.
- `frontend/src/lib/rateLimit.ts` exposes `checkRateLimit` and
  `getRealIp` (extracted verbatim from the deleted middleware) plus
  unit tests in `frontend/src/lib/__tests__/rateLimit.test.ts`.
- `frontend/scripts/check-middleware-absent.mjs` exits non-zero if
  `src/middleware.ts` re-appears.
- After `npm run build && pm2 restart goodswap`, all of the following
  return HTTP 200:
  - `curl -I http://localhost:3100/`
  - `curl -I http://localhost:3100/governance`
  - `curl -I http://localhost:3100/perps`
  - `curl -I http://localhost:3100/lend`
  - `curl -I http://localhost:3100/predict`
  - `curl -I http://localhost:3100/swap`
- PM2 logs for `goodswap` no longer contain
  `EvalError: Code generation from strings disallowed`.
- `pm2 list` shows `goodswap` as `online` with restart count stable
  for at least 60 seconds after the fix.

## Out of scope

- Reintroducing rate limiting on a real `/api/*` endpoint (no API
  routes exist yet).
- Upgrading Next.js. We stay on 14.2.35 for now; the helper-based
  workaround is sufficient.
- Replacing PM2 / `next start` with a different runtime.

## Verification commands

```bash
cd /home/goodclaw/gooddollar-l2/frontend
ls src/middleware.ts 2>&1 || echo "OK: middleware deleted"
node scripts/check-middleware-absent.mjs && echo "OK: regression test passes"
npm run build
pm2 restart goodswap
sleep 5
for r in / /governance /perps /lend /predict /swap; do
  printf '%s -> %s\n' "$r" "$(curl -o /dev/null -s -w '%{http_code}' http://localhost:3100$r)"
done
pm2 logs goodswap --lines 200 --nostream | grep -c EvalError || echo "OK: no EvalError in logs"
```
