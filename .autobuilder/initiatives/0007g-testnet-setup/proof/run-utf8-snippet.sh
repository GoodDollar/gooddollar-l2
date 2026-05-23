#!/usr/bin/env bash
# Lane-7 internal-smoke UTF-8 snippet truncation proof driver
# (task 0007g/0020).
#
# `redact_snippet` ends in `head -c 80` — byte truncation. UTF-8
# encodes non-ASCII codepoints as 2–4 bytes; cutting at byte 80 in the
# middle of a multi-byte sequence produces invalid UTF-8 that renders
# as `�` (U+FFFD) and flips `file -i` from `charset=utf-8` to
# `charset=binary` for the committed smoke report.
#
# Fix: replace `head -c 80` with a `node -e` snippet that uses
# `Array.from(str).slice(0, 80).join("")` — codepoint-aware,
# always-valid UTF-8 output. Node is already on the preflight tool
# list; no new dependency.
#
# Cases:
#   1. emoji body (UTF-8 4-byte codepoints) → no `�`, file stays UTF-8.
#   2. accented Latin body → no `�`.
#   3. Mandarin body → no `�`.
#   4. ASCII regression — snippet length stays exactly 80 chars.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

EMOJI_PORT=49321
LATIN_PORT=49322
CJK_PORT=49323
ASCII_PORT=49324

cleanup() {
  for pid in "${EMOJI_PID:-}" "${LATIN_PID:-}" "${CJK_PID:-}" \
             "${ASCII_PID:-}"; do
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

# Each fixture returns HTTP 500 with a body crafted to push the
# snippet truncation past byte 80, where the cut would land mid-
# codepoint. The `add_diag_row` path fires on non-2xx, so the
# diag row's `body[:80]=` cell exercises `redact_snippet`.
node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const body = "fail👋💥🚀".repeat(20);
http.createServer((_, res) => {
  res.writeHead(500, { "content-type": "text/plain" });
  res.end(JSON.stringify({ status: body }));
}).listen(port, "127.0.0.1");
' "$EMOJI_PORT" >/tmp/proof-utf8.emoji.log 2>&1 &
EMOJI_PID=$!

node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const body = "café — naïve échangé ".repeat(10);
http.createServer((_, res) => {
  res.writeHead(500, { "content-type": "text/plain" });
  res.end(JSON.stringify({ status: body }));
}).listen(port, "127.0.0.1");
' "$LATIN_PORT" >/tmp/proof-utf8.latin.log 2>&1 &
LATIN_PID=$!

node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const body = "状态：失败 信号 时间 异常 ".repeat(10);
http.createServer((_, res) => {
  res.writeHead(500, { "content-type": "text/plain" });
  res.end(JSON.stringify({ status: body }));
}).listen(port, "127.0.0.1");
' "$CJK_PORT" >/tmp/proof-utf8.cjk.log 2>&1 &
CJK_PID=$!

node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
// Spaced ASCII so redact_snippets 20+ char alphanumeric rule
// doesnt fire and collapse the whole body to [REDACTED-token].
const body = "OK ".repeat(80);
http.createServer((_, res) => {
  res.writeHead(500, { "content-type": "text/plain" });
  res.end(JSON.stringify({ status: body }));
}).listen(port, "127.0.0.1");
' "$ASCII_PORT" >/tmp/proof-utf8.ascii.log 2>&1 &
ASCII_PID=$!

sleep 0.5

run_case() {
  local label="$1" port="$2" report="$3"
  echo
  echo "=== $label ==="
  rm -f "$report"
  LANE7_BASE="http://localhost" \
  PRICE_SERVICE_URL="http://127.0.0.1:$port/health" \
  ORACLE_SIGNER_URL="http://127.0.0.1:$port/health" \
  HEDGE_ENGINE_URL="http://127.0.0.1:$port/health" \
  STATUS_AGGREGATOR_URL="http://127.0.0.1:$port/status.json" \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>&1
  echo "exit: $?"
}

# Case 1: emoji body.
run_case "Case 1: emoji body (4-byte codepoints)" \
  "$EMOJI_PORT" /tmp/proof-utf8-1.md
# `iconv -f utf-8 -t utf-8` validates UTF-8.
if ! iconv -f utf-8 -t utf-8 /tmp/proof-utf8-1.md >/dev/null 2>&1; then
  echo "FAIL  emoji report is not valid UTF-8"
  exit 1
fi
echo "PASS  emoji report is valid UTF-8"
if file -i /tmp/proof-utf8-1.md | grep -qE 'charset=binary'; then
  echo "FAIL  emoji report flagged as binary by file(1)"
  file -i /tmp/proof-utf8-1.md
  exit 1
fi
echo "PASS  emoji report charset=utf-8"
# Search for the U+FFFD replacement character (0xEF 0xBF 0xBD).
if grep -aF $'\xEF\xBF\xBD' /tmp/proof-utf8-1.md >/dev/null 2>&1; then
  echo "FAIL  emoji report contains U+FFFD replacement char"
  exit 1
fi
echo "PASS  no U+FFFD in emoji report"

# Case 2: accented Latin body.
run_case "Case 2: accented Latin body" \
  "$LATIN_PORT" /tmp/proof-utf8-2.md
iconv -f utf-8 -t utf-8 /tmp/proof-utf8-2.md >/dev/null 2>&1 \
  || { echo "FAIL  Latin report invalid UTF-8"; exit 1; }
echo "PASS  Latin report is valid UTF-8"
if file -i /tmp/proof-utf8-2.md | grep -qE 'charset=binary'; then
  echo "FAIL  Latin report flagged as binary"
  exit 1
fi
echo "PASS  Latin report charset=utf-8"
if grep -aF $'\xEF\xBF\xBD' /tmp/proof-utf8-2.md >/dev/null 2>&1; then
  echo "FAIL  Latin report contains U+FFFD"
  exit 1
fi
echo "PASS  no U+FFFD in Latin report"

# Case 3: Mandarin body.
run_case "Case 3: Mandarin body" \
  "$CJK_PORT" /tmp/proof-utf8-3.md
iconv -f utf-8 -t utf-8 /tmp/proof-utf8-3.md >/dev/null 2>&1 \
  || { echo "FAIL  Mandarin report invalid UTF-8"; exit 1; }
echo "PASS  Mandarin report is valid UTF-8"
if file -i /tmp/proof-utf8-3.md | grep -qE 'charset=binary'; then
  echo "FAIL  Mandarin report flagged as binary"
  exit 1
fi
echo "PASS  Mandarin report charset=utf-8"
if grep -aF $'\xEF\xBF\xBD' /tmp/proof-utf8-3.md >/dev/null 2>&1; then
  echo "FAIL  Mandarin report contains U+FFFD"
  exit 1
fi
echo "PASS  no U+FFFD in Mandarin report"

# Case 4: ASCII regression — body[:80]= cell still hits the 80-char
# cap on ASCII content (no over-trim, no under-trim).
run_case "Case 4: ASCII regression — exactly 80 chars" \
  "$ASCII_PORT" /tmp/proof-utf8-4.md
iconv -f utf-8 -t utf-8 /tmp/proof-utf8-4.md >/dev/null 2>&1 \
  || { echo "FAIL  ASCII report invalid UTF-8"; exit 1; }
echo "PASS  ASCII report is valid UTF-8"
# Extract the body[:80]= snippet content from the diag row.
# Format: ...| body[:80]=`<content>` |
ascii_diag_line=$(grep -F 'body[:80]=' /tmp/proof-utf8-4.md | head -n 1)
echo "ascii diag line: $ascii_diag_line"
# Extract content between body[:80]=` and ` | at end.
ascii_body=$(printf '%s' "$ascii_diag_line" | sed -n 's/.*body\[:80\]=`\(.*\)` |.*/\1/p')
ascii_len=${#ascii_body}
echo "ascii snippet length: $ascii_len (expect = 80)"
if (( ascii_len != 80 )); then
  echo "FAIL  ASCII snippet length wrong"
  exit 1
fi
echo "PASS  ASCII snippet is exactly 80 chars"

echo
echo "ALL CASES PASS"
