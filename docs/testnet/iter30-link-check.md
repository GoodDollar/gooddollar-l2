# Iter 30 — Documentation Link Check

**Task:** [`.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0042-iter30-readme-doc-checkpoint-6-analytics-feedback.md`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0042-iter30-readme-doc-checkpoint-6-analytics-feedback.md)
**Row in 50-iter plan:** Row 30 — _README / doc checkpoint 6 + gate_.
**Status:** ✅ All in-repo doc links resolve. All external probes return HTTP 200.

## Tool

[`scripts/check-doc-links.py`](../../scripts/check-doc-links.py) — walks
every Markdown link in `README.md`, `docs/TESTNET_README.md`, and
`docs/ARCHITECTURE.md`; for relative links it resolves the target on
disk, for external HTTP/HTTPS links it does a `HEAD` (falling back to
`GET`) and accepts any `2xx`/`3xx` response, and for the public RPC it
runs an `eth_chainId` probe to assert the chain still returns
`0xa455` (= chain id 42069).

Iter 30 fix shipped in this commit: the checker now `urllib.parse.unquote`s
relative targets before resolving them on disk. Next.js route groups use
literal parentheses in folder names (`src/app/(app)/analytics/page.tsx`),
which collide with Markdown link syntax `[text](path)`. The fix lets
authors percent-encode the parentheses (`(app)` → `%28app%29`) in the
link target without breaking the resolver.

## Summary

```
$ python3 scripts/check-doc-links.py
checked = 90  broken = 0
```

(After this iteration writes `iter30-readme-doc-checkpoint-6.md` and
`iter30-link-check.md`. Pre-write, the same command reported
`broken = 3` — all three rows were the in-flight evidence files this
commit is now landing.)

## Coverage

| File | Relative links | External links | Status |
|---|---:|---:|---|
| `README.md` | 28 | 7 | ✅ all OK |
| `docs/TESTNET_README.md` | 21 | 6 | ✅ all OK |
| `docs/ARCHITECTURE.md` | 30 | 5 (incl. RPC chainId probe) | ✅ all OK |

## External probes verified live (2026-05-18 UTC)

| URL | Result |
|---|---|
| `https://goodswap.goodclaw.org` | HTTP 200 |
| `https://goodswap.goodclaw.org/api/status` | HTTP 200 — `overall=healthy`, 12/12 services ok |
| `https://rpc.goodclaw.org` | RPC probe: `chainId=0xa455` (= 42069) ✅ |
| `https://explorer.goodclaw.org` | HTTP 200 |
| `https://paperclip.goodclaw.org` | HTTP 200 |
| `https://goodagent.goodclaw.org` | HTTP 200 |
| `https://cloud.reown.com` | HTTP 200 |
| `http://localhost:3100/` | HTTP 200 (PM2 frontend) |

## Broken links resolved this iteration

Before the iter‑30 fixes the link checker reported 5 broken links. All
five are now resolved:

| # | Source file | Bad link (before) | Fix |
|---|---|---|---|
| 1 | `docs/ARCHITECTURE.md` | `../frontend/src/app/analytics/page.tsx` | The page lives under the `(app)` route group, so the path is now `../frontend/src/app/%28app%29/analytics/page.tsx` (and the checker URL-decodes targets). |
| 2 | `docs/ARCHITECTURE.md` | `../frontend/src/lib/__tests__/redactSecrets.test.ts` | The redaction logic is covered by the API route integration tests, not a sibling unit-test file. Link redirected to `../frontend/src/app/api/feedback/__tests__/route.test.ts` with a one-line note explaining which test case exercises redaction. |
| 3 | `README.md` | `docs/testnet/iter30-readme-doc-checkpoint-6.md` | Written this iteration. |
| 4 | `README.md` | `docs/testnet/iter30-link-check.md` | This file. |
| 5 | `docs/TESTNET_README.md` | `testnet/iter30-readme-doc-checkpoint-6.md` | Written this iteration. |

## Why the route-group encoding matters

`frontend/src/app/(app)/` is a Next.js
[route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups).
Folders wrapped in literal `(…)` are excluded from the URL pathname but
still nest pages under a shared layout. They are not synthetic — the
parentheses are part of the on-disk path and any tool that opens the
file (editors, file browsers, `git`) needs them. The Markdown link
syntax `[text](path)` parses `(` and `)` as the path delimiters, so
the conventional fix is to URL-encode them in the link target. The
iter‑30 patch to `scripts/check-doc-links.py` is six lines:

```python
from urllib.parse import unquote
...
def check_relative(link: str, source: Path) -> tuple[bool, str]:
    target = link.split("#", 1)[0].split("?", 1)[0]
    # URL-decode so paths like ../foo/%28app%29/page.tsx resolve to (app).
    target = unquote(target)
    ...
```

This keeps Markdown rendering clean (no angle-bracket hacks, no broken
parenthesis matching) while letting the checker see the real on-disk
filename.

## References

- [`scripts/check-doc-links.py`](../../scripts/check-doc-links.py) (modified this iteration).
- [`docs/testnet/iter25-link-check.md`](iter25-link-check.md) (previous checkpoint, iter 25).
- Initiative plan row: [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../TESTNET-READINESS-50-ITERATIONS.md) row 30.
