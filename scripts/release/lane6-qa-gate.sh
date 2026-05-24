#!/usr/bin/env bash
# scripts/release/lane6-qa-gate.sh
#
# Lane 6 release gate — runs the full live-prices proof in one shot, halts
# on first failure, and writes a single auditable evidence directory under
# qa-proof/evidence/<run-id>/.
#
# Exit codes (matches docs/release/lane6-qa-gate-checklist.md):
#   0  all steps passed
#   1  a test or runtime check failed
#   2  an environment / setup precondition failed
#
# Usage:
#   ./scripts/release/lane6-qa-gate.sh
#
# Optional env:
#   PORT             frontend smoke port (default 3126)
#   SKIP_FRONTEND=1  skip step 6 (frontend build + smoke)
#   QUIET=1          suppress per-step subprocess output (failure logs still print)

set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"
EVIDENCE="$REPO_ROOT/qa-proof/evidence/$RUN_ID"
mkdir -p "$EVIDENCE"

SUMMARY_PATH="$EVIDENCE/summary.json"
PORT="${PORT:-3126}"

# Each step appends a JSON line `{ name, status, durationMs, evidencePath }`
# to STEPS_JSONL. On exit we render summary.json from it.
STEPS_JSONL="$EVIDENCE/steps.ndjson"
: > "$STEPS_JSONL"

# Tracks the running state so the EXIT trap can render summary.json even
# when set -e bails mid-step.
GATE_STATUS="fail"
FAILED_STEP=""
FAILED_MESSAGE=""

# ── Helpers ──────────────────────────────────────────────────────────────
log() { printf '%s %s\n' "[$(date -u +%H:%M:%S)]" "$*" >&2; }

run_step() {
  # run_step <stepNum> <name> <evidenceSubpath> <cmd…>
  local n="$1"; shift
  local name="$1"; shift
  local sub="$1"; shift
  local cmd=("$@")
  local started ended dur status evidence_path
  evidence_path="$EVIDENCE/$sub"
  mkdir -p "$(dirname "$evidence_path")"
  log "step $n — $name"
  started=$(date +%s%3N)

  set +e
  if [[ "${QUIET:-0}" = "1" ]]; then
    "${cmd[@]}" >"$evidence_path.log" 2>&1
  else
    "${cmd[@]}" 2>&1 | tee "$evidence_path.log"
  fi
  local code=${PIPESTATUS[0]}
  set -e

  ended=$(date +%s%3N)
  dur=$((ended - started))
  if [[ "$code" -eq 0 ]]; then
    status="ok"
  else
    status="fail"
    FAILED_STEP="$n"
    FAILED_MESSAGE="$name (exit $code)"
  fi

  printf '{"step":%s,"name":%s,"status":%s,"durationMs":%s,"evidencePath":%s,"exitCode":%s}\n' \
    "$n" \
    "$(printf '%s' "$name" | jq -Rs .)" \
    "$(printf '%s' "$status" | jq -Rs .)" \
    "$dur" \
    "$(printf '%s' "$evidence_path.log" | jq -Rs .)" \
    "$code" >> "$STEPS_JSONL"

  if [[ "$code" -ne 0 ]]; then
    return 1
  fi
}

render_summary() {
  # Render the running NDJSON into a JSON summary file.
  local steps
  steps="$(jq -s '.' "$STEPS_JSONL")"
  jq -n \
    --arg runId "$RUN_ID" \
    --arg status "$GATE_STATUS" \
    --arg failedStep "$FAILED_STEP" \
    --arg failedMessage "$FAILED_MESSAGE" \
    --arg evidence "$EVIDENCE" \
    --argjson steps "$steps" \
    '{
      runId: $runId,
      status: $status,
      failedStep: (if $failedStep == "" then null else ($failedStep | tonumber) end),
      failedMessage: (if $failedMessage == "" then null else $failedMessage end),
      evidence: $evidence,
      steps: $steps
    }' > "$SUMMARY_PATH"
}

cleanup() {
  # Render summary, regardless of how we exit. Don't mask the real exit.
  local code=$?
  if [[ "$code" -eq 0 ]]; then
    GATE_STATUS="ok"
  fi
  render_summary || true
  if [[ "$GATE_STATUS" = "ok" ]]; then
    echo "OK lane6-qa-gate passed (run-id=$RUN_ID, evidence=$EVIDENCE)"
  else
    echo "FAIL lane6-qa-gate at step ${FAILED_STEP:-?}: ${FAILED_MESSAGE:-unknown}"
    echo "    evidence: $EVIDENCE"
  fi
  return $code
}
trap cleanup EXIT

# ── Step 1 — safety constant ─────────────────────────────────────────────
build_etoro_client() {
  (cd "$REPO_ROOT/backend/etoro-client" && npm run build)
}
check_real_trading_constant() {
  node -e '
    const m = require("./backend/etoro-client/dist/safety");
    if (m.REAL_TRADING_ENABLED !== false) {
      console.error("REAL_TRADING_ENABLED is " + m.REAL_TRADING_ENABLED + " (expected false)");
      process.exit(1);
    }
    console.log("REAL_TRADING_ENABLED === false (safety fence intact)");
  '
}

# ── Step 2/3 — backend unit tests ───────────────────────────────────────
test_etoro_client() {
  (cd "$REPO_ROOT/backend/etoro-client" && npm test --silent)
}
test_hedge_engine() {
  (cd "$REPO_ROOT/backend/hedge-engine" && npm test --silent)
}

# ── Step 4 — qa-harness integration ─────────────────────────────────────
qa_gate_harness() {
  (cd "$REPO_ROOT/backend/qa-harness" && npm run qa:gate --silent)
  # Copy harness evidence into our run dir.
  if [[ -d "$REPO_ROOT/qa-proof/evidence" ]]; then
    rsync -a --exclude="$RUN_ID" "$REPO_ROOT/qa-proof/evidence/" "$EVIDENCE/qa-harness/" 2>/dev/null || \
      cp -r "$REPO_ROOT/qa-proof/evidence/" "$EVIDENCE/qa-harness/" 2>/dev/null || true
  fi
}

# ── Step 5 — demo hedge dry-run ─────────────────────────────────────────
hedge_dry_run() {
  (cd "$REPO_ROOT/backend/hedge-engine" && npm run hedge:demo --silent -- --dry-run --symbol AAPL)
  if [[ -f "$REPO_ROOT/qa-proof/hedges/latest.json" ]]; then
    cp "$REPO_ROOT/qa-proof/hedges/latest.json" "$EVIDENCE/hedge-proof.json"
  else
    echo "expected qa-proof/hedges/latest.json not found"
    return 1
  fi
}

# ── Step 6 — frontend build + /live-prices-proof smoke ──────────────────
frontend_smoke() {
  if [[ "${SKIP_FRONTEND:-0}" = "1" ]]; then
    echo "SKIP_FRONTEND=1 — skipping frontend smoke"
    return 0
  fi
  (cd "$REPO_ROOT/frontend" && npm run build --silent)

  # Start next start in the background, kill on exit.
  local server_pid
  ( cd "$REPO_ROOT/frontend" && PORT="$PORT" npm run start --silent ) &
  server_pid=$!
  trap "kill $server_pid 2>/dev/null || true" RETURN

  # Wait up to 60s for the server to come up.
  local i
  for i in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  curl -fsS "http://127.0.0.1:${PORT}/live-prices-proof" -o "$EVIDENCE/proof-page.html"
  grep -q "Live Prices Proof" "$EVIDENCE/proof-page.html"
  grep -q "REAL_TRADING_ENABLED" "$EVIDENCE/proof-page.html"
}

# ── Pre-flight ───────────────────────────────────────────────────────────
preflight() {
  for bin in node npm jq curl rsync; do
    if ! command -v "$bin" >/dev/null 2>&1; then
      echo "preflight: required binary '$bin' is not on PATH" >&2
      exit 2
    fi
  done
}

preflight

# ── Run sequence ─────────────────────────────────────────────────────────
run_step 0 "preflight build etoro-client"          "00-build-etoro-client" build_etoro_client
run_step 1 "safety constant — REAL_TRADING_ENABLED" "01-safety-constant"     check_real_trading_constant
run_step 2 "etoro-client jest"                      "02-etoro-client-tests"  test_etoro_client
run_step 3 "hedge-engine jest"                      "03-hedge-engine-tests"  test_hedge_engine
run_step 4 "qa-harness integration"                 "04-qa-harness"          qa_gate_harness
run_step 5 "hedge demo dry-run + proof"             "05-hedge-demo"          hedge_dry_run
run_step 6 "frontend build + /live-prices-proof"    "06-frontend-smoke"      frontend_smoke

GATE_STATUS="ok"
