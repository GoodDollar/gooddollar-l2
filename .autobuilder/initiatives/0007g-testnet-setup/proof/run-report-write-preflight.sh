#!/usr/bin/env bash
# Lane-7 internal-smoke REPORT write-failure proof driver
# (task 0007g/0022).
#
# `internal-smoke.sh` writes its Markdown report via:
#   mkdir -p "$(dirname "$REPORT")"
#   { echo "# ..."; ... } > "$REPORT"
#
# `set -u` is on but `set -e` is intentionally off (probes must
# continue past failures). Both the `mkdir -p` and the redirect can
# fail silently — with no diagnostic and no impact on the exit
# code. The console summary still prints `report: $REPORT` and
# operators paste that path into promotion tickets while the file
# doesn't exist (or is stale from a previous run). Promotion fraud
# by omission.
#
# Fix:
#   1. fail-fast REPORT preflight near the other preflights — checks
#      that the parent dir can be created, that REPORT isn't a
#      directory, that an existing REPORT is writable, and that an
#      open-for-write actually succeeds (catches noexec / sticky-
#      mounted / etc cases). Exit 2 on any failure.
#   2. post-write verification — captures the redirect status into
#      `report_write_ok`, then asserts the file is non-empty.
#      Exits 3 on mid-write failure (disk full caught here via
#      /dev/full's ENOSPC-on-write).
#   3. Exit-code header updated to document `3`.
#
# Cases:
#   A. REPORT parent unwritable          → exit 2, "cannot create REPORT parent directory"
#   B. REPORT is a directory             → exit 2, "REPORT is a directory"
#   C. REPORT exists but is 0400         → exit 2, "REPORT exists but is not writable"
#   D. REPORT=/dev/full (Linux only)     → exit 3, "failed to write smoke report"
#   E. green path (writable temp)        → exit 0/1 from verdict, report has content

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49701
TMP_BASE="${TMPDIR:-/tmp}/proof-report-write-$$"
mkdir -p "$TMP_BASE"

cleanup() {
  for pid in "${GREEN_PID:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    [[ -n "$pid" ]] && wait "$pid" 2>/dev/null || true
  done
  # Restore writable mode before rm so the trap doesn't EACCES on
  # the 0400 fixture file.
  chmod -R u+w "$TMP_BASE" 2>/dev/null || true
  rm -rf "$TMP_BASE"
}
trap cleanup EXIT

# Shared green harness so the smoke's other probes don't pollute
# the verdict in cases that exercise the report-write path.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >"$TMP_BASE/green.log" 2>&1 &
GREEN_PID=$!
sleep 0.4

run_smoke() {
  local report="$1"
  PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  REPORT="$report" \
    "$SMOKE" >"$TMP_BASE/smoke.stdout" 2>"$TMP_BASE/smoke.stderr"
}

assert_exit() {
  local label="$1" expected="$2" actual="$3"
  if (( actual == expected )); then
    echo "PASS  $label (exit $actual)"
  else
    echo "FAIL  $label  — expected exit $expected, got $actual"
    echo "--- stderr ---"
    cat "$TMP_BASE/smoke.stderr" 2>/dev/null
    return 1
  fi
}

assert_stderr() {
  local label="$1" needle="$2"
  if grep -qF "$needle" "$TMP_BASE/smoke.stderr"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label  — missing in stderr: $needle"
    echo "--- stderr ---"
    cat "$TMP_BASE/smoke.stderr" 2>/dev/null
    return 1
  fi
}

# ---- Case A: REPORT parent unwritable ----
echo
echo "=== Case A: REPORT parent unwritable ==="
ROOT_DIR="$TMP_BASE/no-write-root"
mkdir -p "$ROOT_DIR"
chmod 500 "$ROOT_DIR"
run_smoke "$ROOT_DIR/child/iter.md"
rc=$?
chmod 700 "$ROOT_DIR"
assert_exit "exit 2 on unwritable parent" 2 "$rc" || exit 1
assert_stderr "FATAL names parent dir" "cannot create REPORT parent directory" || exit 1
# Verdict should NOT have run — probes must not fire before preflight.
# Detect by checking for the verdict line that gets printed only when
# the smoke completes the verdict block.
if grep -qF "verdict:" "$TMP_BASE/smoke.stdout"; then
  echo "FAIL  Case A produced a verdict line — preflight didn't fail fast"
  exit 1
fi
echo "PASS  no verdict emitted (preflight failed fast)"

# ---- Case B: REPORT is a directory ----
echo
echo "=== Case B: REPORT is a directory ==="
DIR_TARGET="$TMP_BASE/report-as-dir"
mkdir -p "$DIR_TARGET"
run_smoke "$DIR_TARGET"
rc=$?
assert_exit "exit 2 on REPORT=<dir>" 2 "$rc" || exit 1
assert_stderr "FATAL names directory case" "REPORT is a directory" || exit 1

# ---- Case C: REPORT exists but is 0400 ----
echo
echo "=== Case C: REPORT exists 0400 ==="
RO_TARGET="$TMP_BASE/readonly.md"
echo "stale content" > "$RO_TARGET"
chmod 0400 "$RO_TARGET"
run_smoke "$RO_TARGET"
rc=$?
chmod 0600 "$RO_TARGET"
assert_exit "exit 2 on 0400 REPORT" 2 "$rc" || exit 1
assert_stderr "FATAL names readonly case" "REPORT exists but is not writable" || exit 1
# Stale content must NOT have been clobbered.
stale=$(cat "$RO_TARGET")
if [[ "$stale" != "stale content" ]]; then
  echo "FAIL  Case C clobbered the existing read-only file"
  exit 1
fi
echo "PASS  existing read-only file not clobbered"

# ---- Case D: REPORT=/dev/full (Linux only) ----
echo
echo "=== Case D: REPORT=/dev/full (disk-full mid-write) ==="
if [[ -c /dev/full && "$(uname -s)" == "Linux" ]]; then
  run_smoke /dev/full
  rc=$?
  assert_exit "exit 3 on /dev/full" 3 "$rc" || exit 1
  assert_stderr "FATAL names mid-write failure" "failed to write smoke report" || exit 1
else
  echo "SKIP  /dev/full not available on this host"
fi

# ---- Case E: writable temp (green path) ----
echo
echo "=== Case E: writable temp regression ==="
GREEN_TARGET="$TMP_BASE/green.md"
run_smoke "$GREEN_TARGET"
rc=$?
if (( rc != 0 && rc != 1 )); then
  echo "FAIL  Case E exit was $rc (expect 0 or 1 from verdict)"
  cat "$TMP_BASE/smoke.stderr"
  exit 1
fi
echo "PASS  Case E exit code is verdict-grade ($rc)"
if [[ ! -s "$GREEN_TARGET" ]]; then
  echo "FAIL  Case E green report is empty or missing"
  exit 1
fi
echo "PASS  green report file has content"
if ! grep -qF "# Lane-7 Internal Smoke Run" "$GREEN_TARGET"; then
  echo "FAIL  Case E green report missing title"
  exit 1
fi
echo "PASS  green report has expected title"

# ---- Case F: exit-code header documents 2 and 3 ----
echo
echo "=== Case F: script header documents exit codes 2 and 3 ==="
if ! grep -qE '^#   2  ' "$SMOKE"; then
  echo "FAIL  script header missing exit-code 2 documentation"
  exit 1
fi
if ! grep -qE '^#   3  ' "$SMOKE"; then
  echo "FAIL  script header missing exit-code 3 documentation"
  exit 1
fi
echo "PASS  header documents exit codes 2 and 3"

echo
echo "ALL CASES PASS"
