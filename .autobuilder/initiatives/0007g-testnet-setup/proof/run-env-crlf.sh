#!/usr/bin/env bash
# Lane-7 internal-smoke .env CRLF proof driver (task 0007g/0012).
#
# Verifies the .env parser strips trailing CR from key/value pairs
# before the safety-fence comparison. Today's bug: `read -r` leaves
# CR on the value, the equality check (`rte == "false"`) fails on
# `false\r`, the smoke fires a spurious "REAL_TRADING_ENABLED is
# false\r — must be unset or false" BLOCKER whose printed CR
# scrambles the operator's terminal during incident triage.
#
# Cases:
#   crlf-safe.env   — CRLF, RTE=false, MODE=demo-readonly
#                     → no BLOCKER, single CRLF WARN, exit 0
#   lf-safe.env     — LF, same content (regression baseline)
#                     → no BLOCKER, no CRLF WARN, exit 0
#   crlf-unsafe.env — CRLF, RTE=true (real BLOCKER must still fire)
#                     → BLOCKER fires, printed value `true` (no CR),
#                       exit 1
#
# Also asserts the rendered Markdown report contains zero `0d` bytes
# in any case.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"
FIXTURES="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/env-fixtures"

GREEN_PORT=49631

cleanup() {
  for pid in "${GREEN_PID:-}"; do
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

assert_no_cr() {
  local label="$1" file="$2"
  if LC_ALL=C grep -q $'\r' "$file"; then
    echo "FAIL  $label  — file contains a CR (0x0d) byte"
    LC_ALL=C grep -n $'\r' "$file" | head -3
    return 1
  fi
  echo "PASS  $label"
}

run_case() {
  local label="$1" envfile="$2" report="$3"
  echo
  echo "=== $label ==="
  PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  LANE7_ENV_FILE="$envfile" \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>&1
  echo "exit: $?"
}

node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-env-crlf.green.log 2>&1 &
GREEN_PID=$!
sleep 0.4

# Case A: CRLF .env with REAL_TRADING_ENABLED=false (the false-alarm
# scenario that fires a contradictory BLOCKER today).
run_case "Case A: CRLF + RTE=false" \
  "$FIXTURES/crlf-safe.env" /tmp/proof-env-crlf-A.md
assert_substr "fence intact line" \
  /tmp/proof-env-crlf-A.md "REAL_TRADING_ENABLED\` = \`false\` (fence intact)" || exit 1
refute_substr "no spurious RTE BLOCKER" \
  /tmp/proof-env-crlf-A.md "lane-7 forbids real trading" || exit 1
assert_substr "ETORO_MODE allowlisted" \
  /tmp/proof-env-crlf-A.md "ETORO_MODE\` = \`demo-readonly\` (within lane-7 allowlist)" || exit 1
assert_substr "CRLF advisory WARN" \
  /tmp/proof-env-crlf-A.md "has CRLF line endings" || exit 1
assert_no_cr "no CR bytes in report" /tmp/proof-env-crlf-A.md || exit 1

# Case B: LF .env (regression baseline — no CRLF WARN expected).
run_case "Case B: LF baseline" \
  "$FIXTURES/lf-safe.env" /tmp/proof-env-crlf-B.md
assert_substr "fence intact line" \
  /tmp/proof-env-crlf-B.md "REAL_TRADING_ENABLED\` = \`false\` (fence intact)" || exit 1
refute_substr "no spurious BLOCKER" \
  /tmp/proof-env-crlf-B.md "lane-7 forbids real trading" || exit 1
refute_substr "no CRLF advisory WARN on LF file" \
  /tmp/proof-env-crlf-B.md "has CRLF line endings" || exit 1
assert_no_cr "no CR bytes in report" /tmp/proof-env-crlf-B.md || exit 1

# Case C: CRLF .env with REAL_TRADING_ENABLED=true — real fence BLOCKER.
run_case "Case C: CRLF + RTE=true (real BLOCKER)" \
  "$FIXTURES/crlf-unsafe.env" /tmp/proof-env-crlf-C.md
assert_substr "RTE=true BLOCKER fires" \
  /tmp/proof-env-crlf-C.md "REAL_TRADING_ENABLED\` = \`true\` — lane-7 forbids real trading" || exit 1
refute_substr "no leaked CR in fence line" \
  /tmp/proof-env-crlf-C.md "REAL_TRADING_ENABLED\` = \`true"$'\r' || exit 1
assert_substr "CRLF advisory WARN" \
  /tmp/proof-env-crlf-C.md "has CRLF line endings" || exit 1
assert_no_cr "no CR bytes in report" /tmp/proof-env-crlf-C.md || exit 1

echo
echo "ALL CASES PASS"
