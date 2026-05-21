# API error envelope

All `/api/*` routes in this app return a stable JSON error envelope for any
non-success response (4xx, 5xx). This document describes the contract so
keepers, status pages, dashboards, and external integrators can parse
responses uniformly.

## Why this exists

Before this contract, hitting a typo URL like `/api/healht` or sending a
`GET` to a `POST`-only route returned Next.js's default HTML 404/405 page.
Anything that consumes our API (status aggregator, observability scrapers,
SDK clients, browser fetches) then crashed on `JSON.parse` of `<!doctype html>...`.

The fix is a small, stable JSON envelope plus matching headers, applied at:

- A **catch-all** route `app/api/[...slug]/route.ts` for unknown paths (404).
- **Per-route 405 handlers** on every route that only supports a subset of
  HTTP methods.

## Envelope shape

Source: [`frontend/src/lib/api-error.ts`](../src/lib/api-error.ts)

```ts
interface ApiErrorBody {
  /** Human-readable error message. Always present. */
  error: string
  /** Machine-readable code, snake_case. Stable across releases. */
  code: string
  /** ISO-8601 timestamp the error was generated. */
  timestamp?: string
  /** Request path that triggered the error. */
  path?: string
  /** HTTP method of the offending request. */
  method?: string
  /** For 405 responses: list of HTTP methods the route does accept. */
  allowed?: string[]
  /** Opaque correlation id for sensitive failures. */
  errorId?: string
}
```

Responses always carry:

| Header          | Value                              |
| --------------- | ---------------------------------- |
| `Content-Type`  | `application/json; charset=utf-8`  |
| `Cache-Control` | `no-store` (for any status ≥ 400)  |

Routes may add more headers (e.g. `Allow` on 405, see below).

## Canonical codes

| HTTP | `code`                  | When                                                              |
| ---- | ----------------------- | ----------------------------------------------------------------- |
| 404  | `api_route_not_found`   | Unknown path under `/api/*` (catch-all route)                     |
| 405  | `method_not_allowed`    | Valid path, wrong HTTP method (per-route handler)                 |
| 400  | route-specific          | Bad input — e.g. `unknown_symbols`, `invalid_payload`             |
| 503  | route-specific          | Upstream / dependency unreachable                                 |

Routes are free to introduce additional 4xx codes; they MUST stay
`snake_case`, MUST be stable across releases, and SHOULD describe *what*
went wrong (`unknown_symbols`) rather than *which line* (`zod_error_3`).

## 404 — Unknown API route

A catch-all route at `app/api/[...slug]/route.ts` matches anything under
`/api/*` that no other route claimed.

Example:

```bash
$ curl -i http://localhost:3000/api/healht
HTTP/1.1 404 Not Found
content-type: application/json; charset=utf-8
cache-control: no-store

{
  "error": "API route not found",
  "code": "api_route_not_found",
  "timestamp": "2026-05-20T14:42:31.000Z",
  "path": "/api/healht",
  "method": "GET"
}
```

This explicitly does **not** affect non-API 404s — page-level 404s still
use `app/not-found.tsx` and serve HTML (browser users want a friendly page,
not JSON).

## 405 — Method not allowed

Per-route 405 handlers use the shared helper:

```ts
// frontend/src/app/api/<route>/route.ts
import { methodNotAllowed } from '@/lib/api-error'

const ALLOWED = ['POST'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])

export const GET = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
```

The helper emits an RFC 7231–compliant `Allow` header alongside the JSON
envelope:

```bash
$ curl -i -X DELETE http://localhost:3000/api/csp-report
HTTP/1.1 405 Method Not Allowed
content-type: application/json; charset=utf-8
cache-control: no-store
allow: POST

{
  "error": "Method not allowed",
  "code": "method_not_allowed",
  "timestamp": "2026-05-20T14:42:31.000Z",
  "path": "/api/csp-report",
  "method": "DELETE",
  "allowed": ["POST"]
}
```

### Current per-route allowed methods

This list is enforced by
[`src/app/api/__tests__/method-not-allowed.test.ts`](../src/app/api/__tests__/method-not-allowed.test.ts).
If you add a new method to a route, update both files.

| Route                     | Allowed methods |
| ------------------------- | --------------- |
| `/api/csp-report`         | `POST`          |
| `/api/rpc`                | `POST`          |
| `/api/faucet`             | `GET`, `POST`   |
| `/api/analytics/overview` | `GET`           |
| `/api/feedback`           | `POST`          |
| `/api/predict/comments`   | `GET`, `POST`   |
| `/api/prices`             | `GET`           |
| `/api/status`             | `GET`           |

Routes not listed here either accept all methods (rare) or are subject to
future hardening — open a follow-up task if you encounter one that falls
back to Next.js's HTML 405 page.

### CORS preflight (`OPTIONS`)

The `methodNotAllowed` helper deliberately does **not** treat `OPTIONS` as
a special case. All `/api/*` routes are same-origin in this app, so
browsers do not issue preflight requests against them. If we later expose
a route cross-origin, add an explicit `OPTIONS` handler returning 204 with
the appropriate `Access-Control-*` headers; do **not** repurpose this 405
helper for it.

## Using the helper directly

For other 4xx/5xx responses that need the same envelope shape, call
`apiError` directly:

```ts
import { apiError } from '@/lib/api-error'

if (unknown.length > 0) {
  return apiError(400, 'unknown_symbols', 'One or more symbols are unknown', {
    path: req.nextUrl.pathname,
    method: req.method,
    unknown,
  })
}
```

The third positional argument is the human message; any extra keys passed
through `extra` (other than `headers` and `cacheControl`) are merged into
the JSON body.

## Client integration tips

- **Always check `Content-Type` before parsing.** If a response is not
  `application/json`, treat it as an infrastructure failure (upstream
  proxy, CDN 5xx page, dev server crash) rather than an API error.
- **Switch on `code`, not `error`.** The human message can change between
  releases for clarity; the code is stable.
- **Respect `Cache-Control: no-store`.** Do not cache error responses —
  the server will recover and the next request may succeed.
- **For 405 responses, read `allowed` or the `Allow` header** and retry
  with a valid method rather than guessing.

## Testing

Two test suites cover the contract:

- Unit: [`src/lib/__tests__/api-error.test.ts`](../src/lib/__tests__/api-error.test.ts)
  — `apiError` / `methodNotAllowed` shape, headers, defaults.
- Integration: [`src/app/api/__tests__/method-not-allowed.test.ts`](../src/app/api/__tests__/method-not-allowed.test.ts)
  — every route in the table above, every rejected method, real handler
  imports.

Run locally:

```bash
cd frontend
npx vitest run src/lib/__tests__/api-error.test.ts \
               src/app/api/__tests__/method-not-allowed.test.ts \
               src/app/api/\[...slug\]/__tests__/route.test.ts
```
