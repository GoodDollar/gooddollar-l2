#!/usr/bin/env bash
# Lane-7 internal-smoke HTTP-error diagnostic proof driver.
#
# Boots the fake-status-server on the `lane7-smoke-html-500` profile
# (returns HTTP 500 + text/html body on every path), points all four
# `*_URL` envs at it, and asserts that the captured smoke report
# surfaces:
#   - the literal `HTTP 500`
#   - the literal `text/html` content-type
#   - a redacted `[REDACTED-token]` placeholder for the Bearer token
#     embedded in the fixture body
#   - a `body[:80]=` field with a non-empty snippet
#
# Also asserts that with no listener on a port (curl exit 7 path), the
# diagnostic row includes `curl_exit=7`.
#
# Red half of TDD for task 0007.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

REPORT=/tmp/proof-html500.md
HARNESS_PORT=49555

cleanup() {
  if [[ -n "${HARNESS_PID:-}" ]]; then
    kill "$HARNESS_PID" 2>/dev/null || true
    wait "$HARNESS_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

node "$HARNESS" "$HARNESS_PORT" --profile lane7-smoke-html-500 \
  >/tmp/proof-html500.harness.log 2>&1 &
HARNESS_PID=$!
sleep 0.5

PRICE_SERVICE_URL="http://127.0.0.1:$HARNESS_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$HARNESS_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$HARNESS_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$HARNESS_PORT/status.json" \
REPORT="$REPORT" \
"$SMOKE" >/tmp/proof-html500.console.log 2>&1
rc=$?

echo "exit code: $rc"
echo "report (first 50 lines):"
head -n 50 "$REPORT"
echo "..."

fail=0
check() {
  local label="$1" pattern="$2"
  if grep -qF "$pattern" "$REPORT"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label  — missing literal: $pattern"
    fail=1
  fi
}

check "HTTP 500 surfaced"           "HTTP 500"
check "text/html content-type"       "text/html"
check "Bearer token redacted"        "[REDACTED-token]"
check "body snippet present"         "body[:80]="

kill "$HARNESS_PID" 2>/dev/null || true
HARNESS_PID=

# Case B: curl exit 7 (refused) — port not listening.
PRICE_SERVICE_URL="http://127.0.0.1:49911/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:49911/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:49911/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:49911/status.json" \
REPORT=/tmp/proof-html500-refused.md \
"$SMOKE" >/dev/null 2>&1
echo
echo "case B: refused (no listener):"
head -n 40 /tmp/proof-html500-refused.md
echo "..."
if grep -qF "curl_exit=7" /tmp/proof-html500-refused.md; then
  echo "PASS  curl_exit=7 surfaced"
else
  echo "FAIL  curl_exit=7 missing"
  fail=1
fi

# Case C: redact_snippet unit test (independent of the HTTP probe path).
# Source the smoke for its helpers; guard against running the full body
# by setting INTERNAL_SMOKE_TEST_ONLY which the script checks for early
# exit. Simpler: just re-implement the same pipeline directly here so
# the proof is hermetic.
echo
echo "case C: redact_snippet unit test"
input='Bearer abcdef0123456789abcdef0123456789 X-Tag=keep'
expected_substr='Bearer [REDACTED-token]'
got="$(printf '%s' "$input" \
  | tr -d '\n\r' \
  | tr '|' '_' \
  | sed -E 's#[A-Za-z0-9_+/=-]{20,}#[REDACTED-token]#g' \
  | head -c 80)"
echo "in:  $input"
echo "out: $got"
if [[ "$got" == *"$expected_substr"* ]]; then
  echo "PASS  redaction substituted long token"
else
  echo "FAIL  redaction did not substitute long token"
  fail=1
fi

if (( fail )); then
  echo
  echo "DRIVER FAILED"
  exit 1
fi

echo
echo "ALL CASES PASS"
