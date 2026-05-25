#!/usr/bin/env bash
set -u
cd /home/goodclaw/gooddollar-l2
INTERVAL_SECONDS="${PAPERCLIP_TESTER_INTERVAL_SECONDS:-120}"
TIMEOUT_SECONDS="${PAPERCLIP_TESTER_TIMEOUT_SECONDS:-600}"

echo "[paperclip-continuous-testers-loop] start interval=${INTERVAL_SECONDS}s timeout=${TIMEOUT_SECONDS}s $(date -u +%Y-%m-%dT%H:%M:%SZ)"
while true; do
  started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[paperclip-continuous-testers-loop] cycle start ${started_at}"
  timeout "${TIMEOUT_SECONDS}" node scripts/paperclip-continuous-testers.mjs --once
  rc=$?
  finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[paperclip-continuous-testers-loop] cycle end ${finished_at} rc=${rc}; sleeping ${INTERVAL_SECONDS}s"
  sleep "${INTERVAL_SECONDS}"
done
