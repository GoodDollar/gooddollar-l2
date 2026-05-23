# iter15 — internal-smoke /quotes/fresh/all probe (task 0007g/0024)

## Summary

The lane-7 spec's URGENT OVERRIDE explicitly requires the smoke
prove:

> price-service reachable and serving **non-empty normalized quotes**

The smoke probed only `/health`, which short-circuits to
`status: 'ok'` whenever `cache.size === 0`
(see `backend/price-service/src/server.ts:20-31`). A price-service
with no upstream feed, all symbols filtered, or a stale binary
running without the eToro adapter wired up returns 200 ok with
zero quotes flowing — and the smoke reported GREEN. The spec's
mission deliverable was unverified for 19 of 20 executed tasks
in this initiative.

This task adds the missing `## Price-service quote flow` section
that probes the existing `/quotes/fresh/all` endpoint (no
service-side changes) and asserts `count >= MIN_FRESH_QUOTES` and
freshest quote age `<= QUOTE_MAX_AGE_S`.

## Patch shape

### Preflights (alongside the existing `require_uint` cluster)

```bash
MIN_FRESH_QUOTES="${MIN_FRESH_QUOTES:-1}"
QUOTE_MAX_AGE_S="${QUOTE_MAX_AGE_S:-600}"

require_uint MIN_FRESH_QUOTES "$MIN_FRESH_QUOTES"
require_uint QUOTE_MAX_AGE_S  "$QUOTE_MAX_AGE_S"

# PRICE_SERVICE_QUOTES_URL: optional explicit override, validated via
# the same PROBE_URL_RE as every other URL preflight (task 0015).
```

### Auto-skip discipline

The new section sits between status-aggregator and on-chain
freshness. It auto-skips with a `ℹ️  skipped — ...` note when:

1. `price-service /health` was unreachable (existing BLOCKER
   covers it; don't double-report).
2. `price-service /health` returned non-2xx (same).
3. `price-service /health` body does NOT contain a `freshQuotes`
   field (operator running against a custom price-service or a
   generic /health stub — opt in by setting
   `PRICE_SERVICE_QUOTES_URL` explicitly).

An explicit `PRICE_SERVICE_QUOTES_URL` override bypasses all
auto-skip heuristics and always probes the supplied URL. This
preserves the 17 existing proof drivers, which point at generic
fake servers that don't include the lane-7 price-service shape.

### Probe + classification

When the probe runs, the section emits:

```
| metric | value | classification |
|--------|-------|----------------|
| fresh quote count | 3 / min 1 | ✅ OK |
| freshest quote age | 0 s ≤ 600 s | ✅ OK |
| source (first quote) | `etoro-demo` | ✅ OK |
```

Or on failure:

```
| metric | value | classification |
|--------|-------|----------------|
| fresh quote count | 0 / min 1 | ❌ BLOCKER |
| ↳ | configured symbols: 3; cached: 0; fresh: 0 | (filter rejecting all or upstream stale) |
```

`configured symbols / cached / fresh` is pulled from the cached
`/health` body (captured before subsequent probes mutated the
`http_probe` globals).

### Severity split

| Outcome                                | Severity                      |
|----------------------------------------|-------------------------------|
| transport fail / non-2xx               | BLOCKER + diag row            |
| JSON without `count` or `quotes[]`     | BLOCKER + diag row            |
| `count < MIN_FRESH_QUOTES`             | BLOCKER + breakdown row       |
| `count >= MIN_FRESH_QUOTES`, stale     | WARN                          |
| `count >= MIN_FRESH_QUOTES`, fresh     | OK                            |
| auto-skipped                           | informational note only       |

`stale` is WARN (not BLOCKER) to mirror the existing
`STALENESS_THRESHOLD_S` policy for the on-chain probe. Operators
who want fail-on-stale can set `QUOTE_MAX_AGE_S=1` and re-run.

## Acceptance criteria evidence

```
=== Case A: green (count=3, fresh) ===
exit: 0
PASS  exit 0
PASS  section header present
PASS  fresh quote count row
PASS  count 3 / min 1 OK
PASS  freshest age row
PASS  source first quote etoro-demo
PASS  no BLOCKER on green

=== Case B: empty (count=0, /health=ok) ===
exit: 1
PASS  exit 1 (BLOCKER)
PASS  section header present
PASS  count BLOCKER
PASS  diag breakdown shows configured/cached/fresh

=== Case C: stale (count=3, freshest 1000s old) ===
exit: 0
PASS  exit 0 (WARN, not BLOCKER)
PASS  section header present
PASS  freshest age WARN

=== Case D: price-service unreachable (auto-skip) ===
exit: 1
PASS  section header present
PASS  skip note on unreachable
PASS  no duplicate /quotes BLOCKER

=== Case E: explicit PRICE_SERVICE_QUOTES_URL with non-JSON response ===
exit: 1
PASS  exit 1 on non-JSON /quotes response
PASS  non-JSON BLOCKER

ALL CASES PASS
```

## URGENT OVERRIDE alignment

The spec banner reads:

> Required evidence before considering the lane useful:
> - **price-service reachable and serving non-empty normalized quotes**,
> - oracle-signer reachable and consuming/publishing or
>   health-only with explicit blocker,
> - on-chain freshness checked or explicitly blocked by missing
>   `LANE7_RPC` / signer key,
> ...

Before this task: only the first sub-clause ("reachable") was
verified — `/health` returns 200 even for an empty cache. After
this task: both sub-clauses ("reachable" AND "non-empty normalized
quotes") are verified, with the count + freshest-age + source
fields surfaced in the report for reviewer scan.

## Regression sweep

All 18 proof drivers pass (17 prior + run-quote-flow-probe.sh).
The auto-skip heuristic correctly identifies every existing
fake-server-based driver as "not lane-7 price-service shape" and
emits the skip note instead of producing a spurious BLOCKER.

## Runbook update

`docs/testnet/INTERNAL-TESTNET-RUNBOOK.md` extended with:

- The new probe step (#5 in the probe order list).
- Documentation for `MIN_FRESH_QUOTES`, `QUOTE_MAX_AGE_S`,
  `PRICE_SERVICE_QUOTES_URL` in the env-contract section.
- Documentation for the new exit codes 2 and 3 (added by task
  0022) in the post-deploy wiring section.

## Out of scope

- Probing per-symbol via `/quotes/:symbol` — fresh/all is the
  right shape for a smoke probe.
- Probing `/status/quotes` (the fourth quote endpoint) — its
  `freshCount` field overlaps with `/quotes/fresh/all`.
- Validating quote content against a price-range / schema —
  smoke is a presence + freshness check.
- A parallel probe for oracle-signer's publish counter —
  flagged in task PRD §Out of scope for a sibling task.
- Modifying the price-service to add new endpoints — the
  existing `/quotes/fresh/all` is sufficient.
