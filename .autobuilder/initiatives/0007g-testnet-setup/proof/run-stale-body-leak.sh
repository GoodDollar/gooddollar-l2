#!/usr/bin/env bash
# Lane-7 internal-smoke stale TMP_BODY leak proof driver
# (task 0007g/0017).
#
# `http_probe` shares a single tempfile across every probe. `curl -o
# file` opens the file lazily on the first response byte; transport-
# level failures (refused, DNS, timeout, empty reply) leave the file
# untouched, so the next probe's `cat $TMP_BODY` reads the previous
# probe's body. The diag row then shows a body that didn't come from
# the failing probe — operators see `[REDACTED-token]`-style snippets
# from a successful probe rendered as if they were the failing
# service's response.
#
# Cases:
#   1. forward order: succeed → refuse × 3 — each refused row's
#      body[:80]= must be empty, no `STALE-MARKER-...` leak across
#      probes.
#   2. status-aggregator unreachable after a successful probe — its
#      diag row body[:80]= must be empty.
#   3. regression: HTTP 500 with a body still shows the body in the
#      diag row (single-probe path; truncate fires only before
#      curl, not after).

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

GREEN_PORT=49281
HTML500_PORT=49282

cleanup() {
  for pid in "${GREEN_PID:-}" "${HTML500_PID:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    [[ -n "$pid" ]] && wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

assert_substr() {
  local label="$1" file="$2" needle="$3"
  if grep -qF "$needle" "$file"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label  — missing literal: $needle"
    echo "--- file contents ---"
    cat "$file"
    return 1
  fi
}

refute_substr() {
  local label="$1" file="$2" needle="$3"
  if grep -qF "$needle" "$file"; then
    echo "FAIL  $label  — found forbidden literal: $needle"
    echo "--- file contents ---"
    cat "$file"
    return 1
  else
    echo "PASS  $label"
  fi
}

# Spawn a tiny fake price-service that returns a body with a
# distinctive marker. Long enough to trip redact_snippet's 20+ char
# alphanumeric token rule so the leaked body would render as
# `[REDACTED-token]` (today's bug surface).
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({
    status: "ok",
    marker: "STALE-MARKER-12345678901234567890",
  }));
}).listen(port, "127.0.0.1");
' "$GREEN_PORT" >/tmp/proof-stale-body.green.log 2>&1 &
GREEN_PID=$!

# A second server returns HTTP 500 with a real body so the regression
# case can confirm body-bearing failures still render their actual body.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
http.createServer((req, res) => {
  res.writeHead(500, { "content-type": "text/plain" });
  res.end("server-side error: token=Bearer abcdef0123456789abcdef0123456789");
}).listen(port, "127.0.0.1");
' "$HTML500_PORT" >/tmp/proof-stale-body.html500.log 2>&1 &
HTML500_PID=$!
sleep 0.5

# Case 1: forward order — succeed (price-service, body-bearing) then
# three refused (oracle-signer, hedge-engine, status-aggregator). Each
# refused diag row's body cell must be empty (no leak from the
# successful probe).
echo
echo "=== Case 1: succeed → refuse × 3 (forward order) ==="
rm -f /tmp/proof-stale-body-1.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$GREEN_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:1/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:1/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:1/status.json" \
REPORT=/tmp/proof-stale-body-1.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"

# Marker must appear once and only once — the price-service row
# (rendered as `marker:[REDACTED-token]` because the marker is
# already 28 chars of [A-Za-z0-9-], so redact_snippet collapses it
# to the literal `[REDACTED-token]`). Either the literal marker OR
# its redacted form is acceptable on the price-service row; what
# matters is the leak shape on the failing rows.
refute_substr "no STALE-MARKER bytes leak across probes" \
  /tmp/proof-stale-body-1.md "STALE-MARKER-12345678901234567890" || exit 1

# After redaction, the body becomes
# `{"status":"ok","marker":"[REDACTED-token]"}`. If the bug is alive,
# the three refused rows each carry that exact substring. After the
# fix, only the price-service row carries it, and the count is at most
# one (or zero, if the price-service body itself isn't rendered as
# such here). Assert ≤ 1 occurrences in the report.
hits=$(grep -cF '[REDACTED-token]' /tmp/proof-stale-body-1.md || true)
if (( hits > 1 )); then
  echo "FAIL  [REDACTED-token] appeared $hits times — leak across probes"
  cat /tmp/proof-stale-body-1.md
  exit 1
fi
echo "PASS  [REDACTED-token] appeared $hits time(s) (≤ 1)"

# Each refused service must have its diag row body[:80]= empty.
# Refused rows look like:
#   | ↳ | HTTP 000, content-type ?, curl_exit=7 | body[:80]=`` |
# Confirm the refused rows render with `body[:80]=\`\``.
refused_rows=$(grep -cE 'curl_exit=7' /tmp/proof-stale-body-1.md || true)
echo "refused rows (curl_exit=7): $refused_rows (expect ≥ 3)"
if (( refused_rows < 3 )); then
  echo "FAIL  expected ≥ 3 refused diag rows"
  cat /tmp/proof-stale-body-1.md
  exit 1
fi
empty_body_rows=$(grep -cE 'curl_exit=7 \| body\[:80\]=`` ' /tmp/proof-stale-body-1.md || true)
echo "refused rows with empty body: $empty_body_rows (expect = $refused_rows)"
if (( empty_body_rows != refused_rows )); then
  echo "FAIL  refused rows did not all show empty body — stale leak alive"
  cat /tmp/proof-stale-body-1.md
  exit 1
fi
echo "PASS  every refused row shows body[:80]=\`\`"

# Case 2: status-aggregator unreachable after a successful body-
# bearing probe. The status-aggregator's diag row also routes
# through http_probe, so the same fix applies.
echo
echo "=== Case 2: status-aggregator unreachable after body-bearing success ==="
rm -f /tmp/proof-stale-body-2.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$GREEN_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:1/status.json" \
REPORT=/tmp/proof-stale-body-2.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
refute_substr "no STALE-MARKER bytes leak into agg diag" \
  /tmp/proof-stale-body-2.md "STALE-MARKER-12345678901234567890" || exit 1
# The aggregator diag row appears once (curl_exit=7 — refused).
agg_refused=$(grep -cE 'curl_exit=7 \| body\[:80\]=`` ' /tmp/proof-stale-body-2.md || true)
echo "agg refused row with empty body: $agg_refused (expect ≥ 1)"
if (( agg_refused < 1 )); then
  echo "FAIL  status-aggregator diag row leaked stale body"
  cat /tmp/proof-stale-body-2.md
  exit 1
fi
echo "PASS  status-aggregator refused row shows empty body"

# Case 3: regression — HTTP 500 body-bearing failure must continue
# to render its body in the diag row. Truncate fires only BEFORE
# curl, not after, so a successful curl (exit 0) with HTTP 500 still
# fills $TMP_BODY and the diag row reads it.
echo
echo "=== Case 3: regression — HTTP 500 with body shows the body ==="
rm -f /tmp/proof-stale-body-3.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$HTML500_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$GREEN_PORT/status.json" \
REPORT=/tmp/proof-stale-body-3.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "HTTP 500 row is present" \
  /tmp/proof-stale-body-3.md "http-500" || exit 1
assert_substr "HTTP 500 body rendered (token redacted)" \
  /tmp/proof-stale-body-3.md "[REDACTED-token]" || exit 1
# curl_exit=0 (success even on HTTP 500) — the diag row's body cell
# must NOT be empty for this case.
assert_substr "HTTP 500 diag row carries body" \
  /tmp/proof-stale-body-3.md "curl_exit=0" || exit 1
refute_substr "HTTP 500 row body[:80] is not empty" \
  /tmp/proof-stale-body-3.md "curl_exit=0 | body[:80]=\`\` " || exit 1

echo
echo "ALL CASES PASS"
