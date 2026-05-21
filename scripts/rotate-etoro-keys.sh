#!/usr/bin/env bash
set -euo pipefail

# rotate-etoro-keys.sh — Rotate eToro API credentials
# Usage: ./scripts/rotate-etoro-keys.sh [sandbox|real]

MODE="${1:-sandbox}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ "$MODE" != "sandbox" && "$MODE" != "real" ]]; then
  echo "Usage: $0 [sandbox|real]"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found. Create it from .env.example first."
  exit 1
fi

KEY_VAR="ETORO_${MODE^^}_KEY"
SECRET_VAR="ETORO_${MODE^^}_SECRET"

echo "=== eToro Key Rotation ($MODE mode) ==="
echo "Target: $KEY_VAR / $SECRET_VAR in $ENV_FILE"
echo ""

read -rp "Enter new API key: " NEW_KEY
if [[ -z "$NEW_KEY" ]]; then
  echo "Error: API key cannot be empty."
  exit 1
fi

read -rsp "Enter new API secret: " NEW_SECRET
echo ""
if [[ -z "$NEW_SECRET" ]]; then
  echo "Error: API secret cannot be empty."
  exit 1
fi

# Backup current .env
cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"

# Update or append the key/secret
update_env_var() {
  local var_name="$1"
  local var_value="$2"
  if grep -q "^${var_name}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" "$ENV_FILE"
  else
    echo "${var_name}=${var_value}" >> "$ENV_FILE"
  fi
}

update_env_var "$KEY_VAR" "$NEW_KEY"
update_env_var "$SECRET_VAR" "$NEW_SECRET"

echo "Updated $KEY_VAR and $SECRET_VAR in $ENV_FILE"

# Restart PM2 services if available
if command -v pm2 &>/dev/null; then
  echo "Restarting PM2 etoro services..."
  pm2 restart etoro-client --update-env 2>/dev/null || true
  pm2 restart stocks-keeper --update-env 2>/dev/null || true
  pm2 restart price-service --update-env 2>/dev/null || true
  echo "PM2 services restarted."
else
  echo "PM2 not found — restart services manually."
fi

echo ""
echo "Key rotation complete. Verify connectivity with:"
echo "  cd backend/etoro-client && npx ts-node -e \"const { createEtoroClient } = require('./src'); const c = createEtoroClient(); console.log(c.getSummary());\""
echo ""
echo "Backup saved to ${ENV_FILE}.bak.*"
