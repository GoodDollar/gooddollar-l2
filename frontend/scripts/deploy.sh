#!/usr/bin/env bash
#
# Frontend deploy script — the ONLY supported way to roll a new build
# of the `goodswap` PM2 app into production.
#
# Why this exists
# ---------------
# Running `next build` in isolation rotates `.next/BUILD_ID` and every
# hashed CSS asset, but the already-running PM2 process keeps serving HTML
# that references the OLD asset hashes. Next's static handler then returns
# HTTP 400 for those stale paths and every page renders unstyled.
#
# This script guarantees the only correct sequence:
#   1. install deps deterministically (npm ci)
#   2. build (rotates .next/ artifacts)
#   3. pm2 reload goodswap --update-env  (zero-downtime in-place swap)
#   4. poll http://localhost:3100/ until the new process is bound
#   5. run check-buildid-sync.mjs in strict mode to PROVE the rollover
#      actually took effect (disk BUILD_ID == live __NEXT_DATA__.buildId).
#
# Tracking: .autobuilder/initiatives/0002-security-hardening/tasks/
#           0060-fix-frontend-deploy-stale-buildid-pm2-reload.md
#
# Usage:    cd frontend && npm run deploy
# Env:
#   PM2_APP_NAME (default: goodswap)
#   NEXT_LIVE_URL (default: http://localhost:3100/)
#   GOODCHAIN_LANE=lane7 — opt into lane7 49xxx route defaults
#   FRONTEND_DEPLOY_SKIP_CI (default: 0)  — skip `npm ci`, use existing node_modules
#   FRONTEND_DEPLOY_SKIP_BUILD (default: 0)  — skip `npm run build`
set -euo pipefail

PM2_APP_NAME="${PM2_APP_NAME:-goodswap}"
NEXT_LIVE_URL="${NEXT_LIVE_URL:-http://localhost:3100/}"
GOODCHAIN_LANE="${GOODCHAIN_LANE:-}"
SKIP_CI="${FRONTEND_DEPLOY_SKIP_CI:-0}"
SKIP_BUILD="${FRONTEND_DEPLOY_SKIP_BUILD:-0}"

# Lane-7 live-prices defaults are intentionally opt-in. Generic deploys must
# provide explicit route envs instead of inheriting lane-local Anvil ports.
if [ "$GOODCHAIN_LANE" = "lane7" ]; then
  export PRICE_SERVICE_URL="${PRICE_SERVICE_URL:-http://127.0.0.1:49300/status/quotes}"
  export NEXT_PUBLIC_PRICE_SERVICE_URL="${NEXT_PUBLIC_PRICE_SERVICE_URL:-http://127.0.0.1:49300}"
  export ORACLE_SIGNER_URL="${ORACLE_SIGNER_URL:-http://127.0.0.1:49107/proof}"
  export STATUS_AGGREGATOR_URL="${STATUS_AGGREGATOR_URL:-http://127.0.0.1:49200/status.json}"
else
  missing_route_env=()
  for key in PRICE_SERVICE_URL NEXT_PUBLIC_PRICE_SERVICE_URL ORACLE_SIGNER_URL STATUS_AGGREGATOR_URL; do
    if [ -z "${!key:-}" ]; then
      missing_route_env+=("$key")
    fi
  done
  if [ "${#missing_route_env[@]}" -gt 0 ]; then
    printf '\033[1;31m[deploy] FAIL:\033[0m set GOODCHAIN_LANE=lane7 for lane7 49xxx defaults or export explicit route envs: %s\n' "${missing_route_env[*]}" >&2
    exit 1
  fi
fi

cd "$(dirname "$0")/.."   # frontend/

log() { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[deploy] FAIL:\033[0m %s\n' "$*" >&2; exit 1; }

# --- 1. install ---------------------------------------------------------------
if [ "$SKIP_CI" = "1" ]; then
  log "skipping npm ci (FRONTEND_DEPLOY_SKIP_CI=1)"
else
  log "installing deps (npm ci)..."
  npm ci --no-audit --no-fund
fi

# --- 2. build -----------------------------------------------------------------
if [ "$SKIP_BUILD" = "1" ]; then
  log "skipping next build (FRONTEND_DEPLOY_SKIP_BUILD=1)"
else
  log "building (next build)..."
  npm run build
fi

if [ ! -f .next/BUILD_ID ]; then
  fail ".next/BUILD_ID not present after build — aborting reload."
fi
NEW_BUILD_ID="$(cat .next/BUILD_ID)"
log "new disk BUILD_ID: ${NEW_BUILD_ID}"

# --- 3. pm2 reload ------------------------------------------------------------
if ! command -v pm2 >/dev/null 2>&1; then
  fail "pm2 not in PATH — install pm2 or activate the deploy user shell."
fi

log "pm2 reload ${PM2_APP_NAME} --update-env"
pm2 reload "${PM2_APP_NAME}" --update-env

# --- 4. wait for live process to bind & serve --------------------------------
log "waiting for ${NEXT_LIVE_URL} to respond..."
ATTEMPTS=30
SLEEP_S=1
for i in $(seq 1 "${ATTEMPTS}"); do
  if curl -fsS --max-time 2 "${NEXT_LIVE_URL}" -o /dev/null; then
    log "live process responding (attempt ${i})"
    break
  fi
  if [ "${i}" = "${ATTEMPTS}" ]; then
    fail "live process did not respond at ${NEXT_LIVE_URL} after ${ATTEMPTS}s — check \`pm2 logs ${PM2_APP_NAME}\`."
  fi
  sleep "${SLEEP_S}"
done

# --- 5. enforce BUILD_ID sync -------------------------------------------------
log "verifying disk BUILD_ID matches live __NEXT_DATA__..."
NEXT_LIVE_URL="${NEXT_LIVE_URL}" node scripts/check-buildid-sync.mjs --strict

log "deploy complete — ${PM2_APP_NAME} now serving BUILD_ID ${NEW_BUILD_ID}"
