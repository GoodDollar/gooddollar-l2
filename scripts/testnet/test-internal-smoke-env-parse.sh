#!/usr/bin/env bash
# Unit harness for lib/load-lane7-env.sh (task 0007g/0027).
#
# Asserts the `.env` parser normalizes whitespace on both key and
# value before the safety-fence allowlist match, so a stray leading
# space / tab / trailing whitespace on REAL_TRADING_ENABLED does
# NOT silently bypass the fence (the original bug — false GREEN on
# an actually-enabled real-trading toggle).
#
# Each case writes a one-line `.env` fixture to /tmp, sources the
# loader with that fixture, and asserts the resulting ENV_PRESENCE
# / WARNINGS shape. No HTTP probes, no smoke run — pure parser
# behavior.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOADER="$REPO_ROOT/scripts/testnet/lib/load-lane7-env.sh"

fail=0
case_n=0

# Run the loader in a clean sub-bash so each case starts from a
# pristine ENV_PRESENCE / WARNINGS / shell env. Echo `KEY=val` lines
# we want to inspect; the harness greps stdout.
load_and_dump() {
  local envfile="$1"
  env -i HOME="$HOME" PATH="$PATH" bash -c "
    set -u
    declare -a WARNINGS=()
    declare -A ENV_PRESENCE=()
    LANE7_ENV_FILE='$envfile'
    . '$LOADER'
    printf 'PRESENCE_RTE=%s\n' \"\${ENV_PRESENCE[REAL_TRADING_ENABLED]:-MISSING}\"
    printf 'PRESENCE_MODE=%s\n' \"\${ENV_PRESENCE[ETORO_MODE]:-MISSING}\"
    printf 'PRESENCE_HDR=%s\n' \"\${ENV_PRESENCE[HEDGE_DRY_RUN]:-MISSING}\"
    printf 'SHELL_HDR=%s\n' \"\${HEDGE_DRY_RUN:-MISSING}\"
    for w in \"\${WARNINGS[@]}\"; do printf 'WARN=%s\n' \"\$w\"; done
  "
}

assert_eq() {
  local label="$1" want="$2" got="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$want" == "$got" ]]; then
    echo "PASS  [$case_n] $label  ($got)"
  else
    echo "FAIL  [$case_n] $label  — want='$want' got='$got'"
    fail=1
  fi
}

assert_substr() {
  local label="$1" haystack="$2" needle="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "PASS  [$case_n] $label  (matched '$needle')"
  else
    echo "FAIL  [$case_n] $label  — '$needle' not in:"
    printf '%s\n' "$haystack" | sed 's/^/    /'
    fail=1
  fi
}

refute_substr() {
  local label="$1" haystack="$2" needle="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "FAIL  [$case_n] $label  — forbidden '$needle' present:"
    printf '%s\n' "$haystack" | sed 's/^/    /'
    fail=1
  else
    echo "PASS  [$case_n] $label  (no '$needle')"
  fi
}

extract() {
  local out="$1" key="$2"
  printf '%s\n' "$out" | awk -F= -v k="$key" '$1==k { sub(/^[^=]*=/, ""); print; exit }'
}

# Case 1: leading-space key ` REAL_TRADING_ENABLED=true` MUST land
#         in ENV_PRESENCE[]=true (the safety-critical false-GREEN
#         bypass — original 0027 bug).
echo
echo "=== Case 1: leading-space key ==="
F1=/tmp/env-parse-c1.env
printf ' REAL_TRADING_ENABLED=true\nETORO_MODE=demo-readonly\n' > "$F1"
OUT="$(load_and_dump "$F1")"
assert_eq "leading-space key trimmed" "PRESENCE_RTE=true" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"
assert_eq "mode unaffected" "PRESENCE_MODE=demo-readonly" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_MODE=')"

# Case 2: tab-prefixed key.
echo
echo "=== Case 2: tab-prefixed key ==="
F2=/tmp/env-parse-c2.env
printf '\tREAL_TRADING_ENABLED=true\n' > "$F2"
OUT="$(load_and_dump "$F2")"
assert_eq "tab-prefixed key trimmed" "PRESENCE_RTE=true" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"

# Case 3: trailing whitespace before `=` (`REAL_TRADING_ENABLED =true`).
echo
echo "=== Case 3: trailing whitespace before = ==="
F3=/tmp/env-parse-c3.env
printf 'REAL_TRADING_ENABLED =true\n' > "$F3"
OUT="$(load_and_dump "$F3")"
assert_eq "trailing-WS-before-= key trimmed" "PRESENCE_RTE=true" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"

# Case 4: leading-whitespace value (`REAL_TRADING_ENABLED= true`).
# Trimmed → 'true' → safety fence consumer sees same value as raw 'true'.
echo
echo "=== Case 4: leading-WS value ==="
F4=/tmp/env-parse-c4.env
printf 'REAL_TRADING_ENABLED= true\n' > "$F4"
OUT="$(load_and_dump "$F4")"
assert_eq "leading-WS value trimmed" "PRESENCE_RTE=true" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"

# Case 5: trailing-whitespace value (`REAL_TRADING_ENABLED=true `).
echo
echo "=== Case 5: trailing-WS value ==="
F5=/tmp/env-parse-c5.env
printf 'REAL_TRADING_ENABLED=true \n' > "$F5"
OUT="$(load_and_dump "$F5")"
assert_eq "trailing-WS value trimmed" "PRESENCE_RTE=true" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"

# Case 6: embedded-whitespace key (`REAL_TRADING ENABLED=true`).
# Must NOT silently fall through (the typo-fall-through bug). The
# loader emits a per-line WARN naming the bad key, drops it, and
# the fence-presence path stays at default 'unset'.
echo
echo "=== Case 6: embedded-WS key ==="
F6=/tmp/env-parse-c6.env
printf 'REAL_TRADING ENABLED=true\nETORO_MODE=mock\n' > "$F6"
OUT="$(load_and_dump "$F6")"
assert_eq "embedded-WS key not stored" "PRESENCE_RTE=MISSING" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"
assert_substr "WARN names the bad key" "$OUT" "WARN=.env key contains whitespace"
assert_eq "valid key still parsed" "PRESENCE_MODE=mock" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_MODE=')"

# Case 7: regression — CRLF .env (task 0012 contract). The loader
# must still strip the trailing CR and still emit the CRLF advisory
# WARN. Build the fixture with explicit \r\n bytes.
echo
echo "=== Case 7: CRLF regression (task 0012) ==="
F7=/tmp/env-parse-c7.env
printf 'REAL_TRADING_ENABLED=false\r\nETORO_MODE=demo-readonly\r\n' > "$F7"
OUT="$(load_and_dump "$F7")"
assert_eq "CRLF value CR-stripped" "PRESENCE_RTE=false" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"
assert_eq "CRLF mode CR-stripped" "PRESENCE_MODE=demo-readonly" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_MODE=')"
assert_substr "CRLF advisory WARN" "$OUT" "WARN=$F7 has CRLF line endings"

# Case 8: regression — quote-strip (task 0012 contract). Outer
# quotes on the value still come off after the new whitespace trim.
echo
echo "=== Case 8: quote-strip regression ==="
F8=/tmp/env-parse-c8.env
printf 'REAL_TRADING_ENABLED="false"\nETORO_MODE='\''mock'\''\n' > "$F8"
OUT="$(load_and_dump "$F8")"
assert_eq "double-quoted value unquoted" "PRESENCE_RTE=false" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"
assert_eq "single-quoted value unquoted" "PRESENCE_MODE=mock" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_MODE=')"

# Case 9: regression — comment lines and blank lines are still
# skipped after the whitespace trim. A leading `# ` comment line
# is still classified as a comment.
echo
echo "=== Case 9: comment + blank lines ==="
F9=/tmp/env-parse-c9.env
printf '# header comment\n\nREAL_TRADING_ENABLED=false\n  # indented comment\n\nETORO_MODE=mock\n' > "$F9"
OUT="$(load_and_dump "$F9")"
assert_eq "RTE parsed past comments" "PRESENCE_RTE=false" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_RTE=')"
assert_eq "MODE parsed past comments" "PRESENCE_MODE=mock" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_MODE=')"
refute_substr "no spurious WARN on comment lines" "$OUT" "key contains whitespace"
refute_substr "no spurious WARN on indented comment" "$OUT" "ignored (not in lane-7 allowlist"

# Case 10: HEDGE_DRY_RUN as third fence key (task 0031). Lands in
# ENV_PRESENCE[] symmetric with REAL_TRADING_ENABLED / ETORO_MODE
# and MUST NOT be exported into the shell (the safety contract:
# fence keys never propagate to child processes the smoke spawns).
echo
echo "=== Case 10: HEDGE_DRY_RUN presence-only ==="
F10=/tmp/env-parse-c10.env
printf 'HEDGE_DRY_RUN=false\n' > "$F10"
OUT="$(load_and_dump "$F10")"
assert_eq "HEDGE_DRY_RUN landed in ENV_PRESENCE" "PRESENCE_HDR=false" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_HDR=')"
assert_eq "HEDGE_DRY_RUN NOT exported to shell" "SHELL_HDR=MISSING" "$(printf '%s\n' "$OUT" | grep '^SHELL_HDR=')"
refute_substr "no unknown-key WARN for HEDGE_DRY_RUN" "$OUT" "HEDGE_DRY_RUN"

# Case 11: HEDGE_DRY_RUN=true (the safe state) — symmetric.
echo
echo "=== Case 11: HEDGE_DRY_RUN=true ==="
F11=/tmp/env-parse-c11.env
printf 'HEDGE_DRY_RUN=true\n' > "$F11"
OUT="$(load_and_dump "$F11")"
assert_eq "HEDGE_DRY_RUN=true landed" "PRESENCE_HDR=true" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_HDR=')"

# Case 12: omitted HEDGE_DRY_RUN — presence stays MISSING (safe
# default; smoke treats absence as ✅ since hedge-engine defaults
# to dry-run).
echo
echo "=== Case 12: HEDGE_DRY_RUN omitted ==="
F12=/tmp/env-parse-c12.env
printf 'REAL_TRADING_ENABLED=false\n' > "$F12"
OUT="$(load_and_dump "$F12")"
assert_eq "HEDGE_DRY_RUN stays MISSING when omitted" "PRESENCE_HDR=MISSING" "$(printf '%s\n' "$OUT" | grep '^PRESENCE_HDR=')"

echo
if (( fail == 0 )); then
  echo "ALL $case_n CASES PASS"
  exit 0
else
  echo "ONE OR MORE OF $case_n CASES FAILED"
  exit 1
fi
