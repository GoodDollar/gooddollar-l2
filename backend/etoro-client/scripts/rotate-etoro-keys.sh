#!/usr/bin/env bash
set -euo pipefail

# rotate-etoro-keys.sh — Helper for rotating eToro API keys in .env
#
# Usage:
#   ./scripts/rotate-etoro-keys.sh <sandbox|real> <new-key> <new-secret>
#
# This script updates the appropriate ETORO_*_KEY and ETORO_*_SECRET
# in the project .env file and logs the rotation event to audit.log.

ENV_FILE="${ENV_FILE:-.env}"
AUDIT_LOG="audit.log"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ $# -eq 3 ]] || die "Usage: $0 <sandbox|real> <new-key> <new-secret>"

MODE="$1"
NEW_KEY="$2"
NEW_SECRET="$3"

case "$MODE" in
  sandbox) KEY_VAR="ETORO_SANDBOX_KEY"; SECRET_VAR="ETORO_SANDBOX_SECRET" ;;
  real)    KEY_VAR="ETORO_REAL_KEY";    SECRET_VAR="ETORO_REAL_SECRET" ;;
  *)       die "Mode must be 'sandbox' or 'real', got: $MODE" ;;
esac

[[ -f "$ENV_FILE" ]] || die ".env file not found at $ENV_FILE"

REDACTED_KEY="${NEW_KEY:0:3}...${NEW_KEY: -3}"

if grep -q "^${KEY_VAR}=" "$ENV_FILE"; then
  sed -i "s|^${KEY_VAR}=.*|${KEY_VAR}=${NEW_KEY}|" "$ENV_FILE"
else
  echo "${KEY_VAR}=${NEW_KEY}" >> "$ENV_FILE"
fi

if grep -q "^${SECRET_VAR}=" "$ENV_FILE"; then
  sed -i "s|^${SECRET_VAR}=.*|${SECRET_VAR}=${NEW_SECRET}|" "$ENV_FILE"
else
  echo "${SECRET_VAR}=${NEW_SECRET}" >> "$ENV_FILE"
fi

echo "{\"action\":\"key_rotation\",\"mode\":\"${MODE}\",\"newKeyRedacted\":\"${REDACTED_KEY}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$AUDIT_LOG"

echo "✓ Rotated ${MODE} credentials (key: ${REDACTED_KEY})"
