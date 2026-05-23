# Lane-7 Internal Smoke — HTTP-error Diagnostic Proof Summary (task 0007g/0007)

_Captured 2026-05-23 against the new `lane7-smoke-html-500` harness profile.
Source script: `scripts/testnet/internal-smoke.sh`. Driver:
`.autobuilder/initiatives/0007g-testnet-setup/proof/run-html-500.sh`._

The smoke now captures the HTTP status code, content-type, curl exit
code, and a redacted snippet of the response body for every probe and
emits a `↳`-prefixed diagnostic row directly under any BLOCKER row.
Previously each transport-layer or HTTP-error failure mode collapsed
into a generic `unreachable` / `status=unknown` line — the operator
had to re-run `curl -v` against every URL by hand to learn whether
the symptom was a 5xx page, a captive portal, an OAuth redirect, or a
real outage.

## What changed in `internal-smoke.sh`

- `http_body()` (single-purpose `curl … || true`) replaced by
  `http_probe()` which captures four globals — `HTTP_CODE`, `HTTP_CT`,
  `CURL_EXIT`, `HTTP_BODY` — into the calling shell.
- `redact_snippet()` trims to 80 bytes, drops table-breaking
  characters, and substitutes any 20+ char alphanumeric token with the
  literal `[REDACTED-token]` placeholder. Same redaction shape as
  `scripts/testnet/health-gate.sh`.
- `add_diag_row()` emits a 3-column table row that lines up under the
  canonical BLOCKER row (matching column count keeps the report's
  Markdown table well-formed in every renderer).
- `probe_health` now distinguishes `unreachable` (empty body / curl
  failure) from `http-<code>` (non-2xx response with a body), and
  emits `add_diag_row` whenever a probe fails.
- Status-aggregator branch grew the same 3-state distinction
  (`empty body` / `HTTP <code>` / `not parseable`) and emits a
  matching `add_diag_row` on any of them.

## Driver output (excerpt)

```
| service | reported status | classification |
|---------|-----------------|----------------|
| `price-service` | http-500 | ❌ BLOCKER |
| ↳ | HTTP 500, content-type text/html, curl_exit=0 | body[:80]=`<html>Internal Server Error: token=Bearer [REDACTED-token]</html>` |
| `oracle-signer` | http-500 | ❌ BLOCKER |
| ↳ | HTTP 500, content-type text/html, curl_exit=0 | body[:80]=`<html>Internal Server Error: token=Bearer [REDACTED-token]</html>` |
| `hedge-engine`  | http-500 | ❌ BLOCKER |
| ↳ | HTTP 500, content-type text/html, curl_exit=0 | body[:80]=`<html>Internal Server Error: token=Bearer [REDACTED-token]</html>` |
```

For the connection-refused case (Case B, no listener on `49911`):

```
| `price-service` | unreachable | ❌ BLOCKER |
| ↳ | HTTP 000, content-type ?, curl_exit=7 | body[:80]=`` |
```

`curl_exit=7` maps to "failed to connect" in the standard curl(1)
exit-code table — the operator can check the table without re-running
the probe.

The `Bearer abcdef0123456789abcdef0123456789` token embedded in the
fixture body is rendered as `Bearer [REDACTED-token]` in the report,
demonstrating the redaction pass. Case C in the driver re-asserts the
same substitution against a synthetic input so the redaction is
covered independently of the harness.

## No-regression check

- Default-path green proof (`lane7-smoke-green` harness profile,
  `LANE7_RPC` unset) is byte-identical modulo timestamps. Diagnostic
  rows fire only on the failure path.
- The `iter05-internal-smoke-red.md` capture has been refreshed in
  this commit so it includes the new `↳` rows for the four
  unreachable probes (`curl_exit=7`, empty body) — verdict shape is
  preserved (RED, exit 1, 4 blockers, 1 warning).

## Pointers

- Full HTML-500 capture: [`iter06-smoke-html-500.md`](./iter06-smoke-html-500.md)
- Smoke script: [`scripts/testnet/internal-smoke.sh`](../../../scripts/testnet/internal-smoke.sh)
- Driver: [`proof/run-html-500.sh`](./proof/run-html-500.sh)
- Refreshed RED capture: [`iter05-internal-smoke-red.md`](./iter05-internal-smoke-red.md)
- PRD: [`tasks/0007-smoke-no-diagnostic-on-non-json-or-http-error-bodies.md`](./tasks/0007-smoke-no-diagnostic-on-non-json-or-http-error-bodies.md)
