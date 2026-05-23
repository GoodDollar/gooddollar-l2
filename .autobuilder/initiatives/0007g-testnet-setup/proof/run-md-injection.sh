#!/usr/bin/env bash
# Lane-7 internal-smoke Markdown injection proof driver
# (task 0007g/0018).
#
# `internal-smoke.sh` substitutes service-controlled bytes (response
# `status` field, status-aggregator `status` field, `Content-Type`
# header) into Markdown table cells without escaping. Three corruption
# surfaces:
#   1. pipe `|` splits cells into extra columns;
#   2. backtick "`" breaks the inline code span;
#   3. newline / CR breaks the row entirely (renders as a fragment).
#
# The fix introduces `escape_md_cell()` near `redact_snippet`,
# applied at every site that substitutes untrusted bytes into a
# table cell. The helper:
#   - escapes `|` -> `\|`        (cell delimiter — the dangerous one)
#   - replaces `` ` `` -> `'`    (downgrade backtick → apostrophe)
#   - drops CR (`\r`)            (avoid CRLF / lone-CR splits)
#   - replaces LF -> ` `         (preserve readability of multi-line)
#
# Cases:
#   1. probe_health pipe in status field
#   2. probe_health backtick in status field
#   3. probe_health newline in status field
#   4. status-aggregator pipe in status field
#   5. regression: `"ok"` renders unchanged

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

PIPE_PORT=49241
BACK_PORT=49242
NL_PORT=49243
AGG_PORT=49244
GREEN_PORT=49245

cleanup() {
  for pid in "${PIPE_PID:-}" "${BACK_PID:-}" "${NL_PID:-}" \
             "${AGG_PID:-}" "${GREEN_PID:-}"; do
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

# Tiny single-status fake servers. Each returns one status string on
# /health so `probe_health` reads the metachar-bearing value into a
# Markdown row.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const status = process.argv[2];
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ status }));
}).listen(port, "127.0.0.1");
' "$PIPE_PORT" 'ok | injected | column' >/tmp/proof-md-inj.pipe.log 2>&1 &
PIPE_PID=$!

node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const status = process.argv[2];
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ status }));
}).listen(port, "127.0.0.1");
' "$BACK_PORT" 'running `uptime`' >/tmp/proof-md-inj.back.log 2>&1 &
BACK_PID=$!

node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const status = process.argv[2];
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ status }));
}).listen(port, "127.0.0.1");
' "$NL_PORT" $'ok\nstale-warning' >/tmp/proof-md-inj.nl.log 2>&1 &
NL_PID=$!

# Status-aggregator returning a metachar-bearing service status. Must
# embed the metachar inside the JSON body that `node` then parses,
# tab-prints, and the bash side reads.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const body = {
  services: [
    { name: "oracle-signer", status: "pipe|in|status" },
    { name: "hedge-engine",  status: "ok" },
  ],
};
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}).listen(port, "127.0.0.1");
' "$AGG_PORT" >/tmp/proof-md-inj.agg.log 2>&1 &
AGG_PID=$!

# Regression baseline: a normal `"ok"` status.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ status: "ok" }));
}).listen(port, "127.0.0.1");
' "$GREEN_PORT" >/tmp/proof-md-inj.green.log 2>&1 &
GREEN_PID=$!

sleep 0.5

# ---- Case 1: pipe in status (probe_health row) ----
echo
echo "=== Case 1: pipe in status field ==="
rm -f /tmp/proof-md-inj-1.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$PIPE_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$GREEN_PORT/status.json" \
REPORT=/tmp/proof-md-inj-1.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
# After fix: row is `| \`price-service\` | ok \| injected \| column | ❌ BLOCKER |`
assert_substr "escaped pipe in status row" \
  /tmp/proof-md-inj-1.md 'ok \| injected \| column' || exit 1
# The price-service row must have exactly 4 unescaped pipe delimiters
# (start + 2 separators + end → 4 chars). Count `|` chars on the row
# minus escaped `\|` occurrences.
row_1=$(grep -F '| `price-service`' /tmp/proof-md-inj-1.md | head -n 1)
escaped_pipes=$(printf '%s' "$row_1" | grep -oE '\\\|' | wc -l)
total_pipes=$(printf '%s' "$row_1" | grep -oE '\|' | wc -l)
unescaped=$(( total_pipes - escaped_pipes ))
echo "row 1 unescaped pipes: $unescaped (expect = 4)"
if (( unescaped != 4 )); then
  echo "FAIL  row 1 cell delimiters wrong"
  echo "row: $row_1"
  exit 1
fi
echo "PASS  row has exactly 3 cells (4 unescaped pipe delimiters)"

# ---- Case 2: backtick in status ----
echo
echo "=== Case 2: backtick in status field ==="
rm -f /tmp/proof-md-inj-2.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$BACK_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$GREEN_PORT/status.json" \
REPORT=/tmp/proof-md-inj-2.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "backtick downgraded to apostrophe in status cell" \
  /tmp/proof-md-inj-2.md "| \`price-service\` | running 'uptime' | ❌ BLOCKER |" || exit 1
# Backticks legitimately remain in BLOCKERS[] (raw value, criterion 6)
# and in `redact_snippet`'s body cell (PRD §3 leaves redact_snippet
# alone). Only the status cell of the price-service row is the
# escape_md_cell surface — assert there.
status_row_2=$(grep -F '| `price-service` |' /tmp/proof-md-inj-2.md | head -n 1)
echo "status row: $status_row_2"
if printf '%s' "$status_row_2" | grep -qE '\| running .*\`.*\| ❌'; then
  echo "FAIL  backtick remains inside the status cell after escape_md_cell"
  exit 1
fi
echo "PASS  no raw backtick inside the price-service status cell"

# ---- Case 3: newline in status ----
echo
echo "=== Case 3: newline in status field ==="
rm -f /tmp/proof-md-inj-3.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$NL_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$GREEN_PORT/status.json" \
REPORT=/tmp/proof-md-inj-3.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "newline collapsed to space" \
  /tmp/proof-md-inj-3.md '| ok stale-warning |' || exit 1
# The price-service row must be a single line.
row_3_count=$(grep -cF '`price-service`' /tmp/proof-md-inj-3.md)
echo "price-service row count: $row_3_count (expect = 1)"
if (( row_3_count != 1 )); then
  echo "FAIL  row split across multiple lines"
  cat /tmp/proof-md-inj-3.md
  exit 1
fi
echo "PASS  row is on a single line"

# ---- Case 4: status-aggregator pipe in status field ----
echo
echo "=== Case 4: pipe in status-aggregator status field ==="
rm -f /tmp/proof-md-inj-4.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$GREEN_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$AGG_PORT/status.json" \
HEALTH_CONTRACT="$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md" \
REPORT=/tmp/proof-md-inj-4.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "escaped pipe in agg row" \
  /tmp/proof-md-inj-4.md 'pipe\|in\|status' || exit 1
agg_row=$(grep -F '| `oracle-signer` |' /tmp/proof-md-inj-4.md | grep -F 'pipe' | head -n 1)
agg_escaped=$(printf '%s' "$agg_row" | grep -oE '\\\|' | wc -l)
agg_total=$(printf '%s' "$agg_row" | grep -oE '\|' | wc -l)
agg_unescaped=$(( agg_total - agg_escaped ))
echo "agg row unescaped pipes: $agg_unescaped (expect = 4)"
if (( agg_unescaped != 4 )); then
  echo "FAIL  agg row cell delimiters wrong"
  echo "row: $agg_row"
  exit 1
fi
echo "PASS  agg row has exactly 3 cells"

# ---- Case 5: regression — `"ok"` renders unchanged ----
echo
echo "=== Case 5: regression — `ok` baseline ==="
rm -f /tmp/proof-md-inj-5.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$GREEN_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:$GREEN_PORT/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:$GREEN_PORT/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:$GREEN_PORT/status.json" \
REPORT=/tmp/proof-md-inj-5.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "ok row unchanged" \
  /tmp/proof-md-inj-5.md '| `price-service` | ok | ✅ OK |' || exit 1

echo
echo "ALL CASES PASS"
