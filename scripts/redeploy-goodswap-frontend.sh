#!/usr/bin/env bash
# Rebuild the goodswap Next.js bundle and restart the PM2 process so
# the live frontend at https://goodswap.goodclaw.org serves the latest
# source. Required after any change to:
#   - frontend/src/lib/devnet.ts
#   - op-stack/addresses.json
#   - any other module statically inlined into the production bundle.
#
# Usage:
#   scripts/redeploy-goodswap-frontend.sh
#
# Exits non-zero if the build fails, the PM2 process does not come back
# online cleanly, or the live host does not return HTTP 200.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
PM2_NAME="goodswap"
LIVE_URL="${GOODSWAP_LIVE_URL:-https://goodswap.goodclaw.org/ubi-impact}"

echo "[redeploy] Repo root: $REPO_ROOT"
echo "[redeploy] Frontend dir: $FRONTEND_DIR"
echo "[redeploy] PM2 process: $PM2_NAME"
echo "[redeploy] Verifying live URL: $LIVE_URL"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "[redeploy] FAIL: frontend dir not found: $FRONTEND_DIR" >&2
  exit 1
fi

echo "[redeploy] Building Next.js bundle ..."
cd "$FRONTEND_DIR"
npm run build

echo "[redeploy] Restarting PM2 process: $PM2_NAME ..."
pm2 restart "$PM2_NAME" --update-env

echo "[redeploy] Waiting for PM2 process to settle (up to 30s) ..."
ok=0
for _ in $(seq 1 30); do
  status=$(pm2 jlist | jq -r --arg n "$PM2_NAME" \
    '.[] | select(.name==$n) | .pm2_env.status')
  unstable=$(pm2 jlist | jq -r --arg n "$PM2_NAME" \
    '.[] | select(.name==$n) | .pm2_env.unstable_restarts')
  if [ "$status" = "online" ]; then
    if [ "${unstable:-0}" = "0" ]; then
      ok=1
      echo "[redeploy] $PM2_NAME is online (unstable_restarts=$unstable)"
      break
    fi
  fi
  sleep 1
done

if [ "$ok" -ne 1 ]; then
  echo "[redeploy] FAIL: $PM2_NAME did not reach a clean online state" >&2
  pm2 logs "$PM2_NAME" --lines 30 --nostream || true
  exit 1
fi

echo "[redeploy] Probing live host ..."
http_code=$(curl -sS -o /dev/null -w '%{http_code}' \
  --max-time 15 "$LIVE_URL" || true)
if [ "$http_code" != "200" ]; then
  echo "[redeploy] FAIL: live host $LIVE_URL returned HTTP $http_code" >&2
  exit 1
fi
echo "[redeploy] Live host returned HTTP $http_code"

echo "[redeploy] Done."
