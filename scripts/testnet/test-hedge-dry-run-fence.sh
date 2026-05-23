#!/usr/bin/env bash
# Round-trip harness for the HEDGE_DRY_RUN third-fence-key check
# (task 0031). Writes a `.env` with the documented values, runs
# the smoke pointed at unreachable lane-local services, and greps
# the resulting BLOCKERS / report for the HEDGE_DRY_RUN-specific
# fence outcome.
#
# The service probes will all fail (nothing listening on the
# default lane-local ports during the test) — that produces a
# RED verdict regardless of the fence value. We don't care about
# the service-reachability blockers; we assert ONLY on the
# presence/absence of a HEDGE_DRY_RUN-shaped BLOCKER line and on
# the corresponding row in the report.
#
# Mirrors the shape of `test-internal-smoke-env-parse.sh` — same
# REPO_ROOT / fail-counter / assert_eq / assert_substr helpers
# (inlined here to keep the harness self-contained).

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
CONTRACT="$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md"

fail=0
case_n=0

assert_substr() {
  local label="$1" haystack="$2" needle="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "PASS  [$case_n] $label"
  else
    echo "FAIL  [$case_n] $label  — '$needle' not in output"
    fail=1
  fi
}

refute_substr() {
  local label="$1" haystack="$2" needle="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "FAIL  [$case_n] $label  — forbidden '$needle' present"
    fail=1
  else
    echo "PASS  [$case_n] $label"
  fi
}

# Run the smoke against a `.env` fixture that points the service
# URLs at a definitely-closed loopback port (port 1 — privileged,
# reserved, never bound by a normal stack). That guarantees the
# service probes fail without hanging on long DNS resolution.
# We pick a random REPORT path per case so they don't collide.
run_smoke_with_env() {
  local envfile="$1" report="$2"
  # Use an unreachable local URL — `http://127.0.0.1:1/...` will
  # be refused immediately by the kernel (no service binds to
  # port 1 by default). Each probe spends ~0s on connection
  # refused, so the full smoke completes in well under the curl
  # --max-time 10 cap.
  env -i HOME="$HOME" PATH="$PATH" \
    LANE7_ENV_FILE="$envfile" \
    REPORT="$report" \
    HEALTH_CONTRACT="$CONTRACT" \
    PRICE_SERVICE_URL="http://127.0.0.1:1/health" \
    ORACLE_SIGNER_URL="http://127.0.0.1:1/health" \
    HEDGE_ENGINE_URL="http://127.0.0.1:1/health" \
    STATUS_AGGREGATOR_URL="http://127.0.0.1:1/status.json" \
    bash "$SMOKE" 2>&1
  return $?
}

# Case 1: HEDGE_DRY_RUN=false — must produce a HEDGE_DRY_RUN
# fence BLOCKER and a ❌ row in the report.
echo "=== Case 1: HEDGE_DRY_RUN=false → RED fence row ==="
ENV1=/tmp/hedge-fence-c1.env
REP1=/tmp/hedge-fence-c1.md
cat > "$ENV1" <<'EOF'
REAL_TRADING_ENABLED=false
ETORO_MODE=mock
HEDGE_DRY_RUN=false
EOF
OUT1="$(run_smoke_with_env "$ENV1" "$REP1")"
EXIT1=$?
assert_substr "exit non-zero (BLOCKER)" "EXIT=$EXIT1" "EXIT=1"
assert_substr "console BLOCKER names HEDGE_DRY_RUN" "$OUT1" "BLOCKER: HEDGE_DRY_RUN is false"
if [[ -f "$REP1" ]]; then
  REPORT1="$(cat "$REP1")"
  assert_substr "report ❌ row for HEDGE_DRY_RUN" "$REPORT1" "❌ \`HEDGE_DRY_RUN\` = \`false\`"
  assert_substr "report names Promotion gate" "$REPORT1" "Promotion gate"
fi

# Case 2: HEDGE_DRY_RUN=true — ✅ row, no fence BLOCKER.
echo
echo "=== Case 2: HEDGE_DRY_RUN=true → GREEN fence row ==="
ENV2=/tmp/hedge-fence-c2.env
REP2=/tmp/hedge-fence-c2.md
cat > "$ENV2" <<'EOF'
REAL_TRADING_ENABLED=false
ETORO_MODE=mock
HEDGE_DRY_RUN=true
EOF
OUT2="$(run_smoke_with_env "$ENV2" "$REP2")"
refute_substr "no HEDGE_DRY_RUN BLOCKER on safe value" "$OUT2" "BLOCKER: HEDGE_DRY_RUN"
if [[ -f "$REP2" ]]; then
  REPORT2="$(cat "$REP2")"
  assert_substr "report ✅ row for HEDGE_DRY_RUN=true" "$REPORT2" "✅ \`HEDGE_DRY_RUN\` = \`true\`"
fi

# Case 3: HEDGE_DRY_RUN omitted entirely — ✅ row (treated as
# safe `unset` since the hedge-engine's own default is dry-run).
echo
echo "=== Case 3: HEDGE_DRY_RUN omitted → GREEN ===
"
ENV3=/tmp/hedge-fence-c3.env
REP3=/tmp/hedge-fence-c3.md
cat > "$ENV3" <<'EOF'
REAL_TRADING_ENABLED=false
ETORO_MODE=mock
EOF
OUT3="$(run_smoke_with_env "$ENV3" "$REP3")"
refute_substr "no HEDGE_DRY_RUN BLOCKER when omitted" "$OUT3" "BLOCKER: HEDGE_DRY_RUN"
if [[ -f "$REP3" ]]; then
  REPORT3="$(cat "$REP3")"
  assert_substr "report ✅ row for HEDGE_DRY_RUN=unset" "$REPORT3" "✅ \`HEDGE_DRY_RUN\` = \`unset\`"
fi

# Case 4: HEDGE_DRY_RUN typo (`yes`) — must BLOCKER (anything
# other than `true` or `unset` is unsafe per the fence contract).
echo
echo "=== Case 4: HEDGE_DRY_RUN=yes (typo) → RED ==="
ENV4=/tmp/hedge-fence-c4.env
REP4=/tmp/hedge-fence-c4.md
cat > "$ENV4" <<'EOF'
REAL_TRADING_ENABLED=false
ETORO_MODE=mock
HEDGE_DRY_RUN=yes
EOF
OUT4="$(run_smoke_with_env "$ENV4" "$REP4")"
assert_substr "BLOCKER on HEDGE_DRY_RUN=yes" "$OUT4" "BLOCKER: HEDGE_DRY_RUN is yes"

echo
if (( fail == 0 )); then
  echo "ALL $case_n CASES PASS"
  exit 0
else
  echo "ONE OR MORE OF $case_n CASES FAILED"
  exit 1
fi
