#!/usr/bin/env bash
# Unit harness for redact_url_secrets() in scripts/testnet/internal-smoke.sh
# (task 0007g/0028).
#
# Each case asserts the helper output character-by-character against an
# expected string. The helper definition is small and hoisted, so we
# extract it with awk rather than sourcing the whole 1k-line smoke
# script (which would execute the preflights). No HTTP, no subshells
# beyond the awk extraction.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

# Extract just the function definition into a sourceable tmp file.
HELPER_TMP="$(mktemp)"
trap 'rm -f "$HELPER_TMP"' EXIT
awk '
  /^redact_url_secrets\(\) \{/ { capture=1 }
  capture { print }
  capture && /^\}$/ { capture=0 }
' "$SMOKE" > "$HELPER_TMP"
# shellcheck source=/dev/null
. "$HELPER_TMP"

fail=0
case_n=0

assert_eq() {
  local label="$1" want="$2" got="$3"
  case_n=$(( case_n + 1 ))
  if [[ "$want" == "$got" ]]; then
    echo "PASS  [$case_n] $label"
  else
    echo "FAIL  [$case_n] $label"
    printf '      want: %q\n      got:  %q\n' "$want" "$got"
    fail=1
  fi
}

# Case 1: existing userinfo redaction contract (task 0016).
assert_eq "userinfo stripped" \
  "https://h/path" \
  "$(redact_url_secrets "https://user:KEY@h/path")"

# Case 2: existing query-string redaction contract (task 0016).
assert_eq "query-string stripped" \
  "https://h/path" \
  "$(redact_url_secrets "https://h/path?key=x")"

# Case 3: backtick in path → downgraded to apostrophe (task 0028 fix
# for the inline-code-span break).
assert_eq "backtick in path → apostrophe" \
  "https://h/path-with-'bt'" \
  "$(redact_url_secrets 'https://h/path-with-`bt`')"

# Case 4: pipe in path → escaped (table-cell delimiter safety).
assert_eq "pipe in path → \\|" \
  'https://h/path-with-\|-pipe' \
  "$(redact_url_secrets 'https://h/path-with-|-pipe')"

# Case 5: CR + LF in path → dropped (would otherwise break the
# row terminator).
assert_eq "CR and LF dropped" \
  "https://h/path-with-CR-LF-end" \
  "$(redact_url_secrets $'https://h/path-with-CR\r-LF\n-end')"

# Case 6: plain URL unchanged (no regression on credential-free inputs).
assert_eq "credential-free URL unchanged" \
  "https://h/normal-path" \
  "$(redact_url_secrets "https://h/normal-path")"

# Case 7: combined — userinfo + query + backtick + pipe (all four
# surfaces co-existing) all reduced in one call.
assert_eq "combined: userinfo + query + backtick + pipe" \
  "https://h/p-'x'-\\|-y" \
  "$(redact_url_secrets 'https://user:KEY@h/p-`x`-|-y?key=z')"

# Case 8: empty input → empty output (defensive — no surprise).
assert_eq "empty input → empty output" \
  "" \
  "$(redact_url_secrets "")"

echo
if (( fail == 0 )); then
  echo "ALL $case_n CASES PASS"
  exit 0
else
  echo "ONE OR MORE OF $case_n CASES FAILED"
  exit 1
fi
