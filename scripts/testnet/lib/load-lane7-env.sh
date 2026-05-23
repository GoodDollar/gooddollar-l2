#!/usr/bin/env bash
# Lane-7 `.env` loader for `scripts/testnet/internal-smoke.sh`.
#
# Runs BEFORE the smoke's parameter-expansion defaults so that
# runbook-documented overrides (`PRICE_SERVICE_PORT=49300`,
# `LANE7_RPC=http://localhost:8545`, `STALENESS_THRESHOLD_S=600`, ...)
# get a chance to populate the environment before `${VAR:-default}`
# resolves. Without this hoist, an operator who put the runbook's
# 16-key block in `.env` and ran the smoke directly (no `set -a`)
# would silently fall through to production-reserved ports
# (4000 / 9106 / 9107 / 9200) and chase four phantom-outage
# BLOCKERs caused by one missing env-load step.
#
# Precedence: shell-exported values WIN over `.env`. The
# `[[ -z "${!key:-}" ]]` guard skips the export when the operator
# has already set the variable in the shell (CI overrides, one-shot
# `FOO=bar ./internal-smoke.sh` invocations). Matches the convention
# `dotenv`, `pm2 --env`, and `docker-compose env_file` use.
#
# Caller contract (must be set BEFORE sourcing this file):
#   - $LANE7_ENV_FILE     — absolute path to the `.env` file
#   - WARNINGS[]          — declared (`declare -a`) by caller
#   - ENV_PRESENCE[]      — declared (`declare -A`) by caller
#
# This file is `source`d, not exec'd. It deliberately does NOT
# declare WARNINGS / ENV_PRESENCE itself — those are owned by the
# main script so a child shell substitution (`$(...)`) cannot
# accidentally swallow updates.
#
# Two distinct categories of key are accepted:
#   - presence-only fence keys (REAL_TRADING_ENABLED, ETORO_MODE)
#     land in ENV_PRESENCE[] and are NEVER exported into the shell.
#     Exporting them would propagate into every child process the
#     smoke spawns (node, curl, awk), which is precisely what the
#     safety fence is meant to prevent.
#   - operational keys (ports, URLs, thresholds, oracle address,
#     REPORT path, etc.) are exported into the shell so the
#     existing parameter-expansion defaults in the caller pick
#     them up unchanged. Single code path through `require_uint` /
#     `PROBE_URL_RE` — no validation duplication.
#
# Unknown non-comment keys collect into a single deferred WARN so
# typos like `PRICE_SERVICE_PROT=49300` surface once instead of
# being silently discarded (pre-0026 behavior).
#
# Whitespace + quote handling (task 0027 convergence):
#   - trim CR (Windows-CRLF), then leading + trailing ASCII
#     whitespace on both key and value
#   - skip blank lines + `#` comments
#   - WARN-and-skip on embedded whitespace in key
#   - strip at most one outer layer of mismatched quotes from
#     value (`"true` / `"true"` / `'true'` all → `true`)

if [[ -z "${LANE7_ENV_FILE:-}" || ! -f "$LANE7_ENV_FILE" ]]; then
  return 0
fi

if grep -q $'\r' "$LANE7_ENV_FILE" 2>/dev/null; then
  WARNINGS+=("$LANE7_ENV_FILE has CRLF line endings — run \`dos2unix\` or \`sed -i 's/\\r\$//'\`")
fi

declare -a _LANE7_ENV_UNKNOWN=()
while IFS='=' read -r _key _val; do
  _key="${_key%$'\r'}"; _val="${_val%$'\r'}"
  _key="${_key#"${_key%%[![:space:]]*}"}"
  _key="${_key%"${_key##*[![:space:]]}"}"
  [[ -z "$_key" || "$_key" =~ ^# ]] && continue
  if [[ "$_key" =~ [[:space:]] ]]; then
    WARNINGS+=(".env key contains whitespace and was ignored: $(printf %q "$_key")")
    continue
  fi
  _val="${_val#"${_val%%[![:space:]]*}"}"
  _val="${_val%"${_val##*[![:space:]]}"}"
  _val="${_val%\"}"; _val="${_val#\"}"; _val="${_val%\'}"; _val="${_val#\'}"
  case "$_key" in
    REAL_TRADING_ENABLED|ETORO_MODE)
      ENV_PRESENCE[$_key]="$_val"
      ;;
    PRICE_SERVICE_PORT|PRICE_SERVICE_WS_PORT|ORACLE_SIGNER_PORT \
      |HEDGE_ENGINE_PORT|STATUS_AGGREGATOR_PORT|LANE7_BASE \
      |LANE7_RPC|STALENESS_THRESHOLD_S|MIN_FRESH_QUOTES \
      |QUOTE_MAX_AGE_S|PRICE_SERVICE_URL|ORACLE_SIGNER_URL \
      |HEDGE_ENGINE_URL|STATUS_AGGREGATOR_URL \
      |PRICE_SERVICE_QUOTES_URL|STOCK_ORACLE_V2_ADDRESS \
      |HEALTH_CONTRACT|REPORT|L2_RPC_URL)
      if [[ -z "${!_key:-}" ]]; then export "$_key=$_val"; fi
      ;;
    *)
      _LANE7_ENV_UNKNOWN+=("$_key")
      ;;
  esac
done < "$LANE7_ENV_FILE"

if (( ${#_LANE7_ENV_UNKNOWN[@]} > 0 )); then
  WARNINGS+=(".env keys ignored (not in lane-7 allowlist): ${_LANE7_ENV_UNKNOWN[*]}")
fi
unset _LANE7_ENV_UNKNOWN _key _val
