#!/usr/bin/env bash
set -euo pipefail
cd "/home/goodclaw/goodchain-live-prices-lanes/lane7-testnet-setup"
export CURSOR_CMD="/home/goodclaw/.local/bin/cursor"
export AUTOBUILDER_LANE="lane7-testnet-setup"
exec /home/goodclaw/.local/bin/autobuilder \
  --project-dir "/home/goodclaw/goodchain-live-prices-lanes/lane7-testnet-setup" \
  --root-initiative "0007g-testnet-setup" \
  --project-id "gooddollar-l2-0007g-testnet-setup" \
  --executor cursor \
  --model claude-opus-4-7-thinking-high \
  --port "3127" \
  --max-iterations "6" \
  --log-file "/home/goodclaw/goodchain-live-prices-lanes/lane7-testnet-setup/.autobuilder/loop.log" \
  --no-push
