#!/usr/bin/env bash
# Lane-7 internal-smoke .env Markdown-injection proof driver
# (task 0007g/0025).
#
# The real-trading fence section substituted `.env`-sourced
# REAL_TRADING_ENABLED and ETORO_MODE values verbatim into
# `` `…` `` inline-code spans in summary lines. Operator-controlled
# bytes (backticks, pipes, CR/LF — common in copy-paste from Slack
# or 1Password) broke the inline code span, scrambling the safety-
# critical fence section of the report exactly when reviewers
# stare hardest.
#
# Task 0018 established `escape_md_cell` as the single Markdown-
# escape stop and explicitly scoped out this surface for a later
# task. This driver verifies the post-0018 retrofit:
#   - $rte and $mode route through escape_md_cell for the four
#     add_summary substitutions
#   - BLOCKERS[] (terminal echo) and the case-match allowlist
#     continue to use the RAW value
#
# Cases:
#   A. backtick in REAL_TRADING_ENABLED  → fence line has no
#      embedded backticks (downgraded to apostrophes); count
#      of backticks per fence line is exactly 4
#   B. pipe in ETORO_MODE                → fires the allowlist
#      BLOCKER (case-match uses raw value) AND the inline code
#      span contains an escaped \| (no broken cell)
#   C. mid-value CR                      → no stray CR in the
#      rendered report

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"
FIXTURES="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/env-fixtures"

GREEN_PORT=49831

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

node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-env-md-inj.green.log 2>&1 &
GREEN_PID=$!
sleep 0.4

run_smoke() {
  local envfile="$1" report="$2"
  PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  LANE7_ENV_FILE="$envfile" \
  REPORT="$report" \
    "$SMOKE" >/tmp/proof-env-md-inj.console 2>&1
  rc=$?
}

# ---- Case A: backtick in REAL_TRADING_ENABLED ----
echo
echo "=== Case A: backtick in REAL_TRADING_ENABLED ==="
run_smoke "$FIXTURES/lane7-md-injection-backtick.env" /tmp/proof-env-md-inj-A.md
echo "exit: $rc"

fence_line=$(grep -E '^[✅❌] `REAL_TRADING_ENABLED`' /tmp/proof-env-md-inj-A.md | head -n 1)
if [[ -z "$fence_line" ]]; then
  echo "FAIL  Case A — no REAL_TRADING_ENABLED fence line in report"
  cat /tmp/proof-env-md-inj-A.md
  exit 1
fi
echo "fence line: $fence_line"
backtick_count=$(printf '%s' "$fence_line" | tr -cd '`' | wc -c)
echo "backtick count on fence line: $backtick_count (expect = 4)"
if (( backtick_count != 4 )); then
  echo "FAIL  fence line has $backtick_count backticks — embedded backticks broke the code span"
  exit 1
fi
echo "PASS  fence line has exactly 4 backticks (2 around key + 2 around value)"
# The downgrade is `\`` -> `'`. Embedded backticks in the value should
# render as apostrophes inside the code span.
if ! printf '%s' "$fence_line" | grep -qF "foo'echo PWN'bar"; then
  echo "FAIL  embedded backticks were not downgraded to apostrophes"
  exit 1
fi
echo "PASS  embedded backticks downgraded to apostrophes"
# BLOCKERS[] console echo must keep the RAW value (raw bytes faithful).
assert_substr "raw value preserved in BLOCKERS[] console echo" \
  /tmp/proof-env-md-inj.console "REAL_TRADING_ENABLED is foo\`echo PWN\`bar" || exit 1
# The fence value is also not in the allowlist, so it should fire a
# BLOCKER (exit 1).
if (( rc != 1 )); then
  echo "FAIL  Case A expected exit 1 (BLOCKER), got $rc"
  exit 1
fi
echo "PASS  exit 1 (fence BLOCKER fired)"

# ---- Case B: pipe in ETORO_MODE ----
echo
echo "=== Case B: pipe in ETORO_MODE ==="
run_smoke "$FIXTURES/lane7-md-injection-pipe.env" /tmp/proof-env-md-inj-B.md
echo "exit: $rc"

mode_line=$(grep -E '^[✅❌] `ETORO_MODE`' /tmp/proof-env-md-inj-B.md | head -n 1)
if [[ -z "$mode_line" ]]; then
  echo "FAIL  Case B — no ETORO_MODE fence line in report"
  cat /tmp/proof-env-md-inj-B.md
  exit 1
fi
echo "mode line: $mode_line"
# Allowlist match uses RAW value — `demo|readonly` is not in the list
# so the * branch fires the BLOCKER.
if (( rc != 1 )); then
  echo "FAIL  Case B expected exit 1 (allowlist BLOCKER), got $rc"
  exit 1
fi
echo "PASS  exit 1 (allowlist BLOCKER fired on raw \`demo|readonly\`)"
# Inline code span should contain escaped \| (escape_md_cell output).
if ! printf '%s' "$mode_line" | grep -qE 'demo\\\|readonly'; then
  echo "FAIL  ETORO_MODE value not pipe-escaped (\\|) inside code span"
  exit 1
fi
echo "PASS  pipe escaped as \\| inside inline code span"
# BLOCKERS[] keeps the raw value.
assert_substr "raw pipe preserved in BLOCKERS[] console echo" \
  /tmp/proof-env-md-inj.console "ETORO_MODE is demo|readonly" || exit 1

# ---- Case C: mid-value CR ----
echo
echo "=== Case C: mid-value CR in REAL_TRADING_ENABLED ==="
run_smoke "$FIXTURES/lane7-md-injection-crlf.env" /tmp/proof-env-md-inj-C.md
echo "exit: $rc"

# escape_md_cell drops CR — but the .env parser's earlier `${val%$'\r'}`
# only strips trailing CR (task 0012). For `true\rfalse`, the trailing
# strip is a no-op (no trailing CR) so the value is `true<CR>false`.
# escape_md_cell strips that CR for the markdown render.
fence_line=$(grep -E '^[✅❌] `REAL_TRADING_ENABLED`' /tmp/proof-env-md-inj-C.md | head -n 1)
echo "fence line: $fence_line"
if [[ -z "$fence_line" ]]; then
  echo "FAIL  Case C — no REAL_TRADING_ENABLED fence line"
  cat /tmp/proof-env-md-inj-C.md
  exit 1
fi
if LC_ALL=C printf '%s' "$fence_line" | grep -q $'\r'; then
  echo "FAIL  Case C fence line still contains a CR (0x0d)"
  printf '%s' "$fence_line" | od -c | head -3
  exit 1
fi
echo "PASS  no CR (0x0d) in fence line"
# The full report should also be CR-free in the fence section
# (rest of the report may carry CR from operator-rendered tables —
# but the fence summary lines should be clean).

# ---- Case D: regression — clean .env still renders identically ----
echo
echo "=== Case D: regression — clean LF .env ==="
run_smoke "$FIXTURES/lf-safe.env" /tmp/proof-env-md-inj-D.md
echo "exit: $rc"
if (( rc != 0 )); then
  echo "FAIL  Case D expected exit 0 (no BLOCKERs), got $rc"
  cat /tmp/proof-env-md-inj-D.md
  exit 1
fi
assert_substr "fence intact line unchanged" \
  /tmp/proof-env-md-inj-D.md "REAL_TRADING_ENABLED\` = \`false\` (fence intact)" || exit 1
assert_substr "allowlist line unchanged" \
  /tmp/proof-env-md-inj-D.md "ETORO_MODE\` = \`demo-readonly\` (within lane-7 allowlist)" || exit 1

echo
echo "ALL CASES PASS"
