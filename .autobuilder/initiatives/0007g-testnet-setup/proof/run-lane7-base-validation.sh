#!/usr/bin/env bash
# Lane-7 internal-smoke LANE7_BASE shape preflight proof driver
# (task 0007g/0019).
#
# `internal-smoke.sh` builds default probe URLs by concatenating
# `$LANE7_BASE:$PORT/path`. A trailing slash (`http://localhost/`)
# or path prefix (`http://localhost/api`) on LANE7_BASE silently
# produces semantically-nonsense shapes like `http://localhost/:4000/health`,
# which curl resolves against port 80 and yields four cascading 404
# BLOCKERs from whatever's on the default port. The existing probe-URL
# preflight regex passes those concatenations because the host class
# `[^:/]+` doesn't introspect the inner shape.
#
# Fix: add a dedicated LANE7_BASE preflight `^https?://[^:/]+(:[0-9]+)?$`
# (no trailing `(/.*)?`) before the URL concatenations, gated by "any
# *_URL override unset" so operators with reverse-proxy path-prefix
# setups can still bypass it via the per-service overrides.
#
# Cases:
#   1. LANE7_BASE='http://localhost/' (trailing slash) → FATAL exit 2
#   2. LANE7_BASE='http://localhost/api' (path prefix) → FATAL exit 2
#   3. LANE7_BASE='http://localhost' (regression) → exit 0 against fake fixture
#   4. LANE7_BASE='http://localhost:8080' (overlap with task 0006) → still
#      catches the resulting double-colon via PROBE_URL_RE
#   5. LANE7_BASE='http://internal-host/lane7' WITH all four *_URL
#      overrides set → exit 0 (gate skipped: base unused)
#   6. LANE7_BASE='http://internal-host/lane7' with NO overrides →
#      FATAL (gate fires: base would be used)
#   7. wallclock for FATAL cases ≤ 100ms (no curl, no node spawn)

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49671

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

run_fatal_case() {
  local label="$1" base="$2" report="$3" stderr="$4"
  echo
  echo "=== $label ==="
  start_ns=$(date +%s%N)
  LANE7_BASE="$base" \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>"$stderr"
  rc=$?
  end_ns=$(date +%s%N)
  elapsed_ms=$(( (end_ns - start_ns) / 1000000 ))
  echo "exit: $rc, elapsed: ${elapsed_ms}ms"
  [[ "$rc" == "2" ]] || { echo "FAIL  expected exit 2, got $rc"; return 1; }
  echo "PASS  exit code 2"
  if [[ -e "$report" ]]; then
    echo "FAIL  Markdown report written despite FATAL"
    return 1
  fi
  echo "PASS  no Markdown report written"
  if (( elapsed_ms > 200 )); then
    echo "FAIL  wallclock ${elapsed_ms}ms — expected ≤ 200ms"
    return 1
  fi
  echo "PASS  wallclock ${elapsed_ms}ms (≤ 200ms)"
}

# Case 1: trailing slash.
rm -f /tmp/proof-lane7-base-1.md
run_fatal_case "Case 1: LANE7_BASE='http://localhost/'" \
  "http://localhost/" \
  /tmp/proof-lane7-base-1.md \
  /tmp/proof-lane7-base-1.stderr || exit 1
assert_substr "FATAL names variable" /tmp/proof-lane7-base-1.stderr \
  "LANE7_BASE='http://localhost/'" || exit 1
assert_substr "FATAL points to *_URL escape hatches" \
  /tmp/proof-lane7-base-1.stderr \
  "PRICE_SERVICE_URL" || exit 1

# Case 2: path prefix.
rm -f /tmp/proof-lane7-base-2.md
run_fatal_case "Case 2: LANE7_BASE='http://localhost/api'" \
  "http://localhost/api" \
  /tmp/proof-lane7-base-2.md \
  /tmp/proof-lane7-base-2.stderr || exit 1

# Spawn fixture for green/regression cases.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-lane7-base.green.log 2>&1 &
GREEN_PID=$!
sleep 0.5

# Case 3: regression baseline — default LANE7_BASE shape.
echo
echo "=== Case 3: LANE7_BASE=http://127.0.0.1 against fixture ==="
rm -f /tmp/proof-lane7-base-3.md
LANE7_BASE="http://127.0.0.1" \
PRICE_SERVICE_PORT=$GREEN_PORT \
ORACLE_SIGNER_PORT=$GREEN_PORT \
HEDGE_ENGINE_PORT=$GREEN_PORT \
STATUS_AGGREGATOR_PORT=$GREEN_PORT \
REPORT=/tmp/proof-lane7-base-3.md \
  "$SMOKE" >/dev/null 2>&1
rc=$?
echo "exit: $rc"
[[ -f /tmp/proof-lane7-base-3.md ]] || { echo "FAIL  no report on regression"; exit 1; }
assert_substr "regression report header" /tmp/proof-lane7-base-3.md \
  "**Lane base:** \`http://127.0.0.1\`" || exit 1
echo "PASS  regression case runs to completion"

# Case 4: overlap with task 0006 (port in base).
echo
echo "=== Case 4: LANE7_BASE='http://localhost:8080' (overlap w/ task 0006) ==="
rm -f /tmp/proof-lane7-base-4.md
LANE7_BASE="http://localhost:8080" \
REPORT=/tmp/proof-lane7-base-4.md \
  "$SMOKE" >/dev/null 2>/tmp/proof-lane7-base-4.stderr
rc=$?
echo "exit: $rc"
[[ "$rc" == "2" ]] || { echo "FAIL  Case 4 expected exit 2"; exit 1; }
echo "PASS  exit code 2 (caught by PROBE_URL_RE downstream)"
# The new LANE7_BASE check passes (port in base is legal); the
# existing PROBE_URL_RE check fires on the resulting double-colon URL.
assert_substr "double-colon URL caught" /tmp/proof-lane7-base-4.stderr \
  "PRICE_SERVICE_URL=http://localhost:8080:" || exit 1

# Case 5: path-prefix base, BUT all four *_URL overrides set →
# the new gate skips because LANE7_BASE is unused.
echo
echo "=== Case 5: path-prefix base + all *_URL overrides set ==="
rm -f /tmp/proof-lane7-base-5.md
LANE7_BASE="http://internal-host/lane7" \
PRICE_SERVICE_URL="http://127.0.0.1:$GREEN_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$GREEN_PORT/status.json" \
REPORT=/tmp/proof-lane7-base-5.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
[[ -f /tmp/proof-lane7-base-5.md ]] || { echo "FAIL  Case 5 expected report"; exit 1; }
echo "PASS  Case 5: gate skipped (base unused, *_URL overrides win)"

# Case 6: path-prefix base, NO overrides → gate fires.
echo
echo "=== Case 6: path-prefix base + NO overrides → FATAL ==="
rm -f /tmp/proof-lane7-base-6.md
LANE7_BASE="http://internal-host/lane7" \
REPORT=/tmp/proof-lane7-base-6.md \
  "$SMOKE" >/dev/null 2>/tmp/proof-lane7-base-6.stderr
rc=$?
echo "exit: $rc"
[[ "$rc" == "2" ]] || { echo "FAIL  Case 6 expected exit 2"; exit 1; }
echo "PASS  exit code 2"
assert_substr "FATAL names path-prefix base" /tmp/proof-lane7-base-6.stderr \
  "LANE7_BASE='http://internal-host/lane7'" || exit 1

echo
echo "ALL CASES PASS"
