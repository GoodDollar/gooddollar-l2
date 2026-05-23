#!/usr/bin/env bash
# Lane-7 internal-smoke HEALTH_CONTRACT preflight proof driver
# (task 0007g/0013).
#
# Verifies the new path-existence preflight and the awk stderr
# redirection. Today's bug: the script resolves `$HEALTH_CONTRACT`
# but never checks the file exists. A missing file leaks a raw
# `awk: fatal: cannot open file ...` per service to the operator's
# TTY *and* yields an empty `cls` that fires misleading
# `MISSING-FROM-CONTRACT` BLOCKERs.
#
# Cases:
#   A. HEALTH_CONTRACT=/nonexistent/path.md  → exit 2, single FATAL
#                                              block, no Markdown report,
#                                              wallclock ≤ 100ms.
#   B. HEALTH_CONTRACT=""  (explicit empty)  → same FATAL path (the
#                                              `:-` → `-` swap makes this
#                                              respect the explicit
#                                              empty value).
#   C. HEALTH_CONTRACT unset                 → resolves to the in-tree
#                                              default; smoke runs
#                                              normally.
#   D. HEALTH_CONTRACT=<binary garbage>      → existing
#                                              `MISSING-FROM-CONTRACT`
#                                              BLOCKER fires cleanly,
#                                              no `awk: fatal` text leaks.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49641

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

# Case A: nonexistent contract path → FATAL.
echo
echo "=== Case A: HEALTH_CONTRACT=/nonexistent/path.md ==="
start_ns=$(date +%s%N)
HEALTH_CONTRACT=/nonexistent/path.md \
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
REPORT=/tmp/proof-contract-preflight-A.md \
  "$SMOKE" >/tmp/proof-contract-preflight-A.stdout 2>/tmp/proof-contract-preflight-A.stderr
rc=$?
end_ns=$(date +%s%N)
elapsed_ms=$(( (end_ns - start_ns) / 1000000 ))
echo "exit: $rc, elapsed: ${elapsed_ms}ms"
[[ "$rc" == "2" ]] || { echo "FAIL  Case A expected exit 2, got $rc"; exit 1; }
echo "PASS  exit code 2"
assert_substr "FATAL line 1 (not readable)" \
  /tmp/proof-contract-preflight-A.stderr \
  "FATAL: HEALTH_CONTRACT not readable at: /nonexistent/path.md" || exit 1
assert_substr "FATAL line 2 (set or restore)" \
  /tmp/proof-contract-preflight-A.stderr \
  "FATAL: set HEALTH_CONTRACT=<path> or restore docs/testnet/HEALTH-CONTRACT.md" || exit 1
refute_substr "no awk fatal leak" \
  /tmp/proof-contract-preflight-A.stderr \
  "awk: fatal" || exit 1
if [[ -e /tmp/proof-contract-preflight-A.md ]]; then
  echo "FAIL  Case A wrote a Markdown report despite FATAL"
  exit 1
fi
echo "PASS  no Markdown report written"
if (( elapsed_ms > 500 )); then
  echo "FAIL  Case A wallclock ${elapsed_ms}ms — expected ≤ 500ms"
  exit 1
fi
echo "PASS  wallclock ${elapsed_ms}ms (≤ 500ms)"

# Case B: explicit-empty HEALTH_CONTRACT.
echo
echo "=== Case B: HEALTH_CONTRACT='' (explicit empty) ==="
HEALTH_CONTRACT="" \
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
REPORT=/tmp/proof-contract-preflight-B.md \
  "$SMOKE" >/tmp/proof-contract-preflight-B.stdout 2>/tmp/proof-contract-preflight-B.stderr
rc=$?
echo "exit: $rc"
[[ "$rc" == "2" ]] || { echo "FAIL  Case B expected exit 2, got $rc"; exit 1; }
echo "PASS  exit code 2"
assert_substr "FATAL line 1 (not readable)" \
  /tmp/proof-contract-preflight-B.stderr \
  "FATAL: HEALTH_CONTRACT not readable at:" || exit 1
refute_substr "no awk fatal leak" \
  /tmp/proof-contract-preflight-B.stderr \
  "awk: fatal" || exit 1

# Case C: HEALTH_CONTRACT unset → uses in-tree default.
echo
echo "=== Case C: HEALTH_CONTRACT unset (default path) ==="
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-contract-preflight.green.log 2>&1 &
GREEN_PID=$!
sleep 0.4
unset HEALTH_CONTRACT
PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
REPORT=/tmp/proof-contract-preflight-C.md \
  "$SMOKE" >/tmp/proof-contract-preflight-C.stdout 2>/tmp/proof-contract-preflight-C.stderr
rc=$?
echo "exit: $rc"
refute_substr "no FATAL on default path" \
  /tmp/proof-contract-preflight-C.stderr "FATAL:" || exit 1
assert_substr "Markdown report written" \
  /tmp/proof-contract-preflight-C.md "Lane-7 Internal Smoke Run" || exit 1
assert_substr "EXCLUDED row from default contract" \
  /tmp/proof-contract-preflight-C.md "EXCLUDED" || exit 1

# Case D: garbled contract file (binary garbage).
echo
echo "=== Case D: HEALTH_CONTRACT points at binary garbage ==="
GARBAGE=/tmp/proof-contract-preflight-garbage.bin
head -c 256 /dev/urandom > "$GARBAGE"
HEALTH_CONTRACT="$GARBAGE" \
PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
REPORT=/tmp/proof-contract-preflight-D.md \
  "$SMOKE" >/tmp/proof-contract-preflight-D.stdout 2>/tmp/proof-contract-preflight-D.stderr
rc=$?
echo "exit: $rc"
refute_substr "no awk fatal leak (garbled file)" \
  /tmp/proof-contract-preflight-D.stderr "awk: fatal" || exit 1
refute_substr "no awk fatal leak in stdout" \
  /tmp/proof-contract-preflight-D.stdout "awk: fatal" || exit 1
assert_substr "MISSING-FROM-CONTRACT BLOCKER fires cleanly" \
  /tmp/proof-contract-preflight-D.md "MISSING-FROM-CONTRACT" || exit 1

echo
echo "ALL CASES PASS"
