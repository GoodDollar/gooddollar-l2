---
id: fix-swap-page-broken-prerender-redirect
title: "CRITICAL — /swap returns 307 with no Location header and Next.js error page (broken direct navigation)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, frontend, swap, redirect, nextjs, bug]
---

# CRITICAL — /swap returns 307 with no Location header and Next.js error page

## Plan (one-week decision: ✅ <30 minutes, single config change, no split)

### Research

- Reproduced locally and on production with `curl -sI`:
  - `http://localhost:3100/swap` → 307, no `Location`, body is `__next_error__`.
  - `https://goodswap.goodclaw.org/swap` → identical via Caddy reverse-proxy.
- Source of the redirect is a server-component page using `next/navigation`'s
  `redirect()` (`frontend/src/app/swap/page.tsx`, 5 lines).
- Build output `frontend/.next/server/app/swap.meta` contains
  `{"status": 307, "headers": {"x-next-cache-tags": "..."}}` — **no `Location`**.
- `grep '"status": 30' frontend/.next/server/app/*.meta` confirms this is the
  only prerendered redirect in the build, so the scope is isolated to `/swap`.
- All other 16 routes return `200 OK` with valid HTML.
- Existing test `src/app/swap/__tests__/page.test.tsx` mocks `next/navigation.redirect`
  and asserts the call — this needs to be rewritten because we're removing the
  page that calls `redirect()`.
- Foundry test count is `1020` (from `forge test`), not `1024` as currently in
  README. README needs a correction in the same commit.

### Architecture

```
BEFORE (broken):
┌─────────────────────┐    static prerender    ┌─────────────────────────┐
│ src/app/swap/page.tsx ├──── npm run build ───►│ .next/server/app/swap.meta │
│  export default () =>│                        │  {"status":307,            │
│    redirect('/')     │                        │   "headers":{...}}         │
└─────────────────────┘                        │  ❌ no Location            │
                                                └─────────────────────────┘
                                                              │
                                                              ▼
                                                ┌───────────────────────────┐
                                                │ Browser sees 307 + body=  │
                                                │ __next_error__ → broken   │
                                                └───────────────────────────┘

AFTER (fixed):
┌─────────────────────┐    framework redirect   ┌──────────────────────────┐
│ next.config.js      ├──── runtime handler ───►│ HTTP/1.1 307             │
│   async redirects() │                         │ Location: /              │
│   /swap → /         │                         │ (empty body)              │
└─────────────────────┘                         └──────────────────────────┘
        ▲                                                       │
        │                                                       ▼
        │  DELETE src/app/swap/page.tsx                ┌───────────────────┐
        └────────────────────────────────────────────  │ Browser follows   │
                                                       │ Location → /      │
                                                       └───────────────────┘
```

### Steps

1. Edit `frontend/next.config.js`:
   - Add (or extend) `async redirects()` returning `[{ source: '/swap',
     destination: '/', permanent: false }]`.
2. Delete `frontend/src/app/swap/page.tsx`.
3. Rewrite `frontend/src/app/swap/__tests__/page.test.tsx` to import
   `next.config.js`'s `redirects()` and assert the `/swap → /` entry exists
   with `permanent: false`. (If the test layer can't easily import the
   config, delete the test file — it is no longer meaningful, and the
   framework-level behaviour is covered by Next.js itself.)
4. Run `rm -rf frontend/.next && cd frontend && npm run build` — must succeed.
5. Restart frontend: `pm2 restart goodswap`.
6. Verify: `curl -sI http://localhost:3100/swap` must show `HTTP/1.1 307` and
   `Location: /`, body must NOT contain `__next_error__`.
7. Run `cd frontend && npm run test -- --run` — no regressions.
8. Run `npm run test:run -- src/app/swap/` if path-scoped run is available
   to verify the rewritten/removed test compiles.
9. Update `README.md`: correct the test count from `1024` back to `1020`
   (both the stats banner line and the component status table row).
10. Run `npx -y react-doctor@latest . --verbose --diff` from `frontend/`
    — confirm score ≥ 75 (or at minimum ≥ 50 per build-loop rule).
11. Commit with message:
    `fix(frontend): route /swap redirect via next.config.js (was broken prerender 307 with no Location)`.

### One-week decision

This is a small, surgical change touching:
- `frontend/next.config.js` (+5 lines)
- `frontend/src/app/swap/page.tsx` (delete, 5 lines)
- `frontend/src/app/swap/__tests__/page.test.tsx` (rewrite or delete)
- `README.md` (test count correction — 2 line edits)

Total: <30 min of edits, ~5 min for build + verify. **No split needed.**

## Problem

Direct navigation to `/swap` on `goodswap.goodclaw.org` (and on the local PM2 instance
at `http://localhost:3100/swap`) returns a malformed HTTP response that breaks the
flagship Swap page for any user who:

- Bookmarks `/swap`
- Pastes a shared URL into the address bar
- Hard-refreshes while on `/swap`
- Arrives from an external referrer (Google, Twitter, partner sites)

### Observed Behavior

```
$ curl -sI http://localhost:3100/swap
HTTP/1.1 307 Temporary Redirect
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding
x-nextjs-cache: HIT
Cache-Control: s-maxage=31536000, stale-while-revalidate
ETag: "qc2wkvi10va15"
Content-Type: text/html; charset=utf-8
Content-Length: 13027
```

**There is NO `Location` header.** Browsers receiving a 3xx without `Location`
will either render the body or stall — depending on UA. The body is:

```html
<!DOCTYPE html><html id="__next_error__">
  <head>...</head>
  <body><!-- Next.js error page payload --></body>
</html>
```

i.e. the Next.js internal error fallback, not the homepage.

The prerendered file `.next/server/app/swap.meta` shows the root cause:

```json
{
  "status": 307,
  "headers": {
    "x-next-cache-tags": "_N_T_/layout,_N_T_/swap/layout,_N_T_/swap/page,_N_T_/swap"
  }
}
```

Status `307` with no `Location` header is baked into the static cache. It is
served with `Cache-Control: s-maxage=31536000` (one year), so the broken
response is essentially permanent until a redeploy with a fix.

### Source

`src/app/swap/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function SwapPage() {
  redirect('/')
}
```

`redirect()` from `next/navigation` throws `NEXT_REDIRECT`. During the static
prerender pass Next.js correctly turns this into a 307 status but does *not*
emit a `Location` header in the `.meta` file. For client-side (RSC) navigation
the redirect destination is encoded in the streamed payload and works fine,
which is why navigating internally via `<Link>` doesn't expose the bug.

This is the Next.js App Router's documented behaviour for `redirect()` from a
prerendered server page — it is designed for RSC navigation, not for being
hit as the first request.

## Impact

- **P0 / CRITICAL**: the product is literally called *GoodSwap* and the
  flagship `/swap` URL is the most likely entry point. A broken HTTP response
  on this route is a launch-blocker.
- Cached at the CDN/Caddy layer (`X-Nextjs-Cache: HIT`, `s-maxage=31536000`),
  so the breakage persists across all visitors and is not flushed by a
  user refresh.
- Affects production (`goodswap.goodclaw.org/swap`) and local
  (`http://localhost:3100/swap`) identically. Reproduces with both
  `curl` and a hard browser refresh.

Verified that no other page is affected — surface-sweep of `/`, `/perps`,
`/predict`, `/lend`, `/stable`, `/stocks`, `/explore`, `/portfolio`,
`/predict/create`, `/agents`, `/ubi-impact`, `/governance`, `/yield`, `/pool`,
`/bridge` all return `200 OK` with valid HTML.

## Fix

Move the `/swap → /` redirect out of a server component (which gets
prerendered) and into the `next.config.js` redirects config, which is
processed by the framework's request handler and emits a proper
`Location` header.

### Proposed Implementation

1. **Add to `frontend/next.config.js` `async redirects()` array**:

   ```js
   async redirects() {
     return [
       {
         source: '/swap',
         destination: '/',
         permanent: false, // 307 — matches existing semantics
       },
     ]
   }
   ```

2. **Delete `src/app/swap/page.tsx`** (and its parent directory if empty after
   leaving the test in place — see step 3).

3. **Update `src/app/swap/__tests__/page.test.tsx`**:
   - The current test mocks `next/navigation.redirect` and asserts it is called.
   - With the page deleted, this test is no longer meaningful and should be
     rewritten as a smoke test that verifies the redirect is configured in
     `next.config.js`, or simply removed (the framework-level redirect is
     covered by Next.js's own tests).
   - Preferred: convert it into a unit test that imports `next.config.js`
     and asserts `redirects()` returns a `/swap → /` entry with `permanent: false`.

4. **Verify the fix locally**:
   ```bash
   cd frontend
   rm -rf .next
   npm run build
   pm2 restart goodswap
   curl -sI http://localhost:3100/swap | head -5
   # Expect: HTTP/1.1 307, Location: /, no __next_error__ HTML body
   ```

5. **Run the test suite** (`npm run test`) and ensure nothing else regresses.

6. **Run `npx -y react-doctor@latest . --verbose --diff`** before committing
   (per build-loop policy, target score ≥75, never commit if <50).

## Acceptance Criteria

- `curl -sI http://localhost:3100/swap` returns `HTTP/1.1 307` **with a
  `Location: /` header**.
- Response body is empty (or trivial), NOT `<html id="__next_error__">`.
- Production `https://goodswap.goodclaw.org/swap` exhibits identical correct
  behaviour after the next deploy.
- Hard-loading `/swap` in a real browser navigates to `/` cleanly without
  flashing an error page.
- All existing Vitest tests pass; the rewritten swap test (if kept) covers
  the new redirect mechanism.
- README updated: keep stats accurate (1020 / 1020 tests passing — the
  previous claim of 1024 was incorrect; correct it as part of this commit).

## Out of Scope

- The choice to redirect `/swap → /` at all is product-owner territory; this
  task only fixes the *mechanism*, preserving the current 307 semantics.
- Other prerendered routes are not affected (only `swap.meta` has a 3xx
  status — confirmed by `grep '"status": 30' .next/server/app/*.meta`).

## References

- `frontend/src/app/swap/page.tsx` (current broken implementation)
- `frontend/.next/server/app/swap.meta` (broken prerender output)
- `frontend/next.config.js` (where the redirect should live)
- Next.js 14 docs: [redirects in `next.config.js`](https://nextjs.org/docs/app/api-reference/next-config-js/redirects)
- Next.js 14 docs: [`redirect()` in server components](https://nextjs.org/docs/app/api-reference/functions/redirect) — note the section on static prerender behaviour.
