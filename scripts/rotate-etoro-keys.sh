#!/usr/bin/env bash
#
# rotate-etoro-keys.sh — rotate eToro DEMO credentials (`ETORO_DEMO_KEY`,
# `ETORO_DEMO_SECRET`, optionally `ETORO_DEMO_USER_KEY`) in $ENV_FILE.
#
# These are the only credential env vars the lane-1 SDK reads
# (`backend/etoro-client/src/auth.ts::loadCredentialsFromEnv`). Rotating
# any other variant (e.g. legacy `ETORO_SANDBOX_KEY` / `ETORO_REAL_KEY`)
# would update env vars the SDK ignores while the live SDK keeps using
# the previous demo credentials.
#
# Usage:
#   ./scripts/rotate-etoro-keys.sh demo
#
#   `real`, `sandbox`, or any other mode is refused with exit 2 and
#   leaves $ENV_FILE / $ROTATE_AUDIT_LOG byte-identical. The lane stance
#   is REAL_TRADING_ENABLED=false (source-level fence); see
#   .autobuilder/initiatives/0007a-etoro-connectivity/spec.md.
#
# Env overrides (operator + test):
#   ENV_FILE           — target env file (default: .env)
#   ROTATE_AUDIT_LOG   — audit log path (default: audit.log)
#   ROTATE_SKIP_PM2    — set non-empty to skip the PM2 restart block
#                        (used by the regression test).

set -euo pipefail

MODE="${1-}"
ENV_FILE="${ENV_FILE:-.env}"
AUDIT_LOG="${ROTATE_AUDIT_LOG:-audit.log}"
SPEC_REF=".autobuilder/initiatives/0007a-etoro-connectivity/spec.md"
LANE_PM2_SERVICES=(price-service oracle-signer hedge-engine)

usage() {
  cat >&2 <<EOF
Usage: $0 demo

  Rotates ETORO_DEMO_KEY, ETORO_DEMO_SECRET, and (optionally)
  ETORO_DEMO_USER_KEY in \$ENV_FILE (default .env) — the three env vars
  the lane-1 SDK reads in loadCredentialsFromEnv().

  Refuses any other mode (real, sandbox, …) per the lane stance
  REAL_TRADING_ENABLED=false (see ${SPEC_REF}).
EOF
}

# refuse() — print refusal to stderr and exit 2, never touching $ENV_FILE
# or $AUDIT_LOG.
refuse() {
  printf '[rotate-etoro-keys] %s\n' "$1" >&2
  printf '  See %s (Global Safety Gates: REAL_TRADING_ENABLED=false).\n' "$SPEC_REF" >&2
  exit 2
}

case "$MODE" in
  '')
    usage
    exit 2
    ;;
  real)
    refuse "refusing 'real': no real-account credential path exists in this lane."
    ;;
  sandbox)
    refuse "refusing 'sandbox': legacy mode name; only 'demo' rotates lane SDK creds."
    ;;
  demo)
    ;;
  *)
    refuse "unknown mode '$MODE'; only 'demo' is rotatable."
    ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
  printf '[rotate-etoro-keys] %s not found — run `cp .env.example .env` first.\n' "$ENV_FILE" >&2
  exit 2
fi

printf '=== eToro Key Rotation (demo mode) ===\n'
printf 'Target: %s in %s (the vars the SDK reads).\n\n' \
  'ETORO_DEMO_KEY / ETORO_DEMO_SECRET / ETORO_DEMO_USER_KEY' "$ENV_FILE"

read -rp 'Enter new ETORO_DEMO_KEY: ' NEW_KEY
if [[ -z "$NEW_KEY" ]]; then
  printf '[rotate-etoro-keys] key cannot be empty.\n' >&2
  exit 2
fi

read -rsp 'Enter new ETORO_DEMO_SECRET: ' NEW_SECRET
printf '\n'
if [[ -z "$NEW_SECRET" ]]; then
  printf '[rotate-etoro-keys] secret cannot be empty.\n' >&2
  exit 2
fi

read -rp 'Enter new ETORO_DEMO_USER_KEY (Enter to keep current): ' NEW_USER_KEY

BACKUP="${ENV_FILE}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
cp "$ENV_FILE" "$BACKUP"

# update_env_var() — set $1=$2 in $ENV_FILE. Replaces both `KEY=…` and
# `# KEY=…` lines in a single sed (so a fresh `cp .env.example .env`
# gets uncommented in-place); appends at EOF when neither shape exists.
# Uses `|` as the sed delimiter so secrets containing `/` don't collide.
update_env_var() {
  local var_name="$1"
  local var_value="$2"
  if grep -qE "^(# )?${var_name}=" "$ENV_FILE"; then
    sed -i -E "s|^(# )?${var_name}=.*|${var_name}=${var_value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$var_name" "$var_value" >> "$ENV_FILE"
  fi
}

ROTATED=(ETORO_DEMO_KEY ETORO_DEMO_SECRET)
update_env_var ETORO_DEMO_KEY "$NEW_KEY"
update_env_var ETORO_DEMO_SECRET "$NEW_SECRET"
if [[ -n "$NEW_USER_KEY" ]]; then
  update_env_var ETORO_DEMO_USER_KEY "$NEW_USER_KEY"
  ROTATED+=(ETORO_DEMO_USER_KEY)
fi

REDACTED_KEY="${NEW_KEY:0:3}...${NEW_KEY: -3}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

VARS_JSON='['
SEP=''
for v in "${ROTATED[@]}"; do
  VARS_JSON+="${SEP}\"${v}\""
  SEP=','
done
VARS_JSON+=']'

printf '{"action":"key_rotation","mode":"demo","vars":%s,"newKeyRedacted":"%s","timestamp":"%s"}\n' \
  "$VARS_JSON" "$REDACTED_KEY" "$TIMESTAMP" >> "$AUDIT_LOG"

printf 'Rotated demo credentials (key: %s)\n' "$REDACTED_KEY"
printf 'Backup saved to %s\n\n' "$BACKUP"

# Restart only the three lane-1 ecosystem entries registered in
# backend/ecosystem.config.js. Fail loud if PM2 knows a service but the
# restart errors; quiet-skip names PM2 has never heard of (the autobuilder
# host may not run the lane).
if [[ -z "${ROTATE_SKIP_PM2:-}" ]] && command -v pm2 >/dev/null 2>&1; then
  printf 'Restarting lane-1 PM2 services...\n'
  PM2_LIST="$(pm2 jlist 2>/dev/null || true)"
  PM2_FAIL=0
  for svc in "${LANE_PM2_SERVICES[@]}"; do
    if printf '%s' "$PM2_LIST" | grep -q "\"name\":\"${svc}\""; then
      if ! pm2 restart "$svc" --update-env; then
        printf '[rotate-etoro-keys] pm2 restart %s failed.\n' "$svc" >&2
        PM2_FAIL=1
      fi
    else
      printf '  %s: not registered in PM2 — skipping.\n' "$svc"
    fi
  done
  if [[ "$PM2_FAIL" -ne 0 ]]; then
    exit 1
  fi
else
  printf 'PM2 not invoked; restart %s manually.\n' "${LANE_PM2_SERVICES[*]}"
fi

cat <<EOF

Verify the SDK consumes the rotated credentials:
  (cd backend/etoro-client && ETORO_MODE=demo-readonly npm run verify-credentials)

This invokes loadCredentialsFromEnv() against the current shell env and
exits 0 only when the rotated demo trio resolves cleanly.
EOF
