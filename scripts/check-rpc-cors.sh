#!/usr/bin/env bash
# scripts/check-rpc-cors.sh
#
# Smoke test for the CORS contract of https://rpc.goodclaw.org.
#
# Used standalone for ad-hoc verification, and called by
# scripts/health-check.sh to gate every deployment.
#
# Exit codes:
#   0  all checks passed
#   1  any check failed
#
# Usage:
#   scripts/check-rpc-cors.sh                    # check rpc.goodclaw.org
#   RPC_URL=https://rpc.example.com \
#     scripts/check-rpc-cors.sh                  # check a custom RPC
#   ORIGIN=https://app.example.com \
#     scripts/check-rpc-cors.sh                  # check from a custom Origin
#
# Requirements: bash, curl, awk, grep.

set -u

RPC_URL="${RPC_URL:-https://rpc.goodclaw.org}"
ORIGIN="${ORIGIN:-https://goodswap.goodclaw.org}"

# Color helpers (no-op if NO_COLOR is set or stdout is not a tty).
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_OK=$'\033[32m'
  C_ERR=$'\033[31m'
  C_DIM=$'\033[2m'
  C_RESET=$'\033[0m'
else
  C_OK=""
  C_ERR=""
  C_DIM=""
  C_RESET=""
fi

PASS=0
FAIL=0

pass() {
  printf '  %s✓%s %s\n' "$C_OK" "$C_RESET" "$1"
  PASS=$((PASS + 1))
}

fail() {
  printf '  %s✗%s %s\n' "$C_ERR" "$C_RESET" "$1"
  FAIL=$((FAIL + 1))
}

dim() {
  printf '    %s%s%s\n' "$C_DIM" "$1" "$C_RESET"
}

# Count occurrences of a given response header (case-insensitive).
# $1 = headers blob, $2 = header name (e.g. "access-control-allow-origin")
count_header() {
  local headers="$1"
  local name="$2"
  printf '%s\n' "$headers" \
    | awk -v h="$name" '
        BEGIN { IGNORECASE = 1 }
        # strip CR
        { sub(/\r$/, "") }
        # only consider header lines (key: value), not status line
        /^[A-Za-z][A-Za-z0-9_-]*:/ {
          colon = index($0, ":")
          key = tolower(substr($0, 1, colon - 1))
          if (key == h) n++
        }
        END { print (n + 0) }
      '
}

# Pull the value of the first occurrence of a given response header.
get_header() {
  local headers="$1"
  local name="$2"
  printf '%s\n' "$headers" \
    | awk -v h="$name" '
        BEGIN { IGNORECASE = 1 }
        { sub(/\r$/, "") }
        /^[A-Za-z][A-Za-z0-9_-]*:/ {
          colon = index($0, ":")
          key = tolower(substr($0, 1, colon - 1))
          if (key == h) {
            val = substr($0, colon + 1)
            sub(/^[ \t]+/, "", val)
            print val
            exit
          }
        }
      '
}

printf 'CORS smoke test: %s (Origin: %s)\n' "$RPC_URL" "$ORIGIN"

# ---------------------------------------------------------------------
# 1. Preflight (OPTIONS) check
# ---------------------------------------------------------------------
PREFLIGHT="$(curl -sS -o /tmp/.cors-options-body.$$ -D - \
  -X OPTIONS "$RPC_URL" \
  -H "Origin: $ORIGIN" \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  --max-time 10 2>&1)" || {
  fail "OPTIONS preflight: curl failed"
  rm -f /tmp/.cors-options-body.$$
  printf '\nResult: %d passed, %d failed\n' "$PASS" "$FAIL"
  exit 1
}
rm -f /tmp/.cors-options-body.$$

# Take the LAST HTTP/x.y status line — curl with -D - on HTTPS can emit
# intermediate "200 Connection Established" or "100 Continue" lines that
# we want to ignore.
OPTIONS_STATUS="$(printf '%s\n' "$PREFLIGHT" | awk '/^HTTP\// { code = $2 } END { print code }')"
case "$OPTIONS_STATUS" in
  200|204)
    pass "OPTIONS preflight returns $OPTIONS_STATUS"
    ;;
  *)
    fail "OPTIONS preflight returned $OPTIONS_STATUS (want 200 or 204)"
    ;;
esac

ACAO_OPT_COUNT="$(count_header "$PREFLIGHT" 'access-control-allow-origin')"
if [[ "$ACAO_OPT_COUNT" -eq 1 ]]; then
  pass "Exactly 1 Access-Control-Allow-Origin on OPTIONS"
else
  fail "Got $ACAO_OPT_COUNT Access-Control-Allow-Origin on OPTIONS (want 1)"
fi

ACAM_OPT_COUNT="$(count_header "$PREFLIGHT" 'access-control-allow-methods')"
if [[ "$ACAM_OPT_COUNT" -eq 1 ]]; then
  pass "Exactly 1 Access-Control-Allow-Methods on OPTIONS"
else
  fail "Got $ACAM_OPT_COUNT Access-Control-Allow-Methods on OPTIONS (want 1)"
fi

ACAH_OPT_COUNT="$(count_header "$PREFLIGHT" 'access-control-allow-headers')"
if [[ "$ACAH_OPT_COUNT" -eq 1 ]]; then
  pass "Exactly 1 Access-Control-Allow-Headers on OPTIONS"
else
  fail "Got $ACAH_OPT_COUNT Access-Control-Allow-Headers on OPTIONS (want 1)"
fi

ACAO_OPT_VAL="$(get_header "$PREFLIGHT" 'access-control-allow-origin')"
case "$ACAO_OPT_VAL" in
  '*'|"$ORIGIN")
    pass "OPTIONS Access-Control-Allow-Origin: $ACAO_OPT_VAL"
    ;;
  *)
    fail "OPTIONS Access-Control-Allow-Origin: '$ACAO_OPT_VAL' (want '*' or '$ORIGIN')"
    ;;
esac

# ---------------------------------------------------------------------
# 2. Actual POST (eth_blockNumber) check
# ---------------------------------------------------------------------
BODY='{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
POST_FILE="/tmp/.cors-post-body.$$"
POST="$(curl -sS -o "$POST_FILE" -D - \
  -X POST "$RPC_URL" \
  -H "Origin: $ORIGIN" \
  -H 'Content-Type: application/json' \
  --data "$BODY" \
  --max-time 10 2>&1)" || {
  fail "POST eth_blockNumber: curl failed"
  rm -f "$POST_FILE"
  printf '\nResult: %d passed, %d failed\n' "$PASS" "$FAIL"
  exit 1
}

POST_STATUS="$(printf '%s\n' "$POST" | awk '/^HTTP\// { code = $2 } END { print code }')"
if [[ "$POST_STATUS" == "200" ]]; then
  pass "POST eth_blockNumber returns 200"
else
  fail "POST eth_blockNumber returned $POST_STATUS (want 200)"
fi

ACAO_POST_COUNT="$(count_header "$POST" 'access-control-allow-origin')"
if [[ "$ACAO_POST_COUNT" -eq 1 ]]; then
  pass "Exactly 1 Access-Control-Allow-Origin on POST"
else
  fail "Got $ACAO_POST_COUNT Access-Control-Allow-Origin on POST (want 1)"
fi

ACAO_POST_VAL="$(get_header "$POST" 'access-control-allow-origin')"
case "$ACAO_POST_VAL" in
  '*'|"$ORIGIN")
    pass "POST Access-Control-Allow-Origin: $ACAO_POST_VAL"
    ;;
  *)
    fail "POST Access-Control-Allow-Origin: '$ACAO_POST_VAL' (want '*' or '$ORIGIN')"
    ;;
esac

POST_BODY="$(cat "$POST_FILE" 2>/dev/null || true)"
rm -f "$POST_FILE"
if printf '%s' "$POST_BODY" | grep -q '"result":"0x'; then
  BLOCK_HEX="$(printf '%s' "$POST_BODY" \
    | grep -oE '"result":"0x[0-9a-fA-F]+"' \
    | head -1 \
    | sed -E 's/.*"(0x[0-9a-fA-F]+)".*/\1/')"
  pass "RPC returned block number $BLOCK_HEX"
else
  fail "RPC did not return a valid eth_blockNumber result"
  dim "body: $(printf '%s' "$POST_BODY" | head -c 200)"
fi

# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------
printf '\nResult: %d passed, %d failed\n' "$PASS" "$FAIL"
if [[ "$FAIL" -eq 0 ]]; then
  exit 0
else
  exit 1
fi
