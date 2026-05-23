#!/usr/bin/env bash
# Lane-7 internal-smoke backtick-in-diag-row proof driver
# (task 0007g/0021).
#
# `add_diag_row` substitutes `redact_snippet "$HTTP_BODY"` directly
# inside a Markdown inline code span (`body[:80]=\`<snippet>\``).
# `redact_snippet` strips CR/LF, downgrades pipes to underscores,
# redacts long tokens, and codepoint-truncates to 80 chars — but it
# does NOT escape backticks. A body that contains backticks (common
# in error messages that quote identifiers / file paths / code)
# silently splits the inline code span into "code" + "prose" +
# "code" fragments in GFM, making the most failure-diagnostic cell
# in the report read as italic / bold prose at 3 AM.
#
# Fix (task 0021 Variant B): wrap the redact_snippet output in
# `escape_md_cell` at the callsite. `escape_md_cell` already
# downgrades backticks (` -> '), escapes pipes (\|), drops CR, and
# turns LF -> space — exactly the chars that break the cell.
#
# Cases:
#   1. body containing 3 backticks → snippet cell must contain
#      ZERO literal backticks (only the 2 wrappers around it on
#      the row).
#   2. backtick-free regression — snippet survives unchanged
#      (no double-escaping, no truncation regression).

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

BT_PORT=49401
PLAIN_PORT=49402

cleanup() {
  for pid in "${BT_PID:-}" "${PLAIN_PID:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    [[ -n "$pid" ]] && wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

# Fake price-service returning HTTP 500 with a JSON body whose
# `error` string contains three literal backticks. The smoke's
# non-2xx path triggers add_diag_row, which is the surface under
# test. Body is short so 80-char truncation never trims a backtick.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const body = JSON.stringify({
  error: "oops `connection refused` see `docs/runbook.md`",
});
http.createServer((_, res) => {
  res.writeHead(500, { "content-type": "application/json" });
  res.end(body);
}).listen(port, "127.0.0.1");
' "$BT_PORT" >/tmp/proof-backtick.bt.log 2>&1 &
BT_PID=$!

# Backtick-free regression — exercises the same diag-row path but
# without any escapable characters.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
http.createServer((_, res) => {
  res.writeHead(500, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "plain old failure no metachars" }));
}).listen(port, "127.0.0.1");
' "$PLAIN_PORT" >/tmp/proof-backtick.plain.log 2>&1 &
PLAIN_PID=$!

sleep 0.5

# ---- Case 1: backtick body ----
echo "=== Case 1: backtick in body ==="
rm -f /tmp/proof-backtick-1.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$BT_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:49911/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:49911/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:49911/status.json" \
REPORT=/tmp/proof-backtick-1.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"

diag_line=$(grep -F 'body[:80]=' /tmp/proof-backtick-1.md | head -n 1)
if [[ -z "$diag_line" ]]; then
  echo "FAIL  no body[:80]= diag row in report"
  cat /tmp/proof-backtick-1.md
  exit 1
fi
echo "diag line: $diag_line"

# Backtick count on the whole row should be exactly 2 — the two
# wrappers around the snippet payload. The unpatched script would
# pass through the three body backticks for a total of 5.
backtick_count=$(printf '%s' "$diag_line" | tr -cd '`' | wc -c)
echo "backtick count on diag row: $backtick_count (expect = 2)"
if (( backtick_count != 2 )); then
  echo "FAIL  diag row contains $backtick_count backticks — embedded backticks broke the inline code span"
  exit 1
fi
echo "PASS  diag row has exactly two wrapper backticks"

# Sanity: the redaction downgrade is `\`` -> `'`. The body should
# now show apostrophes where the backticks were.
if ! grep -qF "'connection refused'" /tmp/proof-backtick-1.md; then
  echo "FAIL  backtick was not downgraded to apostrophe in the snippet"
  exit 1
fi
echo "PASS  backtick downgraded to apostrophe in snippet payload"

# ---- Case 2: backtick-free regression ----
echo
echo "=== Case 2: backtick-free regression ==="
rm -f /tmp/proof-backtick-2.md
LANE7_BASE="http://localhost" \
PRICE_SERVICE_URL="http://127.0.0.1:$PLAIN_PORT/health" \
ORACLE_SIGNER_URL="http://127.0.0.1:49911/health" \
HEDGE_ENGINE_URL="http://127.0.0.1:49911/health" \
STATUS_AGGREGATOR_URL="http://127.0.0.1:49911/status.json" \
REPORT=/tmp/proof-backtick-2.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"

plain_line=$(grep -F 'body[:80]=' /tmp/proof-backtick-2.md | head -n 1)
echo "plain diag line: $plain_line"
plain_count=$(printf '%s' "$plain_line" | tr -cd '`' | wc -c)
echo "backtick count on plain diag row: $plain_count (expect = 2)"
if (( plain_count != 2 )); then
  echo "FAIL  plain regression: expected 2 wrapper backticks, got $plain_count"
  exit 1
fi
if ! grep -qF "plain old failure no metachars" /tmp/proof-backtick-2.md; then
  echo "FAIL  plain regression: snippet payload missing or mutated"
  exit 1
fi
echo "PASS  backtick-free body renders unchanged"

# ---- Case 3: ensure no other redact_snippet callsite was added ----
echo
echo "=== Case 3: redact_snippet remains single-callsite ==="
# Count actual invocations only — `redact_snippet "` (calls) and
# `redact_snippet()` (definition). Comments mentioning the helper
# by name are fine and don't count.
def_count=$(grep -cE 'redact_snippet\(\)' "$SMOKE")
call_count=$(grep -cE 'redact_snippet "' "$SMOKE")
echo "redact_snippet definitions: $def_count (expect = 1)"
echo "redact_snippet callsites:   $call_count (expect = 1)"
if (( def_count != 1 || call_count != 1 )); then
  echo "FAIL  unexpected redact_snippet definition/callsite count"
  grep -nE 'redact_snippet[ "(]' "$SMOKE"
  exit 1
fi
echo "PASS  redact_snippet still has one definition + one callsite"

echo
echo "ALL CASES PASS"
